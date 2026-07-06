import { INGREDIENT_LIST } from "./ingredients";
import { IS_DEMO, DEMO_LOCKED_INGREDIENT_SET } from "../target";
import type { Ingredient } from "../types";

// Collection sets for the Affinity Journal: know N pairs whose BOTH ingredients
// belong to the set's pool. Progress is fully derived from discoveredAffinities;
// only claims are persisted (weekly). Targets clamp to the pool size so the
// demo (fewer unlocked ingredients) stays completable.

export interface CollectionSet {
  id: string;
  name: string;
  icon: string;
  ids: Set<string>; // pool: both pair members must be in here
  target: number; // pairs needed
}

function pool(pred: (i: Ingredient) => boolean): Set<string> {
  return new Set(
    INGREDIENT_LIST.filter(
      (i) => pred(i) && !(IS_DEMO && DEMO_LOCKED_INGREDIENT_SET.has(i.id)),
    ).map((i) => i.id),
  );
}

const clamp = (want: number, p: Set<string>) =>
  Math.min(want, (p.size * (p.size - 1)) / 2);

function build(): CollectionSet[] {
  const spice = pool((i) => i.category === "spice");
  const veg = pool((i) => i.category === "vegetable");
  const protein = pool((i) => i.category === "protein");
  const all = pool(() => true);
  // ponytail: no dairy/herb sets — base pools of 3-4 are too thin to be a hunt
  return [
    { id: "set_spice", name: "Spice Cabinet", icon: "local_fire_department", ids: spice, target: clamp(10, spice) },
    { id: "set_veg", name: "Produce Aisle", icon: "nutrition", ids: veg, target: clamp(10, veg) },
    { id: "set_protein", name: "Protein Counter", icon: "set_meal", ids: protein, target: clamp(6, protein) },
    { id: "set_scholar", name: "Journal Scholar", icon: "menu_book", ids: all, target: 30 },
  ];
}

export const COLLECTION_SETS: CollectionSet[] = build();
export const COLLECTION_SET_MAP: Record<string, CollectionSet> =
  Object.fromEntries(COLLECTION_SETS.map((c) => [c.id, c]));

export function setProgress(
  cs: CollectionSet,
  discovered: Record<string, number>,
): number {
  let n = 0;
  for (const key of Object.keys(discovered)) {
    const [a, b] = key.split("|");
    if (cs.ids.has(a) && cs.ids.has(b)) n++;
  }
  return Math.min(n, cs.target);
}
