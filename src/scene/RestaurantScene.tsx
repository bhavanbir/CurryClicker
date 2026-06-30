import { useEffect, useState } from "react";
import { Sprite } from "./Sprite";
import { SceneBackdrop } from "./SceneBackdrop";
import { Counter, COUNTER_CAPACITY } from "./Counter";
import { project, projectWall, type Projected } from "./projection";
import { PIXEL_SCALE, PROP, type SpriteAnim } from "./manifest";
import { TABLES, PLANTS, DOOR, WINDOWS } from "./layout";

// POV-from-above-the-counter restaurant diorama. We look down over the counter
// (foreground) out into the perspective-projected dining room (wall, floor,
// door, windows, tables, plants). Clicking cooks (unchanged contract); each cook
// drops a curry dish onto the counter, filling it up to capacity with no
// overflow. Customers + décor placement arrive in later phases.

interface Props {
  cookSignal: number; // increments on every cook
  onCook: (x: number, y: number) => void;
  busy?: boolean; // recipe ready -> scene is "open"
}

/** A sprite ground-anchored at a projected floor/wall point. */
function Placed({ p, anim, flip }: { p: Projected; anim: SpriteAnim; flip?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${p.xPct}%`, top: `${p.yPct}%`, zIndex: p.z }}
    >
      <Sprite
        sheet={anim.sheet}
        frames={anim.frames}
        fps={anim.fps}
        scale={p.scale}
        flip={flip}
        pixelScale={PIXEL_SCALE}
      />
    </div>
  );
}

export function RestaurantScene({ cookSignal, onCook, busy = true }: Props) {
  // Curry piled on the counter. Fills as you cook, capped at capacity.
  // TODO(Phase 2): customers picking up dishes frees slots, making this dynamic.
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (cookSignal === 0) return;
    setFilled((f) => Math.min(f + 1, COUNTER_CAPACITY));
  }, [cookSignal]);

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onCook(e.clientX - rect.left, e.clientY - rect.top);
      }}
      className="arcade-box relative h-[240px] w-full cursor-pointer select-none overflow-hidden sm:h-[300px] md:h-[340px] lg:h-[380px]"
    >
      <SceneBackdrop />

      {/* OPEN / CLOSED sign */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-[2500] -translate-x-1/2 rounded-full border-2 border-ink bg-curry-yellow px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-ink shadow-arcade-sm">
        {busy ? "Open" : "Closed"}
      </div>

      {/* Back-wall structure */}
      <Placed p={projectWall(DOOR.u, DOOR.heightPct)} anim={PROP.door} />
      {WINDOWS.map((w, i) => (
        <Placed key={i} p={projectWall(w.u, w.heightPct)} anim={PROP.window} />
      ))}

      {/* Corner plants */}
      {PLANTS.map((pl, i) => (
        <Placed key={i} p={project(pl.u, pl.v)} anim={PROP.plant} />
      ))}

      {/* Tables */}
      {TABLES.map((t, i) => (
        <Placed key={i} p={project(t.u, t.v)} anim={PROP.table} />
      ))}

      {/* Foreground counter, piling up with cooked curry */}
      <Counter count={filled} />
    </div>
  );
}
