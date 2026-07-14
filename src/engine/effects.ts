// Aggregates owned upgrades + decorations into the flat set of numeric effects
// the click/auto pipelines consume. Pure: same inputs → same output.

import {
  UPGRADE_MAP,
  DECORATION_MAP,
  DECOR_SETS,
  decorSetComplete,
  prestigeBaseClick,
  ladleValue,
} from "./shopData";
import { franchiseBaseSlots, reputationMultiplier } from "./franchiseData";
import { BASE_UNLOCKED_SLOTS, MAX_SLOTS } from "../config";
import { IS_DEMO, DEMO_MAX_SLOTS } from "../target";

const SLOT_CAP = IS_DEMO ? DEMO_MAX_SLOTS : MAX_SLOTS;

export interface ActiveEffects {
  clickMultiplier: number; // product of click_multiplier upgrades
  flatClickBonus: number; // click_flat upgrades + decoration passiveClickBonus
  decorSetMultiplier: number; // product of completed decoration-set bonuses
  unlockedSlots: number; // base + recipe_slot_unlock upgrades
  spicePairAffinityBonus: number; // flat affinity added to spice/spice pairs
  spiceClickBonusPerSpice: number; // flat cook value per spice ingredient
  expansionLevel: number; // 0–5: restaurant size (tables + customer flow)
  globalMultiplier: number; // franchise Reputation ×curry, applied to all earnings
}

export function computeEffects(
  purchasedUpgrades: string[],
  ownedDecorations: Record<string, number>,
  franchiseUpgrades: string[] = [],
  prestigeLevel = 0,
): ActiveEffects {
  let clickMultiplier = prestigeBaseClick(prestigeLevel);
  let flatClickBonus = 0;
  let unlockedSlots = franchiseBaseSlots(franchiseUpgrades);
  let expansionLevel = 0;

  for (const id of purchasedUpgrades) {
    const eff = UPGRADE_MAP[id]?.effect;
    if (!eff) continue;
    switch (eff.type) {
      case "click_multiplier":
        clickMultiplier *= ladleValue(UPGRADE_MAP[id], prestigeLevel);
        break;
      case "click_flat":
        flatClickBonus += eff.value;
        break;
      case "recipe_slot_unlock":
        unlockedSlots = Math.max(unlockedSlots, eff.slotIndex + 1);
        break;
      case "restaurant_expansion":
        expansionLevel = Math.max(expansionLevel, eff.level);
        break;
    }
  }

  let spicePairAffinityBonus = 0;
  let spiceClickBonusPerSpice = 0;

  for (const [id, qtyRaw] of Object.entries(ownedDecorations)) {
    const deco = DECORATION_MAP[id];
    if (!deco) continue;
    const qty = Math.min(qtyRaw, deco.maxQuantity);
    if (qty <= 0) continue;
    flatClickBonus += deco.passiveClickBonus * qty;
    spicePairAffinityBonus += (deco.spicePairAffinity ?? 0) * qty;
    spiceClickBonusPerSpice += (deco.spiceClickBonus ?? 0) * qty;
  }

  let decorSetMultiplier = 1;
  for (const set of DECOR_SETS) {
    if (decorSetComplete(set, ownedDecorations)) decorSetMultiplier *= set.clickMult;
  }

  return {
    clickMultiplier,
    flatClickBonus,
    decorSetMultiplier,
    unlockedSlots: Math.min(unlockedSlots, SLOT_CAP),
    spicePairAffinityBonus,
    spiceClickBonusPerSpice,
    expansionLevel,
    globalMultiplier: reputationMultiplier(franchiseUpgrades),
  };
}

export const NO_EFFECTS: ActiveEffects = {
  clickMultiplier: 1,
  flatClickBonus: 0,
  decorSetMultiplier: 1,
  unlockedSlots: BASE_UNLOCKED_SLOTS,
  spicePairAffinityBonus: 0,
  spiceClickBonusPerSpice: 0,
  expansionLevel: 0,
  globalMultiplier: 1,
};
