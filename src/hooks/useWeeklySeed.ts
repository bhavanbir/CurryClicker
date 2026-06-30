import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { getAffinityData } from "../engine/affinityEngine";
import type { AffinityData } from "../types";

// Ensures the store is pointed at the current calendar week (rolling over a
// stale save into a fresh week) and returns this week's derived affinity data.
export function useWeeklySeed(): AffinityData {
  const ensureCurrentWeek = useGameStore((s) => s.ensureCurrentWeek);
  const seed = useGameStore((s) => s.seed);

  useEffect(() => {
    ensureCurrentWeek();
  }, [ensureCurrentWeek]);

  return getAffinityData(seed);
}
