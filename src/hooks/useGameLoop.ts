import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { DAY_DURATION_SECONDS } from "../config";
import { DAY_CHOICE_MAP } from "../engine/dayChoices";

// Single requestAnimationFrame loop. React components subscribe to store values;
// they do NOT drive timing. State is read via getState() inside the loop to
// avoid stale closures and constant effect re-subscription.
export function useGameLoop() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // Clamp delta to 1s so a backgrounded tab doesn't dump a giant catch-up
      // tick (offline production is handled separately in later phases).
      const deltaSec = Math.min(now - last, 1000) / 1000;
      last = now;

      const s = useGameStore.getState();
      // Time only flows once the player has opened the day (Start Day) and
      // isn't paused. Auto-production also stops, so nothing ticks.
      if (s.phase === "cooking" && s.dayStarted && !s.dayPaused) {
        // End-of-day modifier can scale auto-production and the day's length.
        const mod = s.activeDayModifierId
          ? DAY_CHOICE_MAP[s.activeDayModifierId]
          : undefined;
        const auto = s.autoProduction * (mod?.autoMult ?? 1);
        if (auto > 0) {
          s.addCurry(auto * deltaSec);
        }
        const daySeconds =
          mod?.daySeconds ?? DAY_DURATION_SECONDS * (mod?.dayLengthMult ?? 1);
        s.advanceDayProgress(deltaSec / daySeconds);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
