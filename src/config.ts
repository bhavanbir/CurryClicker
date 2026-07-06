// Central runtime config for the MVP core loop.

// One simulated week in ms. Compressed by default so the day/week/summary
// loop is observable during development. Override via VITE_WEEK_DURATION_MS.
// Production value would be 7 * 24 * 60 * 60 * 1000 = 604_800_000.
export const WEEK_DURATION_MS: number = Number(
  import.meta.env.VITE_WEEK_DURATION_MS ?? 7 * 60 * 1000, // 7 minutes
);

export const DAYS_PER_WEEK = 7;

// Real seconds that make up one in-game day.
export const DAY_DURATION_SECONDS: number =
  WEEK_DURATION_MS / DAYS_PER_WEEK / 1000;

// Recipe slots: the first 3 are free; the 4th and 5th unlock via shop upgrades
// (recipe_slot_unlock). Effective count lives in the store as `unlockedSlots`,
// derived by engine/effects.computeEffects.
export const BASE_UNLOCKED_SLOTS = 3;
export const MAX_SLOTS = 5;

// At least this many fully-positive recipes are guaranteed each week.
export const GUARANTEED_RECIPE_COUNT = 6;

// Cooks of one recipe before its affinity pairs are "tasted" (revealed in the
// Journal mid-day). Balance knob: lower = faster Journal fill = easier 20-pair
// franchise star.
export const TASTE_COOKS_TO_REVEAL = 25;
