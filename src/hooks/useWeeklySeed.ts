import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";

// Ensures the store is pointed at the current calendar week (rolling over a
// stale save into a fresh week).
export function useWeeklySeed(): void {
  const ensureCurrentWeek = useGameStore((s) => s.ensureCurrentWeek);

  useEffect(() => {
    ensureCurrentWeek();
  }, [ensureCurrentWeek]);
}
