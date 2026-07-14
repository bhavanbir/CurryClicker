// Sprite-sheet manifest — the single place that knows which image holds which
// frames. Points at the commissioned pixel-art PNGs (16px grid, see
// src/assets/sprites/scene). To swap art, repoint the `src` imports and adjust
// frameW/H/columns/rows to the pack. See ASSETS.md.

import type { SpriteSheet } from "./Sprite";
import propsUrl from "../assets/sprites/scene/props.png";
import customerUrl from "../assets/sprites/scene/customer.png";
import customerDastarUrl from "../assets/sprites/scene/customer_dastar.png";
import curryUrl from "../assets/sprites/scene/curry.png";
import windowStreetUrl from "../assets/sprites/scene/window_street.png";
import windowPasserbyUrl from "../assets/sprites/scene/window_passerby.png";
import interiorUrl from "../assets/sprites/scene/interior_props.png";

/** screen px drawn per source px — bumps all pixel art up to a chunky scale */
export const PIXEL_SCALE = 3;

const PROPS: SpriteSheet = { src: propsUrl, frameW: 16, frameH: 16, columns: 4, rows: 1 };
const CUSTOMER: SpriteSheet = { src: customerUrl, frameW: 16, frameH: 16, columns: 3, rows: 4 };
const CUSTOMER_DASTAR: SpriteSheet = { src: customerDastarUrl, frameW: 16, frameH: 16, columns: 3, rows: 4 };
const CURRY: SpriteSheet = { src: curryUrl, frameW: 16, frameH: 16, columns: 5, rows: 1 };
const WINDOW_STREET: SpriteSheet = { src: windowStreetUrl, frameW: 32, frameH: 32, columns: 4, rows: 4 };
const WINDOW_PASSERBY: SpriteSheet = { src: windowPasserbyUrl, frameW: 16, frameH: 16, columns: 2, rows: 1 };
const INTERIOR: SpriteSheet = { src: interiorUrl, frameW: 32, frameH: 32, columns: 4, rows: 3 };

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
} satisfies Record<string, SpriteAnim>;

// Animated window diorama layers — sky/street are phase-picked (fps 0), clouds
// loop, passerby lives on its own 16px sheet. Stacked back→front by WindowView.
export const WINDOW = {
  sky: (phase: number): SpriteAnim => ({ sheet: WINDOW_STREET, frames: [phase], fps: 0 }),
  clouds: { sheet: WINDOW_STREET, frames: [4, 5, 6, 7], fps: 2 } as SpriteAnim,
  street: (phase: number): SpriteAnim => ({ sheet: WINDOW_STREET, frames: [8 + phase], fps: 0 }),
  frame: { sheet: WINDOW_STREET, frames: [12], fps: 0 } as SpriteAnim,
  passerby: { sheet: WINDOW_PASSERBY, frames: [0, 1], fps: 4 } as SpriteAnim,
};

// Fixed interior dressing (ceiling fans, lamps, clock, valances, board, shelf,
// photos, entry mat) — skin-neutral furniture, placed by layout.ts FIXTURES.
export const FIXTURE = {
  ceilingFan: { sheet: INTERIOR, frames: [0, 1, 2], fps: 12 },
  pendantLamp: { sheet: INTERIOR, frames: [3, 4], fps: 3 },
  wallClock: { sheet: INTERIOR, frames: [5, 6], fps: 2 },
  windowValance: { sheet: INTERIOR, frames: [7], fps: 0 },
  menuBoard: { sheet: INTERIOR, frames: [8], fps: 0 },
  tumblerShelf: { sheet: INTERIOR, frames: [9], fps: 0 },
  familyPhotos: { sheet: INTERIOR, frames: [10], fps: 0 },
  entryMat: { sheet: INTERIOR, frames: [11], fps: 0 },
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
