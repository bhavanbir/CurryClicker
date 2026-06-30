// Shared domain types for the MVP core loop.

export type IngredientCategory =
  | "spice"
  | "vegetable"
  | "protein"
  | "dairy"
  | "herb";

export type Rarity = "common" | "uncommon" | "rare";

export interface Ingredient {
  id: string;
  name: string;
  icon: string; // Material Symbols ligature name
  color: string; // Tailwind text-color class for the icon
  baseValue: number; // Curry contribution per use (1–10)
  category: IngredientCategory;
  rarity: Rarity;
  description: string;
}

// affinity[a][b] -> float in roughly [-1.0, +2.0]; symmetric; self = 0
export type AffinityMatrix = Record<string, Record<string, number>>;

export interface AffinityData {
  matrix: AffinityMatrix;
  guaranteed: string[][];
}

export type RecipeTier =
  | "none"
  | "terrible" // avg affinity < -0.3
  | "neutral" // -0.3 .. 0.3
  | "good" // 0.3 .. 0.8
  | "great" // 0.8 .. 1.3
  | "legendary"; // > 1.3

export interface PairScore {
  a: string;
  b: string;
  affinity: number;
}

export interface RecipeScore {
  affinityScore: number; // raw sum of all pairwise affinities
  avgAffinity: number; // per-pair average
  multiplier: number; // final multiplier applied to click value
  tier: RecipeTier;
  baseValue: number; // sum of slotted ingredient baseValues
  pairBreakdown: PairScore[];
}

export interface DailySnapshot {
  day: number;
  curry: string; // Decimal serialised as string
  clicks: number;
  tierAtDayEnd: RecipeTier; // best/active recipe tier when the day rolled over
}

// --- Shop (framework §4.6 / §10) ---

export type UpgradeEffect =
  | { type: "click_multiplier"; value: number }
  | { type: "auto_cps"; value: number }
  | { type: "recipe_slot_unlock"; slotIndex: number } // unlock slots 4 & 5
  | { type: "affinity_lens" };

export interface Upgrade {
  id: string;
  name: string;
  icon: string; // Material Symbols ligature
  tone: string; // Tailwind bg class for the icon tile
  description: string;
  cost: number; // in curry
  tier: number;
  prerequisiteUpgradeId?: string;
  effect: UpgradeEffect;
}

export interface Decoration {
  id: string;
  name: string;
  icon: string;
  tone: string;
  description: string;
  cost: number; // in curry
  passiveCurryPerSec: number;
  passiveClickBonus: number;
  spicePairAffinity?: number; // flat affinity added to every spice/spice pair
  spiceClickBonus?: number; // flat cook value per spice ingredient in recipe
  maxQuantity: number; // stackable up to this many
}

// --- Rewards ---

export interface DailySpecial {
  day: number;
  ingredientA: string;
  ingredientB: string;
  bonusMultiplier: number; // 2.0
}

export interface DiscoveredRecipe {
  fingerprint: string; // sorted ingredient ids joined by "+"
  ingredientIds: string[];
  tier: RecipeTier;
  multiplier: number;
  name?: string; // set by the Naming Ceremony
  discoveredDay: number;
}
