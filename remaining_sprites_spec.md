# Curry Clicker — Remaining Sprites To Make

Everything below follows the conventions in `SPRITESHEETS.md` and
`artist_sprite_spec.md`: author at 1×, transparent 32-bit PNG,
16×16 tile base for scene art (`PIXEL_SCALE = 3`, pixelated, bottom-center
anchor), 32×32 for UI icons.

---

## 1. New customer sprites — turbaned man & turbaned woman

Two new rows for `src/assets/sprites/scene/customer.png`, extending the sheet
from **3×4 (48×64)** to **3×6 (48×96)**. Same format as the existing rows:
16×16 frames, columns = `[idle/seated, walk-A, walk-B]`, 2-frame walk cycle
played at 6 fps.

| Row | Character | Art direction |
| --- | --- | --- |
| 5 (index 4) | Man with turban | Same body silhouette as existing rows; add a wrapped turban (e.g. saffron or deep red) with a visible center pleat, short beard optional; keep 1–2 px forehead gap so the turban reads at 16 px |
| 6 (index 5) | Woman with turban | Same body silhouette; turban in a distinct palette (e.g. teal or magenta) with a small front knot; earrings or a dupatta accent to differentiate at a glance |

Constraints:

- Head + turban must stay inside the 16×16 cell — do not raise the sprite's
  ground anchor; walkers are horizontally flipped in code, so keep designs
  symmetric enough to read mirrored.
- Match the existing rows' outline weight and palette contrast so the six
  variants mix naturally in the dining room.
- Wiring them in is a two-line code change (`src/scene/manifest.ts`: rows
  `4 → 6`, and `Customer.tsx`'s variant pick `id % 4 → id % 6`) — art only for
  this task.

## 2. New ingredient icons (15) — 32×32 px UI icons

One PNG per id in `src/assets/icons/`; auto-discovered, no code change.
Full art direction per icon lives in `newSpritesSpecs.md` §1.

- **Himalayan set:** `yak_butter`, `black_cardamom`, `timur_pepper`,
  `buckwheat`, `juniper_berry`
- **Tandoor set:** `charcoal_smoke`, `naan_crisp`, `kasuri_methi`,
  `black_salt`, `tandoori_paneer`
- **Mithai set:** `khoya`, `pistachio`, `rose_syrup`, `cardamom_sugar`,
  `saffron_milk`

## 3. Counter backdrop — 320×192 px single PNG

Replaces the CSS-gradient wall/floor/counter (`SceneBackdrop.tsx`,
`Counter.tsx`). Full region-by-region spec (shelf bays, palette, what stays
out of the bake) is in `newSpritesSpecs.md` §2; concept art:
`newCounterConcept.png`.

- Back wall rows 0–77, dining floor 77–134, counter face 134–192.
- Four shelf bays ≈ 72×48 px each with 8 px wood posts.

## 4. OPEN/CLOSED sign — 64×16 two-frame strip

Currently a text `<div>` (`RestaurantScene.tsx`). 2 columns × 1 row,
**32×16 per frame**: frame 0 = yellow "CLOSED" lozenge, frame 1 = green
"OPEN". Swapped by `dayStarted`; hangs top-center of the back wall.

## 5. Potted trees — 16×32 décor sprites

Left/right scene edges (per the counter concept). Tall-footprint décor,
ground-anchored bottom-center, so they scale with depth and can become
buyable décor later. Two variants (round canopy / slim cypress) would be nice
but one is enough to ship.

## 6. Production replacements for placeholder scene sheets

All current scene art is placeholder (per `src/assets/sprites/ASSETS.md`).
Final-quality versions, same drop-in layouts as documented in
`artist_sprite_spec.md` §2–3:

- `props.png` — 4×1 @16×16: table, plant, door, window.
- `curry.png` — 2×1 @16×16: red curry bowl, yellow curry + rice.
- `customer.png` — 3×6 @16×16 once the turban rows land (§1).
- The 20 décor sprites (`neko`, `tandoor`, `fountain`, `elephant`, …) at the
  native sizes listed in `artist_sprite_spec.md` §3.

Option: Kenney CC0 packs (Tiny Town, RPG Urban, Toon Characters 1) are the
approved fallback source if commissioned art slips — but they won't include
the turbaned customers, which must be custom.
