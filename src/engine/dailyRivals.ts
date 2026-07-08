// Daily NPC rival chefs. 100 deterministic rivals per calendar-day seed stand
// in for a real Steam leaderboard (the steamworks.js binding can't fetch one
// yet — see electron/steam.cjs). Placement against them drives trophy awards.
// ponytail: rival scores scale off the player's highScore so the field stays
// competitive at any progression stage; swap for real Steam entries later.

import { makeRng } from "../lib/rng";

export const RIVAL_COUNT = 100;

export interface RivalEntry {
  name: string;
  score: number;
}

const FIRST = [
  "Spicy", "Garam", "Tikka", "Naan", "Paneer", "Masala", "Chutney", "Vindaloo",
  "Korma", "Saffron", "Cardamom", "Turmeric", "Ghee", "Tandoori", "Biryani",
  "Cumin", "Chili", "Pepper", "Coco", "Mango",
];
const LAST = [
  "Boi", "Gorilla", "Taco", "Stop", "Panic", "Master", "Wizard", "Ninja",
  "King", "Queen", "Fiend", "Machine", "Storm", "Legend", "Goblin", "Baron",
  "Rocket", "Whisk", "Ladle", "Pot",
];

// Trophy tier for a final daily rank; null = outside the top 100.
export function trophyTierFor(rank: number): string | null {
  if (rank <= 5) return String(rank);
  if (rank <= 10) return "top10";
  if (rank <= RIVAL_COUNT) return "top100";
  return null;
}

export const TROPHY_TIERS: { key: string; label: string; icon: string }[] = [
  { key: "1", label: "1st Place", icon: "trophy" },
  { key: "2", label: "2nd Place", icon: "workspace_premium" },
  { key: "3", label: "3rd Place", icon: "workspace_premium" },
  { key: "4", label: "4th Place", icon: "military_tech" },
  { key: "5", label: "5th Place", icon: "military_tech" },
  { key: "top10", label: "Top 10", icon: "stars" },
  { key: "top100", label: "Top 100", icon: "star" },
];

// 100 rivals, sorted best-first. Deterministic per (seed, scale-bucket): the
// scale is bucketed to the player's highScore order of magnitude so scores
// don't jitter with every new personal best mid-day.
export function getDailyRivals(seed: number, playerHighScore: number): RivalEntry[] {
  const scale = Math.pow(10, Math.ceil(Math.log10(Math.max(playerHighScore, 10_000))));
  const rng = makeRng(`${seed}-rivals-${scale}`);
  const used = new Set<string>();
  const rivals: RivalEntry[] = [];
  for (let i = 0; i < RIVAL_COUNT; i++) {
    let name =
      FIRST[Math.floor(rng() * FIRST.length)] + LAST[Math.floor(rng() * LAST.length)];
    if (used.has(name)) name += String(Math.floor(rng() * 90) + 10);
    used.add(name);
    // Geometric spread: the best rival sits ~2.5× the scale bucket, the worst
    // near zero, with per-rival jitter so the curve isn't perfectly smooth.
    const score = scale * 2.5 * Math.pow(0.92, i) * (0.7 + 0.6 * rng());
    rivals.push({ name, score: Math.floor(score) });
  }
  rivals.sort((a, b) => b.score - a.score);
  return rivals;
}

// Rank among the rivals (1 = beating everyone; RIVAL_COUNT+1 = beating no one).
export function placementFor(score: number, rivals: RivalEntry[]): number {
  return rivals.filter((r) => r.score > score).length + 1;
}
