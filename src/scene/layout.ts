// Fixed furniture + structure placement for the restaurant room, in normalized
// floor coords (u: left→right, v: back→front). Tables carry seat offsets so
// Phase 2 customers can sit around them. Wall items use (u, heightPct) where
// heightPct is 0 at the floor line and 1 at the top of the back wall.

export interface Seat {
  /** offset from the table center, in u/v units */
  du: number;
  dv: number;
}

export interface TableSpot {
  u: number;
  v: number;
  seats: Seat[];
  minLevel: number; // appears once Restaurant Expansion reaches this level (0 = base)
}

const pair = (du = 0.06, dv = 0): Seat[] => [
  { du: -du, dv },
  { du, dv },
];

const tbl = (u: number, v: number, minLevel: number, dv = 0): TableSpot => ({
  u,
  v,
  seats: pair(0.06, dv),
  minLevel,
});

// A clean, evenly spaced dining room laid out on 3 rows (back / mid / front) and
// 5 columns. The base room shows 5 tables; each Restaurant Expansion level adds
// a symmetric pair (a centre table arrives last), so the room fills out neatly.
export const ALL_TABLES: TableSpot[] = [
  // base room (level 0): 2 back + 3 front
  tbl(0.35, 0.33, 0),
  tbl(0.65, 0.33, 0),
  tbl(0.2, 0.67, 0, 0.02),
  tbl(0.5, 0.67, 0, 0.02),
  tbl(0.8, 0.67, 0, 0.02),
  // level 1 (+2): inner mid pair
  tbl(0.35, 0.5, 1),
  tbl(0.65, 0.5, 1),
  // level 2 (+2): outer mid pair
  tbl(0.2, 0.5, 2),
  tbl(0.8, 0.5, 2),
  // level 3 (+2): outer back pair
  tbl(0.2, 0.33, 3),
  tbl(0.8, 0.33, 3),
  // level 4 (+2): inner front pair
  tbl(0.35, 0.67, 4, 0.02),
  tbl(0.65, 0.67, 4, 0.02),
  // level 5 (+2): centre mid + centre back
  tbl(0.5, 0.5, 5),
  tbl(0.5, 0.33, 5),
];

// Base tables only — the default room when no expansion is owned.
export const TABLES: TableSpot[] = ALL_TABLES.filter((t) => t.minLevel === 0);

/** Tables visible at a given expansion level (0–5). */
export function tablesForLevel(level: number): TableSpot[] {
  return ALL_TABLES.filter((t) => t.minLevel <= level);
}

/** Absolute (u,v) seat coordinates for every table visible at a level. */
export function seatsForLevel(level: number): { u: number; v: number }[] {
  return tablesForLevel(level).flatMap((t) =>
    t.seats.map((s) => ({ u: t.u + s.du, v: t.v + s.dv })),
  );
}

// Corner plants on the floor.
export const PLANTS: { u: number; v: number }[] = [
  { u: 0.05, v: 0.46 },
  { u: 0.96, v: 0.52 },
];

// Back-wall structure.
export const DOOR = { u: 0.5, heightPct: 0 };
// Windows retuned to heightPct 0.55 (sill lower) now they're a 32×32 diorama.
export const WINDOWS: { u: number; heightPct: number }[] = [
  { u: 0.18, heightPct: 0.55 },
  { u: 0.82, heightPct: 0.55 },
];

// Fixed interior fixtures. Keys index manifest FIXTURE. Wall pieces use
// (u, heightPct); the entry mat is the one floor fixture (u, v via project).
export const FIXTURES = [
  // Ceiling pieces sit lower than the spec's first pass: sprites are
  // bottom-anchored, so a too-high heightPct pushes the art above the frame.
  { key: "ceilingFan", u: 0.33, heightPct: 0.6 },
  { key: "ceilingFan", u: 0.67, heightPct: 0.6 },
  { key: "pendantLamp", u: 0.44, heightPct: 0.62 },
  { key: "pendantLamp", u: 0.56, heightPct: 0.62 },
  { key: "wallClock", u: 0.72, heightPct: 0.65 },
  { key: "windowValance", u: 0.18, heightPct: 0.72 },
  { key: "windowValance", u: 0.82, heightPct: 0.72 },
  { key: "menuBoard", u: 0.33, heightPct: 0.14 },
  { key: "tumblerShelf", u: 0.67, heightPct: 0.14 },
  { key: "familyPhotos", u: 0.5, heightPct: 0.2 },
] as const;
export const FLOOR_FIXTURES = [{ key: "entryMat", u: 0.5, v: 0.06 }] as const;

// Where the chef stands behind the counter, and where served-dish pops appear.
export const CHEF_SPOT = { u: 0.5, v: 0.84 };
