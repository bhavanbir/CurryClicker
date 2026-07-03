// Decoration mount points around the room — the back wall plus the left and
// right side walls. Each slot is an explicit screen-space anchor (%, with a
// depth scale) so décor hangs nicely along the perimeter instead of on a rigid
// grid. A Placement's `col` is an index into WALL_SLOTS (`row` is unused).

export interface WallSlot {
  xPct: number;
  yPct: number;
  scale: number;
}

export const WALL_SLOTS: WallSlot[] = [
  // back wall — an even row near the top (indices 0–5)
  { xPct: 30, yPct: 16, scale: 0.8 },
  { xPct: 38, yPct: 16, scale: 0.8 },
  { xPct: 46, yPct: 16, scale: 0.8 },
  { xPct: 54, yPct: 16, scale: 0.8 },
  { xPct: 62, yPct: 16, scale: 0.8 },
  { xPct: 70, yPct: 16, scale: 0.8 },
  // left side wall — receding toward the camera, growing (indices 6–10)
  { xPct: 22, yPct: 36, scale: 0.68 },
  { xPct: 17, yPct: 44, scale: 0.76 },
  { xPct: 12, yPct: 52, scale: 0.84 },
  { xPct: 8, yPct: 58, scale: 0.92 },
  { xPct: 4, yPct: 64, scale: 1.0 },
  // right side wall — mirror (indices 11–15)
  { xPct: 78, yPct: 36, scale: 0.68 },
  { xPct: 83, yPct: 44, scale: 0.76 },
  { xPct: 88, yPct: 52, scale: 0.84 },
  { xPct: 92, yPct: 58, scale: 0.92 },
  { xPct: 96, yPct: 64, scale: 1.0 },
];

// Fill order for auto-placement: back wall first, then alternate left/right.
export const WALL_PLACE_ORDER = [
  0, 1, 2, 3, 4, 5, 6, 11, 7, 12, 8, 13, 9, 14, 10, 15,
];
