// Cookbook + Naming Ceremony helpers (framework §11.3 / §15.2). A recipe's
// identity is the *set* of its ingredients, so the fingerprint is order-free.

import { makeRng } from "../lib/rng";

export function recipeFingerprint(slots: (string | null)[]): string {
  return slots
    .filter((s): s is string => s !== null)
    .slice()
    .sort()
    .join("+");
}

// Two-word arcade name generator, seeded by the fingerprint so the suggested
// default is stable for a given recipe (players can override it).
const ADJECTIVES = [
  "Crimson",
  "Golden",
  "Blazing",
  "Royal",
  "Mystic",
  "Smoky",
  "Velvet",
  "Thunder",
  "Saffron",
  "Midnight",
  "Emerald",
  "Spiced",
  "Wild",
  "Sacred",
  "Molten",
];

const NOUNS = [
  "Blaze",
  "Storm",
  "Feast",
  "Dream",
  "Inferno",
  "Symphony",
  "Sunrise",
  "Tempest",
  "Whisper",
  "Crown",
  "Mirage",
  "Cascade",
  "Ember",
  "Nirvana",
  "Riot",
];

export function suggestRecipeName(fingerprint: string): string {
  const rng = makeRng(`name-${fingerprint}`);
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
  return `${adj} ${noun}`;
}
