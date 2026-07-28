import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sprite } from "./Sprite";
import { SceneBackdrop } from "./SceneBackdrop";
import { customerAnim } from "./manifest";
import { formatCurry } from "../lib/format";
import { useGameStore } from "../store/useGameStore";

// Day-5 boss arena. Swapped in for RestaurantScene, which is the whole trick:
// the room, the diners and the counter simply aren't mounted, so the scene is
// the boss and nothing else. Same frame classes and the same
// onPointerDown → onCook(x, y) contract, so every caller upstream is unchanged.

/** screen px per source px — the boss is the same customer, enormous. */
const BOSS_PIXEL_SCALE = 14;
const BOSS_PX = 16 * BOSS_PIXEL_SCALE;

interface Props {
  cookSignal: number; // increments on every cook
  onCook: (x: number, y: number) => void;
  busy?: boolean; // day running -> the fight is live
}

export function BossScene({ cookSignal, onCook, busy = true }: Props) {
  const activeSkin = useGameStore((s) => s.activeSkin);
  const darkMode = useGameStore((s) => s.darkMode);
  const skin = darkMode ? "neon" : activeSkin;
  const hp = useGameStore((s) => s.bossHp) ?? 0;
  const maxHp = useGameStore((s) => s.bossMaxHp) ?? 1;
  const reduced = useReducedMotion() ?? false;

  // Hurt flash — one short brightness pop per cook, so a mash reads as damage.
  const [hurt, setHurt] = useState(false);
  useEffect(() => {
    if (cookSignal === 0) return;
    setHurt(true);
    const id = window.setTimeout(() => setHurt(false), 90);
    return () => window.clearTimeout(id);
  }, [cookSignal]);

  // ponytail: scaled-up customer sheet as placeholder art; swap for a BOSS
  // manifest entry when the real sprite is commissioned.
  const anim = customerAnim(0).idle;

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onCook(e.clientX - rect.left, e.clientY - rect.top);
      }}
      className="scene-frame relative isolate h-[clamp(240px,45dvh,560px)] w-full cursor-pointer select-none overflow-hidden"
    >
      <SceneBackdrop skin={skin} />

      {/* BOSS! pill + HP bar — the OPEN sign's slot, in a much worse mood */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-[2500] flex w-2/3 -translate-x-1/2 flex-col items-center gap-1">
        <span className="rounded-full border-2 border-ink bg-tier-terrible px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-arcade-sm">
          {busy ? "Boss!" : "Boss incoming"}
        </span>
        <div className="w-full">
          {/* Stroked, not shadowed: the backdrop behind it is pale cream on
              most skins, where a 1px shadow leaves the label unreadable. */}
          <div className="text-stroke-ink mb-0.5 text-center font-display text-[10px] font-black uppercase tracking-widest text-white">
            HP {formatCurry(hp)} / {formatCurry(maxHp)}
          </div>
          <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-white/70">
            <div
              className="h-full bg-tier-terrible transition-[width] duration-150"
              style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* The boss itself. Fixed box (not a zero-size anchor like Placed) so
          GameplayScreen can read it back for the super-crit spawn bounds. */}
      <motion.div
        data-boss-body
        className="pointer-events-none absolute bottom-[4%] left-1/2 -translate-x-1/2"
        style={{ width: BOSS_PX, height: BOSS_PX }}
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute inset-0 transition-[filter] duration-75"
          style={{ filter: hurt ? "brightness(2.4) saturate(0.3)" : undefined }}
        >
          <Sprite
            sheet={anim.sheet}
            frames={anim.frames}
            fps={anim.fps}
            pixelScale={BOSS_PIXEL_SCALE}
          />
        </div>
      </motion.div>
    </div>
  );
}
