// Calendar identity + seed, derived locally so daily systems (rivals, day
// choices) are shared by anyone playing the same calendar day — no backend.
// The week id remains for the in-game week loop's display/rollover.

// Anti-cheat: on desktop the clock is anchored to Steam server time (synced in
// useWeeklySeed), so changing the system clock can't force day/week rollovers.
// Offset stays 0 on web or when Steam is unavailable. Local timezone still
// applies, so rollover remains local midnight.
let clockOffsetMs = 0;
export function syncClock(serverEpochSec: number): void {
  clockOffsetMs = serverEpochSec * 1000 - Date.now();
}
const now = () => new Date(Date.now() + clockOffsetMs);

export function getCurrentWeekId(d: Date = now()): string {
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

// Local calendar date, e.g. "2026-07-07". Daily rivals, day choices, and the
// daily leaderboard all reseed when this rolls over at local midnight.
export function getCurrentDateId(d: Date = now()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Stable 32-bit hash (FNV-1a) of any id string -> integer seed.
export function seedFromWeekId(weekId: string): number {
  let h = 2166136261;
  for (let i = 0; i < weekId.length; i++) {
    h ^= weekId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
