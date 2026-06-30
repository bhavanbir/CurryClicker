// Pseudo-perspective projection for the POV-from-the-counter restaurant scene.
//
// The room is modelled in normalized floor coordinates:
//   u ∈ [0,1]  left → right
//   v ∈ [0,1]  back wall (far) → counter (near / camera)
//
// project() maps (u,v) onto the scene rectangle as a trapezoid: the floor is
// narrow at the back wall and widens toward the foreground, and things near the
// camera (v→1) sit lower on screen, are larger, and overlap things behind them.
// All outputs are percentages (0–100) so consumers can drop them straight into
// CSS `left`/`top`, plus a `scale` and integer `z` for stacking.

export interface Projected {
  /** horizontal position, % of scene width */
  xPct: number;
  /** vertical position of the sprite's ground point, % of scene height */
  yPct: number;
  /** size multiplier — farther = smaller */
  scale: number;
  /** stacking order — nearer = higher */
  z: number;
}

// --- Room tuning. Fractions of the scene rectangle. ---------------------------

// Vertical band the dining floor occupies. Above FLOOR_TOP_PCT is the back wall;
// below FLOOR_BOTTOM_PCT is the foreground counter surface.
export const FLOOR_TOP_PCT = 40; // back wall meets floor
const FLOOR_BOTTOM_PCT = 70; // front edge of floor (back edge of the counter)

// Floor width at the back wall (narrow) and at the front (wide). % of width.
export const BACK_LEFT_PCT = 26;
export const BACK_RIGHT_PCT = 74;
const FRONT_LEFT_PCT = -4;
const FRONT_RIGHT_PCT = 104;

// Sprite scale at the back wall vs. at the counter.
const BACK_SCALE = 0.62;
const FRONT_SCALE = 1.18;

// Foreshortening: bias screen-Y toward the back so far rows bunch up like a real
// floor receding to a horizon. 0 = linear, higher = more compression at the back.
const FORESHORTEN = 0.55;

export const WALL_TOP_PCT = 0;
export const WALL_BOTTOM_PCT = FLOOR_TOP_PCT;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Apply foreshortening easing to the depth parameter for vertical placement. */
function depthEase(v: number): number {
  // ease-in: small v (far) changes slowly, large v (near) changes fast.
  return v + (v * v - v) * FORESHORTEN;
}

/** Project a normalized floor coordinate to the scene rectangle. */
export function project(u: number, v: number): Projected {
  const t = clamp01(v);
  const uu = clamp01(u);
  const ty = depthEase(t);

  const left = lerp(BACK_LEFT_PCT, FRONT_LEFT_PCT, t);
  const right = lerp(BACK_RIGHT_PCT, FRONT_RIGHT_PCT, t);

  return {
    xPct: lerp(left, right, uu),
    yPct: lerp(FLOOR_TOP_PCT, FLOOR_BOTTOM_PCT, ty),
    scale: lerp(BACK_SCALE, FRONT_SCALE, t),
    z: Math.round(t * 1000),
  };
}

/** Project a point on the back wall (v is ignored; uses a wall height band). */
export function projectWall(u: number, heightPct: number): Projected {
  return {
    xPct: lerp(BACK_LEFT_PCT, BACK_RIGHT_PCT, clamp01(u)),
    yPct: lerp(WALL_BOTTOM_PCT, WALL_TOP_PCT, clamp01(heightPct)),
    scale: BACK_SCALE,
    z: 0,
  };
}

/** CSS clip-path polygon (in scene-rect %) tracing the four floor corners. */
export function floorClipPath(): string {
  const corners = [project(0, 0), project(1, 0), project(1, 1), project(0, 1)];
  return `polygon(${corners.map((c) => `${c.xPct}% ${c.yPct}%`).join(", ")})`;
}

// --- Floor grid (used later for seating + décor snapping) ---------------------

export const GRID_COLS = 8;
export const GRID_ROWS = 5;

/** Center (u,v) of a floor grid cell. */
export function cellToUV(col: number, row: number): { u: number; v: number } {
  return {
    u: (col + 0.5) / GRID_COLS,
    v: (row + 0.5) / GRID_ROWS,
  };
}

/** Nearest grid cell to a normalized floor coordinate. */
export function uvToCell(u: number, v: number): { col: number; row: number } {
  return {
    col: clamp(Math.floor(clamp01(u) * GRID_COLS), 0, GRID_COLS - 1),
    row: clamp(Math.floor(clamp01(v) * GRID_ROWS), 0, GRID_ROWS - 1),
  };
}

/** Project the center of a floor grid cell. */
export function projectCell(col: number, row: number): Projected {
  const { u, v } = cellToUV(col, row);
  return project(u, v);
}

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
