# Curry Game Pixel Art — Delivery

32-bit PNGs with transparency, authored at 1× native size. Upscale in-game with
`image-rendering: pixelated` (PIXEL_SCALE 3). 1px ink (`#191c1e`) outline on all
sprites; warm palette built around cream `#fffdf8` / orange `#ff8c00`.

## sprites/ui/ — shop & UI icons, 32×32, centered in cell
- 25 upgrades: `wooden_spoon` `steel_ladle` `golden_ladle` `obsidian_ladle` `diamond_ladle`
  `celestial_ladle` `chefs_knife` `damascus_knife` `legendary_cleaver` `sous_chef`
  `kitchen_brigade` `industrial_pot` `curry_conveyor` `robot_kitchen` `curry_megaworks`
  `delivery_bicycle` `delivery_scooter` `delivery_van` `recipe_slot_4` `recipe_slot_5`
  `cozy_extension` `extra_seating` `dining_hall` `grand_floor` `curry_emporium`
- 45 ingredients: named exactly by ingredient id from `src/engine/ingredients.ts`
  (`chili.png` … `white_pepper.png`)
- 20 decoration shop tiles: `deco_<id>.png` (16×16 scene art blitted at 2×; oversized
  items center-cropped)

## sprites/scene/ — scene sprites, native px, bottom-center anchor
- 20 decorations at spec footprints: `neko` 16×16 … `fountain` 48×48, `elephant` 32×48,
  `herb_garden` 48×24 (full table in manifest.json)
- Core art (drop-in for manifest.ts placeholder SVGs, same geometry):
  - `props.png` — 4×1 @16×16: table, plant, door, window (+ individual `prop_*.png`)
  - `curry.png` — 2×1 @16×16 variants (+ `curry_1/2.png`)
  - `customer.png` — 3×4 @16×16: rows = 4 palette variants; col 0 idle, cols 1–2 walk

## sprites/sheets/ — composed sheets
`ui_upgrades.png` (5×5 @32), `ui_ingredients.png` (9×5 @32), `ui_decorations.png` (5×4 @32),
`scene_decorations.png` (5×4 @48×48 cells, sprites bottom-center anchored in cell).

## sprites/manifest.json
Frame indices, native sizes, and anchors for every sheet — plug into `manifest.ts`
style `SpriteSheet` entries (`{src, frameW, frameH, columns, rows}`).

`qa/` holds 2× contact sheets for review; `sprites/_helpers.js` is the generator
helper (safe to delete).
