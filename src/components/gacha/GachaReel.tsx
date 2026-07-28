import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  RARITIES,
  RARITY_INGREDIENTS,
  type GachaRarity,
  type RolledIngredient,
} from "../../engine/gacha";
import { INGREDIENTS } from "../../engine/ingredients";
import { PixelIcon } from "../PixelIcon";
import { ArcadePanel } from "../arcade/ArcadePanel";
import { rarityColor, rarityFx } from "./rarityFx";

// CS:GO-style horizontal case reel. The result is already in the player's
// inventory before this mounts — the strip is pure presentation, so the tiles
// around the winner are cosmetic filler.

const TILE = 92;
const GAP = 8;
const PITCH = TILE + GAP;
const COUNT = 40;
const WIN_INDEX = 35; // 4 tiles of runway past the landing point

// Filler weighted toward the bottom of the table so the strip reads like the
// real drop rates rushing past — a wall of legendaries would kill the payoff.
const FILLER_WEIGHT = [46, 26, 15, 8, 4, 1];

function fillerRarity(): GachaRarity {
  const total = FILLER_WEIGHT.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    r -= FILLER_WEIGHT[i];
    if (r < 0) return RARITIES[i];
  }
  return "common";
}

interface Tile {
  ingredientId: string;
  rarity: GachaRarity;
}

export function GachaReel({
  result,
  onLanded,
}: {
  result: RolledIngredient;
  onLanded: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const w = trackRef.current?.clientWidth ?? 0;
    setWidth(w);
    // Never measured (hidden/zero-width container) — land immediately rather
    // than strand the caller in a spin that can never complete.
    if (!w) onLanded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiles = useMemo<Tile[]>(() => {
    const out = Array.from({ length: COUNT }, (): Tile => {
      const rarity = fillerRarity();
      const pool = RARITY_INGREDIENTS[rarity];
      return {
        ingredientId: pool[Math.floor(Math.random() * pool.length)],
        rarity,
      };
    });
    out[WIN_INDEX] = { ingredientId: result.ingredientId, rarity: result.rarity };
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.uid]);

  const fx = rarityFx[result.rarity];

  // Land the winning tile under the centre marker, offset by a little jitter so
  // it never stops dead-centre twice in a row.
  const jitter = useMemo(
    () => (Math.random() * 2 - 1) * TILE * 0.55,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result.uid],
  );
  const targetX = width
    ? -(WIN_INDEX * PITCH) + width / 2 - TILE / 2 + jitter
    : 0;

  return (
    <ArcadePanel className="relative h-full overflow-hidden">
      <div
        ref={trackRef}
        className="relative flex h-full items-center overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)",
        }}
      >
        {width > 0 && (
          <motion.div
            className="flex"
            style={{ gap: GAP }}
            initial={{ x: 0 }}
            animate={{ x: [0, targetX - 34, targetX] }}
            transition={{
              duration: fx.reelMs / 1000,
              times: [0, 0.9, 1],
              // Long decel then a small settle back off the overshoot.
              ease: [[0.05, 0.72, 0.08, 1], "easeInOut"],
            }}
            onAnimationComplete={onLanded}
          >
            {tiles.map((t, i) => {
              const ing = INGREDIENTS[t.ingredientId];
              const curry = t.rarity === "currylicious";
              return (
                <div
                  key={i}
                  className={`relative flex shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-ink py-2 ${
                    curry ? "rarity-curry-surface" : "bg-cream-100"
                  }`}
                  style={{ width: TILE, height: TILE }}
                >
                  <PixelIcon
                    id={t.ingredientId}
                    icon={ing?.icon ?? "restaurant"}
                    size={36}
                  />
                  <span className="max-w-full truncate px-1 text-[9px] font-bold uppercase leading-none text-ink">
                    {ing?.name ?? t.ingredientId}
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px]"
                    style={{ backgroundColor: rarityColor(t.rarity) }}
                  />
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Centre marker: a hairline with triangle caps (borders, no SVG) */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0 -translate-x-1/2">
        <span className="absolute inset-y-2 left-1/2 w-[2px] -translate-x-1/2 bg-ink" />
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "10px solid rgb(var(--ink))",
          }}
        />
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "10px solid rgb(var(--ink))",
          }}
        />
      </div>
    </ArcadePanel>
  );
}
