// Sprite-sheet manifest — the single place that knows which image holds which
// frames. Points at the commissioned pixel-art PNGs (16px grid, see
// src/assets/sprites/scene). To swap art, repoint the `src` imports and adjust
// frameW/H/columns/rows to the pack. See ASSETS.md.

import type { SpriteSheet } from "./Sprite";
import propsUrl from "../assets/sprites/scene/props.png";
import customerUrl from "../assets/sprites/scene/customer.png";
import curryUrl from "../assets/sprites/scene/curry.png";

/** screen px drawn per source px — bumps all pixel art up to a chunky scale */
export const PIXEL_SCALE = 3;

const PROPS: SpriteSheet = { src: propsUrl, frameW: 16, frameH: 16, columns: 4, rows: 1 };
const CUSTOMER: SpriteSheet = { src: customerUrl, frameW: 16, frameH: 16, columns: 3, rows: 4 };
const CURRY: SpriteSheet = { src: curryUrl, frameW: 16, frameH: 16, columns: 2, rows: 1 };

export interface SpriteAnim {
  sheet: SpriteSheet;
  frames: number[];
  fps: number;
}

// Static props (single frame each) from the shared PROPS sheet.
export const PROP = {
  table: { sheet: PROPS, frames: [0], fps: 0 },
  plant: { sheet: PROPS, frames: [1], fps: 0 },
  door: { sheet: PROPS, frames: [2], fps: 0 },
  window: { sheet: PROPS, frames: [3], fps: 0 },
} satisfies Record<string, SpriteAnim>;

// Curry dishes that pile up on the counter — two colour variants for variety.
export const CURRY_VARIANTS: SpriteAnim[] = [
  { sheet: CURRY, frames: [0], fps: 0 },
  { sheet: CURRY, frames: [1], fps: 0 },
];

// Customer — 4 palette variants (sheet rows), each with an idle/seated frame
// and a 2-frame walk cycle. Pick a stable variant per customer (e.g. id % 4).
export const CUSTOMER_VARIANTS = CUSTOMER.rows;

export function customerAnim(variant: number): { idle: SpriteAnim; walk: SpriteAnim } {
  const base = (Math.abs(variant) % CUSTOMER_VARIANTS) * CUSTOMER.columns;
  return {
    idle: { sheet: CUSTOMER, frames: [base], fps: 0 },
    walk: { sheet: CUSTOMER, frames: [base + 1, base + 2], fps: 6 },
  };
}
