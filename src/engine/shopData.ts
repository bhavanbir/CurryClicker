// Shop catalogue — single source of truth for purchasable Upgrades and
// Decorations (framework §10 / §4.6). Costs are plain numbers (curry).
// IAP cosmetics stay in
// data/sampleData (real-money, no gameplay effect) until Epic E.

import type { Upgrade, Decoration } from "../types";

// --- Upgrades (one-time, some chained via prerequisiteUpgradeId) ---
export const UPGRADES: Upgrade[] = [
  // Click multipliers (stack multiplicatively per security_and_logic §1.3)
  {
    id: "wooden_spoon",
    name: "Wooden Spoon",
    icon: "soup_kitchen",
    tone: "bg-amber-200",
    description: "×1.5 click value",
    cost: 10_000,
    tier: 1,
    effect: { type: "click_multiplier", value: 1.5 },
  },
  {
    id: "steel_ladle",
    name: "Steel Ladle",
    icon: "kitchen",
    tone: "bg-slate-200",
    description: "×2 click value",
    cost: 50_000,
    tier: 2,
    prerequisiteUpgradeId: "wooden_spoon",
    effect: { type: "click_multiplier", value: 2.0 },
  },
  {
    id: "golden_ladle",
    name: "Golden Ladle",
    icon: "star",
    tone: "bg-yellow-200",
    description: "×3 click value",
    cost: 200_000,
    tier: 3,
    prerequisiteUpgradeId: "steel_ladle",
    effect: { type: "click_multiplier", value: 3.0 },
  },
  {
    id: "obsidian_ladle",
    name: "Obsidian Ladle",
    icon: "dark_mode",
    tone: "bg-stone-300",
    description: "×4 click value",
    cost: 800_000,
    tier: 4,
    prerequisiteUpgradeId: "golden_ladle",
    effect: { type: "click_multiplier", value: 4.0 },
  },
  {
    id: "diamond_ladle",
    name: "Diamond Ladle",
    icon: "diamond",
    tone: "bg-sky-200",
    description: "×5 click value",
    cost: 10_000_000,
    tier: 5,
    prerequisiteUpgradeId: "obsidian_ladle",
    effect: { type: "click_multiplier", value: 5.0 },
  },
  {
    id: "celestial_ladle",
    name: "Celestial Ladle",
    icon: "auto_awesome",
    tone: "bg-violet-200",
    description: "×6 click value",
    cost: 60_000_000,
    tier: 6,
    prerequisiteUpgradeId: "diamond_ladle",
    effect: { type: "click_multiplier", value: 6.0 },
  },
  // Knife-work (second cook-value chain)
  {
    id: "chefs_knife",
    name: "Chef's Knife",
    icon: "cut",
    tone: "bg-gray-200",
    description: "×1.5 click value",
    cost: 30_000,
    tier: 1,
    effect: { type: "click_multiplier", value: 1.5 },
  },
  {
    id: "damascus_knife",
    name: "Damascus Knife",
    icon: "swords",
    tone: "bg-slate-300",
    description: "×2 click value",
    cost: 150_000,
    tier: 2,
    prerequisiteUpgradeId: "chefs_knife",
    effect: { type: "click_multiplier", value: 2.0 },
  },
  {
    id: "legendary_cleaver",
    name: "Legendary Cleaver",
    icon: "carpenter",
    tone: "bg-red-200",
    description: "×2.5 click value",
    cost: 700_000,
    tier: 3,
    prerequisiteUpgradeId: "damascus_knife",
    effect: { type: "click_multiplier", value: 2.5 },
  },
  // Kitchen crew (flat +curry per click)
  {
    id: "sous_chef",
    name: "Sous Chef",
    icon: "engineering",
    tone: "bg-blue-200",
    description: "+3 curry per click",
    cost: 20_000,
    tier: 1,
    effect: { type: "click_flat", value: 3 },
  },
  {
    id: "kitchen_brigade",
    name: "Kitchen Brigade",
    icon: "groups",
    tone: "bg-indigo-200",
    description: "+12 curry per click",
    cost: 100_000,
    tier: 2,
    prerequisiteUpgradeId: "sous_chef",
    effect: { type: "click_flat", value: 12 },
  },
  {
    id: "industrial_pot",
    name: "Industrial Pot",
    icon: "factory",
    tone: "bg-zinc-300",
    description: "+50 curry per click",
    cost: 500_000,
    tier: 3,
    prerequisiteUpgradeId: "kitchen_brigade",
    effect: { type: "click_flat", value: 50 },
  },
  {
    id: "curry_conveyor",
    name: "Curry Conveyor",
    icon: "conveyor_belt",
    tone: "bg-teal-200",
    description: "+200 curry per click",
    cost: 2_000_000,
    tier: 4,
    prerequisiteUpgradeId: "industrial_pot",
    effect: { type: "click_flat", value: 200 },
  },
  {
    id: "robot_kitchen",
    name: "Robot Kitchen",
    icon: "smart_toy",
    tone: "bg-cyan-200",
    description: "+750 curry per click",
    cost: 20_000_000,
    tier: 5,
    prerequisiteUpgradeId: "curry_conveyor",
    effect: { type: "click_flat", value: 750 },
  },
  {
    id: "curry_megaworks",
    name: "Curry Megaworks",
    icon: "warehouse",
    tone: "bg-purple-200",
    description: "+2,500 curry per click",
    cost: 100_000_000,
    tier: 6,
    prerequisiteUpgradeId: "robot_kitchen",
    effect: { type: "click_flat", value: 2_500 },
  },
  // Delivery (second flat-per-cook chain)
  {
    id: "delivery_bicycle",
    name: "Delivery Bicycle",
    icon: "pedal_bike",
    tone: "bg-lime-200",
    description: "+6 curry per click",
    cost: 40_000,
    tier: 1,
    effect: { type: "click_flat", value: 6 },
  },
  {
    id: "delivery_scooter",
    name: "Delivery Scooter",
    icon: "two_wheeler",
    tone: "bg-emerald-200",
    description: "+30 curry per click",
    cost: 250_000,
    tier: 2,
    prerequisiteUpgradeId: "delivery_bicycle",
    effect: { type: "click_flat", value: 30 },
  },
  {
    id: "delivery_fleet",
    name: "Delivery Van Fleet",
    icon: "local_shipping",
    tone: "bg-sky-200",
    description: "+125 curry per click",
    cost: 1_200_000,
    tier: 3,
    prerequisiteUpgradeId: "delivery_scooter",
    effect: { type: "click_flat", value: 125 },
  },
  // Recipe slots
  {
    id: "slot_4",
    name: "4th Slot",
    icon: "grid_view",
    tone: "bg-green-200",
    description: "Unlock 4-ingredient recipes",
    cost: 5_000,
    tier: 1,
    effect: { type: "recipe_slot_unlock", slotIndex: 3 },
  },
  {
    id: "slot_5",
    name: "5th Slot",
    icon: "apps",
    tone: "bg-emerald-200",
    description: "Unlock 5-ingredient recipes",
    cost: 25_000,
    tier: 2,
    prerequisiteUpgradeId: "slot_4",
    effect: { type: "recipe_slot_unlock", slotIndex: 4 },
  },
  // Restaurant Expansion (5 chained tiers — bigger room, more tables & diners)
  {
    id: "expand_1",
    name: "Cozy Extension",
    icon: "storefront",
    tone: "bg-orange-200",
    description: "Grow the shop: +2 tables & more customers",
    cost: 8_000,
    tier: 1,
    effect: { type: "restaurant_expansion", level: 1 },
  },
  {
    id: "expand_2",
    name: "Extra Seating",
    icon: "add_business",
    tone: "bg-amber-200",
    description: "Bigger room: even more tables & diners",
    cost: 30_000,
    tier: 2,
    prerequisiteUpgradeId: "expand_1",
    effect: { type: "restaurant_expansion", level: 2 },
  },
  {
    id: "expand_3",
    name: "Dining Hall",
    icon: "domain",
    tone: "bg-yellow-200",
    description: "A busier dining room with more seats",
    cost: 90_000,
    tier: 3,
    prerequisiteUpgradeId: "expand_2",
    effect: { type: "restaurant_expansion", level: 3 },
  },
  {
    id: "expand_4",
    name: "Grand Floor",
    icon: "apartment",
    tone: "bg-lime-200",
    description: "Packed with tables and a steady crowd",
    cost: 250_000,
    tier: 4,
    prerequisiteUpgradeId: "expand_3",
    effect: { type: "restaurant_expansion", level: 4 },
  },
  {
    id: "expand_5",
    name: "Curry Emporium",
    icon: "location_city",
    tone: "bg-green-200",
    description: "Maximum bustle — a packed house!",
    cost: 600_000,
    tier: 5,
    prerequisiteUpgradeId: "expand_4",
    effect: { type: "restaurant_expansion", level: 5 },
  },
];

// --- Decorations (flat +curry per click; some carry a special bonus; stackable) ---
export const DECORATIONS: Decoration[] = [
  {
    id: "neko",
    name: "Lucky Neko Cat",
    icon: "pets",
    tone: "bg-pink-200",
    description: "+1 curry per click",
    cost: 5_000,
    passiveClickBonus: 1,
    maxQuantity: 3,
  },
  {
    id: "spatula",
    name: "Golden Spatula Statue",
    icon: "restaurant",
    tone: "bg-yellow-200",
    description: "+2 curry per click",
    cost: 10_000,
    passiveClickBonus: 2,
    maxQuantity: 3,
  },
  {
    id: "spice_rack",
    name: "Spice Rack Deluxe",
    icon: "kitchen",
    tone: "bg-orange-200",
    description: "+3 curry per click · +0.2 affinity to all spice pairs",
    cost: 18_000,
    passiveClickBonus: 3,
    spicePairAffinity: 0.2,
    maxQuantity: 1,
  },
  {
    id: "arcade",
    name: "Retro Arcade Cabinet",
    icon: "videogame_asset",
    tone: "bg-red-200",
    description: "+4 curry per click",
    cost: 25_000,
    passiveClickBonus: 4,
    maxQuantity: 2,
  },
  {
    id: "tandoor",
    name: "Tandoor Oven",
    icon: "local_fire_department",
    tone: "bg-rose-200",
    description: "+6 curry per click · +1 click value per spice in recipe",
    cost: 40_000,
    passiveClickBonus: 6,
    spiceClickBonus: 1,
    maxQuantity: 1,
  },
  {
    id: "shrine",
    name: "Curry Shrine",
    icon: "temple_buddhist",
    tone: "bg-amber-200",
    description: "+12 curry per click",
    cost: 80_000,
    passiveClickBonus: 12,
    maxQuantity: 1,
  },
  {
    id: "neon_sign",
    name: "Neon Sign",
    icon: "light_mode",
    tone: "bg-fuchsia-200",
    description: "+20 curry per click",
    cost: 150_000,
    passiveClickBonus: 20,
    maxQuantity: 1,
  },
  {
    id: "auto_ladle",
    name: "Auto-Ladle Machine",
    icon: "precision_manufacturing",
    tone: "bg-cyan-200",
    description: "+45 curry per click",
    cost: 300_000,
    passiveClickBonus: 45,
    maxQuantity: 1,
  },
  {
    id: "potted_tulsi",
    name: "Potted Tulsi",
    icon: "potted_plant",
    tone: "bg-green-200",
    description: "+1 curry per click",
    cost: 3_000,
    passiveClickBonus: 1,
    maxQuantity: 4,
  },
  {
    id: "wind_chimes",
    name: "Brass Wind Chimes",
    icon: "notifications",
    tone: "bg-sky-200",
    description: "+1 curry per click",
    cost: 8_000,
    passiveClickBonus: 1,
    maxQuantity: 3,
  },
  {
    id: "copper_pots",
    name: "Hanging Copper Pots",
    icon: "flatware",
    tone: "bg-orange-200",
    description: "+2 curry per click",
    cost: 15_000,
    passiveClickBonus: 2,
    maxQuantity: 2,
  },
  {
    id: "rangoli",
    name: "Rangoli Floor Art",
    icon: "texture",
    tone: "bg-violet-200",
    description: "+3 curry per click",
    cost: 22_000,
    passiveClickBonus: 3,
    maxQuantity: 1,
  },
  {
    id: "masala_dabba",
    name: "Heirloom Masala Dabba",
    icon: "grid_on",
    tone: "bg-yellow-200",
    description: "+4 curry per click · +0.15 affinity to all spice pairs",
    cost: 35_000,
    passiveClickBonus: 4,
    spicePairAffinity: 0.15,
    maxQuantity: 1,
  },
  {
    id: "koi_tank",
    name: "Koi Fish Tank",
    icon: "waves",
    tone: "bg-blue-200",
    description: "+9 curry per click",
    cost: 60_000,
    passiveClickBonus: 9,
    maxQuantity: 1,
  },
  {
    id: "jukebox",
    name: "Bollywood Jukebox",
    icon: "music_note",
    tone: "bg-purple-200",
    description: "+15 curry per click",
    cost: 110_000,
    passiveClickBonus: 15,
    maxQuantity: 1,
  },
  {
    id: "pepper_mill",
    name: "Giant Pepper Mill",
    icon: "blender",
    tone: "bg-stone-200",
    description: "+10 curry per click · +2 click value per spice in recipe",
    cost: 120_000,
    passiveClickBonus: 10,
    spiceClickBonus: 2,
    maxQuantity: 1,
  },
  {
    id: "chandelier",
    name: "Brass Chandelier",
    icon: "wb_incandescent",
    tone: "bg-amber-200",
    description: "+25 curry per click",
    cost: 220_000,
    passiveClickBonus: 25,
    maxQuantity: 1,
  },
  {
    id: "fountain",
    name: "Courtyard Fountain",
    icon: "water",
    tone: "bg-cyan-200",
    description: "+50 curry per click",
    cost: 450_000,
    passiveClickBonus: 50,
    maxQuantity: 1,
  },
  {
    id: "elephant_statue",
    name: "Marble Elephant Statue",
    icon: "festival",
    tone: "bg-rose-200",
    description: "+90 curry per click",
    cost: 2_500_000,
    passiveClickBonus: 90,
    maxQuantity: 1,
  },
  {
    id: "rooftop_garden",
    name: "Rooftop Herb Garden",
    icon: "yard",
    tone: "bg-lime-200",
    description: "+160 curry per click",
    cost: 5_000_000,
    passiveClickBonus: 160,
    maxQuantity: 1,
  },
];

export const UPGRADE_MAP: Record<string, Upgrade> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);

export const DECORATION_MAP: Record<string, Decoration> = Object.fromEntries(
  DECORATIONS.map((d) => [d.id, d]),
);

// --- Decoration sets ---
// Owning every piece of a set makes the shop "look nice" and pays a cook-value
// multiplier. Sets stack multiplicatively with each other.
export interface DecorSet {
  id: string;
  name: string;
  pieces: string[]; // decoration ids, one of each required
  clickMult: number;
}

export const DECOR_SETS: DecorSet[] = [
  // Cozy Corner is completable in the demo (potted_tulsi + neko).
  { id: "cozy", name: "Cozy Corner", pieces: ["potted_tulsi", "neko", "wind_chimes"], clickMult: 1.1 },
  { id: "spice_lord", name: "Spice Lord", pieces: ["spice_rack", "masala_dabba", "pepper_mill", "tandoor"], clickMult: 1.25 },
  { id: "golden_hour", name: "Golden Hour", pieces: ["spatula", "chandelier", "neon_sign"], clickMult: 1.15 },
  { id: "zen_garden", name: "Zen Garden", pieces: ["koi_tank", "fountain", "rangoli"], clickMult: 1.2 },
  { id: "showtime", name: "Showtime", pieces: ["arcade", "jukebox", "copper_pots"], clickMult: 1.15 },
];

export function decorSetComplete(
  s: DecorSet,
  owned: Record<string, number>,
): boolean {
  return s.pieces.every((id) => (owned[id] ?? 0) > 0);
}

// Repeat copies of a stackable decoration cost more, so decor prices keep
// pace with a growing bankroll instead of becoming pocket change.
export const DECORATION_COST_GROWTH = 1.75; // per copy already owned

export function decorationCost(deco: Decoration, ownedQty: number): number {
  return Math.round(deco.cost * Math.pow(DECORATION_COST_GROWTH, ownedQty));
}

// --- Prestige (weekly rollover) scaling ---
// Each completed week ("prestige") upgrades are wiped and re-bought at higher
// prices, but every ladle — including your bare hands — cooks harder.
// ponytail: three tuning knobs, no config system
export const PRESTIGE_LADLE_GROWTH = 0.25; // +25%/wk — must visibly keep pace with the ×1.5^wk cost curve
export const LADLE_CAP_RATIO = 4; // capped ladles top out at 4× printed value (hit at prestige 12)
export const UPGRADE_COST_GROWTH = 1.5; // all upgrade costs ×1.5^prestige

const LADLE_IDS = new Set([
  "wooden_spoon",
  "steel_ladle",
  "golden_ladle",
  "obsidian_ladle",
  "diamond_ladle",
  "celestial_ladle",
]);

export function prestigeLadleFactor(prestige: number): number {
  return 1 + PRESTIGE_LADLE_GROWTH * prestige;
}

// The "default ladle" — base click multiplier with no upgrades. Capped like
// every non-celestial ladle.
export function prestigeBaseClick(prestige: number): number {
  return Math.min(prestigeLadleFactor(prestige), LADLE_CAP_RATIO);
}

// Value a click_multiplier upgrade contributes at a given prestige level.
// Knives (non-ladle ids) pass through unchanged; celestial_ladle is uncapped.
export function ladleValue(upgrade: Upgrade, prestige: number): number {
  const printed =
    upgrade.effect.type === "click_multiplier" ? upgrade.effect.value : 1;
  if (!LADLE_IDS.has(upgrade.id)) return printed;
  const grown = printed * prestigeLadleFactor(prestige);
  return upgrade.id === "celestial_ladle"
    ? grown
    : Math.min(grown, printed * LADLE_CAP_RATIO);
}

export function upgradeCost(upgrade: Upgrade, prestige: number): number {
  return Math.round(upgrade.cost * Math.pow(UPGRADE_COST_GROWTH, prestige));
}
