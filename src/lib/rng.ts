// Seeded RNG wrappers. All weekly determinism flows through here so the same
// seed produces the same affinity matrix for every player that week.
import seedrandom from "seedrandom";

export type Rng = () => number;

export function makeRng(seed: string | number): Rng {
  return seedrandom(String(seed));
}
