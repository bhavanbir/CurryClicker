import type { AffinityData, AffinityMatrix } from "../types";
import { makeRng } from "../lib/rng";
import { INGREDIENT_IDS } from "./ingredients";
import { GUARANTEED_RECIPE_COUNT } from "../config";

// Deterministically builds the full weekly affinity matrix plus a set of
// guaranteed all-positive recipes from a single integer seed. Same seed ->
// same data for every player that week.
export function buildAffinityData(seed: number): AffinityData {
  const rng = makeRng(seed);

  // Step 1: raw symmetric pairwise affinity matrix.
  const matrix: AffinityMatrix = {};
  for (const a of INGREDIENT_IDS) matrix[a] = {};

  for (const a of INGREDIENT_IDS) {
    for (const b of INGREDIENT_IDS) {
      if (a === b) {
        matrix[a][b] = 0;
        continue;
      }
      if (a < b) {
        const val = rng() * 3 - 1; // range: -1.0 .. +2.0
        matrix[a][b] = val;
        matrix[b][a] = val;
      }
    }
  }

  // Step 2: carve out guaranteed positive recipes by forcing all pairs in a
  // combo to be strongly positive.
  const guaranteed: string[][] = [];
  const shuffled = shuffle([...INGREDIENT_IDS], rng);
  let pool = [...shuffled];

  while (guaranteed.length < GUARANTEED_RECIPE_COUNT && pool.length >= 3) {
    const size = 3 + Math.floor(rng() * 3); // 3, 4 or 5
    const combo = pool.splice(0, size);

    for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        const val = 0.8 + rng() * 1.2; // +0.8 .. +2.0
        matrix[combo[i]][combo[j]] = val;
        matrix[combo[j]][combo[i]] = val;
      }
    }

    guaranteed.push(combo);
    if (pool.length < 5) pool = shuffle([...shuffled], rng);
  }

  return { matrix, guaranteed };
}

// Fisher–Yates with a seeded rng (stable, unlike Array.sort(() => rng()-0.5)).
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Memoised accessor — the matrix only changes when the weekly seed changes.
let cache: { seed: number; data: AffinityData } | null = null;

export function getAffinityData(seed: number): AffinityData {
  if (cache && cache.seed === seed) return cache.data;
  const data = buildAffinityData(seed);
  cache = { seed, data };
  return data;
}
