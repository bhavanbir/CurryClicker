import { useMemo } from "react";
import { useGameStore } from "../store/useGameStore";
import { getAffinityData } from "../engine/affinityEngine";
import { computeRecipeScore } from "../engine/recipeEngine";
import { getDailyCraving } from "../engine/weekEngine";
import { computeEffects, type ActiveEffects } from "../engine/effects";
import type { RecipeScore } from "../types";

// Live aggregate effects from owned upgrades + decorations.
export function useEffects(): ActiveEffects {
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const ownedDecorations = useGameStore((s) => s.ownedDecorations);
  const franchiseUpgrades = useGameStore((s) => s.franchiseUpgrades);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  return useMemo(
    () =>
      computeEffects(purchasedUpgrades, ownedDecorations, franchiseUpgrades, weeksCompleted),
    [purchasedUpgrades, ownedDecorations, franchiseUpgrades, weeksCompleted],
  );
}

// Live recipe score for the current slots + this week's matrix, including the
// decoration spice-pair affinity bonus so tier/multiplier match what's cooked.
export function useRecipeScore(): RecipeScore {
  const slots = useGameStore((s) => s.slots);
  const seed = useGameStore((s) => s.seed);
  const currentDay = useGameStore((s) => s.currentDay);
  const effects = useEffects();

  return useMemo(() => {
    const { matrix } = getAffinityData(seed);
    return computeRecipeScore(slots, matrix, {
      spicePairBonus: effects.spicePairAffinityBonus,
      craving: getDailyCraving(currentDay, seed),
    });
  }, [slots, seed, currentDay, effects.spicePairAffinityBonus]);
}
