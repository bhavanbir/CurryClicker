import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore, useEffects } from "../hooks/useRecipeScore";
import { getAffinityData, affinityPairKey } from "../engine/affinityEngine";
import { recipeFingerprint } from "../engine/cookbook";
import { TASTE_COOKS_TO_REVEAL } from "../config";
import { handleClick, type ClickMods } from "../engine/clickEngine";
import { getDailySpecial, getDailyCraving } from "../engine/weekEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { formatCurry } from "../lib/format";
import { playCook, playDiscovery } from "../lib/sfx";
import type { Screen } from "../navigation";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { DayProgressBar } from "../components/DayProgressBar";
import { AffinityBadge } from "../components/AffinityBadge";
import { RestaurantScene } from "../scene/RestaurantScene";
import { FloatText, type Float } from "../components/FloatText";
import { ClickBurst } from "../components/ClickBurst";
import { PixelIcon } from "../components/PixelIcon";
import { TodayStrip } from "../components/TodayStrip";
import { FlavorTag } from "../components/FlavorTag";
import { RecipeNamingModal } from "../components/RecipeNamingModal";
import { StatChip } from "../components/arcade/StatChip";
import { Icon } from "../components/arcade/Icon";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";
import { SteamCta } from "../components/SteamCta";
import { useCrazyCurry } from "../hooks/useCrazyCurry";
import { useOnFire } from "../hooks/useOnFire";
import { UPGRADES, DECORATIONS, upgradeCost } from "../engine/shopData";

interface Props {
  onNavigate: (s: Screen) => void;
  onOpenShop: () => void;
}

let floatId = 0;

// Critical circle tiers — anti-autoclicker bait. Low mults are common, big and
// slow; high mults are rare, tiny and fast. Weights sum to 100.
const CRIT_TIERS = [
  { mult: 1.1, weight: 40, size: 96, ms: 10000, className: "bg-white text-ink" },
  { mult: 1.5, weight: 25, size: 84, ms: 7000, className: "bg-cream-100 text-ink" },
  { mult: 2, weight: 15, size: 72, ms: 5000, className: "bg-curry-yellow text-ink" },
  { mult: 5, weight: 10, size: 60, ms: 2500, className: "bg-curry-orange text-white" },
  { mult: 10, weight: 6, size: 48, ms: 1200, className: "bg-tier-terrible text-white" },
  { mult: 25, weight: 3, size: 38, ms: 600, className: "bg-flavor-unique text-white" },
  { mult: 100, weight: 1, size: 28, ms: 300, className: "bg-ink text-curry-yellow" },
] as const;
type CritTier = (typeof CRIT_TIERS)[number];

function rollCritTier(): CritTier {
  let r = Math.random() * 100;
  for (const t of CRIT_TIERS) {
    r -= t.weight;
    if (r < 0) return t;
  }
  return CRIT_TIERS[0];
}

const CHAIN_CAP = 3; // max jackpot-chain depth after the first crit click

export function GameplayScreen({ onNavigate, onOpenShop }: Props) {
  const slots = useGameStore((s) => s.slots);
  const seed = useGameStore((s) => s.seed);
  const currentDay = useGameStore((s) => s.currentDay);
  const streakDays = useGameStore((s) => s.recipeStreakDays);
  const streakMult = useGameStore((s) => s.recipeStreakMultiplier);
  const addCurry = useGameStore((s) => s.addCurry);
  const registerClick = useGameStore((s) => s.registerClick);
  const claimSpecial = useGameStore((s) => s.claimSpecial);
  const logCook = useGameStore((s) => s.logCook);
  const dayStarted = useGameStore((s) => s.dayStarted);
  const dayPaused = useGameStore((s) => s.dayPaused);
  const startDay = useGameStore((s) => s.startDay);
  const togglePause = useGameStore((s) => s.togglePause);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const totalCurryAllTime = useGameStore((s) => s.totalCurryAllTime);
  const highestTierSeen = useGameStore((s) => s.highestTierSeen);
  const lastWeekStars = useGameStore((s) => s.lastWeekStars);
  const discoveredRecipes = useGameStore((s) => s.discoveredRecipes);
  const discoveredAffinities = useGameStore((s) => s.discoveredAffinities);
  const franchiseStarsEarned = useGameStore((s) => s.franchiseStarsEarned);

  const demoEnded = IS_DEMO && weeksCompleted >= 1;

  const score = useRecipeScore();
  const effects = useEffects();
  const [floats, setFloats] = useState<Float[]>([]);
  const [crit, setCrit] = useState<{
    id: number;
    x: number;
    y: number;
    tier: CritTier;
    chain: number; // 0 = normal spawn; >0 = jackpot chain step
    phase: "telegraph" | "live";
  } | null>(null);
  const critHoverRef = useRef(false); // mouse currently over the crit circle
  const reduced = useReducedMotion() ?? false;
  const onFire = useOnFire();
  const [cookSignal, setCookSignal] = useState(0);
  const [namingFp, setNamingFp] = useState<string | null>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);

  const filled = slots.filter(Boolean) as string[];
  const hasRecipe = filled.length > 0;

  const special = getDailySpecial(currentDay, seed);
  const specialActive =
    slots.includes(special.ingredientA) && slots.includes(special.ingredientB);
  const craving = getDailyCraving(currentDay, seed);
  const mods: ClickMods = {
    specialMultiplier: specialActive ? special.bonusMultiplier : 1,
    streakMultiplier: streakMult,
    craving,
  };

  const perCook = handleClick(slots, getAffinityData(seed).matrix, effects, mods).value;

  // Taste-to-reveal progress for the standing recipe (any pair still unknown?)
  const hasUntastedPair =
    filled.length >= 2 &&
    filled.some((a, i) =>
      filled
        .slice(i + 1)
        .some((b) => discoveredAffinities[affinityPairKey(a, b)] === undefined),
    );
  const tasteCount = Math.min(
    discoveredRecipes[recipeFingerprint(slots)]?.cookCount ?? 0,
    TASTE_COOKS_TO_REVEAL,
  );

  const crazy = useCrazyCurry(hasRecipe && dayStarted && !dayPaused && !demoEnded);

  function cook(x: number, y: number, critMult = 1) {
    if (!hasRecipe || !dayStarted || dayPaused) return; // shop closed or paused
    const result = handleClick(slots, getAffinityData(seed).matrix, effects, mods);
    if (result.value <= 0) return;

    const crazyMult = crazy.registerCook();
    const fireMult = onFire.registerCook();
    const value = Math.floor(result.value * crazyMult * critMult * fireMult);

    addCurry(value);
    registerClick();
    playCook(onFire.heat / 100);
    if (result.isSpecial) claimSpecial(currentDay);
    const outcome = logCook(slots);
    if (outcome.needsNaming) setNamingFp(outcome.fingerprint);
    if (outcome.rumorReward) {
      playDiscovery("legendary");
      shakeScene("lg");
      const rid = floatId++;
      const rumorLabel = `Rumor solved! +${formatCurry(outcome.rumorReward)}`;
      setFloats((f) =>
        [...f, { id: rid, x, y: y - 60, label: rumorLabel }].slice(-12),
      );
      window.setTimeout(
        () => setFloats((f) => f.filter((fl) => fl.id !== rid)),
        800,
      );
    }
    if (outcome.tastedPairs > 0) {
      const tasteId = floatId++;
      setFloats((f) =>
        [...f, { id: tasteId, x, y: y - 40, label: `Tasted! +${outcome.tastedPairs} pairs` }].slice(-12),
      );
      window.setTimeout(
        () => setFloats((f) => f.filter((fl) => fl.id !== tasteId)),
        800,
      );
    }
    setCookSignal((n) => n + 1);

    // 25% chance to spawn a critical circle (if none is up) — click it before
    // it expires for the tier's multiplier. Crit clicks skip this roll; their
    // follow-up comes from the jackpot chain in clickCrit instead.
    if (critMult === 1 && !crit && Math.random() < 0.25) {
      spawnCrit(rollCritTier(), 0);
    }

    const id = floatId++;
    let label = "+" + formatCurry(value);
    if (critMult > 1) label += ` CRIT ×${critMult}!`;
    else if (crazyMult > 1) label += ` ×${crazyMult}!`;
    else if (result.isSpecial) label += " ×2!";
    else if (fireMult > 1) label += ` 🔥×${fireMult}`;
    setFloats((f) => [...f, { id, x, y, label }].slice(-12)); // cap under mash
    window.setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 800);
  }

  function cookFromButton() {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    // jitter so mashing the button doesn't stack identical bursts
    if (rect) cook(rect.width / 2 + (Math.random() * 48 - 24), rect.height * 0.45);
    else cook(0, 0);
  }

  // Scene shake for big moments only (never plain clicks — over-juicing reads
  // as noise). Direct classList toggle: no rerender, restarts cleanly.
  function shakeScene(strength: "sm" | "lg") {
    const el = sceneWrapRef.current;
    if (!el || reduced) return;
    el.classList.remove("shake-sm", "shake-lg");
    void el.offsetWidth; // reflow so re-adding restarts the animation
    el.classList.add(`shake-${strength}`);
  }

  // On Fire ignition (stage 2) gets a small shake.
  const prevFireStageRef = useRef(onFire.stage);
  useEffect(() => {
    if (onFire.stage === 2 && prevFireStageRef.current < 2) shakeScene("sm");
    prevFireStageRef.current = onFire.stage;
  }, [onFire.stage]);

  // Crazy Curry event start gets a small shake.
  useEffect(() => {
    if (crazy.event) shakeScene("sm");
  }, [crazy.event?.startedAt]);

  function spawnCrit(tier: CritTier, chain: number) {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = tier.size / 2 + 8;
    const critId = floatId++;
    critHoverRef.current = false;
    const x = margin + Math.random() * Math.max(1, rect.width - margin * 2);
    const y = margin + Math.random() * Math.max(1, rect.height - margin * 2);
    if (chain === 0) {
      setCrit({ id: critId, x, y, tier, chain, phase: "live" });
      window.setTimeout(
        () => setCrit((c) => (c?.id === critId ? null : c)),
        tier.ms,
      );
    } else {
      // Chained circles telegraph first: a 400ms "incoming" cue, then live.
      setCrit({ id: critId, x, y, tier, chain, phase: "telegraph" });
      window.setTimeout(() => {
        setCrit((c) => (c?.id === critId ? { ...c, phase: "live" } : c));
        window.setTimeout(
          () => setCrit((c) => (c?.id === critId ? null : c)),
          tier.ms,
        );
      }, 400);
    }
  }

  function clickCrit(c: NonNullable<typeof crit>) {
    if (c.phase !== "live") return;
    setCrit(null);
    critHoverRef.current = false;
    cook(c.x, c.y, c.tier.mult);
    if (c.tier.mult >= 5) shakeScene(c.tier.mult >= 25 ? "lg" : "sm");
    // Jackpot chain: chance to spawn a rarer, one-tier-higher follow-up.
    // Odds shrink per step (35% → 25% → 15%), capped at CHAIN_CAP deep.
    const idx = CRIT_TIERS.indexOf(c.tier);
    if (c.chain < CHAIN_CAP && Math.random() < 0.35 - 0.1 * c.chain) {
      spawnCrit(CRIT_TIERS[Math.min(idx + 1, CRIT_TIERS.length - 1)], c.chain + 1);
    }
  }

  // Spacebar hits the crit circle when the mouse is hovering it.
  const critSpaceRef = useRef<() => boolean>(() => false);
  critSpaceRef.current = () => {
    if (crit && critHoverRef.current) {
      clickCrit(crit);
      return true;
    }
    return false;
  };

  // Spacebar cooks — same guarded path as the Cook! button. Skips form fields
  // and focused buttons so native keyboard behavior still works there.
  const cookFromButtonRef = useRef(cookFromButton);
  cookFromButtonRef.current = cookFromButton;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.tagName === "BUTTON" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault(); // no page scroll
      if (critSpaceRef.current()) return; // hovering the crit circle? hit it
      cookFromButtonRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatChip icon="calendar_today" label="Day" value={`${currentDay}/7`} />
          {dayStarted && (
            <button
              type="button"
              onClick={togglePause}
              aria-label={dayPaused ? "Resume day" : "Pause day"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink shadow-arcade-sm transition-transform hover:-translate-y-0.5 ${
                dayPaused ? "bg-primary text-white" : "bg-white text-ink"
              }`}
            >
              <Icon name={dayPaused ? "play_arrow" : "pause"} fill size={20} />
            </button>
          )}
        </div>
        <ScoreDisplay />
        {streakDays >= 2 ? (
          <StatChip icon="whatshot" label="Streak" value={`${streakMult.toFixed(2)}×`} />
        ) : (
          <div className="w-[88px]" />
        )}
      </div>

      <DayProgressBar />

      <TodayStrip event={crazy.event} nextEventAt={crazy.nextEventAt} />

      {!demoEnded && <GoalBar onOpenShop={onOpenShop} />}

      {/* Restaurant scene + floats */}
      <div ref={sceneWrapRef} className="relative">
        <RestaurantScene
          cookSignal={cookSignal}
          onCook={cook}
          busy={hasRecipe && dayStarted && !dayPaused}
          cravingMatched={score.cravingMatched ?? false}
        />
        <AnimatePresence>
          {floats.map((f) => (
            <div key={f.id}>
              <ClickBurst x={f.x} y={f.y} />
              <FloatText x={f.x} y={f.y} label={f.label} />
            </div>
          ))}
        </AnimatePresence>

        {/* Critical circle — click (or hover + spacebar) before it expires.
            Telegraph phase = non-interactive "incoming" cue for chained circles. */}
        <AnimatePresence>
          {crit && crit.phase === "telegraph" && (
            <div
              key={`t${crit.id}`}
              className="crit-telegraph pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-ink"
              style={{
                left: crit.x,
                top: crit.y,
                width: crit.tier.size,
                height: crit.tier.size,
              }}
            />
          )}
          {crit && crit.phase === "live" && (
            <motion.button
              key={crit.id}
              type="button"
              aria-label={`Critical hit! ×${crit.tier.mult}`}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, times: [0, 0.6, 1] }}
              onPointerDown={() => clickCrit(crit)}
              onPointerEnter={() => (critHoverRef.current = true)}
              onPointerLeave={() => (critHoverRef.current = false)}
              className={`absolute z-40 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-ink font-display font-black shadow-arcade ${crit.tier.className}`}
              style={{
                left: crit.x,
                top: crit.y,
                width: crit.tier.size,
                height: crit.tier.size,
                fontSize: Math.max(9, Math.round(crit.tier.size * 0.24)),
              }}
            >
              ×{crit.tier.mult}
              {crit.chain > 0 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded border border-ink bg-curry-yellow px-1 text-[8px] font-black uppercase text-ink">
                  Chain
                </span>
              )}
              {/* timer: inner ring shrinks to nothing over the tier lifetime */}
              <motion.span
                className="pointer-events-none absolute inset-1 rounded-full border-4 border-ink/25"
                initial={{ scale: 1 }}
                animate={{ scale: 0 }}
                transition={{ duration: crit.tier.ms / 1000, ease: "linear" }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* On Fire — stage-2 glow + heat bar pinned to the scene bottom */}
        {onFire.stage === 2 && (
          <div className="on-fire-glow pointer-events-none absolute inset-0 z-10" />
        )}
        {onFire.heat > 0 && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 w-1/2 -translate-x-1/2">
            {onFire.stage === 2 && (
              <div className="mb-0.5 text-center font-display text-[10px] font-black uppercase tracking-widest text-white [text-shadow:1px_1px_0_#191c1e]">
                🔥 On Fire ×1.5
              </div>
            )}
            <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-white/70">
              <div
                className={`h-full transition-[width] duration-150 ${
                  onFire.stage === 2
                    ? "bg-tier-terrible"
                    : onFire.stage === 1
                      ? "bg-curry-orange"
                      : "bg-curry-yellow"
                }`}
                style={{ width: `${onFire.heat}%` }}
              />
            </div>
          </div>
        )}

        {/* Crazy Curry banner — keep clicking above the floor for the bonus */}
        {crazy.event && (
          <motion.div
            key={crazy.event.startedAt}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-none absolute left-1/2 top-10 z-40 w-max max-w-[90%] -translate-x-1/2 rounded-xl border-4 border-ink bg-curry-yellow px-4 py-2 text-center shadow-arcade"
          >
            <div className="flex items-center justify-center gap-1 font-display text-sm font-black uppercase tracking-wide text-ink">
              <Icon name="local_fire_department" fill size={18} className="text-tier-terrible" />
              Crazy Curry! Keep {crazy.event.floor}+ clicks/sec
            </div>
            <div
              className={`text-xs font-black uppercase tracking-wide ${
                crazy.onPace ? "text-tier-good" : "text-ink/60"
              }`}
            >
              {crazy.onPace
                ? `×${crazy.event.mult} bonus active!`
                : `×${crazy.event.mult} if you keep the pace`}
            </div>
            <motion.div
              className="mt-1 h-1.5 rounded-full bg-ink/80"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: crazy.event.durationMs / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </div>

      {/* Active recipe bar */}
      {demoEnded ? (
        <ArcadePanel className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <Icon name="emoji_events" fill size={30} className="text-tertiary" />
            <h2 className="font-display text-xl font-black uppercase text-ink">
              That's the demo!
            </h2>
          </div>
          <p className="text-sm font-semibold text-ink/70">
            Week 2's fresh affinity matrix is already waiting in your Kitchen —
            the full game lets you chase it week after week, with 45 ingredients,
            the 5th slot, skins, and the whole Franchise catalog.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <DemoStat
              icon="star"
              label="Curry all-time"
              value={formatCurry(totalCurryAllTime, 1)}
            />
            <DemoStat
              icon="restaurant"
              label="Best tier"
              value={
                lastWeekStars?.reasons.some((r) => r.includes("Legendary"))
                  ? "Legendary"
                  : lastWeekStars?.reasons.some((r) => r.includes("Great"))
                    ? "Great"
                    : highestTierSeen !== "none"
                      ? highestTierSeen
                      : "—"
              }
            />
            <DemoStat
              icon="stars"
              label="Stars earned"
              value={franchiseStarsEarned.toLocaleString()}
            />
          </div>
          <SteamCta label="Get the full game on Steam" />
        </ArcadePanel>
      ) : (
      <ArcadePanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        {hasRecipe ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {filled.map((id, i) => (
                  <span
                    key={i}
                    className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-white"
                  >
                    <PixelIcon id={id} icon={INGREDIENTS[id].icon} size={32} iconClassName={INGREDIENTS[id].color} />
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => onNavigate("kitchen")}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border-2 border-dashed border-ink/40 text-ink/40"
                  aria-label="Edit recipe"
                >
                  <Icon name="edit" size={18} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <AffinityBadge tier={score.tier} multiplier={score.multiplier} />
                <FlavorTag flavor={score.flavor} craving={craving} tier={score.tier} />
                <span className="text-sm font-bold text-ink/60">
                  +{formatCurry(perCook)} / cook
                </span>
                {hasUntastedPair && (
                  <span className="flex items-center gap-1 text-sm font-bold text-ink/60">
                    <Icon name="science" size={16} />
                    Tasting… {tasteCount}/{TASTE_COOKS_TO_REVEAL}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
            <Icon name="info" className="text-primary" size={20} />
            No recipe yet — open the Kitchen to cook one up!
          </div>
        )}

        {/* Primary action: build a recipe → open the day → cook. The day clock
            only starts when the player presses Start Day. */}
        <ArcadeButton
          size="xl"
          variant={!hasRecipe ? "tertiary" : !dayStarted || dayPaused ? "buy" : "primary"}
          onClick={
            !hasRecipe
              ? () => onNavigate("kitchen")
              : !dayStarted
                ? startDay
                : dayPaused
                  ? togglePause
                  : cookFromButton
          }
        >
          {!hasRecipe ? (
            <>
              <Icon name="skillet" fill size={26} />
              Open Kitchen
            </>
          ) : !dayStarted ? (
            <>
              <Icon name="play_arrow" fill size={28} />
              Start Day {currentDay}
            </>
          ) : dayPaused ? (
            <>
              <Icon name="play_arrow" fill size={28} />
              Resume Day
            </>
          ) : (
            <>
              <Icon name="local_fire_department" fill size={28} />
              {onFire.stage === 2 ? "ON FIRE!" : "Cook!"}
            </>
          )}
        </ArcadeButton>
      </ArcadePanel>
      )}

      {namingFp && (
        <RecipeNamingModal fingerprint={namingFp} onClose={() => setNamingFp(null)} />
      )}
    </div>
  );
}

// Near-miss goal bar: progress toward the cheapest eligible shop item, flips
// to a pulsing READY! when affordable. Eligibility mirrors ShopNotifier.
function GoalBar({ onOpenShop }: { onOpenShop: () => void }) {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const ownedDecorations = useGameStore((s) => s.ownedDecorations);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);

  let target: { name: string; icon: string; tone: string; cost: number } | null =
    null;
  for (const u of UPGRADES) {
    if (IS_DEMO && u.id === "slot_5") continue;
    if (purchasedUpgrades.includes(u.id)) continue;
    if (u.prerequisiteUpgradeId && !purchasedUpgrades.includes(u.prerequisiteUpgradeId)) continue;
    const cost = upgradeCost(u, weeksCompleted);
    if (!target || cost < target.cost)
      target = { name: u.name, icon: u.icon, tone: u.tone, cost };
  }
  for (const d of DECORATIONS) {
    if (IS_DEMO && !DEMO_DECORATIONS.includes(d.id)) continue;
    if ((ownedDecorations[d.id] ?? 0) >= d.maxQuantity) continue;
    if (!target || d.cost < target.cost)
      target = { name: d.name, icon: d.icon, tone: d.tone, cost: d.cost };
  }
  if (!target) return null;

  const ready = currentCurry >= target.cost;
  const pct = Math.min(100, (currentCurry / target.cost) * 100);
  return (
    <button
      type="button"
      onClick={onOpenShop}
      className="relative flex h-9 w-full items-center gap-2 overflow-hidden rounded-lg border-2 border-ink bg-white px-2 text-left shadow-arcade-sm"
    >
      <div
        className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${
          ready ? "animate-pulse bg-buy" : "bg-curry-yellow/60"
        }`}
        style={{ width: `${pct}%` }}
      />
      <span
        className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-ink ${target.tone}`}
      >
        <Icon name={target.icon} fill size={14} className="text-ink" />
      </span>
      <span className="relative truncate text-xs font-extrabold text-ink">
        {ready
          ? `${target.name} — READY!`
          : `${target.name} — ${formatCurry(currentCurry)} / ${formatCurry(target.cost)}`}
      </span>
    </button>
  );
}

function DemoStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border-2 border-ink bg-cream-100 px-2 py-2 text-center">
      <Icon name={icon} fill size={18} className="text-primary" />
      <span className="font-display text-sm font-black capitalize text-ink">
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-wide text-ink/50">
        {label}
      </span>
    </div>
  );
}
