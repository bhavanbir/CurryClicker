// Folds purchased skill nodes + equipped gacha rolls into the flat set of
// numeric effects the click/spin/scene pipelines consume. Pure: same inputs →
// same output.

import { SKILL_MAP, META_MAP, prestigeBaseClick } from "./skillTree";
import { modMagnitude, type RolledIngredient } from "./gacha";

export interface ActiveEffects {
  clickMult: number; // includes the prestige base-click multiplier
  flatClick: number;
  globalMult: number; // star Reputation, highest tier wins
  critChanceMult: number;
  critPowerMult: number;
  fireGainMult: number;
  spinCostMult: number; // ≤ 1; multiplied into spinCost()
  luck: number; // additive bias toward rarer gacha pulls
  expansionLevel: number; // 0–5: restaurant size (tables + customer flow)
}

export const NO_EFFECTS: ActiveEffects = {
  clickMult: 1,
  flatClick: 0,
  globalMult: 1,
  critChanceMult: 1,
  critPowerMult: 1,
  fireGainMult: 1,
  spinCostMult: 1,
  luck: 0,
  expansionLevel: 0,
};

export function computeEffects(
  skillNodes: string[],
  metaNodes: string[],
  equipped: RolledIngredient[] = [],
  prestigeLevel = 0,
): ActiveEffects {
  const e: ActiveEffects = {
    ...NO_EFFECTS,
    clickMult: prestigeBaseClick(prestigeLevel),
  };

  const apply = (type: string, value: number) => {
    switch (type) {
      case "click_mult":
        e.clickMult *= 1 + value;
        break;
      case "flat_click":
        e.flatClick += value;
        break;
      case "crit_chance":
        e.critChanceMult *= 1 + value;
        break;
      case "crit_power":
        e.critPowerMult *= 1 + value;
        break;
      case "fire_gain":
        e.fireGainMult *= 1 + value;
        break;
      // Discounts stack the other way: each one shaves a share off the price.
      case "spin_discount":
        e.spinCostMult *= Math.max(0, 1 - value);
        break;
      case "luck":
        e.luck += value;
        break;
    }
  };

  for (const id of [...skillNodes, ...metaNodes]) {
    const eff = (SKILL_MAP[id] ?? META_MAP[id])?.effect;
    if (!eff) continue;
    if (eff.type === "expansion") {
      e.expansionLevel = Math.max(e.expansionLevel, eff.level);
    } else if (eff.type === "global_mult") {
      e.globalMult = Math.max(e.globalMult, eff.value); // tiers replace, never stack
    } else if (eff.type !== "head_start") {
      apply(eff.type, eff.value);
    }
  }

  for (const roll of equipped) {
    for (const mod of roll.mods) apply(mod.type, modMagnitude(mod, roll.rarity));
  }

  return e;
}
