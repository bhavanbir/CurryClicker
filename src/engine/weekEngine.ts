// Weekly identity + seed. In the full game the seed comes from Supabase's
// weekly_seeds table; for the MVP we derive it locally from the ISO week so
// the affinity matrix is still shared by anyone playing the same calendar week.

import type { DailySpecial, DailySnapshot, Flavor, RecipeTier } from "../types";
import { FLAVORS, BASE_INGREDIENT_IDS } from "./ingredients";
import { IS_DEMO, DEMO_LOCKED_INGREDIENT_SET, DEMO_MAX_SLOTS } from "../target";
import { makeRng } from "../lib/rng";
import { getAffinityData } from "./affinityEngine";
import { MAX_SLOTS } from "../config";

export function getCurrentWeekId(d: Date = new Date()): string {
  // ISO-8601 week number.
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Stable 32-bit hash (FNV-1a) of the week id -> integer seed.
export function seedFromWeekId(weekId: string): number {
  let h = 2166136261;
  for (let i = 0; i < weekId.length; i++) {
    h ^= weekId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Chef's Special (framework §8): a deterministic ingredient duo per (seed, day)
// worth a 2× cook bonus when both are slotted. Same for all players that day.
export const SPECIAL_BONUS_MULTIPLIER = 2.0;

export function getDailySpecial(day: number, seed: number): DailySpecial {
  const rng = makeRng(`${seed}-special-day${day}`);
  const ids = IS_DEMO
    ? BASE_INGREDIENT_IDS.filter((id) => !DEMO_LOCKED_INGREDIENT_SET.has(id))
    : BASE_INGREDIENT_IDS;
  const a = ids[Math.floor(rng() * ids.length)];
  let b = ids[Math.floor(rng() * ids.length)];
  while (b === a) b = ids[Math.floor(rng() * ids.length)];
  return {
    day,
    ingredientA: a,
    ingredientB: b,
    bonusMultiplier: SPECIAL_BONUS_MULTIPLIER,
  };
}

// Daily Craving: one flavour the town wants today, deterministic per (seed, day)
// so it changes daily and reshuffles when the weekly seed rolls over. A recipe
// whose flavour matches earns a bonus; a mismatch caps legendary at great.
export function getDailyCraving(day: number, seed: number): Flavor {
  const rng = makeRng(`${seed}-craving-day${day}`);
  return FLAVORS[Math.floor(rng() * FLAVORS.length)];
}

// Weekly Rumor: one guaranteed all-positive combo, revealed one ingredient per
// day — a week-long treasure hunt. Deterministic per seed; null in demo builds
// when no guaranteed combo is fully cookable (locked ingredients / 4-slot cap).
export function getWeeklyRumor(seed: number): string[] | null {
  const { guaranteed } = getAffinityData(seed);
  const maxLen = IS_DEMO ? DEMO_MAX_SLOTS : MAX_SLOTS;
  const pool = guaranteed.filter(
    (c) =>
      c.length <= maxLen &&
      (!IS_DEMO || c.every((id) => !DEMO_LOCKED_INGREDIENT_SET.has(id))),
  );
  if (pool.length === 0) return null; // ponytail: demo hides the rumor that week
  const rng = makeRng(`${seed}-rumor`);
  return pool[Math.floor(rng() * pool.length)];
}

// Combo order is already seeded-shuffled, so revealing a prefix is fair.
export function rumorRevealedCount(rumor: string[], day: number): number {
  return Math.min(day, rumor.length);
}

// Recipe Streak (framework §9): consecutive days ending at tier good+ build a
// multiplier; any neutral-or-below day resets it.
const STREAK_MULTIPLIERS: Record<number, number> = {
  0: 1.0,
  1: 1.0,
  2: 1.05,
  3: 1.08,
  4: 1.12,
  5: 1.15,
  6: 1.2,
  7: 1.25,
};

const STREAK_QUALIFYING_TIERS: RecipeTier[] = ["good", "great", "legendary"];

export function streakMultiplierFor(days: number): number {
  return STREAK_MULTIPLIERS[Math.min(days, 7)] ?? 1.0;
}

export function evaluateStreak(
  snapshot: Pick<DailySnapshot, "tierAtDayEnd">,
  currentStreakDays: number,
): { newStreakDays: number; newMultiplier: number } {
  const qualifies = STREAK_QUALIFYING_TIERS.includes(snapshot.tierAtDayEnd);
  const newStreakDays = qualifies ? Math.min(currentStreakDays + 1, 7) : 0;
  return {
    newStreakDays,
    newMultiplier: streakMultiplierFor(newStreakDays),
  };
}
