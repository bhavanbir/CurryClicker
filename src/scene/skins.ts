// Restaurant scene skins — the colour palette for the wall + floor. Wired into
// SceneBackdrop via its `skin` prop and selectable in the scene's Decorate
// panel (Phase 4). Free/cosmetic; the real-money skin store is a later phase.

import type { SceneSkin } from "../types";

export interface SkinPalette {
  label: string;
  wallFrom: string;
  wallTo: string;
  floor: string;
  floorEdge: string;
  /** counter slab gradient (top → bottom) */
  counterFrom: string;
  counterTo: string;
}

export const SKINS: Record<SceneSkin, SkinPalette> = {
  default: {
    label: "Curry House",
    wallFrom: "#fff3da",
    wallTo: "#f6e4bf",
    floor: "#e7b986",
    floorEdge: "#caa06b",
    counterFrom: "#e2913f",
    counterTo: "#c8772e",
  },
  neon: {
    label: "Neon Night",
    wallFrom: "#241b3a",
    wallTo: "#3a2160",
    floor: "#2b2350",
    floorEdge: "#1c1736",
    counterFrom: "#ff4fa3",
    counterTo: "#b3247a",
  },
  zen: {
    label: "Zen Garden",
    wallFrom: "#eef6ec",
    wallTo: "#d9ead3",
    floor: "#cfe0c3",
    floorEdge: "#aac397",
    counterFrom: "#8bb07a",
    counterTo: "#6d9460",
  },
  mumbai: {
    label: "Rooftop Mumbai",
    wallFrom: "#ffe7c2",
    wallTo: "#ffcf99",
    floor: "#e0a86b",
    floorEdge: "#bd8348",
    counterFrom: "#d2691e",
    counterTo: "#a8521a",
  },
};

export const SKIN_ORDER: SceneSkin[] = ["default", "neon", "zen", "mumbai"];
