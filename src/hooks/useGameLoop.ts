import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { DAY_DURATION_SECONDS } from "../config";

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
      // Time only flows once the player has opened the day (Start Day). Auto-
      // production also pauses until then, so nothing ticks automatically.
      if (s.phase === "cooking" && s.dayStarted) {
        if (s.autoProduction.gt(0)) {
          s.addCurry(s.autoProduction.mul(deltaSec));
        }
        s.advanceDayProgress(deltaSec / DAY_DURATION_SECONDS);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
