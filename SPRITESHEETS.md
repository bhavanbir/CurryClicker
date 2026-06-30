# Curry Clicker — Sprite Sheet Specs

Resolution and layout guide for hand-authored pixel art in the restaurant scene.
If you follow these, your sheets drop straight into `src/scene/manifest.ts` with
no component changes.

## The one rule that makes everything fit

Everything is built on a **16×16 px tile** and rendered through `Sprite.tsx` at
`PIXEL_SCALE = 3` (see `src/scene/manifest.ts`), so **1 source pixel = 3 screen
pixels**. A 16×16 tile shows up at 48×48 on screen, before perspective scaling.

- **Author at 1× (native pixel-art resolution).** Do *not* pre-scale your art —
  the engine upscales it with `image-rendering: pixelated`, so chunky pixels stay
  crisp. A 16×16 tile should be a literal 16×16 PNG.
- **Keep every dimension a multiple of 16** (or 8 at the smallest). This keeps
  sprites sharing the floor grid and counter slots.
- **Transparent background** (32-bit PNG with alpha). No baked-in shadows unless
  you want them rendered at full opacity always.
- **Uniform cells, row-major.** Every frame in a sheet is the same size, packed
  left→right then top→bottom, no padding between cells. Frame index =
  `row * columns + col`.
- **Ground-anchored.** Sprites are pinned to their parent's **bottom-center**.
  Draw each character/prop standing on the *bottom edge* of its cell, horizontally
  centered, or it will float or sink.

The scene viewport is full-width and ~240–380 px tall (≈16:9 → 2:1).

---

## Resolutions by asset type

| Asset | Source cell (1×) | Sheet layout | On-screen (×3) | Notes |
| --- | --- | --- | --- | --- |
| **Main store (backdrop)** | **320×180** whole scene | single image (not a grid) | fills viewport | 16:9 base; see below |
| **Customers** | **16×32** (1×2 tiles) | columns × rows | 48×96 | standing figure, head→feet |
| **Curry bowls** | **16×16** | N×1 strip | 48×48 | one per counter slot |
| **Decorations** | **16×16 → 48×48** (multiples of 16) | one cell per décor, or one strip | 48–144 px | size = footprint on floor grid |

### 1. Main store (the backdrop)

This is the room itself — back wall, windows/door, floor, and the counter
surface you look out over. It is one large background image scaled to cover the
scene rect, **not** run through the tile animator.

- **Author at `320×180`** (classic low-res 16:9). That's a 20×11.25 tile field,
  so if you want it to land exactly on the 16-grid use **`320×192`** (20×12
  tiles).
- Export at 1× and let CSS scale it, **or** pre-export at ×3 (`960×540` /
  `960×576`) if you'd rather control the upscale yourself — either works as long
  as you set `image-rendering: pixelated`.
- Match these regions baked into `projection.ts` so sprites line up with the
  painted room:
  - **Back wall:** top 0–40% of the scene height (`FLOOR_TOP_PCT = 40`).
  - **Dining floor:** 40%–70% (a trapezoid: ~26%–74% wide at the back,
    widening to the full width up front).
  - **Counter / foreground:** bottom 70%–100%.
- Tip: you can split this into layered sheets later (wall / floor / counter) on
  the same 320-wide canvas if you want parallax or a swappable floor.

### 2. Customers

- **`16×32` per frame** (one tile wide, two tall) — enough room for a standing
  character from head to feet. If you want chunkier characters go `24×48`, but
  keep width:height ≈ 1:2 and stay on multiples of 8.
- Suggested frames (match these to the `CUSTOMER_ANIM` entries in the manifest):
  - `idle / seated` — 1 frame
  - `walk` — 2–4 frames (current code expects 2: walk-A, walk-B)
  - optional `eat` — 2 frames
- Lay them out as a single row (e.g. **`16×32`, 4 columns × 1 row** = a
  `64×32` sheet) or a grid if you add more states. Feet on the bottom edge,
  centered. Face **right** by default — the engine mirrors with `flip` to face
  left.

### 3. Curry bowls

- **`16×16` per bowl.** These pile into the counter's fixed slot grid
  (`COUNTER_CAPACITY = 10`), so they must read clearly at a single small tile.
- Make a horizontal strip of variants — **`16×16`, N columns × 1 row**
  (currently 2: red curry, yellow curry + rice). A `32×16` sheet = 2 variants,
  `48×16` = 3, etc. Add more cells to expand `CURRY_VARIANTS`.
- Draw the bowl resting on the bottom edge so it sits *on* the counter.

### 4. Decorations

Décor is player-placed and snaps to the floor grid (8 cols × 5 rows), so its
**source size = how much floor it occupies.** Pick from a small set of footprints:

| Footprint | Source size | On-screen (×3) | Examples |
| --- | --- | --- | --- |
| Small | `16×16` | 48×48 | small plant, stool, sign |
| Tall | `16×32` | 48×96 | floor lamp, tall plant, coat rack |
| Medium | `32×24` | 96×72 | table, booth, counter unit |
| Large | `48×48` | 144×144 | statue, big planter, divider |

- Stay on **multiples of 16**; cap the largest footprint at `48×48` so a décor
  item never swallows more than ~1 grid cell of width.
- One décor per cell, or pack a catalog as a uniform-cell sheet (e.g. all
  `16×16` items in a `16×16`, 8×N grid). If you mix footprints, use **separate
  sheets per footprint size** — a sheet's `frameW/frameH` is one fixed cell size.
- Ground-anchor on the bottom-center; the projection scales décor by depth
  automatically (smaller at the back wall, larger near the counter).

---

## Wiring a finished sheet in

1. Drop the PNG in `src/assets/sprites/` (replaces the placeholder SVGs).
2. In `src/scene/manifest.ts`, repoint the `import …Url` line to your file.
3. Set that sheet's `SpriteSheet` descriptor: `frameW`, `frameH`, `columns`,
   `rows` to match your grid.
4. Set the `frames: [...]` indices on each `PROP` / `CURRY_VARIANTS` /
   `CUSTOMER_ANIM` entry (row-major: `index = row * columns + col`).

No changes to `Sprite.tsx` — it's size- and format-agnostic. See
`src/assets/sprites/ASSETS.md` for the swap procedure in more detail.

## Quick reference

```
Tile base ............. 16×16 px, rendered ×3 (PIXEL_SCALE)
Backdrop .............. 320×180 (or 320×192 for exact tiles)
Customer .............. 16×32 per frame, single-row strip
Curry bowl ............ 16×16 per variant, single-row strip
Decoration ............ 16×16 / 16×32 / 32×24 / 48×48 (multiples of 16)
Format ................ transparent PNG, no inter-cell padding
Anchor ................ bottom-center, feet/base on the bottom edge
Default facing ........ right (engine mirrors for left)
```
