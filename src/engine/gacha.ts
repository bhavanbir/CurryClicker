// Ingredient gacha. Every spin produces a unique RolledIngredient: a rarity
// picks the ingredient pool and the modifier count, and each modifier carries a
// float ∈ [0,1] (CS:GO style) that scales its magnitude inside a per-type range.

import { INGREDIENTS, INGREDIENT_IDS } from "./ingredients";
import { IS_DEMO, DEMO_MAX_RARITY } from "../target";

export type GachaRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "currylicious";

export const RARITIES: GachaRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "currylicious",
];

// Index of a rarity in RARITIES — comparison order for "Epic or better" checks.
export const RARITY_ORDER: Record<GachaRarity, number> = Object.fromEntries(
  RARITIES.map((r, i) => [r, i]),
) as Record<GachaRarity, number>;

export const MOD_COUNT: Record<GachaRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  currylicious: 6,
};

// Out of 1000. Currylicious ≈ 1 in 500 at zero luck.
export const RARITY_WEIGHT: Record<GachaRarity, number> = {
  common: 500,
  uncommon: 280,
  rare: 140,
  epic: 60,
  legendary: 18,
  currylicious: 2,
};

export const RARITY_SCALE: Record<GachaRarity, number> = {
  common: 1,
  uncommon: 1.35,
  rare: 1.8,
  epic: 2.4,
  legendary: 3.2,
  currylicious: 4.2,
};

export type ModType =
  | "click_mult"
  | "flat_click"
  | "crit_chance"
  | "crit_power"
  | "fire_gain"
  | "spin_discount";

export const MOD_TYPES: ModType[] = [
  "click_mult",
  "flat_click",
  "crit_chance",
  "crit_power",
  "fire_gain",
  "spin_discount",
];

// [min, max] at float 0 → 1, before RARITY_SCALE.
export const MOD_RANGE: Record<ModType, [number, number]> = {
  click_mult: [0.02, 0.25],
  flat_click: [1, 40],
  crit_chance: [0.02, 0.2],
  crit_power: [0.05, 0.5],
  fire_gain: [0.05, 0.4],
  spin_discount: [0.01, 0.12],
};

export interface RolledMod {
  type: ModType;
  float: number; // [0,1]
}

export interface RolledIngredient {
  uid: string;
  ingredientId: string;
  rarity: GachaRarity;
  mods: RolledMod[]; // length === MOD_COUNT[rarity], types deduped
  spin: number; // spin index this came from
  at: number; // epoch ms
}

export function modMagnitude(mod: RolledMod, rarity: GachaRarity): number {
  const [min, max] = MOD_RANGE[mod.type];
  return (min + mod.float * (max - min)) * RARITY_SCALE[rarity];
}

// Scale-free power score (rarity scale × float, summed). Comparable across mod
// types, so it drives both inventory overflow and the Combo King badge.
export function rollPower(r: RolledIngredient): number {
  return r.mods.reduce((s, m) => s + RARITY_SCALE[r.rarity] * m.float, 0);
}

const FLOAT_BANDS: [number, string][] = [
  [0.2, "Bland"],
  [0.4, "Simmered"],
  [0.6, "Seasoned"],
  [0.8, "Rich"],
  [1.01, "Sublime"],
];

export function floatBand(f: number): string {
  for (const [ceil, name] of FLOAT_BANDS) if (f < ceil) return name;
  return "Sublime";
}

// --- Rolling -------------------------------------------------------------
// Deliberately unseeded Math.random: seeding buys nothing client-side (the
// player owns the machine) and a known seed enables save-scum rewind. Roll
// integrity lives in sanitizeRoll() on the persist merge path instead.

export function rollRarity(luck = 0): GachaRarity {
  // Luck tilts weight toward the top of the table: weight × (1+luck)^tier.
  const weights = RARITIES.map(
    (r, i) => RARITY_WEIGHT[r] * Math.pow(1 + Math.max(0, luck), i),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    roll -= weights[i];
    if (roll < 0) return demoCap(RARITIES[i]);
  }
  return "common";
}

// Demo gate: the top rarities are full-game only, so a demo roll above the cap
// lands on the cap instead. Inert in the full build. Exported so the trade-up
// can *block* on a capped target instead of silently handing back a downgrade.
export function demoCap(r: GachaRarity): GachaRarity {
  return IS_DEMO && RARITY_ORDER[r] > RARITY_ORDER[DEMO_MAX_RARITY]
    ? DEMO_MAX_RARITY
    : r;
}

function pickMods(count: number): RolledMod[] {
  const pool = [...MOD_TYPES];
  const out: RolledMod[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const [type] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    out.push({ type, float: Math.random() });
  }
  return out;
}

export function spin(spinIndex: number, luck = 0): RolledIngredient {
  const rarity = rollRarity(luck);
  const pool = RARITY_INGREDIENTS[rarity];
  return {
    uid: crypto.randomUUID(),
    ingredientId: pool[Math.floor(Math.random() * pool.length)],
    rarity,
    mods: pickMods(MOD_COUNT[rarity]),
    spin: spinIndex,
    at: Date.now(),
  };
}

// --- Trade-up ------------------------------------------------------------
// Five of a kind become one guaranteed roll of the rarity above. Same roll
// construction as spin(), only the rarity is handed in instead of drawn.

export const COMBINE_COST = 5;

export function nextRarity(r: GachaRarity): GachaRarity | null {
  return RARITIES[RARITY_ORDER[r] + 1] ?? null;
}

export function combineRoll(
  target: GachaRarity,
  spinIndex: number,
): RolledIngredient {
  const rarity = demoCap(target);
  const pool = RARITY_INGREDIENTS[rarity];
  return {
    uid: crypto.randomUUID(),
    ingredientId: pool[Math.floor(Math.random() * pool.length)],
    rarity,
    mods: pickMods(MOD_COUNT[rarity]),
    spin: spinIndex,
    at: Date.now(),
  };
}

// --- Economy -------------------------------------------------------------

export const SPIN_BASE = 2000;
export const SPIN_GROWTH = 1.06; // per spin this week
export const SPIN_PRESTIGE_GROWTH = 1.35; // per completed week

export function spinCost(spinCount: number, prestige = 0, discount = 1): number {
  return Math.round(
    SPIN_BASE *
      Math.pow(SPIN_GROWTH, spinCount) *
      Math.pow(SPIN_PRESTIGE_GROWTH, prestige) *
      discount,
  );
}

export const MAX_INVENTORY = 200;

// Trims an over-full inventory by dropping the weakest unequipped rolls.
// Equipped rolls are never dropped, so the result can exceed MAX_INVENTORY only
// in the impossible case of >200 equipped uids.
export function capInventory(
  inventory: RolledIngredient[],
  equippedUids: string[] = [],
  max = MAX_INVENTORY,
): RolledIngredient[] {
  if (inventory.length <= max) return inventory;
  const equipped = new Set(equippedUids);
  const droppable = inventory
    .filter((r) => !equipped.has(r.uid))
    .sort((a, b) => rollPower(a) - rollPower(b));
  const doomed = new Set(
    droppable.slice(0, inventory.length - max).map((r) => r.uid),
  );
  return inventory.filter((r) => !doomed.has(r.uid));
}

// --- Ingredient partition ------------------------------------------------
// The 60 pantry ingredients split 10 per rarity, ascending from everyday
// staples to the genuinely precious.

export const RARITY_INGREDIENTS: Record<GachaRarity, string[]> = {
  common: [
    "salt",
    "onion",
    "potato",
    "garlic",
    "tomato",
    "turmeric",
    "cumin",
    "coriander_seed",
    "chili",
    "pepper",
  ],
  uncommon: [
    "ginger",
    "yogurt",
    "ghee",
    "chicken",
    "cashew",
    "mustard_seed",
    "curry_leaf",
    "pav",
    "green_chutney",
    "buckwheat",
  ],
  rare: [
    "cardamom",
    "cloves",
    "cinnamon",
    "nutmeg",
    "coconut",
    "paprika",
    "mint",
    "sea_salt",
    "black_salt",
    "naan_crisp",
  ],
  epic: [
    "star_anise",
    "fenugreek",
    "lemongrass",
    "tamarind",
    "garam_masala",
    "shrimp",
    "kokum",
    "jaggery",
    "rose_syrup",
    "kasuri_methi",
  ],
  legendary: [
    "malvani_masala",
    "chaat_masala",
    "seekh_kebab",
    "rose_petals",
    "dried_apricot",
    "white_pepper",
    "yak_butter",
    "juniper_berry",
    "tandoori_paneer",
    "pistachio",
  ],
  currylicious: [
    "saffron",
    "silver_leaf",
    "kewra_water",
    "black_cardamom",
    "timur_pepper",
    "charcoal_smoke",
    "khoya",
    "cardamom_sugar",
    "saffron_milk",
    "lime_leaf",
  ],
};

export const RARITY_OF: Record<string, GachaRarity> = Object.fromEntries(
  RARITIES.flatMap((r) => RARITY_INGREDIENTS[r].map((id) => [id, r])),
);

if (import.meta.env.DEV) {
  const partitioned = Object.keys(RARITY_OF);
  console.assert(
    partitioned.length === INGREDIENT_IDS.length &&
      INGREDIENT_IDS.every((id) => id in RARITY_OF),
    "RARITY_INGREDIENTS must be a permutation of all ingredient ids",
    { partitioned: partitioned.length, pantry: INGREDIENT_IDS.length },
  );
  console.assert(
    RARITIES.every((r, i) => nextRarity(r) === (RARITIES[i + 1] ?? null)) &&
      nextRarity("currylicious") === null,
    "nextRarity must walk RARITIES and dead-end at the top",
  );
}

// --- Persistence guard ---------------------------------------------------

const MOD_TYPE_SET = new Set<string>(MOD_TYPES);

// Validates one persisted roll. A hand-edited float of 9999 would be a huge
// multiplier, so floats are clamped and every structural claim is re-checked.
export function sanitizeRoll(v: unknown): RolledIngredient | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Partial<RolledIngredient>;
  if (typeof r.uid !== "string" || !r.uid) return null;
  if (typeof r.ingredientId !== "string" || !INGREDIENTS[r.ingredientId])
    return null;
  const rarity = r.rarity as GachaRarity;
  if (!(rarity in MOD_COUNT)) return null;
  if (!Array.isArray(r.mods) || r.mods.length !== MOD_COUNT[rarity]) return null;

  const seen = new Set<string>();
  const mods: RolledMod[] = [];
  for (const m of r.mods) {
    if (!m || typeof m !== "object") return null;
    const type = (m as RolledMod).type;
    if (!MOD_TYPE_SET.has(type) || seen.has(type)) return null;
    seen.add(type);
    const f = Number((m as RolledMod).float);
    mods.push({ type, float: Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0 });
  }

  return {
    uid: r.uid,
    ingredientId: r.ingredientId,
    rarity,
    mods,
    spin: Number.isFinite(r.spin) ? Number(r.spin) : 0,
    at: Number.isFinite(r.at) ? Number(r.at) : 0,
  };
}
