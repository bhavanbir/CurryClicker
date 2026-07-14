import type {
  AffinityMatrix,
  Flavor,
  PairScore,
  RecipeScore,
  RecipeTier,
} from "../types";
import { INGREDIENTS } from "./ingredients";

// [avgAffinity threshold, multiplier] — walked top-down to pick the multiplier.
const MULTIPLIER_CURVE: [number, number][] = [
  [-Infinity, 0.5], // terrible
  [-0.3, 0.75],
  [0.3, 1.0], // neutral baseline
  [0.8, 1.5], // good
  [1.3, 2.25], // great
  [1.6, 3.5], // legendary (needs many slots AND a great combo)
];

export function avgAffinityToTier(avg: number): RecipeTier {
  if (avg > 1.3) return "legendary";
  if (avg >= 0.8) return "great";
  if (avg >= 0.3) return "good";
  if (avg >= -0.3) return "neutral";
  return "terrible";
}

export const TIER_ORDER: Record<RecipeTier, number> = {
  none: 0,
  terrible: 1,
  neutral: 2,
  good: 3,
  great: 4,
  legendary: 5,
};

// Multiplier each tier lands on (mirrors MULTIPLIER_CURVE); used to recompute the
// multiplier when a mismatched craving caps the tier down to `great`.
export const TIER_MULTIPLIER: Record<RecipeTier, number> = {
  none: 1,
  terrible: 0.5,
  neutral: 1.0,
  good: 1.5,
  great: 2.25,
  legendary: 3.5,
};

// When the recipe's flavour matches today's craving, cook value gets this bump.
// Deliberately smaller than the Daily Special's 2× since it's easier to hit.
export const CRAVING_MATCH_BONUS = 1.35;

// Most-common flavour among the slotted ingredients. Ties (incl. an empty recipe)
// resolve to `unique`; a single ingredient keeps its own flavour. Returns null
// only when nothing is slotted.
export function computeRecipeFlavor(slots: (string | null)[]): Flavor | null {
  const flavors = slots
    .map((s) => (s ? INGREDIENTS[s]?.flavor : undefined))
    .filter((f): f is Flavor => f !== undefined);

  if (flavors.length === 0) return null;

  const counts = new Map<Flavor, number>();
  for (const f of flavors) counts.set(f, (counts.get(f) ?? 0) + 1);

  let best: Flavor | null = null;
  let bestCount = 0;
  let tied = false;
  for (const [flavor, count] of counts) {
    if (count > bestCount) {
      best = flavor;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }

  return tied ? "unique" : best;
}

// Random decent recipe: sample `slotCount` distinct ingredients and keep the
// first neutral-to-great draw — never terrible, and never a free legendary
// (falls back to the last sample if 40 draws all miss).
export function randomNeutralRecipe(
  ids: string[],
  slotCount: number,
  matrix: AffinityMatrix,
): string[] {
  const count = Math.min(slotCount, ids.length);
  let sample: string[] = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    const pool = [...ids];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    sample = pool.slice(0, count);
    const tier = computeRecipeScore(sample, matrix).tier;
    // neutral/good only: a great+ starter would open the Naming Ceremony on a
    // brand-new player's very first tap, mid-tutorial.
    if (tier === "neutral" || tier === "good") return sample;
  }
  return sample;
}

export interface ScoreOptions {
  // Flat affinity added to every spice/spice pair (Spice Rack Deluxe decoration).
  spicePairBonus?: number;
  // Today's craving. When set, a matching recipe flavour earns CRAVING_MATCH_BONUS
  // and a mismatched legendary is capped down to `great` (effective* fields only;
  // the raw tier/multiplier are always preserved).
  craving?: Flavor;
}

export function computeRecipeScore(
  slots: (string | null)[],
  matrix: AffinityMatrix,
  opts: ScoreOptions = {},
): RecipeScore {
  const spicePairBonus = opts.spicePairBonus ?? 0;
  const craving = opts.craving;
  const ids = slots.filter((s): s is string => s !== null);

  if (ids.length === 0) {
    return {
      affinityScore: 0,
      avgAffinity: 0,
      multiplier: 1,
      tier: "none",
      baseValue: 0,
      pairBreakdown: [],
      flavor: null,
      effectiveTier: "none",
      effectiveMultiplier: 1,
      cravingMatched: craving ? false : null,
    };
  }

  let totalAffinity = 0;
  let pairCount = 0;
  const pairBreakdown: PairScore[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      let val = matrix[ids[i]]?.[ids[j]] ?? 0;
      if (
        spicePairBonus !== 0 &&
        INGREDIENTS[ids[i]]?.category === "spice" &&
        INGREDIENTS[ids[j]]?.category === "spice"
      ) {
        val += spicePairBonus;
      }
      totalAffinity += val;
      pairCount++;
      pairBreakdown.push({ a: ids[i], b: ids[j], affinity: val });
    }
  }

  const avgAffinity = pairCount > 0 ? totalAffinity / pairCount : 0;

  // A single ingredient has no pairs -> neutral 1.0 multiplier.
  let multiplier = 1;
  if (pairCount > 0) {
    multiplier = 0.5;
    for (const [threshold, mult] of MULTIPLIER_CURVE) {
      if (avgAffinity >= threshold) multiplier = mult;
    }
  }

  const baseValue = ids.reduce(
    (sum, id) => sum + (INGREDIENTS[id]?.baseValue ?? 0),
    0,
  );

  const tier: RecipeTier = pairCount > 0 ? avgAffinityToTier(avgAffinity) : "neutral";

  const flavor = computeRecipeFlavor(slots);

  let effectiveTier = tier;
  let effectiveMultiplier = multiplier;
  let cravingMatched: boolean | null = null;
  if (craving) {
    cravingMatched = flavor === craving;
    if (cravingMatched) {
      effectiveMultiplier = multiplier * CRAVING_MATCH_BONUS;
    } else if (tier === "legendary") {
      // Off-craving legendaries still cook well, just not top-tier.
      effectiveTier = "great";
      effectiveMultiplier = TIER_MULTIPLIER.great;
    }
  }

  return {
    affinityScore: totalAffinity,
    avgAffinity,
    multiplier,
    tier,
    baseValue,
    pairBreakdown,
    flavor,
    effectiveTier,
    effectiveMultiplier,
    cravingMatched,
  };
}
