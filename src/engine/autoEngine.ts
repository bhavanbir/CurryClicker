// Passive (idle) production. Recomputed only when upgrades/decorations or the
// active recipe change — never per frame (security_and_logic §1.5). Auto income
// is scaled by the active recipe multiplier, so a good recipe boosts both
// clicking AND idle income.

import type { AffinityMatrix } from "../types";
import { Decimal } from "../lib/decimal";
import { computeRecipeScore } from "./recipeEngine";
import type { ActiveEffects } from "./effects";

export function computeAutoProduction(
  slots: (string | null)[],
  matrix: AffinityMatrix,
  effects: ActiveEffects,
): Decimal {
  const cps = effects.decorationCPS + effects.autoCPS;
  if (cps <= 0) return new Decimal(0);
  const { multiplier } = computeRecipeScore(slots, matrix, {
    spicePairBonus: effects.spicePairAffinityBonus,
  });
  return new Decimal(cps).mul(multiplier).mul(effects.globalMultiplier);
}
