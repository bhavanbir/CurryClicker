// Central runtime config for the MVP core loop.

// One simulated week in ms. Compressed by default so the day/week/summary
// loop is observable during development. Override via VITE_WEEK_DURATION_MS.
// Production value would be 7 * 24 * 60 * 60 * 1000 = 604_800_000.
export const WEEK_DURATION_MS: number = Number(
  import.meta.env.VITE_WEEK_DURATION_MS ?? 5 * 45 * 1000, // 45s per day
);

export const DAYS_PER_WEEK = 5;

// Real seconds that make up one in-game day.
export const DAY_DURATION_SECONDS: number =
  WEEK_DURATION_MS / DAYS_PER_WEEK / 1000;
