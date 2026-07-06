// Franchise (prestige) catalogue — single source of truth for Star-priced
// meta-upgrades (FRANCHISE_DESIGN.md). Costs are in Franchise Stars. Separate
// from the curry-priced shop in shopData.ts.

import type { FranchiseUpgrade } from "../types";
import { INGREDIENT_LIST } from "./ingredients";
import { BASE_UNLOCKED_SLOTS } from "../config";

export const FRANCHISE_UPGRADES: FranchiseUpgrade[] = [
  // Reputation — global curry multiplier, higher tiers replace lower ones.
  {
    id: "reputation_1",
    name: "Reputation I",
    icon: "trending_up",
    description: "Permanent ×1.25 to all curry earned",
    cost: 2,
    tier: 1,
    effect: { type: "reputation", multiplier: 1.25 },
  },
  {
    id: "reputation_2",
    name: "Reputation II",
    icon: "trending_up",
    description: "Permanent ×1.5 to all curry earned",
    cost: 5,
    tier: 2,
    prerequisiteUpgradeId: "reputation_1",
    replaces: "reputation_1",
    effect: { type: "reputation", multiplier: 1.5 },
  },
  {
    id: "reputation_3",
    name: "Reputation III",
    icon: "rocket_launch",
    description: "Permanent ×2 to all curry earned",
    cost: 9,
    tier: 3,
    prerequisiteUpgradeId: "reputation_2",
    replaces: "reputation_2",
    effect: { type: "reputation", multiplier: 2 },
  },
  // Ingredient sets — expand the pantry / affinity puzzle.
  {
    id: "set_coastal",
    name: "Coastal Set",
    icon: "phishing",
    description: "Unlock 5 coastal ingredients",
    cost: 3,
    tier: 1,
    effect: { type: "ingredient_set", set: "coastal" },
  },
  {
    id: "set_street",
    name: "Street Food Set",
    icon: "storefront",
    description: "Unlock 5 street-food ingredients",
    cost: 6,
    tier: 1,
    effect: { type: "ingredient_set", set: "street" },
  },
  {
    id: "set_royal",
    name: "Royal Set",
    icon: "crown",
    description: "Unlock 5 royal ingredients",
    cost: 8,
    tier: 1,
    effect: { type: "ingredient_set", set: "royal" },
  },
  {
    id: "set_himalayan",
    name: "Himalayan Set",
    icon: "landscape",
    description: "Unlock 5 mountain ingredients",
    cost: 10,
    tier: 1,
    effect: { type: "ingredient_set", set: "himalayan" },
  },
  {
    id: "set_tandoor",
    name: "Tandoor Set",
    icon: "local_fire_department",
    description: "Unlock 5 clay-oven ingredients",
    cost: 12,
    tier: 1,
    effect: { type: "ingredient_set", set: "tandoor" },
  },
  {
    id: "set_mithai",
    name: "Mithai Set",
    icon: "cake",
    description: "Unlock 5 dessert ingredients",
    cost: 15,
    tier: 1,
    effect: { type: "ingredient_set", set: "mithai" },
  },
  // Head Start — curry granted at the start of each week.
  {
    id: "head_start_1",
    name: "Head Start I",
    icon: "bolt",
    description: "Start each week with 500 curry",
    cost: 2,
    tier: 1,
    effect: { type: "head_start", curry: 500 },
  },
  {
    id: "head_start_2",
    name: "Head Start II",
    icon: "bolt",
    description: "Start each week with 10,000 curry",
    cost: 3,
    tier: 2,
    prerequisiteUpgradeId: "head_start_1",
    replaces: "head_start_1",
    effect: { type: "head_start", curry: 10_000 },
  },
  // Journal Insight — affinity pairs pre-revealed at the start of each week.
  {
    id: "insight_1",
    name: "Journal Insight I",
    icon: "menu_book",
    description: "3 affinity pairs pre-revealed each week",
    cost: 3,
    tier: 1,
    effect: { type: "journal_insight", pairs: 3 },
  },
  {
    id: "insight_2",
    name: "Journal Insight II",
    icon: "auto_stories",
    description: "6 affinity pairs pre-revealed each week",
    cost: 5,
    tier: 2,
    prerequisiteUpgradeId: "insight_1",
    replaces: "insight_1",
    effect: { type: "journal_insight", pairs: 6 },
  },
  // Fourth Burner — weeks start with a 4th recipe slot already unlocked.
  {
    id: "fourth_burner",
    name: "Fourth Burner",
    icon: "grid_view",
    description: "Weeks start with 4 recipe slots unlocked",
    cost: 6,
    tier: 1,
    effect: { type: "starting_slots", slots: 4 },
  },
];

export const FRANCHISE_UPGRADE_MAP: Record<string, FranchiseUpgrade> =
  Object.fromEntries(FRANCHISE_UPGRADES.map((u) => [u.id, u]));

// Global curry multiplier from owned Reputation tiers (highest wins, no stack).
export function reputationMultiplier(franchiseUpgrades: string[]): number {
  let mult = 1;
  for (const id of franchiseUpgrades) {
    const eff = FRANCHISE_UPGRADE_MAP[id]?.effect;
    if (eff?.type === "reputation") mult = Math.max(mult, eff.multiplier);
  }
  return mult;
}

// Curry granted at week start from the owned Head Start tier (highest wins).
export function headStartCurry(franchiseUpgrades: string[]): number {
  let curry = 0;
  for (const id of franchiseUpgrades) {
    const eff = FRANCHISE_UPGRADE_MAP[id]?.effect;
    if (eff?.type === "head_start") curry = Math.max(curry, eff.curry);
  }
  return curry;
}

// Affinity pairs to pre-reveal at week start from the owned Insight tier.
export function journalInsightPairs(franchiseUpgrades: string[]): number {
  let pairs = 0;
  for (const id of franchiseUpgrades) {
    const eff = FRANCHISE_UPGRADE_MAP[id]?.effect;
    if (eff?.type === "journal_insight") pairs = Math.max(pairs, eff.pairs);
  }
  return pairs;
}

// Recipe slots a week starts with, before any curry slot upgrades.
export function franchiseBaseSlots(franchiseUpgrades: string[]): number {
  let slots = BASE_UNLOCKED_SLOTS;
  for (const id of franchiseUpgrades) {
    const eff = FRANCHISE_UPGRADE_MAP[id]?.effect;
    if (eff?.type === "starting_slots") slots = Math.max(slots, eff.slots);
  }
  return slots;
}

// Ingredient ids the player can currently cook with: base roster + owned sets.
export function unlockedIngredientIds(franchiseUpgrades: string[]): string[] {
  const ownedSets = new Set(
    franchiseUpgrades
      .map((id) => FRANCHISE_UPGRADE_MAP[id]?.effect)
      .filter((e) => e?.type === "ingredient_set")
      .map((e) => (e as { set: string }).set),
  );
  return INGREDIENT_LIST.filter((i) => !i.set || ownedSets.has(i.set)).map(
    (i) => i.id,
  );
}

// Franchise rank title derived from lifetime Stars earned (replaces XP/levels).
const RANK_THRESHOLDS: [number, string][] = [
  [0, "Street Stall"],
  [5, "Corner Kitchen"],
  [15, "Local Favorite"],
  [30, "City Star"],
  [50, "Curry Empire"],
];

export function franchiseRankFor(starsEarned: number): string {
  let title = RANK_THRESHOLDS[0][1];
  for (const [threshold, name] of RANK_THRESHOLDS) {
    if (starsEarned >= threshold) title = name;
  }
  return title;
}
