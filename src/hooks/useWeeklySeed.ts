import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { syncClock } from "../engine/weekEngine";
import { desktop } from "../lib/desktop";

// Keeps the store pointed at the current calendar date (daily seed/leaderboard)
// and week (rolling a stale save into a fresh week). Date first: a midnight
// rollover must finalize yesterday's leaderboard before any weekly reset.
export function useWeeklySeed(): void {
  const ensureCurrentDate = useGameStore((s) => s.ensureCurrentDate);
  const ensureCurrentWeek = useGameStore((s) => s.ensureCurrentWeek);

  useEffect(() => {
    const check = async () => {
      // Anchor to Steam server time before rollover checks; re-syncing every
      // poll also defeats mid-session system-clock changes. No-op off desktop.
      const t = await desktop()?.getServerTime();
      if (t) syncClock(t);
      ensureCurrentDate();
      ensureCurrentWeek();
    };
    void check();
    // Catch midnight passing mid-session. 30s granularity is plenty.
    const timer = window.setInterval(() => void check(), 30_000);
    return () => window.clearInterval(timer);
  }, [ensureCurrentDate, ensureCurrentWeek]);
}
