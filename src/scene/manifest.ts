// Sprite-sheet manifest — the single place that knows which image holds which
// frames. Everything points at placeholder SVG sheets on a 16px grid today; to
// switch to real Kenney CC0 art, drop the PNGs in src/assets/sprites/, repoint
// the `src` imports, and adjust frameW/H/columns/rows to the pack. See ASSETS.md.

import type { SpriteSheet } from "./Sprite";
import propsUrl from "../assets/sprites/props.svg";
import customerUrl from "../assets/sprites/customer.svg";
import curryUrl from "../assets/sprites/curry.svg";

/** screen px drawn per source px — bumps all pixel art up to a chunky scale */
export const PIXEL_SCALE = 3;

const PROPS: SpriteSheet = { src: propsUrl, frameW: 16, frameH: 16, columns: 4, rows: 1 };
const CUSTOMER: SpriteSheet = { src: customerUrl, frameW: 16, frameH: 16, columns: 3, rows: 1 };
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

// Customer — idle/seated, and a 2-frame walk cycle (used in Phase 2).
export const CUSTOMER_ANIM = {
  idle: { sheet: CUSTOMER, frames: [0], fps: 0 },
  walk: { sheet: CUSTOMER, frames: [1, 2], fps: 6 },
} satisfies Record<string, SpriteAnim>;
