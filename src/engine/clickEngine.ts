import type { AffinityMatrix } from "../types";
import { Decimal } from "../lib/decimal";
import { formatCurry } from "../lib/format";
import { computeRecipeScore } from "./recipeEngine";
import { INGREDIENTS } from "./ingredients";
import { NO_EFFECTS, type ActiveEffects } from "./effects";

export interface ClickResult {
  value: Decimal;
  floatLabel: string; // pre-formatted "+1.2K" for the FloatText component
  isSpecial: boolean; // Chef's Special bonus was applied this cook
}

// Per-cook modifiers that are not part of the persistent shop economy:
// the Chef's Special daily bonus and the Recipe Streak multiplier.
export interface ClickMods {
  specialMultiplier: number; // 1, or 2 when both special ingredients are slotted
  streakMultiplier: number; // ≥ 1, from the active recipe streak
}

export const NO_MODS: ClickMods = { specialMultiplier: 1, streakMultiplier: 1 };

function countSpices(slots: (string | null)[]): number {
  let n = 0;
  for (const id of slots) {
    if (id && INGREDIENTS[id]?.category === "spice") n++;
  }
  return n;
}

// Cook value pipeline (security_and_logic §1.3, extended with daily special +
// streak per framework §8/§9):
//   floor( (base·recipeMult·upgradeMult + decorationFlat + tandoorSpiceBonus)
//          · streakMult · specialMult )
export function computeClickValue(
  slots: (string | null)[],
  matrix: AffinityMatrix,
  effects: ActiveEffects = NO_EFFECTS,
  mods: ClickMods = NO_MODS,
): Decimal {
  const score = computeRecipeScore(slots, matrix, {
    spicePairBonus: effects.spicePairAffinityBonus,
  });
  if (score.baseValue === 0) return new Decimal(0);

  const tandoorBonus = effects.spiceClickBonusPerSpice * countSpices(slots);

  return new Decimal(score.baseValue)
    .mul(score.multiplier)
    .mul(effects.clickMultiplier)
    .add(effects.decorationClickBonus)
    .add(tandoorBonus)
    .mul(mods.streakMultiplier)
    .mul(mods.specialMultiplier)
    .floor();
}

export function handleClick(
  slots: (string | null)[],
  matrix: AffinityMatrix,
  effects: ActiveEffects = NO_EFFECTS,
  mods: ClickMods = NO_MODS,
): ClickResult {
  const value = computeClickValue(slots, matrix, effects, mods);
  return {
    value,
    floatLabel: "+" + formatCurry(value),
    isSpecial: mods.specialMultiplier > 1,
  };
}
