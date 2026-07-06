// CurryClicker headless balance simulator (Wave C).
//
// Run:   npx tsx scripts/balanceSim.ts [weeks] [baseSeed]
//        (defaults: 15 weeks, seed 12345 — fully deterministic)
//
// Simulates N weeks of play for three archetypes (idle / casual / active),
// importing the pure engine from src/ (read-only). Prints a per-week table
// (curry earned, shop items owned, stars, franchise purchases) plus summary
// lines: weeks to buy out the 59-star franchise catalog and dead zones.
//
// Vite-ism workaround: src/config.ts reads `import.meta.env`, which explodes
// under plain node/tsx. We register a loader hook (scripts/viteShimHooks.mjs)
// that rewrites it to a plain object BEFORE dynamically importing any src
// module — hence all engine imports below are dynamic, after register().
//
// Modeling notes / simplifications (all mirror useGameStore semantics):
// - Simulated on GAME time. clicksPerDay = clicksPerSec * DAY_DURATION_SECONDS
//   (dev config: 60s days / 7-minute weeks).
// - Curry, shop purchases and franchise state persist across weeks; journal,
//   streak, highestTierSeen, cravingMatchDays reset weekly (per startNewWeek).
// - Journal pairs are revealed from each day's FINAL recipe at day-end (the
//   store's only reveal path) plus Journal Insight pre-reveals.
// - Shop buying strategy: CHEAPEST-FIRST among unlocked (prereq-satisfied,
//   under maxQuantity) items, evaluated at each day end, repeat while
//   affordable. Franchise buying: cheapest-first at week end.
// - Income model: one recipe per day; day income = clickValue * clicksPerDay
//   + autoProduction * dayDuration, with special/streak/craving/reputation
//   mods exactly as in clickEngine/autoEngine.

import { register } from "node:module";

register(new URL("./viteShimHooks.mjs", import.meta.url).href);

// ---- dynamic engine imports (after loader hook registration) --------------

async function importEngine() {
  const [
    config,
    affinity,
    recipe,
    click,
    auto,
    effectsMod,
    week,
    franchise,
    shop,
    ingredients,
    rng,
  ] = await Promise.all([
    import("../src/config"),
    import("../src/engine/affinityEngine"),
    import("../src/engine/recipeEngine"),
    import("../src/engine/clickEngine"),
    import("../src/engine/autoEngine"),
    import("../src/engine/effects"),
    import("../src/engine/weekEngine"),
    import("../src/engine/franchiseData"),
    import("../src/engine/shopData"),
    import("../src/engine/ingredients"),
    import("../src/lib/rng"),
  ]);
  return {
    config,
    affinity,
    recipe,
    click,
    auto,
    effectsMod,
    week,
    franchise,
    shop,
    ingredients,
    rng,
  };
}

// Wave B may be mid-edit in src/engine/{ingredients,shopData}.ts; a transient
// parse error just means "retry shortly".
async function importEngineWithRetry(retries = 4, delayMs = 30_000) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await importEngine();
    } catch (err) {
      if (attempt >= retries) throw err;
      console.error(
        `[balanceSim] engine import failed (attempt ${attempt + 1}/${retries + 1}) — ` +
          `possibly a mid-edit file from the content wave; retrying in ${delayMs / 1000}s...\n  ${err}`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

const E = await importEngineWithRetry();

const { DAY_DURATION_SECONDS, DAYS_PER_WEEK } = E.config;
const { getAffinityData, affinityPairKey } = E.affinity;
const { computeRecipeScore, computeRecipeFlavor } = E.recipe;
const { computeClickValue } = E.click;
const { computeAutoProduction } = E.auto;
const { computeEffects } = E.effectsMod;
const { getDailySpecial, getDailyCraving, evaluateStreak, streakMultiplierFor } =
  E.week;
const {
  FRANCHISE_UPGRADES,
  FRANCHISE_UPGRADE_MAP,
  headStartCurry,
  unlockedIngredientIds,
} = E.franchise;
const { UPGRADES, DECORATIONS } = E.shop;
const { INGREDIENTS } = E.ingredients;
const { makeRng } = E.rng;

type Rng = () => number;
type Matrix = Record<string, Record<string, number>>;

// ---- CLI ------------------------------------------------------------------

const N_WEEKS = Number(process.argv[2] ?? 15);
const BASE_SEED = Number(process.argv[3] ?? 12345);

// ---- archetypes -------------------------------------------------------------

interface Archetype {
  name: string;
  clicksPerSec: number;
  // probability an archetype pays attention to today's craving when picking
  cravingCareProb: number;
  // recipe skill: how the day's recipe is chosen
  pick: (ctx: DayContext, rng: Rng) => string[];
}

interface DayContext {
  day: number; // 1..7
  seed: number;
  matrix: Matrix;
  guaranteed: string[][];
  unlockedIds: string[]; // ingredient pool (franchise sets applied)
  slots: number; // recipe slot count available
  craving: string;
  careAboutCraving: boolean;
  special: { a: string; b: string };
  spicePairBonus: number;
}

// Expected relative value of a combo for a given day (craving + special aware).
function comboValue(ctx: DayContext, combo: string[]): number {
  const score = computeRecipeScore(combo, ctx.matrix, {
    spicePairBonus: ctx.spicePairBonus,
    craving: ctx.careAboutCraving ? (ctx.craving as never) : undefined,
  });
  const specialMult =
    combo.includes(ctx.special.a) && combo.includes(ctx.special.b) ? 2 : 1;
  return score.baseValue * score.effectiveMultiplier * specialMult;
}

function rawTier(ctx: DayContext, combo: string[]): string {
  return computeRecipeScore(combo, ctx.matrix, {
    spicePairBonus: ctx.spicePairBonus,
  }).tier;
}

function sampleCombo(ctx: DayContext, rng: Rng, size: number): string[] {
  const pool = [...ctx.unlockedIds];
  const combo: string[] = [];
  for (let i = 0; i < size && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    combo.push(pool.splice(idx, 1)[0]);
  }
  return combo;
}

// Greedy grow: start from the best pair, add the ingredient that maximises
// average affinity, up to `size` slots.
function greedyCombo(ctx: DayContext, size: number, from?: string[]): string[] {
  const ids = ctx.unlockedIds;
  let combo: string[];
  if (from && from.length > 0) {
    combo = [...from];
  } else {
    let bestPair: string[] = [ids[0], ids[1]];
    let bestVal = -Infinity;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const v = ctx.matrix[ids[i]]?.[ids[j]] ?? 0;
        if (v > bestVal) {
          bestVal = v;
          bestPair = [ids[i], ids[j]];
        }
      }
    }
    combo = bestPair;
  }
  while (combo.length < size) {
    let bestId: string | null = null;
    let bestAvg = -Infinity;
    for (const id of ids) {
      if (combo.includes(id)) continue;
      const cand = [...combo, id];
      let total = 0;
      let n = 0;
      for (let i = 0; i < cand.length; i++) {
        for (let j = i + 1; j < cand.length; j++) {
          total += ctx.matrix[cand[i]]?.[cand[j]] ?? 0;
          n++;
        }
      }
      const avg = total / n;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestId = id;
      }
    }
    if (!bestId) break;
    combo.push(bestId);
  }
  return combo.slice(0, size);
}

// Craving-forced greedy: build the best-affinity combo whose majority flavour
// is the craving (how a skilled player deliberately matches the craving).
function greedyCravingCombo(ctx: DayContext, size: number): string[] | null {
  const flavorIds = ctx.unlockedIds.filter(
    (id) => INGREDIENTS[id]?.flavor === ctx.craving,
  );
  if (flavorIds.length < 2) return null;
  // best pair within the craving flavour
  let combo: string[] = [flavorIds[0], flavorIds[1]];
  let bestVal = -Infinity;
  for (let i = 0; i < flavorIds.length; i++) {
    for (let j = i + 1; j < flavorIds.length; j++) {
      const v = ctx.matrix[flavorIds[i]]?.[flavorIds[j]] ?? 0;
      if (v > bestVal) {
        bestVal = v;
        combo = [flavorIds[i], flavorIds[j]];
      }
    }
  }
  // greedily add ANY ingredient, but only if the recipe flavour stays matched
  while (combo.length < size) {
    let bestId: string | null = null;
    let bestAvg = -Infinity;
    for (const id of ctx.unlockedIds) {
      if (combo.includes(id)) continue;
      const cand = [...combo, id];
      if (computeRecipeFlavor(cand) !== ctx.craving) continue;
      let total = 0;
      let n = 0;
      for (let i = 0; i < cand.length; i++) {
        for (let j = i + 1; j < cand.length; j++) {
          total += ctx.matrix[cand[i]]?.[cand[j]] ?? 0;
          n++;
        }
      }
      const avg = total / n;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestId = id;
      }
    }
    if (!bestId) break;
    combo.push(bestId);
  }
  return combo;
}

// Candidates common to skilled play: guaranteed combos (truncated to fit
// slots), greedy-grown combos, craving-forced builds when the player cares,
// and (for special-chasers) special-duo builds.
function skilledCandidates(ctx: DayContext, chaseSpecial: boolean): string[][] {
  const cands: string[][] = [];
  for (const g of ctx.guaranteed) {
    const usable = g.filter((id) => ctx.unlockedIds.includes(id));
    if (usable.length >= 2) cands.push(usable.slice(0, ctx.slots));
  }
  cands.push(greedyCombo(ctx, ctx.slots));
  if (ctx.careAboutCraving) {
    const cc = greedyCravingCombo(ctx, ctx.slots);
    if (cc) cands.push(cc);
  }
  if (chaseSpecial) {
    const duo = [ctx.special.a, ctx.special.b].filter((id) =>
      ctx.unlockedIds.includes(id),
    );
    if (duo.length === 2) cands.push(greedyCombo(ctx, ctx.slots, duo));
  }
  return cands;
}

function bestOf(ctx: DayContext, cands: string[][]): string[] {
  let best = cands[0];
  let bestVal = -Infinity;
  for (const c of cands) {
    const v = comboValue(ctx, c);
    if (v > bestVal) {
      bestVal = v;
      best = c;
    }
  }
  return best;
}

const ARCHETYPES: Archetype[] = [
  {
    // Mediocre recipes: samples a handful of random combos, keeps a random
    // "good"-tier one (not great), ignores the craving half the time.
    name: "idle",
    clicksPerSec: 0.2,
    cravingCareProb: 0.5,
    pick: (ctx, rng) => {
      const samples: string[][] = [];
      for (let i = 0; i < 15; i++) samples.push(sampleCombo(ctx, rng, ctx.slots));
      const good = samples.filter((c) => {
        const t = rawTier(ctx, c);
        return t === "good";
      });
      if (good.length > 0) {
        if (ctx.careAboutCraving) return bestOf(ctx, good);
        return good[Math.floor(rng() * good.length)];
      }
      // no good combo sampled: settle for the best sampled one
      return bestOf(ctx, samples);
    },
  },
  {
    // Decent search: early week uses sampled combos, from day 4 has "found" a
    // great combo (best guaranteed/greedy candidate). Matches craving most days.
    name: "casual",
    clicksPerSec: 1,
    cravingCareProb: 0.8,
    pick: (ctx, rng) => {
      if (ctx.day <= 3) {
        const samples: string[][] = [];
        for (let i = 0; i < 25; i++)
          samples.push(sampleCombo(ctx, rng, ctx.slots));
        // when playing to the craving, they also try stacking craving-flavour
        // ingredients (mediocre affinity, but the flavour matches)
        if (ctx.careAboutCraving) {
          const flavorPool = ctx.unlockedIds.filter(
            (id) => INGREDIENTS[id]?.flavor === ctx.craving,
          );
          for (let i = 0; i < 10 && flavorPool.length >= 2; i++) {
            const pool = [...flavorPool];
            const combo: string[] = [];
            const size = Math.min(ctx.slots, pool.length);
            for (let k = 0; k < size; k++)
              combo.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
            samples.push(combo);
          }
        }
        return bestOf(ctx, samples);
      }
      return bestOf(ctx, skilledCandidates(ctx, false));
    },
  },
  {
    // Near-optimal: greedy over the matrix + guaranteed combos + special-duo
    // builds. Always plays to the craving (the daily-star counter is worth
    // more than a marginal curry edge): picks the best craving-MATCHING
    // candidate when one exists, otherwise the best overall.
    name: "active",
    clicksPerSec: 3,
    cravingCareProb: 1,
    pick: (ctx) => {
      const cands = skilledCandidates(ctx, true);
      const matching = cands.filter(
        (c) => computeRecipeFlavor(c) === ctx.craving,
      );
      return bestOf(ctx, matching.length > 0 ? matching : cands);
    },
  },
];

// ---- shop / franchise buying ------------------------------------------------

interface PlayerState {
  curry: number;
  purchasedUpgrades: string[];
  ownedDecorations: Record<string, number>;
  franchiseUpgrades: string[];
  stars: number;
  starsEarned: number;
  streakDays: number;
  streakMult: number;
}

interface ShopBuy {
  id: string;
  cost: number;
}

// Cheapest-first greedy shop pass; returns purchases made.
function buyShopGreedy(p: PlayerState): ShopBuy[] {
  const bought: ShopBuy[] = [];
  for (;;) {
    const options: ShopBuy[] = [];
    for (const u of UPGRADES) {
      if (p.purchasedUpgrades.includes(u.id)) continue;
      if (
        u.prerequisiteUpgradeId &&
        !p.purchasedUpgrades.includes(u.prerequisiteUpgradeId)
      )
        continue;
      options.push({ id: u.id, cost: u.cost });
    }
    for (const d of DECORATIONS) {
      if ((p.ownedDecorations[d.id] ?? 0) >= d.maxQuantity) continue;
      options.push({ id: d.id, cost: d.cost });
    }
    options.sort((a, b) => a.cost - b.cost);
    const pick = options.find((o) => p.curry >= o.cost);
    if (!pick) break;
    p.curry -= pick.cost;
    if (UPGRADES.some((u) => u.id === pick.id)) {
      p.purchasedUpgrades.push(pick.id);
    } else {
      p.ownedDecorations[pick.id] = (p.ownedDecorations[pick.id] ?? 0) + 1;
    }
    bought.push(pick);
  }
  return bought;
}

// True when there is at least one shop item left to buy (bounded catalog).
function shopHasRemaining(p: PlayerState): boolean {
  return (
    UPGRADES.some((u) => !p.purchasedUpgrades.includes(u.id)) ||
    DECORATIONS.some((d) => (p.ownedDecorations[d.id] ?? 0) < d.maxQuantity)
  );
}

function shopItemsOwned(p: PlayerState): number {
  return (
    p.purchasedUpgrades.length +
    Object.values(p.ownedDecorations).reduce((a, b) => a + b, 0)
  );
}

// Cheapest-first franchise pass at week end.
function buyFranchiseGreedy(p: PlayerState): string[] {
  const bought: string[] = [];
  for (;;) {
    const options = FRANCHISE_UPGRADES.filter(
      (u) =>
        !p.franchiseUpgrades.includes(u.id) &&
        (!u.prerequisiteUpgradeId ||
          p.franchiseUpgrades.includes(u.prerequisiteUpgradeId)) &&
        u.cost <= p.stars,
    ).sort((a, b) => a.cost - b.cost);
    if (options.length === 0) break;
    const pick = options[0];
    p.stars -= pick.cost;
    p.franchiseUpgrades.push(pick.id);
    bought.push(pick.id);
  }
  return bought;
}

const FRANCHISE_TOTAL_COST = FRANCHISE_UPGRADES.reduce((s, u) => s + u.cost, 0);

// ---- weekly simulation -------------------------------------------------------

interface WeekResult {
  week: number;
  curryEarned: number;
  shopBuys: ShopBuy[];
  shopOwned: number;
  starsEarned: number;
  starsTotal: number; // lifetime
  starsBank: number; // unspent after purchases
  franchiseBuys: string[];
  franchiseOwnedCount: number;
  deadZone: boolean; // nothing new bought AND catalog(s) not exhausted
  tierSeen: string;
  cravingDays: number;
  journalPairs: number;
}

function weekSeed(week: number): number {
  // FNV-ish mix, deterministic per (BASE_SEED, week)
  let h = (BASE_SEED ^ (week * 2654435761)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  return h;
}

function simulateWeek(
  arch: Archetype,
  p: PlayerState,
  week: number,
  rng: Rng,
): WeekResult {
  const seed = weekSeed(week);
  const { matrix, guaranteed } = getAffinityData(seed);
  const unlockedIds = unlockedIngredientIds(p.franchiseUpgrades);

  // --- startNewWeek semantics ---
  p.streakDays = 0;
  p.streakMult = 1;
  const headStart = headStartCurry(p.franchiseUpgrades);
  if (headStart > 0) p.curry += headStart;

  // Journal Insight pre-reveals (mirrors store's seeded loop; we only need the count)
  const insightCount = Math.min(
    E.franchise.journalInsightPairs(p.franchiseUpgrades),
    (unlockedIds.length * (unlockedIds.length - 1)) / 2,
  );
  const journal = new Set<string>();
  if (insightCount > 0) {
    const irng = makeRng(`${seed}-insight`);
    let attempts = 0;
    while (journal.size < insightCount && attempts < 500) {
      attempts++;
      const a = unlockedIds[Math.floor(irng() * unlockedIds.length)];
      const b = unlockedIds[Math.floor(irng() * unlockedIds.length)];
      if (a === b) continue;
      journal.add(affinityPairKey(a, b));
    }
  }

  let highestTier = "none";
  const TIER_ORDER: Record<string, number> = {
    none: 0,
    terrible: 1,
    neutral: 2,
    good: 3,
    great: 4,
    legendary: 5,
  };
  let cravingDays = 0;
  let weekCurry = 0;
  const shopBuys: ShopBuy[] = [];
  const startingStars = p.starsEarned;

  for (let day = 1; day <= DAYS_PER_WEEK; day++) {
    const effects = computeEffects(
      p.purchasedUpgrades,
      p.ownedDecorations,
      p.franchiseUpgrades,
    );
    const craving = getDailyCraving(day, seed);
    const special = getDailySpecial(day, seed);
    const careAboutCraving = rng() < arch.cravingCareProb;

    const ctx: DayContext = {
      day,
      seed,
      matrix,
      guaranteed,
      unlockedIds,
      slots: effects.unlockedSlots,
      craving,
      careAboutCraving,
      special: { a: special.ingredientA, b: special.ingredientB },
      spicePairBonus: effects.spicePairAffinityBonus,
    };

    const combo = arch.pick(ctx, rng);
    const slots = combo; // engine takes (string | null)[]

    const specialMult =
      combo.includes(special.ingredientA) && combo.includes(special.ingredientB)
        ? special.bonusMultiplier
        : 1;

    const clickValue = computeClickValue(slots, matrix, effects, {
      specialMultiplier: specialMult,
      streakMultiplier: p.streakMult,
      craving: craving as never,
    });
    const auto = computeAutoProduction(slots, matrix, effects);
    const clicksPerDay = Math.round(arch.clicksPerSec * DAY_DURATION_SECONDS);
    const dayIncome = clickValue * clicksPerDay + auto * DAY_DURATION_SECONDS;

    p.curry += dayIncome;
    weekCurry += dayIncome;

    // --- day-end rollover (store semantics) ---
    const score = computeRecipeScore(slots, matrix, {
      spicePairBonus: effects.spicePairAffinityBonus,
    });
    if (TIER_ORDER[score.tier] > TIER_ORDER[highestTier])
      highestTier = score.tier;
    const streak = evaluateStreak({ tierAtDayEnd: score.tier as never }, p.streakDays);
    p.streakDays = streak.newStreakDays;
    p.streakMult = streak.newMultiplier;

    // journal: reveal pairs of the day-end recipe
    for (let i = 0; i < combo.length; i++)
      for (let j = i + 1; j < combo.length; j++)
        journal.add(affinityPairKey(combo[i], combo[j]));

    // craving-match day (recipe flavour vs craving, store's day-end check)
    if (score.flavor === craving) cravingDays++;

    // end-of-day shopping
    shopBuys.push(...buyShopGreedy(p));
  }

  // --- week completion: stars per FRANCHISE_DESIGN.md table ---
  let earned = 1; // completing the week
  if (TIER_ORDER[highestTier] >= TIER_ORDER.great) earned += 1;
  if (highestTier === "legendary") earned += 1;
  if (cravingDays >= 4) earned += 1;
  if (journal.size >= 20) earned += 1;
  p.stars += earned;
  p.starsEarned += earned;

  const franchiseBuys = buyFranchiseGreedy(p);

  const catalogDone = p.franchiseUpgrades.length === FRANCHISE_UPGRADES.length;
  const deadZone =
    shopBuys.length === 0 &&
    franchiseBuys.length === 0 &&
    (shopHasRemaining(p) || !catalogDone);

  return {
    week,
    curryEarned: weekCurry,
    shopBuys,
    shopOwned: shopItemsOwned(p),
    starsEarned: earned,
    starsTotal: p.starsEarned,
    starsBank: p.stars,
    franchiseBuys,
    franchiseOwnedCount: p.franchiseUpgrades.length,
    deadZone,
    tierSeen: highestTier,
    cravingDays,
    journalPairs: journal.size,
  };
}

// ---- run --------------------------------------------------------------------

function fmt(n: number): string {
  if (!isFinite(n)) return n.toExponential(2);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

function pad(s: string, w: number): string {
  return s.length >= w ? s : s + " ".repeat(w - s.length);
}

console.log(
  `CurryClicker balance sim — ${N_WEEKS} weeks, base seed ${BASE_SEED}, ` +
    `day=${DAY_DURATION_SECONDS}s, franchise catalog=${FRANCHISE_TOTAL_COST}★, ` +
    `shop items=${UPGRADES.length} upgrades + ${DECORATIONS.length} decorations`,
);
console.log(
  `strategy: shop=cheapest-first at each day end; franchise=cheapest-first at week end\n`,
);

interface ArchSummary {
  name: string;
  buyoutWeek: number | null;
  shopDoneWeek: number | null;
  deadZones: number[];
  totalCurry: number;
}

const summaries: ArchSummary[] = [];

for (const arch of ARCHETYPES) {
  const p: PlayerState = {
    curry: 0,
    purchasedUpgrades: [],
    ownedDecorations: {},
    franchiseUpgrades: [],
    stars: 0,
    starsEarned: 0,
    streakDays: 0,
    streakMult: 1,
  };
  const rng = makeRng(`sim-${arch.name}-${BASE_SEED}`);

  console.log(
    `=== ${arch.name.toUpperCase()} (${arch.clicksPerSec} clicks/sec) ===`,
  );
  console.log(
    pad("wk", 4) +
      pad("curry", 10) +
      pad("shop+", 6) +
      pad("owned", 7) +
      pad("tier", 11) +
      pad("crave", 7) +
      pad("jrnl", 6) +
      pad("★wk", 5) +
      pad("★life", 7) +
      pad("★bank", 7) +
      "franchise buys",
  );

  let buyoutWeek: number | null = null;
  let shopDoneWeek: number | null = null;
  const deadZones: number[] = [];
  let totalCurry = 0;

  for (let w = 1; w <= N_WEEKS; w++) {
    const r = simulateWeek(arch, p, w, rng);
    totalCurry += r.curryEarned;
    if (buyoutWeek === null && r.franchiseOwnedCount === FRANCHISE_UPGRADES.length)
      buyoutWeek = w;
    if (shopDoneWeek === null && !shopHasRemaining(p)) shopDoneWeek = w;
    if (r.deadZone) deadZones.push(w);

    console.log(
      pad(String(w), 4) +
        pad(fmt(r.curryEarned), 10) +
        pad(String(r.shopBuys.length), 6) +
        pad(String(r.shopOwned), 7) +
        pad(r.tierSeen, 11) +
        pad(`${r.cravingDays}/7`, 7) +
        pad(String(r.journalPairs), 6) +
        pad(`+${r.starsEarned}`, 5) +
        pad(String(r.starsTotal), 7) +
        pad(String(r.starsBank), 7) +
        (r.franchiseBuys.length > 0
          ? r.franchiseBuys.join(", ")
          : r.deadZone
            ? "(dead zone)"
            : "-"),
    );
  }

  summaries.push({ name: arch.name, buyoutWeek, shopDoneWeek, deadZones, totalCurry });
  console.log("");
}

console.log("=== SUMMARY ===");
for (const s of summaries) {
  console.log(
    `${pad(s.name, 8)} franchise buyout (${FRANCHISE_TOTAL_COST}★): ` +
      `${s.buyoutWeek !== null ? `week ${s.buyoutWeek}` : `NOT within ${N_WEEKS} weeks`}` +
      ` | shop bought out: ${s.shopDoneWeek !== null ? `week ${s.shopDoneWeek}` : `not within ${N_WEEKS} weeks`}` +
      ` | dead zones: ${s.deadZones.length > 0 ? s.deadZones.join(",") : "none"}` +
      ` | total curry: ${fmt(s.totalCurry)}`,
  );
}
