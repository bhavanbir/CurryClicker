import type { AffinityMatrix, PairScore, RecipeScore, RecipeTier } from "../types";
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

export interface ScoreOptions {
  // Flat affinity added to every spice/spice pair (Spice Rack Deluxe decoration).
  spicePairBonus?: number;
}

export function computeRecipeScore(
  slots: (string | null)[],
  matrix: AffinityMatrix,
  opts: ScoreOptions = {},
): RecipeScore {
  const spicePairBonus = opts.spicePairBonus ?? 0;
  const ids = slots.filter((s): s is string => s !== null);

  if (ids.length === 0) {
    return {
      affinityScore: 0,
      avgAffinity: 0,
      multiplier: 1,
      tier: "none",
      baseValue: 0,
      pairBreakdown: [],
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

  return {
    affinityScore: totalAffinity,
    avgAffinity,
    multiplier,
    tier,
    baseValue,
    pairBreakdown,
  };
}
