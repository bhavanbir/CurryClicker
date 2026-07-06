// Shared domain types for the MVP core loop.

export type IngredientCategory =
  | "spice"
  | "vegetable"
  | "protein"
  | "dairy"
  | "herb";

// Flavour profile — orthogonal to the pantry `category` (which groups by kind:
// spice/veg/protein/…). Flavours drive the daily craving + recipe-flavour match.
export type Flavor = "spicy" | "mild" | "sweet" | "savory" | "unique";

export type Rarity = "common" | "uncommon" | "rare";

// Purchasable ingredient sets (franchise star upgrades). Absent = base roster,
// always available; a set id means the ingredient unlocks with that franchise
// upgrade.
export type IngredientSet =
  | "coastal"
  | "street"
  | "royal"
  | "himalayan"
  | "tandoor"
  | "mithai";

export interface Ingredient {
  id: string;
  name: string;
  icon: string; // Material Symbols ligature name
  color: string; // Tailwind text-color class for the icon
  baseValue: number; // Curry contribution per use (1–10)
  category: IngredientCategory;
  flavor: Flavor;
  rarity: Rarity;
  description: string;
  set?: IngredientSet; // undefined = base 30; otherwise franchise-locked
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
  multiplier: number; // raw multiplier from the affinity tier (pre-craving)
  tier: RecipeTier; // raw tier from the affinity average (pre-craving)
  baseValue: number; // sum of slotted ingredient baseValues
  pairBreakdown: PairScore[];
  flavor: Flavor | null; // most-common flavour among slots; null if empty
  // Craving-adjusted values. When no craving is supplied they equal the raw
  // tier/multiplier and cravingMatched is null.
  effectiveTier: RecipeTier;
  effectiveMultiplier: number;
  cravingMatched: boolean | null;
}

export interface DailySnapshot {
  day: number;
  curry: number;
  clicks: number;
  tierAtDayEnd: RecipeTier; // best/active recipe tier when the day rolled over
}

// --- Shop (framework §4.6 / §10) ---

export type UpgradeEffect =
  | { type: "click_multiplier"; value: number }
  | { type: "auto_cps"; value: number }
  | { type: "recipe_slot_unlock"; slotIndex: number } // unlock slots 4 & 5
  | { type: "restaurant_expansion"; level: number }; // 1–5: bigger room, more diners

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
  cookCount?: number; // cooks this week (taste-to-reveal progress)
}

// --- Restaurant scene (Phase 3/4) ---

// Selectable restaurant backdrops. Free in this build (cosmetic, not pay-to-win);
// the IAP skin store is a later phase.
export type SceneSkin = "default" | "neon" | "zen" | "mumbai";

// A decoration the player has placed onto a floor grid cell in the scene.
export interface Placement {
  instanceId: string; // unique per placed instance
  decorationId: string; // -> DECORATION_MAP
  col: number; // floor grid column (0..GRID_COLS-1)
  row: number; // floor grid row (0..GRID_ROWS-1)
}

// --- Franchise (prestige) ---

export type FranchiseEffect =
  | { type: "reputation"; multiplier: number } // global ×curry, highest tier wins
  | { type: "ingredient_set"; set: IngredientSet } // unlocks a pantry set
  | { type: "head_start"; curry: number } // curry granted at week start
  | { type: "journal_insight"; pairs: number } // pre-revealed affinity pairs/week
  | { type: "starting_slots"; slots: number }; // recipe slots unlocked at week start

export interface FranchiseUpgrade {
  id: string;
  name: string;
  icon: string; // Material Symbols ligature
  description: string;
  cost: number; // in Franchise Stars
  tier: number;
  prerequisiteUpgradeId?: string; // previous tier must be owned first
  replaces?: string; // tier id this supersedes (effect doesn't stack with it)
  effect: FranchiseEffect;
}

// Breakdown of Stars earned for the just-completed week (week-summary display).
export interface WeekStarAward {
  total: number;
  reasons: string[];
}
