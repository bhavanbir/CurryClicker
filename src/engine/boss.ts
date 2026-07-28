import type { DailySnapshot } from "../types";

// Day-5 boss. Its HP is not a hand-tuned number: it's a score threshold read
// off the player's own week, so the fight lands at "one good day, plus a bit"
// whether you're on week 1 or week 40. Damage is curry — one cook, one hit —
// so crits, On Fire and Crazy Curry all feed the fight for free.

export const BOSS_DIFFICULTY = 1.5; // HP ≈ 1.5× a typical day this week
export const BOSS_MIN_HP = 1500; // floor for idle/tutorial weeks

/** Boss HP for a week, from the days already banked. */
export function bossMaxHp(snapshots: DailySnapshot[]): number {
  if (snapshots.length === 0) return BOSS_MIN_HP;
  // Median, not mean: a ghost-pepper ×100 day is an outlier, not the pace —
  // averaging it in would set a bar the player can't clear without one.
  const sorted = snapshots.map((s) => s.curry).sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const median =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.max(BOSS_MIN_HP, Math.round(median * BOSS_DIFFICULTY));
}
