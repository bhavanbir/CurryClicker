import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sprite } from "./Sprite";
import { PIXEL_SCALE, WINDOW } from "./manifest";
import type { Projected } from "./projection";
import { useGameStore } from "../store/useGameStore";

// One back-wall window: a 5-layer street diorama (sky → clouds → street →
// passerby → frame) clipped to the glass. The frame's opaque border + this
// box's overflow:hidden are what crop the passerby at the window edges. Sky and
// street are picked by day phase; the passerby crosses on a random cadence.

/** Day phase from the same quantized dayProgress the backdrop reads. */
function useDayPhase(): number {
  const dp = useGameStore((s) => Math.round(s.dayProgress * 32) / 32);
  return dp < 0.15 ? 0 : dp < 0.55 ? 1 : dp < 0.85 ? 2 : 3; // dawn/midday/dusk/night
}

export function WindowView({ p }: { p: Projected }) {
  const phase = useDayPhase();
  const reduced = useReducedMotion() ?? false;

  // Occasional pedestrian: one crossing every 20–40s, ~5s to traverse, random
  // direction. Reduced motion skips crossings entirely (empty street).
  const [cross, setCross] = useState<{ id: number; dir: number } | null>(null);
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let timer: number;
    let n = 0;
    const run = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setCross({ id: ++n, dir: Math.random() < 0.5 ? 1 : -1 });
        timer = window.setTimeout(() => {
          if (!cancelled) setCross(null);
          run();
        }, 5000);
      }, 20000 + Math.random() * 20000);
    };
    run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reduced]);

  const px = PIXEL_SCALE * p.scale; // local sprite px → screen px
  const w = 32 * px; // scaled window box (square)

  return (
    <div
      className="pointer-events-none absolute overflow-hidden"
      style={{
        left: `${p.xPct}%`,
        top: `${p.yPct}%`,
        width: w,
        height: w,
        transform: "translate(-50%, -100%)",
        zIndex: p.z,
      }}
    >
      <Sprite {...WINDOW.sky(phase)} scale={p.scale} pixelScale={PIXEL_SCALE} />
      <Sprite {...WINDOW.clouds} scale={p.scale} pixelScale={PIXEL_SCALE} />
      <Sprite {...WINDOW.street(phase)} scale={p.scale} pixelScale={PIXEL_SCALE} />
      {cross && (
        <motion.div
          key={cross.id}
          className="absolute left-0"
          style={{ bottom: 8 * px }} // feet on the street line (local y≈24)
          initial={{ x: cross.dir > 0 ? -10 * px : w + 10 * px }}
          animate={{ x: cross.dir > 0 ? w + 10 * px : -10 * px }}
          transition={{ duration: 5, ease: "linear" }}
        >
          <Sprite {...WINDOW.passerby} scale={p.scale} flip={cross.dir < 0} pixelScale={PIXEL_SCALE} />
        </motion.div>
      )}
      <Sprite {...WINDOW.frame} scale={p.scale} pixelScale={PIXEL_SCALE} />
    </div>
  );
}
