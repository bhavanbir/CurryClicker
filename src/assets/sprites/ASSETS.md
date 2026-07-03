# Scene sprite assets

The restaurant scene renders pixel-art sprite sheets through
`src/scene/manifest.ts`. The sheets currently shipped here are **placeholder
SVGs** drawn on a 16×16 grid so the scene runs with zero downloads. They are
deliberately format-compatible with real raster sprite sheets — switching to
final art is a drop-in.

## Final art: Kenney (CC0)

We target [Kenney](https://kenney.nl) packs because they are **CC0 (public
domain)** — no attribution, fully safe for the commercial/IAP build.

| Need                     | Kenney pack                          | Notes                          |
| ------------------------ | ------------------------------------ | ------------------------------ |
| Floor / wall / interior  | **Tiny Town**, **RPG Urban Pack**    | 16×16 top-down tiles           |
| Tables / food / props    | **Tiny Town**, **Roguelike/RPG Pack**| 16×16                          |
| Customers (animated)     | **Toon Characters 1**                | side/front-view walk + idle    |

All are at <https://kenney.nl/assets> and license as CC0.

## How to swap a placeholder for real art

1. Drop the pack's PNG sheet into this folder (e.g. `tiny-town.png`).
2. In `src/scene/manifest.ts`, repoint the `import …Url from "..."` line.
3. Update that sheet's `SpriteSheet` descriptor to match the pack:
   - `frameW` / `frameH` — the pack's tile size (Kenney 16×16 packs → 16).
   - `columns` / `rows` — the sheet's grid dimensions.
4. Update the `frames: [...]` indices in the `PROP` / `CHEF_ANIM` /
   `CUSTOMER_ANIM` entries to the cells you want (row-major:
   `index = row * columns + col`).

No component code changes — `Sprite.tsx` is format- and size-agnostic.

## Placeholder sheet layouts (current)

- `props.svg` — 4×1 @16px: `[0]` table, `[1]` plant, `[2]` door, `[3]` window.
- `curry.svg` — 2×1 @16px: `[0]` red curry bowl, `[1]` yellow curry + rice.
- `customer.svg` — 3×4 @16px: 4 rows = palette variants (skin/hair/outfit),
  columns per row = `[idle, walk-A, walk-B]`. Frame index = `row * 3 + col`;
  use `customerAnim(variant)` from `manifest.ts` rather than raw indices.
  The SVG defines the frames once and re-tints each row via CSS custom
  properties on the row `<g>` — a real PNG sheet just needs the same 3×4 grid.
