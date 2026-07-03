import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore } from "../hooks/useRecipeScore";
import { TIER_ORDER } from "../engine/recipeEngine";
import type { RecipeTier } from "../types";
import { TierDiscoveryOverlay } from "./TierDiscoveryOverlay";
import { playDiscovery } from "../lib/sfx";

const CELEBRATED: RecipeTier[] = ["good", "great", "legendary"];

// Watches the live recipe tier and fires a Discovery Moment the first time a new
// good/great/legendary tier is reached this week (framework §15.1).
export function RewardsLayer() {
  const score = useRecipeScore();
  const highestTierSeen = useGameStore((s) => s.highestTierSeen);
  const noteTierSeen = useGameStore((s) => s.noteTierSeen);
  const [discovery, setDiscovery] = useState<RecipeTier | null>(null);

  useEffect(() => {
    if (
      CELEBRATED.includes(score.tier) &&
      TIER_ORDER[score.tier] > TIER_ORDER[highestTierSeen]
    ) {
      if (noteTierSeen(score.tier)) {
        setDiscovery(score.tier);
        playDiscovery(score.tier as "good" | "great" | "legendary");
      }
    }
  }, [score.tier, highestTierSeen, noteTierSeen]);

  return (
    <AnimatePresence>
      {discovery && (
        <TierDiscoveryOverlay tier={discovery} onDone={() => setDiscovery(null)} />
      )}
    </AnimatePresence>
  );
}
