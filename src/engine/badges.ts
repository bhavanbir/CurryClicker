// Badge system (framework §16). Badges are earned automatically; the evaluator
// is pure and returns every badge id currently satisfied. The store unions the
// result into `unlockedBadges` (badges never un-earn).
// The 10 ids are registered as Steam achievements in src/lib/desktop.ts — the
// conditions behind them can change, the ids cannot.
// Names/descriptions are placeholder copy (rewritten later from the copy doc).

import { RARITY_ORDER, type GachaRarity } from "./gacha";

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  { id: "spicy_boy", name: "Spicy Boy", icon: "local_fire_department", description: "Make your first curry" },
  { id: "curry_king", name: "Curry King", icon: "workspace_premium", description: "Earn 1M curry all-time" },
  { id: "speedster", name: "Speedster", icon: "timer", description: "Cook 1,000 times in one day" },
  { id: "week_warrior", name: "Week Warrior", icon: "calendar_month", description: "Complete a full week" },
  { id: "recipe_master", name: "Pantry Raider", icon: "menu_book", description: "Roll 25 different ingredients" },
  { id: "synergy", name: "Currylicious", icon: "auto_awesome", description: "Pull a Currylicious ingredient" },
  { id: "combo_king", name: "Combo King", icon: "grid_view", description: "Equip 3 ingredients worth 8+ combined power" },
  { id: "special_collector", name: "High Roller", icon: "star", description: "Pull 5 Epic-or-better ingredients" },
  { id: "streak_master", name: "Specialist", icon: "whatshot", description: "Complete every node of one skill branch" },
  { id: "curator", name: "Curator", icon: "edit_note", description: "Hold 50 ingredients at once" },
];

export interface BadgeInputs {
  totalCurry: number;
  maxDayClicks: number;
  weeksCompleted: number;
  distinctIngredients: number; // distinct ingredientIds ever rolled
  bestRarityEver: GachaRarity | null;
  maxEquippedMods: number; // best combined rollPower across the 3 equipped
  epicPulls: number; // lifetime Epic-or-better pulls
  fullBranches: number; // skill branches owned end to end
  inventorySize: number;
}

export function evaluateBadges(i: BadgeInputs): string[] {
  const earned: string[] = [];
  if (i.totalCurry > 0) earned.push("spicy_boy");
  if (i.totalCurry >= 1_000_000) earned.push("curry_king");
  if (i.maxDayClicks >= 1000) earned.push("speedster");
  if (i.weeksCompleted >= 1) earned.push("week_warrior");
  if (i.distinctIngredients >= 25) earned.push("recipe_master");
  if (i.bestRarityEver && RARITY_ORDER[i.bestRarityEver] >= RARITY_ORDER.currylicious)
    earned.push("synergy");
  if (i.maxEquippedMods >= 8) earned.push("combo_king");
  if (i.epicPulls >= 5) earned.push("special_collector");
  if (i.fullBranches >= 1) earned.push("streak_master");
  if (i.inventorySize >= 50) earned.push("curator");
  return earned;
}
