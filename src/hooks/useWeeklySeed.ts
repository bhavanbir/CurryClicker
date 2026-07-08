import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";

// Keeps the store pointed at the current calendar date (daily seed/leaderboard)
// and week (rolling a stale save into a fresh week). Date first: a midnight
// rollover must finalize yesterday's leaderboard before any weekly reset.
export function useWeeklySeed(): void {
  const ensureCurrentDate = useGameStore((s) => s.ensureCurrentDate);
  const ensureCurrentWeek = useGameStore((s) => s.ensureCurrentWeek);

  useEffect(() => {
    const check = () => {
      ensureCurrentDate();
      ensureCurrentWeek();
    };
    check();
    // Catch midnight passing mid-session. 30s granularity is plenty.
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [ensureCurrentDate, ensureCurrentWeek]);
}
