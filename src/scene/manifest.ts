// Sprite-sheet manifest — the single place that knows which image holds which
// frames. Points at the commissioned pixel-art PNGs (16px grid, see
// src/assets/sprites/scene). To swap art, repoint the `src` imports and adjust
// frameW/H/columns/rows to the pack. See ASSETS.md.

import type { SpriteSheet } from "./Sprite";
import propsUrl from "../assets/sprites/scene/props.png";
import customerUrl from "../assets/sprites/scene/customer.png";
import customerDastarUrl from "../assets/sprites/scene/customer_dastar.png";
import curryUrl from "../assets/sprites/scene/curry.png";

/** screen px drawn per source px — bumps all pixel art up to a chunky scale */
export const PIXEL_SCALE = 3;

const PROPS: SpriteSheet = { src: propsUrl, frameW: 16, frameH: 16, columns: 4, rows: 1 };
const CUSTOMER: SpriteSheet = { src: customerUrl, frameW: 16, frameH: 16, columns: 3, rows: 4 };
const CUSTOMER_DASTAR: SpriteSheet = { src: customerDastarUrl, frameW: 16, frameH: 16, columns: 3, rows: 4 };
const CURRY: SpriteSheet = { src: curryUrl, frameW: 16, frameH: 16, columns: 5, rows: 1 };

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

// Curry dishes that pile up on the counter — one colour variant per column.
export const CURRY_VARIANTS: SpriteAnim[] = Array.from({ length: CURRY.columns }, (_, i) => ({
  sheet: CURRY,
  frames: [i],
  fps: 0,
}));

// Customer — palette variants across two sheets (base + dastar), each row an
// idle/seated frame and a 2-frame walk cycle. Pick a stable variant per
// customer (e.g. id % CUSTOMER_VARIANTS).
export const CUSTOMER_VARIANTS = CUSTOMER.rows + CUSTOMER_DASTAR.rows;

export function customerAnim(variant: number): { idle: SpriteAnim; walk: SpriteAnim } {
  let row = Math.abs(variant) % CUSTOMER_VARIANTS;
  let sheet = CUSTOMER;
  if (row >= CUSTOMER.rows) {
    sheet = CUSTOMER_DASTAR;
    row -= CUSTOMER.rows;
  }
  const base = row * sheet.columns;
  return {
    idle: { sheet, frames: [base], fps: 0 },
    walk: { sheet, frames: [base + 1, base + 2], fps: 6 },
  };
}
