# Curry Clicker — New Sprite Specs (v0.4)

Specs for the art added in the v0.4 update: 15 new ingredient icons and the
redesigned counter backdrop from `newCounterConcept.png`. Everything follows
the conventions in `SPRITESHEETS.md` (16×16 px tile base, `PIXEL_SCALE = 3`,
author at 1×, transparent 32-bit PNG, `image-rendering: pixelated`).

---

## 1. New ingredient icons (15)

One PNG per ingredient, **32×32 px at 1×**, transparent background — the same
convention as the existing per-ingredient icons in `src/assets/icons/`. Drop
each file in `src/assets/icons/<id>.png`; `PixelIcon` auto-discovers them via
`import.meta.glob`, **no code change needed**. Until a PNG lands, the Material
Symbols glyph renders as a fallback.

Center the subject in the cell with ~2 px breathing room; these are UI icons,
not scene sprites, so no ground anchor.

### Himalayan Set (`set_himalayan`)

| File | Subject | Art direction |
| --- | --- | --- |
| `yak_butter.png` | Yak Butter | Pale-gold butter pat in a rustic wooden churn bowl; creamy amber highlights |
| `black_cardamom.png` | Black Cardamom | Large dark wrinkled pod, near-black with deep brown ridges, faint smoke wisp |
| `timur_pepper.png` | Timur Pepper | Cluster of small rose-brown berries on a twig, one split open |
| `buckwheat.png` | Buckwheat | Small heap of grey-brown triangular groats, a few scattered grains |
| `juniper_berry.png` | Juniper Berry | 3–4 dusty indigo-blue berries with a tiny pine sprig |

### Tandoor Set (`set_tandoor`)

| File | Subject | Art direction |
| --- | --- | --- |
| `charcoal_smoke.png` | Charcoal Smoke | Glowing orange-cored coal in a small steel bowl, grey smoke curl above |
| `naan_crisp.png` | Naan Crisp | Golden teardrop flatbread with dark blister spots, one shard broken off |
| `kasuri_methi.png` | Kasuri Methi | Crumbled dried green leaves falling from a pinched hand-height pile |
| `black_salt.png` | Black Salt | Chunky pink-purple crystal block with smaller crumbs, subtle violet tint |
| `tandoori_paneer.png` | Tandoori Paneer | Two orange-charred white cubes on a short skewer, char marks on edges |

### Mithai Set (`set_mithai`)

| File | Subject | Art direction |
| --- | --- | --- |
| `khoya.png` | Khoya | Soft off-white milk-solid mound on a small plate, dense and matte |
| `pistachio.png` | Pistachio | Half-open beige shell revealing a bright green kernel, second kernel beside |
| `rose_syrup.png` | Rose Syrup | Small glass bottle of ruby-red syrup with a drip on the neck |
| `cardamom_sugar.png` | Cardamom Sugar | Sparkling pale-green sugar heap with two tiny green pods on top |
| `saffron_milk.png` | Saffron Milk | Golden milk in a steel tumbler, 2–3 red saffron threads floating |

---

## 2. New counter backdrop (from `newCounterConcept.png`)

The concept replaces the current backdrop with a shop viewed from behind a
big wooden service counter: cream wall, dining floor with stools/tables, and a
foreground counter whose face is four open shelf bays stocked with jars,
bottles, cookware, and plates.

### Canvas

- **320×192 px at 1×** (20×12 tiles — the exact-grid variant from
  `SPRITESHEETS.md`). Export at 1× and let CSS upscale, or pre-export ×3
  (960×576).
- Single flat image, not a tile-animator sheet. Drop in
  `src/assets/sprites/scene/` and repoint the backdrop import in
  `src/scene/manifest.ts`.

### Region layout (must match `projection.ts`)

| Region | Rows (of 192 px) | Content from concept |
| --- | --- | --- |
| Back wall | 0–77 (top 40%) | Warm cream plaster; two 16×16 four-pane windows; 16×16 cat-face wall plaques; small 16×24 wall cabinet |
| Dining floor | 77–134 (40–70%) | Tan floorboards as a widening trapezoid (~26%→74% wide at back, full width at front); leave clear — stools/tables/customers are placed sprites, not baked in |
| Counter | 134–192 (bottom 30%) | Dark wood countertop lip (~8 px band) over the shelf-bay face |

### The shelf-bay counter face (the signature element)

Four bays across the 320 px width, each bay ≈ 72×48 px with 8 px wood posts
between and at both ends. Each bay has two shelves (two rows of ~20 px):

| Bay | Top shelf | Bottom shelf |
| --- | --- | --- |
| 1 | Cream/amber storage jars (5) | Plate stack, black pot, two brown crocks |
| 2 | Red/green/amber sauce bottles (7) | Small spice jars in mixed colors (7) |
| 3 | Grey mixing bowl, measuring jug, mustard + ketchup squeeze bottles | Black handled pot, steel bowl, wooden mortar & pestle |
| 4 | Cream/brown jars (5) | Yellow-label spice shakers (3), stacked dark plates (2 piles) |

Jars/bottles are 6–10 px wide each; keep silhouettes readable at 1× — one
highlight pixel per vessel, no dithering.

### Elements that stay OUT of the backdrop

Baked-in art can't react to game state, so these ship separately:

- **CLOSED/OPEN sign** — separate sprite strip, **32×16 per frame, 2 columns ×
  1 row** (64×16 sheet): frame 0 = yellow "CLOSED" lozenge, frame 1 = green
  "OPEN". Swaps with `dayStarted`. Hangs top-center of the back wall.
- **Potted trees (left/right edges)** — 16×32 decoration sprites
  (tall-footprint per `SPRITESHEETS.md`), ground-anchored bottom-center, so
  they scale with depth and can become buyable décor later.
- **Stools / small tables** — already covered by the existing 16×16 /
  32×24 décor footprints; the concept's layout is a decoration arrangement,
  not backdrop art.
- **DECORATE button** — UI chrome, not a sprite.

### Palette notes

Warm and low-contrast, matching the concept: cream wall `#f3e3c3`-ish, tan
floor a step darker, three wood tones for the counter (light top, mid face,
dark posts/outlines). Keep the wall the lightest value so placed sprites and
customers pop against it.

## Quick reference

```
Ingredient icons ...... 32×32 px, 1×, one PNG per id in src/assets/icons/
Backdrop .............. 320×192 single PNG (wall 0–40%, floor 40–70%, counter 70–100%)
Shelf bays ............ 4 bays ≈ 72×48 each, 8 px posts, two shelf rows
CLOSED/OPEN sign ...... 32×16 per frame, 2-frame strip (64×16)
Potted tree ........... 16×32 decoration, bottom-center anchor
Format ................ transparent PNG, no padding, image-rendering: pixelated
```
