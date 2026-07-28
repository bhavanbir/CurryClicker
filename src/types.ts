// Shared domain types for the MVP core loop.

export type IngredientCategory =
  | "spice"
  | "vegetable"
  | "protein"
  | "dairy"
  | "herb";

export interface Ingredient {
  id: string;
  name: string;
  icon: string; // Material Symbols ligature name
  color: string; // Tailwind text-color class for the icon
  baseValue: number; // flavour-text only since the gacha rework
  category: IngredientCategory;
  description: string;
}

export interface DailySnapshot {
  day: number;
  curry: number;
  clicks: number;
}

// --- Restaurant scene (Phase 3/4) ---

// Selectable restaurant backdrops. Free in this build (cosmetic, not pay-to-win);
// the IAP skin store is a later phase.
export type SceneSkin = "default" | "neon" | "zen" | "mumbai";

// Breakdown of Stars earned for the just-completed week (week-summary display).
export interface WeekStarAward {
  total: number;
  reasons: string[];
}
