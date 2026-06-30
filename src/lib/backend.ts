// Backend integration stub.
//
// The MVP runs fully offline against localStorage (handled by the zustand
// persist middleware). The full game wires these calls to Supabase
// (auth + game_saves + leaderboard + weekly_seeds) and Stripe (IAP). The
// interface below is the seam Phase 3/4 will implement — kept here so the
// rest of the app never imports a network client directly.

import type { AffinityData } from "../types";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarId: string;
  scoreText: string;
}

export interface Backend {
  /** Fetch the authoritative weekly seed/recipes (falls back to local derivation). */
  fetchWeeklySeed(weekId: string): Promise<{ seed: number } | null>;
  /** Push the serialised save blob to the cloud. */
  saveGame(serialized: unknown): Promise<void>;
  /** Submit the week's final score for the leaderboard. */
  submitScore(weekId: string, score: string, scoreText: string): Promise<void>;
  /** Read the current weekly leaderboard. */
  getLeaderboard(weekId: string): Promise<LeaderboardEntry[]>;
}

// No-op backend used by the MVP. Every method is a safe stub.
export const localOnlyBackend: Backend = {
  async fetchWeeklySeed() {
    return null; // signals: derive locally from the ISO week
  },
  async saveGame() {
    /* persistence handled by localStorage in MVP */
  },
  async submitScore() {
    /* no leaderboard in MVP */
  },
  async getLeaderboard() {
    return [];
  },
};

export const backend: Backend = localOnlyBackend;

// Re-export so future code can type weekly data uniformly.
export type { AffinityData };
