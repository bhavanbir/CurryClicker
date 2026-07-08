# Curry Clicker — Artist Sprite Spec (every sprite currently in the game)

Global conventions (see `SPRITESHEETS.md`):

- Author at **1×**, transparent 32-bit PNG, no padding.
- Scene sprites sit on a **16×16 px tile base** and render at `PIXEL_SCALE = 3`
  with `image-rendering: pixelated`, ground-anchored bottom-center.
- UI icons are **32×32 px at 1×**, centered with ~2 px breathing room, no
  ground anchor.
- All scene sheets below are **placeholders** awaiting final art (per
  `src/assets/sprites/ASSETS.md`); the UI icons are shipping art.

---

## 1. UI icons — `src/assets/icons/*.png` (92 files, 32×32 px each)

Auto-discovered by `src/components/PixelIcon.tsx`; filename = game id. A
missing PNG falls back to a Material Symbols glyph, so files can land in any
order.

### Ingredient icons (~50) — shown in recipe slots, kitchen, shop, chef's special

| File | Depicts |
| --- | --- |
| `cardamom.png` | Green cardamom pods |
| `cashew.png` | Cashew nuts |
| `chaat_masala.png` | Chaat masala spice tin/heap |
| `chicken.png` | Raw chicken piece |
| `chili.png` | Red chili pepper |
| `cinnamon.png` | Cinnamon sticks |
| `cloves.png` | Whole cloves |
| `coconut.png` | Halved coconut |
| `coriander_seed.png` | Coriander seeds |
| `cumin.png` | Cumin seeds |
| `curry_leaf.png` | Curry leaf sprig |
| `dried_apricot.png` | Dried apricots |
| `fenugreek.png` | Fenugreek seeds/leaves |
| `garam_masala.png` | Garam masala blend |
| `garlic.png` | Garlic bulb + clove |
| `ghee.png` | Ghee jar/pat |
| `ginger.png` | Ginger root |
| `green_chutney.png` | Bowl of green chutney |
| `jaggery.png` | Jaggery block |
| `kewra_water.png` | Kewra essence bottle |
| `kokum.png` | Dried kokum rinds |
| `lemongrass.png` | Lemongrass stalks |
| `lime_leaf.png` | Kaffir lime leaves |
| `malvani_masala.png` | Malvani spice blend |
| `mint.png` | Mint leaves |
| `mustard_seed.png` | Mustard seeds |
| `nutmeg.png` | Nutmeg (whole + grated) |
| `onion.png` | Onion |
| `paprika.png` | Paprika powder/pepper |
| `pav.png` | Pav bread roll |
| `pepper.png` | Black peppercorns |
| `potato.png` | Potato |
| `rose_petals.png` | Dried rose petals |
| `saffron.png` | Saffron threads |
| `salt.png` | Salt heap/shaker |
| `sea_salt.png` | Sea salt crystals |
| `seekh_kebab.png` | Seekh kebab skewer |
| `shrimp.png` | Shrimp |
| `silver_leaf.png` | Edible silver leaf (vark) |
| `star_anise.png` | Star anise pod |
| `tamarind.png` | Tamarind pod/pulp |
| `tomato.png` | Tomato |
| `turmeric.png` | Turmeric root/powder |
| `white_pepper.png` | White peppercorns |
| `yogurt.png` | Yogurt bowl |

### Décor shop-tile icons (`deco_*`, 20) — shop Decor tab

32×32 UI versions of the scene décor (see section 3 for the matching scene
sprites): `deco_arcade`, `deco_auto_ladle`, `deco_chandelier`,
`deco_copper_pots`, `deco_elephant`, `deco_fountain`, `deco_golden_spatula`,
`deco_herb_garden`, `deco_jukebox`, `deco_koi_tank`, `deco_masala_dabba`,
`deco_neko`, `deco_neon_sign`, `deco_pepper_mill`, `deco_rangoli`,
`deco_shrine`, `deco_spice_rack`, `deco_tandoor`, `deco_tulsi`,
`deco_wind_chimes`.

### Upgrade / tool icons (27) — shop Upgrades tab, franchise

| Group | Files |
| --- | --- |
| Ladle tiers | `wooden_spoon`, `steel_ladle`, `golden_ladle`, `obsidian_ladle`, `diamond_ladle`, `celestial_ladle` |
| Knife tiers | `chefs_knife`, `damascus_knife`, `legendary_cleaver` |
| Kitchen crew | `sous_chef`, `kitchen_brigade`, `industrial_pot`, `curry_conveyor`, `robot_kitchen`, `curry_megaworks` |
| Delivery | `delivery_bicycle`, `delivery_scooter`, `delivery_van` |
| Slots / expansion | `recipe_slot_4`, `recipe_slot_5`, `extra_seating`, `cozy_extension`, `dining_hall`, `grand_floor`, `curry_emporium` |

---

## 2. Scene sprite sheets — `src/assets/sprites/scene/` (16×16 frames, PIXEL_SCALE 3)

Wired through `src/scene/manifest.ts`. Frame index is row-major
(`index = row * columns + col`).

| Sheet | Grid | Frames |
| --- | --- | --- |
| `props.png` | 4×1 @16×16 (64×16 total) | `[0]` table, `[1]` plant, `[2]` door, `[3]` window |
| `curry.png` | 2×1 @16×16 (32×16 total) | `[0]` red curry bowl, `[1]` yellow curry + rice — pile up on the counter |
| `customer.png` | 3 cols × 4 rows @16×16 (48×64 total) | 4 rows = palette variants (skin/hair/outfit recolors of one body); columns per row = `[idle/seated, walk-A, walk-B]`; walk = 2 frames @6 fps; picked per diner by `id % 4` |

Legacy/unreferenced variants also in the folder (safe to ignore or delete):
`curry_1.png`, `curry_2.png`, `prop_door.png`, `prop_plant.png`,
`prop_table.png`, `prop_window.png`.

---

## 3. Décor scene sprites — `src/assets/sprites/scene/*.png`

Single-sprite PNGs placed on the restaurant walls/floor. Native sizes from
`src/scene/decorSprites.ts`; rendered ×2 × slot scale, bottom-center anchored.

| File | Decoration | Native size (px) |
| --- | --- | --- |
| `neko.png` | Lucky cat | 16×16 |
| `tulsi.png` | Potted tulsi | 16×16 |
| `masala_dabba.png` | Masala dabba | 16×16 |
| `neon_sign.png` | Neon sign | 32×16 |
| `copper_pots.png` | Copper pots | 32×16 |
| `spice_rack.png` | Spice rack | 32×24 |
| `tandoor.png` | Tandoor oven | 32×24 |
| `shrine.png` | Shrine | 32×24 |
| `auto_ladle.png` | Auto ladle | 32×24 |
| `rangoli.png` | Rangoli | 32×24 |
| `koi_tank.png` | Koi tank | 32×24 |
| `golden_spatula.png` | Golden spatula | 16×32 |
| `arcade.png` | Arcade cabinet | 16×32 |
| `wind_chimes.png` | Wind chimes | 16×32 |
| `jukebox.png` | Jukebox | 16×32 |
| `pepper_mill.png` | Pepper mill | 16×32 |
| `chandelier.png` | Chandelier | 32×32 |
| `fountain.png` | Fountain | 48×48 |
| `elephant.png` | Elephant statue | 32×48 |
| `herb_garden.png` | Rooftop herb garden | 48×24 |

---

## 4. Logos & app art

| File | Use | Notes |
| --- | --- | --- |
| `src/assets/logo.png` | Full logo | pixel art |
| `src/assets/logo_chili.png` | Top bar brand mark + favicon | rendered 32×32, pixelated |
| `build/icon.png` | Electron/Steam app icon | 256×256+ recommended |

---

## 5. Not sprites (drawn in CSS/code today)

For awareness — these have no image file; they're candidates in
`remaining_sprites_spec.md`:

- Restaurant backdrop (wall + floor + counter) — CSS gradients
  (`src/scene/SceneBackdrop.tsx`, `src/scene/Counter.tsx`), recolored per skin.
- OPEN/CLOSED sign — a text `<div>` in `src/scene/RestaurantScene.tsx`.
- Customer mood bubbles — Material Symbols glyphs, not art.
