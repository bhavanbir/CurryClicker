import { Sprite } from "./Sprite";
import { PIXEL_SCALE, CURRY_VARIANTS } from "./manifest";
import { SKINS } from "./skins";
import type { SceneSkin } from "../types";

// The foreground counter, seen from above — the player stands over it looking
// out into the restaurant. Cooked curry piles onto its surface, filling a fixed
// grid of slots back-to-front and stopping when full (no overflow).

const COLS = 5;
const ROWS = 2;
/** how many curry dishes fit on the counter before it's full */
export const COUNTER_CAPACITY = COLS * ROWS;

// Counter slab, in scene-rect %. Flat rectangle facing the player: back edge
// meets the dining floor; front edge is the bottom of the scene.
const BACK_Y = 70;
const FRONT_Y = 99;
const BACK_L = 6;
const BACK_R = 94;
const FRONT_L = BACK_L;
const FRONT_R = BACK_R;

// Inset band where dishes actually sit.
const DISH_BACK_Y = 74;
const DISH_FRONT_Y = 95;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface Slot {
  xPct: number;
  yPct: number;
  scale: number;
  z: number;
}

function slot(i: number): Slot {
  const row = Math.floor(i / COLS); // 0 = back
  const col = i % COLS;
  const vRow = (row + 0.5) / ROWS;
  const left = lerp(BACK_L, FRONT_L, vRow);
  const right = lerp(BACK_R, FRONT_R, vRow);
  const u = (col + 0.5) / COLS;
  return {
    xPct: lerp(left, right, u),
    yPct: lerp(DISH_BACK_Y, DISH_FRONT_Y, vRow),
    scale: lerp(0.42, 0.72, vRow),
    z: 2100 + Math.round(vRow * 100) + col,
  };
}

export function Counter({ count, skin = "default" }: { count: number; skin?: SceneSkin }) {
  const dishes = Math.min(count, COUNTER_CAPACITY);
  const pal = SKINS[skin];

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* counter surface */}
      <div
        className="absolute"
        style={{
          zIndex: 2000,
          top: `${BACK_Y}%`,
          bottom: `${100 - FRONT_Y}%`,
          left: `${BACK_L}%`,
          width: `${BACK_R - BACK_L}%`,
          background: `linear-gradient(${pal.counterFrom}, ${pal.counterTo})`,
          boxShadow: "0 -6px 14px rgba(0, 0, 0, 0.25)",
        }}
      />
      {/* back edge line where the counter meets the floor */}
      <div
        className="absolute h-[3px] bg-ink/40"
        style={{ zIndex: 2001, top: `${BACK_Y}%`, left: `${BACK_L}%`, width: `${BACK_R - BACK_L}%` }}
      />

      {/* curry dishes */}
      {Array.from({ length: dishes }, (_, i) => {
        const s = slot(i);
        const anim = CURRY_VARIANTS[i % CURRY_VARIANTS.length];
        return (
          <div
            key={i}
            className="animate-pop-in absolute"
            style={{ left: `${s.xPct}%`, top: `${s.yPct}%`, zIndex: s.z }}
          >
            <Sprite
              sheet={anim.sheet}
              frames={anim.frames}
              fps={anim.fps}
              scale={s.scale}
              pixelScale={PIXEL_SCALE}
            />
          </div>
        );
      })}
    </div>
  );
}
