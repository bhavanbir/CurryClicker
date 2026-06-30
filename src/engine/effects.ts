// Aggregates owned upgrades + decorations into the flat set of numeric effects
// the click/auto pipelines consume. Pure: same inputs → same output.

import { UPGRADE_MAP, DECORATION_MAP } from "./shopData";
import { BASE_UNLOCKED_SLOTS, MAX_SLOTS } from "../config";

export interface ActiveEffects {
  clickMultiplier: number; // product of click_multiplier upgrades
  decorationClickBonus: number; // sum of passiveClickBonus * qty
  decorationCPS: number; // sum of passiveCurryPerSec * qty
  autoCPS: number; // sum of auto_cps upgrades
  unlockedSlots: number; // base + recipe_slot_unlock upgrades
  spicePairAffinityBonus: number; // flat affinity added to spice/spice pairs
  spiceClickBonusPerSpice: number; // flat cook value per spice ingredient
  affinityLens: boolean; // reveals pairwise affinity values in the Kitchen
}

export function computeEffects(
  purchasedUpgrades: string[],
  ownedDecorations: Record<string, number>,
): ActiveEffects {
  let clickMultiplier = 1;
  let autoCPS = 0;
  let unlockedSlots = BASE_UNLOCKED_SLOTS;
  let affinityLens = false;

  for (const id of purchasedUpgrades) {
    const eff = UPGRADE_MAP[id]?.effect;
    if (!eff) continue;
    switch (eff.type) {
      case "click_multiplier":
        clickMultiplier *= eff.value;
        break;
      case "auto_cps":
        autoCPS += eff.value;
        break;
      case "recipe_slot_unlock":
        unlockedSlots = Math.max(unlockedSlots, eff.slotIndex + 1);
        break;
      case "affinity_lens":
        affinityLens = true;
        break;
    }
  }

  let decorationClickBonus = 0;
  let decorationCPS = 0;
  let spicePairAffinityBonus = 0;
  let spiceClickBonusPerSpice = 0;

  for (const [id, qtyRaw] of Object.entries(ownedDecorations)) {
    const deco = DECORATION_MAP[id];
    if (!deco) continue;
    const qty = Math.min(qtyRaw, deco.maxQuantity);
    if (qty <= 0) continue;
    decorationCPS += deco.passiveCurryPerSec * qty;
    decorationClickBonus += deco.passiveClickBonus * qty;
    spicePairAffinityBonus += (deco.spicePairAffinity ?? 0) * qty;
    spiceClickBonusPerSpice += (deco.spiceClickBonus ?? 0) * qty;
  }

  return {
    clickMultiplier,
    decorationClickBonus,
    decorationCPS,
    autoCPS,
    unlockedSlots: Math.min(unlockedSlots, MAX_SLOTS),
    spicePairAffinityBonus,
    spiceClickBonusPerSpice,
    affinityLens,
  };
}

export const NO_EFFECTS: ActiveEffects = {
  clickMultiplier: 1,
  decorationClickBonus: 0,
  decorationCPS: 0,
  autoCPS: 0,
  unlockedSlots: BASE_UNLOCKED_SLOTS,
  spicePairAffinityBonus: 0,
  spiceClickBonusPerSpice: 0,
  affinityLens: false,
};
