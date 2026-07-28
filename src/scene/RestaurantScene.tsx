import { useEffect, useState } from "react";
import { Sprite } from "./Sprite";
import { SceneBackdrop } from "./SceneBackdrop";
import { Counter, COUNTER_CAPACITY } from "./Counter";
import { Customer } from "./Customer";
import { project, projectWall, type Projected } from "./projection";
import { PIXEL_SCALE, PROP, FIXTURE, type SpriteAnim } from "./manifest";
import { tablesForLevel, PLANTS, DOOR, WINDOWS, FIXTURES, FLOOR_FIXTURES } from "./layout";
import { WindowView } from "./WindowView";
import { useCustomerDirector } from "../hooks/useCustomerDirector";
import { useEffects } from "../hooks/useEffects";
import { useGameStore } from "../store/useGameStore";

// POV-from-above-the-counter restaurant diorama. We look down over the counter
// (foreground) out into the perspective-projected dining room. Clicking cooks
// (unchanged contract); each cook drops a curry dish onto the counter.
//
// Customers walk in, take a seat, eat a dish off the counter (freeing a slot),
// and leave — a living loop driven by useCustomerDirector. The active skin
// recolours the room; customers show mood faces, and turn delighted while the
// kitchen is On Fire.

interface Props {
  cookSignal: number; // increments on every cook
  onCook: (x: number, y: number) => void;
  busy?: boolean; // day running -> scene is "open"
  onFire?: boolean; // kitchen at On Fire stage -> diners get extra happy
  onDinerFed?: () => void; // a diner finished eating (tip hook)
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

export function RestaurantScene({
  cookSignal,
  onCook,
  busy = true,
  onFire = false,
  onDinerFed,
}: Props) {
  const activeSkin = useGameStore((s) => s.activeSkin);
  const darkMode = useGameStore((s) => s.darkMode);
  // Dark mode is Neon Night territory: the daylight skins glare against the
  // dark chrome (the scene-frame already flips to neon), so the room follows.
  // The picked skin still applies in light mode.
  const skin = darkMode ? "neon" : activeSkin;
  const { expansionLevel } = useEffects();
  const tables = tablesForLevel(expansionLevel);

  // Curry piled on the counter: cooking fills it; diners drain it.
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    if (cookSignal === 0) return;
    setFilled((f) => Math.min(f + 1, COUNTER_CAPACITY));
  }, [cookSignal]);

  const customers = useCustomerDirector({
    open: busy,
    dishesAvailable: filled,
    consumeDish: () => setFilled((f) => Math.max(0, f - 1)),
    onFed: onDinerFed,
    expansionLevel,
    delighted: onFire,
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onCook(e.clientX - rect.left, e.clientY - rect.top);
      }}
      /* `isolate` confines the scene's large internal z-indexes (counter/sign
         use 2000–4000) to their own stacking context, so they never paint over
         page-level modals like the onboarding/week-summary overlays. */
      /* Height tracks the viewport so the diorama dominates at any resolution:
         never below 240px (playable on tiny phones), capped at 560px (sprites
         are fixed-pixel; a huge room reads empty). */
      className="scene-frame relative isolate h-[clamp(240px,45dvh,560px)] w-full cursor-pointer select-none overflow-hidden"
    >
      <SceneBackdrop skin={skin} />

      {/* OPEN / CLOSED sign */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-[2500] -translate-x-1/2 rounded-full border-2 border-ink bg-curry-yellow px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-ink shadow-arcade-sm">
        {busy ? "Open" : "Closed"}
      </div>

      {/* Back-wall structure */}
      <Placed p={projectWall(DOOR.u, DOOR.heightPct)} anim={PROP.door} />
      {WINDOWS.map((w, i) => (
        <WindowView key={i} p={projectWall(w.u, w.heightPct)} />
      ))}

      {/* Interior fixtures — fixed room dressing, behind diners (wall z=0) */}
      {FIXTURES.map((f, i) => (
        <Placed key={i} p={projectWall(f.u, f.heightPct)} anim={FIXTURE[f.key]} />
      ))}
      {FLOOR_FIXTURES.map((f, i) => (
        <Placed key={i} p={project(f.u, f.v)} anim={FIXTURE[f.key]} />
      ))}

      {/* Corner plants */}
      {PLANTS.map((pl, i) => (
        <Placed key={i} p={project(pl.u, pl.v)} anim={PROP.plant} />
      ))}

      {/* Tables — more appear as the restaurant is expanded */}
      {tables.map((t, i) => (
        <Placed key={i} p={project(t.u, t.v)} anim={PROP.table} />
      ))}

      {/* Diners */}
      {customers.map((c) => (
        <Customer key={c.id} c={c} />
      ))}

      {/* Foreground counter, piling up with cooked curry */}
      <Counter count={filled} skin={skin} />
    </div>
  );
}
