// Badge system (framework §16). Badges are earned automatically; the evaluator
// is pure and returns every badge id currently satisfied. The store unions the
// result into `unlockedBadges` (badges never un-earn). IAP / leaderboard badges
// (Cosmetic Collector, Top 10 Chef) arrive with Epics D/E and are omitted here.

import type { Decimal } from "../lib/decimal";
import { TIER_ORDER } from "./recipeEngine";
import type { RecipeTier } from "../types";

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
  { id: "week_warrior", name: "Week Warrior", icon: "calendar_month", description: "Complete a full 7-day week" },
  { id: "recipe_master", name: "Recipe Master", icon: "menu_book", description: "Discover 10 different recipes" },
  { id: "synergy", name: "Synergy Seeker", icon: "auto_awesome", description: "Craft a Legendary recipe" },
  { id: "combo_king", name: "Combo King", icon: "grid_view", description: "Use all 5 slots in one recipe" },
  { id: "special_collector", name: "Special Collector", icon: "star", description: "Claim the Chef's Special on 5 days in a week" },
  { id: "streak_master", name: "Streak Master", icon: "whatshot", description: "Hold a good recipe for all 7 days" },
  { id: "curator", name: "Curator", icon: "edit_note", description: "Name 5 recipes" },
];

export interface BadgeInput {
  totalCurry: Decimal;
  maxDayClicks: number;
  weeksCompleted: number;
  discoveredCount: number;
  highestTierSeen: RecipeTier;
  maxSlotsInRecipe: number;
  specialClaimCount: number;
  recipeStreakDays: number;
  namedRecipeCount: number;
}

export function evaluateBadges(i: BadgeInput): string[] {
  const earned: string[] = [];
  if (i.totalCurry.gt(0)) earned.push("spicy_boy");
  if (i.totalCurry.gte(1_000_000)) earned.push("curry_king");
  if (i.maxDayClicks >= 1000) earned.push("speedster");
  if (i.weeksCompleted >= 1) earned.push("week_warrior");
  if (i.discoveredCount >= 10) earned.push("recipe_master");
  if (TIER_ORDER[i.highestTierSeen] >= TIER_ORDER.legendary) earned.push("synergy");
  if (i.maxSlotsInRecipe >= 5) earned.push("combo_king");
  if (i.specialClaimCount >= 5) earned.push("special_collector");
  if (i.recipeStreakDays >= 7) earned.push("streak_master");
  if (i.namedRecipeCount >= 5) earned.push("curator");
  return earned;
}
