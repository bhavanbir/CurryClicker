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
}

// Two back-row tables + three front-row tables, staggered so none fully
// occludes another.
export const TABLES: TableSpot[] = [
  { u: 0.34, v: 0.30, seats: [{ du: -0.07, dv: 0 }, { du: 0.07, dv: 0 }] },
  { u: 0.66, v: 0.30, seats: [{ du: -0.07, dv: 0 }, { du: 0.07, dv: 0 }] },
  { u: 0.2, v: 0.6, seats: [{ du: -0.08, dv: 0.02 }, { du: 0.08, dv: 0.02 }] },
  { u: 0.5, v: 0.62, seats: [{ du: -0.08, dv: 0.02 }, { du: 0.08, dv: 0.02 }] },
  { u: 0.82, v: 0.6, seats: [{ du: -0.08, dv: 0.02 }, { du: 0.08, dv: 0.02 }] },
];

// Corner plants on the floor.
export const PLANTS: { u: number; v: number }[] = [
  { u: 0.05, v: 0.46 },
  { u: 0.96, v: 0.52 },
];

// Back-wall structure.
export const DOOR = { u: 0.5, heightPct: 0 };
export const WINDOWS: { u: number; heightPct: number }[] = [
  { u: 0.18, heightPct: 0.5 },
  { u: 0.82, heightPct: 0.5 },
];

// Where the chef stands behind the counter, and where served-dish pops appear.
export const CHEF_SPOT = { u: 0.5, v: 0.84 };
