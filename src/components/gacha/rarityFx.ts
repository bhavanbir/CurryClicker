import type { GachaRarity } from "../../engine/gacha";

// The single rarity → feedback table. Everything the gacha surface escalates
// (reel length, landing particles, shake, flash, ring reach, reveal overlay)
// reads from here, so tuning the payoff curve is one edit in one file.
export interface RarityFx {
  label: string;
  color: string; // tailwind/CSS-var suffix — "rarity-epic" → var(--rarity-epic)
  particles: number; // ClickBurst size at landing
  shake: number; // px of scene shake
  flash: boolean; // full-surface flash (epic reads subtle, curry reads loud)
  ring: number; // intended --ring-scale (ClickBurst now derives it from power)
  reelMs: number; // reel spin duration
  overlay: boolean; // stamped RarityRevealOverlay
}

export const rarityFx: Record<GachaRarity, RarityFx> = {
  common:       { label: "Common",       color: "rarity-common",    particles: 6,  shake: 0,  flash: false, ring: 1.4, reelMs: 3200, overlay: false },
  uncommon:     { label: "Uncommon",     color: "rarity-uncommon",  particles: 10, shake: 2,  flash: false, ring: 1.9, reelMs: 3500, overlay: false },
  rare:         { label: "Rare",         color: "rarity-rare",      particles: 16, shake: 4,  flash: false, ring: 2.5, reelMs: 3900, overlay: false },
  epic:         { label: "Epic",         color: "rarity-epic",      particles: 24, shake: 7,  flash: true,  ring: 3.1, reelMs: 4300, overlay: false },
  legendary:    { label: "Legendary",    color: "rarity-legendary", particles: 34, shake: 11, flash: true,  ring: 3.8, reelMs: 4700, overlay: true },
  currylicious: { label: "Currylicious", color: "rarity-curry",     particles: 48, shake: 16, flash: true,  ring: 4.6, reelMs: 5200, overlay: true },
};

// ponytail: inline styles instead of `text-${color}` — Tailwind purges class
// names it can't see as literals, and the suffixes map 1:1 onto the CSS vars.
export function rarityColor(rarity: GachaRarity): string {
  return `rgb(var(--${rarityFx[rarity].color}))`;
}
