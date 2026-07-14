# Curry Clicker — Kitchen Scene Overhaul: Baked Interior, Large Animated Windows, Dressing Props

Everything below follows the conventions in `artist_sprite_spec.md` /
`remaining_sprites_spec.md`: author at **1×**, transparent 32-bit PNG unless a
region is explicitly opaque, **16×16 tile base** for scene art
(`PIXEL_SCALE = 3`, `image-rendering: pixelated`, ground-anchored
bottom-center), and **no anti-aliasing, no partial-alpha edges — hard pixels
only**. Frame index is row-major (`index = row * columns + col`). Sheets wire
through `src/scene/manifest.ts`; placement geometry is locked to
`src/scene/projection.ts`.

## Skin strategy

The four skins (`default` / `neon` / `zen` / `mumbai`, see `skins.ts`) recolor
the **room**, not the world. This spec applies that policy in three consistent
ways, stated once here so each section below reads as one coherent choice:

- **Backdrop** — 4 baked palette variants (`backdrop_<skin>.png`). Identical
  linework, palette lookup only; the wall/floor/counter *are* the skin.
- **Window exterior** — **skin-agnostic**. The view through the glass (sky,
  clouds, street, passerby) is the exterior world and does not change when the
  owner repaints the interior, so one shared set serves all four skins. Only
  the window **frame** recolors per skin (it is room furniture) via 4 palette
  tokens.
- **Dressing props** — a **single skin-neutral palette**. These are physical
  objects (teak, brass, chalk, steel); a teak clock stays teak in Neon Night.
  One static PNG for all skins, mirroring how `decorSprites.ts` ships one image
  per décor regardless of skin.

---

## Baked interior backdrop — 320×192 per skin (4 variants)

Replaces the CSS gradient wall/floor/counter in `SceneBackdrop.tsx` +
`Counter.tsx` with one baked room PNG per skin. Author at **1×**, opaque 32-bit
PNG, no padding, `image-rendering: pixelated` at the scene's native upscale
(~3×). The scene `<div>` stretches the 320×192 bake to fill; every pixel row
maps to a fixed % of scene height, so the region map below is locked to
`projection.ts` geometry. **No anti-aliasing, no partial-alpha edges — hard
pixels only.**

### Region map (rows are the vertical axis, 0 = top)

| Region | Rows | Scene % | Contents |
| --- | --- | --- | --- |
| Back wall — plaster | 0–48 | 0–25% | Painted upper wall, flat with sparse noise |
| Back wall — wainscot cap | 49 | ~26% | 1px `trim` highlight line, full width |
| Back wall — wainscoting | 50–73 | 26–38% | Panelled lower wall, 16px-pitch vertical stiles |
| Back wall — baseboard | 74–76 | 38–40% | 3px `baseboard`, its top row 1px lit |
| Dining floor | 77–134 | 40–70% | Perspective plank trapezoid (see below) |
| Counter face | 135–192 | 70–100% | Vertical wood face, horizontal grain |

The wall spans the **full 320px width** (0–319); only the floor is trapezoidal.

### Floor trapezoid (perspective)

Derived from `BACK_LEFT_PCT 26` / `BACK_RIGHT_PCT 74` and `FRONT_LEFT/RIGHT −4/104`:

- **Back edge** (row 77): x = **83..237**.
- **Front edge** (row 134): x = **−13..333**, i.e. clamped to full width 0..319.
- Left/right edges are straight lines between those corners; pixels outside the trapezoid on rows 77–134 are **wall baseboard shadow** (`ambient shadow`, 1 row) fading to floor-fill — but since the counter overlays the very bottom in-game, just fill outside-trapezoid with `ambient shadow`.

**Plank seams — converge toward the back wall (top-left light):**
- 6 longitudinal seams fan from front to back. Seam *i* (i=0..6): back-x = `83 + (237−83)·i/6`, front-x = `−13 + 346·i/6`. Draw each as a 1px `grout` line, top-left side of the seam +1 lightness (`floor A`), bottom-right side −1 (`floor B`), alternating the base plank fill A/B per column strip.
- Depth seams (horizontal, compressed toward back to read as foreshortening): rows **77, 96, 111, 122, 130, 134**. Each 1px `grout`.

### KEEP-CLEAR zones (plain fill only — sprites overlay here)

Draw base material but **no texture, seams, outlines, or décor** inside these:

| Zone | x range | Rows | Reason |
| --- | --- | --- | --- |
| Door | 150–170 | 28–76 | Door sprite, u=0.5 (wall center x=160), ~20px base |
| Window L | 95–127 | 12–44 † | 32×32 window sprite, u=0.18 → x≈111 |
| Window R | 193–225 | 12–44 † | 32×32 window sprite, u=0.82 → x≈209 |
| Décor band | 96–224 | 18–42 | `WALL_SLOTS` back row (yPct 16 → row 31, scale 0.8) — keep low-contrast so hung décor reads |

† The window keep-clear band is drawn generously (rows 12–44) so it tracks the
**final `heightPct` tuning from the windows section** below. The windows
retune from `heightPct ≈ 0.5` toward **~0.55** (sill slightly lower), which
nudges the on-screen window center downward; keeping the cleared band tall
absorbs that tuning without a re-bake. If the window band settles far from
0.55, extend/trim these rows to match — do not add texture inside them.

Keep-clear = flat plaster with its normal 2–3% noise but **no high-contrast marks, no wainscot stiles rising into it** (wainscot starts at row 50, below all three sprite zones, so no conflict there).

### Material detail rules

- **Light direction: top-left.** Every raised element (wainscot stile, baseboard, counter top edge) gets a 1px lighter top/left edge and 1px darker bottom/right edge.
- **1px outlines:** only at material *transitions* (wall→baseboard, floor edge→out-of-trapezoid, counter top). No outline around the canvas itself.
- **Texture / noise budget** (must read at 3× pixelated):
  - Plaster upper: ~2–3% pixels shifted ±1 lightness, scattered, no clusters.
  - Wainscoting: vertical stiles every 16px (x=0,16,32… at 1px `baseboard`-tone), flat panels between.
  - Floor planks: ~5% grain speckle in `floor B`, denser near front rows (120–134), sparse at back.
  - Counter face: horizontal grain — 4–6 broken `counter dark` streaks per 16px band, plus a 1px `trim` top-edge highlight on **row 135**.

### Materials palette (named tokens)

| Token | Role |
| --- | --- |
| `wall upper` | Painted plaster, upper back wall |
| `wainscot` | Lower wall panel fill |
| `baseboard` | Wainscot stiles + floor baseboard |
| `floor A` | Primary plank fill |
| `floor B` | Alternate plank + grain |
| `grout` | Plank seams / gaps |
| `counter light` | Counter wood, lit face |
| `counter mid` | Counter wood midtone |
| `counter dark` | Counter wood shadow / grain streaks |
| `trim` | Top-edge highlights (wainscot cap, counter lip) |
| `ambient shadow` | Out-of-trapezoid fill, contact shadow |

### Per-skin hex (same linework, palette swap only)

| Token | default (Curry House) | neon (Neon Night) | zen (Zen Garden) | mumbai (Rooftop Mumbai) |
| --- | --- | --- | --- | --- |
| `wall upper` | `#fff3da` | `#3a2160` | `#eef6ec` | `#ffe7c2` |
| `wainscot` | `#e8cfa0` | `#241b3a` | `#d9ead3` | `#ffcf99` |
| `baseboard` | `#b98a52` | `#120c22` | `#9fb890` | `#bd8348` |
| `floor A` | `#e7b986` | `#2b2350` | `#cfe0c3` | `#e0a86b` |
| `floor B` | `#d8a874` | `#241d44` | `#bfd4b0` | `#cf9757` |
| `grout` | `#b58a55` | `#1c1736` | `#aac397` | `#a9743d` |
| `counter light` | `#e2913f` | `#ff4fa3` | `#8bb07a` | `#d2691e` |
| `counter mid` | `#d1802f` | `#d63488` | `#7aa268` | `#bb5c1a` |
| `counter dark` | `#c8772e` | `#b3247a` | `#6d9460` | `#a8521a` |
| `trim` | `#fadfb0` | `#4de0ff` | `#f4faf2` | `#fff0d5` |
| `ambient shadow` | `#4a3520` | `#0d0820` | `#47563e` | `#6b3f1c` |

**Exports:** `backdrop_default.png`, `backdrop_neon.png`, `backdrop_zen.png`, `backdrop_mumbai.png` — identical geometry, palette lookup only.

### Stays OUT of the bake

Day/night ambient tint (CSS overlays in `SceneBackdrop`), OPEN/CLOSED sign, and **all sprites**: door, both windows, tables, plants, potted trees, customers, curry dishes, and every placed décor item. Also **not** baked: the counter back-edge shadow line (Counter.tsx draws its own 3px `bg-ink/40` line and slab). Bake the room shell; everything mobile or lit stays a separate layer.

### Claude-generation notes

- **Deterministic draw order:** (1) flat-fill each region with its base token, top→bottom; (2) texture passes — plaster noise, wainscot stiles, floor plank seams + grain, counter grain; (3) 1px transition outlines + top-left/bottom-right edge lighting; (4) blank the four KEEP-CLEAR zones back to flat fill last so nothing bleeds in.
- **Symmetry:** wall, floor fan, and window/décor zones are mirror-symmetric about x=160 — draw the left half, mirror to the right. Door sits on the axis.
- **Reproducibility constraints:** fixed 1× 320×192 grid, integer pixel coords only, no anti-aliasing, no gradients (dither with the two adjacent tokens if a ramp is wanted), **≤12 colors per skin** (the 11 tokens above + at most one derived ±1 shade). Noise must be seeded/patterned, not random, so all four exports share identical mark positions.

---

## Large animated windows — street view (window_street sheets)

The two back-wall windows graduate from a single static 16×16 `props.png` cell (`PROP.window`, index `3`) to a **32×32 layered diorama** that shows the market street across the road, tinted by the same day cycle `SceneBackdrop` already reads. Both windows stay anchored by `layout.ts` `WINDOWS` (`u=0.18` / `u=0.82`); they render the identical layer stack (no per-window variation). Author every sheet at **1×**, transparent 32-bit PNG, no padding, no anti-aliasing, 1px ink outline `#211915` matching the existing props.

**Why the sky/street set is skin-agnostic:** skins recolor the *room* (wall, floor, counter) — the interior. The view through the glass is the *exterior* world, which does not change when the owner repaints their walls. One shared set for all four skins keeps the budget tiny and the fiction honest. Only the window *frame* recolors per skin (it is room furniture), via 4 palette tokens.

### Layer stack (back → front)

Each layer is its own **32×32 frame strip** so `Sprite.tsx` animates it independently (columns = animation frames, row-major index). All five layers are stacked absolutely at the same window origin; the frame is drawn **last** and its glass hole is transparent, so every layer beneath shows through it.

- **a. SKY** — flat 2-band gradient (no AA; a hard 1px seam between bands at y=13). **4 day-phase variants** selected (not animated) by `dayProgress`: dawn, midday, dusk, night. Four phases (not three) because dusk and night read very differently — the street lamp is unlit at dusk-glow vs. fully dark-sky at night — and the extra cell is nearly free.
- **b. CLOUDS** — a soft cloud band across the top third (y 1–11), drifting via a **4-frame horizontal scroll cycle**: each frame shifts the cloud shape +8px, wrapping at 32 so frame 4 tiles seamlessly back to frame 1. *Committed mechanism: frame strip, not CSS translate* — it reuses the existing animator with zero new code path. One cloud tone for all phases (dimmed by the frame overlay + ambient tint, not repainted).
- **c. STREET** — opposite-side market silhouette: flat building fronts (y 12–23), a striped awning (y 14–18, left third), and a street lamp post (x 24–26, y 12–24). **4 day-phase variants** matching the sky: in dawn/midday the lamp bulb is **dark**; in dusk/night the bulb is **lit** with a 3px glow halo around it (core + halo pixels, no blur).
- **d. PASSERBY** — a **16×16, 2-frame walk cycle** pedestrian on its own sheet (different tile base). Sprite frames only; code tweens it horizontally across the glass and mirrors it with `flip` for random direction. Feet land on the street line (local y≈24). Suggested cadence: one crossing every **20–40s** (random), ~5s to traverse, direction random — most of the time the street is empty.
- **e. WINDOW FRAME** — the 32×32 border, sill and glass mask. Opaque border hides all lower-layer overflow; the **transparent glass rectangle is x ∈ [4,27], y ∈ [3,24]** (24×22px). Structure: top rail y0–2, left/right stiles x0–3 and x28–31 (4px incl. outline), sill/apron y25–31 (7px). A **1px inner shadow** (`#4e3418`) runs along the top and left inner edge of the glass hole. 4 material tokens recolor it per skin.

### Sheet layout — `window_street.png` (one file, labeled rows)

One sheet for all four 32×32 layers; the passerby is the only split-out (its 16×16 base can't share a 32×32 grid's `frameW/H`).

`src/assets/sprites/scene/window_street.png` — **4 cols × 4 rows @ 32×32, total 128×128 px**. Row-major `index = row*4 + col`:

| Row | Frames | Layer | Cell 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0–3 | SKY (static, phase-picked) | dawn | midday | dusk | night |
| 1 | 4–7 | CLOUDS (loop) | drift 0 | +8px | +16px | +24px |
| 2 | 8–11 | STREET (static, phase-picked) | dawn (lamp dark) | midday (dark) | dusk (lit) | night (lit) |
| 3 | 12 | FRAME (static) | window frame | *(13–15 blank/spare)* | | |

`src/assets/sprites/scene/window_passerby.png` — **2 cols × 1 row @ 16×16, total 32×16 px**: frame `0` step-A, frame `1` step-B.

### Animation timing (`Sprite.tsx` animator)

| Layer | Sheet | frames | fps | Loop |
| --- | --- | --- | --- | --- |
| Sky | window_street | `[phase]` (0–3) | 0 | static, reselected on phase change |
| Clouds | window_street | `[4,5,6,7]` | 2 | loop |
| Street | window_street | `[8+phase]` | 0 | static, reselected on phase change |
| Passerby | window_passerby | `[0,1]` | 4 | loop (only while a crossing is active; position tweened in code) |
| Frame | window_street | `[12]` | 0 | static |

`phase` ∈ {0 dawn, 1 midday, 2 dusk, 3 night}, derived from the same quantized `dayProgress`: `dawn <0.15 ≤ midday <0.55 ≤ dusk <0.85 ≤ night`.

### Palette (16 colors, no AA, 1px ink outline `#211915`)

| Element | Dawn | Midday | Dusk | Night |
| --- | --- | --- | --- | --- |
| Sky band — top | `#f6b06e` | `#7fc7e8` | `#5e346e` | `#1b1636` |
| Sky band — low | `#ffd9a0` | `#d3edf7` | `#e07a2e` | `#1b1636` (flat) |
| Cloud | `#fdf6e8` | `#fdf6e8` | `#fdf6e8` | `#fdf6e8` |
| Building silhouette | `#34304c` | `#34304c` | `#34304c` | `#34304c` |
| Awning stripe | `#e07a2e` | `#e07a2e` | `#e07a2e` | `#e07a2e` |
| Lamp bulb (unlit) | `#211915` | `#211915` | — | — |
| Lamp glow — core / halo | — | — | `#ffd36b` / `#ffe6a0` | `#ffd36b` / `#ffe6a0` |

Dusk sky reuses `SceneBackdrop`'s existing evening tint (`#5e346e` → `#e07a2e`) so glass and room agree. **Frame material tokens** (recolored per skin, counted in the 16): base `#b6813f`, highlight `#d8a860`, shadow `#7c5626`, inner-shadow `#4e3418`.

### Claude-generation notes

- **Deterministic draw order, every 32×32 cell:** (1) fill both sky bands flat; (2) stamp clouds; (3) stamp buildings, then awning, then lamp post, then lamp bulb/glow; (4) frame cells: border → sill → 1px inner shadow, leaving x∈[4,27],y∈[3,24] fully transparent (alpha 0). Same seed → same pixels.
- **No anti-aliasing, no gradients-in-pixels** — the "gradient" is exactly two solid bands with a hard seam. Every edge is a 1px `#211915` ink line.
- **Composition contract:** the SKY cells are the opaque base; CLOUDS, STREET, and PASSERBY cells are transparent except their drawn content, so each layer beneath shows through. Correctness depends on the **frame being drawn last** with its glass punched out — the opaque frame border is what clips everything to the glass rectangle, so no separate mask is authored. The passerby (16×16) is positioned by code inside the glass and is painted *before* the frame, so the frame edges crop it as it enters/exits.
- Cloud frames must tile: frame `7` (+24px) → frame `4` (0px) is a seamless +8px step; author the cloud shape to wrap horizontally within 32px.

### Wiring notes (one line each)

- `manifest.ts`: add `WINDOW_STREET` (`frameW/H 32, columns 4, rows 4`) and `WINDOW_PASSERBY` (`16, cols 2, rows 1`) sheet defs; export anims `windowSky(phase)`, `windowClouds` (`[4..7]@2`), `windowStreet(phase)`, `windowFrame` (`[12]`), `windowPasserby` (`[0,1]@4`).
- `layout.ts`: `WINDOWS` `u` unchanged; the 2× size means retune `heightPct` (~0.5 → keep, but the sill now sits lower — nudge to ~0.55) so the doubled sprite still reads centered on the back wall.
- Render the five layers as stacked `Placed` divs at `projectWall(w.u, w.heightPct)` (all wall `z=0`): sky < clouds < street < passerby < frame — above `SceneBackdrop`, below floor décor/tables/customers (which carry `project()` z).
- `PROP.window` (props.png index `3`) is **superseded** and can be dropped from the `WINDOWS.map` render in `RestaurantScene.tsx`.

---

## Interior dressing props — fixed room furniture sheet (`interior_props.png`)

Fixed, non-purchasable dressing that makes the room read as a lived-in family curry house, layered over the new baked backdrop. None duplicate the ~20 buyable décors, none land on the 16 `WALL_SLOTS`, the door (`u=0.5`), the windows (`u=0.18/0.82`), the tables, or the OPEN/CLOSED sign (top-center). All wall pieces sit **above** the décor slot row (`yPct≈16`) or **below** it (`yPct>30`) so they never fight player décor. Ground-anchored bottom-center like every scene sprite; `PIXEL_SCALE = 3`.

### 1. The set (8 defs, 11 placements)

| Prop | Instances | Realism gap it fills |
| --- | --- | --- |
| `ceilingFan` | 2 | Every Indian diner has ceiling fans — the only overhead motion in the room. |
| `pendantLamp` | 2 | Warm pooled task-light over the diners; the ambient-lighting gap (distinct from the ornate buyable chandelier — these are bare warm bulbs). |
| `wallClock` | 1 | Time-of-day / "we're open" cue; a swinging pendulum adds a second slow tick of life. |
| `windowValance` | 2 | The baked windows are bare rectangles — a fabric pelmet dresses each one. |
| `menuBoard` | 1 | The "what's cooking today" chalkboard — signage the room otherwise lacks. |
| `tumblerShelf` | 1 | Steel water tumblers + jug on a low shelf — the service-station realism (not the buyable spice rack: crockery, not spices). |
| `familyPhotos` | 1 | Framed photo cluster over the door — the single strongest "family-run" beat, and the door is otherwise undressed. |
| `entryMat` | 1 | Floor doormat + umbrella stand just inside the door — the entrance transition, and the one **floor** fixture (uses `project`). |

### 2. Sheet layout — `interior_props.png`

One PNG, **uniform 32×32 cells**, 4 columns × 3 rows = **128×96 px**. Uniform cells keep the existing `Sprite.tsx` grid math untouched (it addresses `frame % columns`, `frame / columns` at one `frameW×frameH`); each prop is authored at its native size and **anchored bottom-center inside its 32×32 cell**, transparent padding elsewhere. Animated props occupy **contiguous** row-major cells.

| Cell idx | col,row | Prop / frame | Native art size | Anchor in cell |
| --- | --- | --- | --- | --- |
| 0,1,2 | (0,0)(1,0)(2,0) | `ceilingFan` spin f0–f2 | 32×16 | vertical center |
| 3,4 | (3,0)(0,1) | `pendantLamp` flicker f0–f1 | 16×16 | top-center (hangs from ceiling) |
| 5,6 | (1,1)(2,1) | `wallClock` pendulum f0–f1 | 16×32 | fills cell |
| 7 | (3,1) | `windowValance` | 32×16 | top-center |
| 8 | (0,2) | `menuBoard` | 32×24 | bottom-center |
| 9 | (1,2) | `tumblerShelf` | 32×16 | bottom-center |
| 10 | (2,2) | `familyPhotos` | 32×16 | center |
| 11 | (3,2) | `entryMat` | 32×16 | bottom-center |

### 3. Placement (all `heightPct`/`yPct` via `projectWall`; xPct = `lerp(26,74,u)`, yPct = `lerp(40,0,heightPct)`)

| Prop | Anchor call | xPct | yPct | z-layer |
| --- | --- | --- | --- | --- |
| `ceilingFan` ×2 | `projectWall(0.33, 0.60)`, `projectWall(0.67, 0.60)` | 31.8 / 58.2 | 16.0 | z=0, behind customers; flanks the center sign |
| `pendantLamp` ×2 | `projectWall(0.44, 0.62)`, `projectWall(0.56, 0.62)` | 47.1 / 52.9 | 15.2 | z=0; sign (z2500) overlays cleanly |
| `wallClock` | `projectWall(0.72, 0.65)` | 60.6 | 14.0 | z=0; sits between right window & center |
| `windowValance` ×2 | `projectWall(0.18, 0.72)`, `projectWall(0.82, 0.72)` | 34.6 / 65.4 | 11.2 ‡ | z=0; caps the top of each window (dresses, doesn't cover) |
| `menuBoard` | `projectWall(0.33, 0.14)` | 31.8 | 34.4 | z=0; below décor row & window bottom |
| `tumblerShelf` | `projectWall(0.67, 0.14)` | 58.2 | 34.4 | z=0; mirror of the board |
| `familyPhotos` | `projectWall(0.50, 0.20)` | 50.0 | 32.0 | z=0; rides just above the door frame |
| `entryMat` | `project(0.50, 0.06)` | 50.0 | ~44 | z≈13, floor — **behind** customers (they walk over it) |

‡ `windowValance` at `heightPct 0.72` (yPct 11.2) sits **above** the window
band, which the windows section retunes toward `heightPct ≈ 0.55` (window
center yPct ≈ 18). That keeps the valance capping the top of each window as
intended — a ~0.17 `heightPct` offset above the glass. If the window
`heightPct` moves during tuning, keep the valance ~0.15–0.17 above it so the
pelmet stays flush with the frame's top rail rather than floating or covering
the glass.

Vertical clearances: décor `WALL_SLOTS` back row is at `yPct≈16` (heightPct≈0.6). Sprites are bottom-anchored, so ceiling pieces anchor AT `yPct 14–16` and their art rises into the `yPct 2–15` ceiling band above the décor row (anchoring them higher pushes the art off the top of the frame — learned in wiring); the remaining wall fixtures sit at `yPct≥32` (below-window band). Side-wall slots live at `xPct 4–22 / 78–96`; all fixtures sit `xPct 31–66`. No collision with door/windows/sign.

### 4. Palette — single skin-neutral set (committed)

These are **physical objects** (teak, brass, chalk, steel), not architecture — a teak clock stays teak in Neon Night. Recoloring per skin would mean 4 baked variants + tint code for zero realism gain; shipping ONE static PNG mirrors how `decorSprites.ts` ships one image per décor regardless of skin. The tokens are warm and mid-value, so they read against all four `skins.ts` backdrops (they *pop* on the dark neon wall, stay neutral on zen green).

| Token | Hex (ink → light) |
| --- | --- |
| Ink outline (1px) | `#211915` |
| Wood (teak) | `#5a3a1f` · `#8a5a2b` · `#b07a3e` |
| Brass / warm metal | `#8a5a1e` · `#c8912e` · `#e9c46a` |
| Steel (tumblers) | `#8b97a0` · `#c9d2d8` · `#eef3f6` |
| Fabric (valance red) | `#7d1f33` · `#b3324a` · `#d4576a` |
| Chalk slate / chalk | `#2e3d36` · `#f2ede0` · `#e9c46a` (yellow) |
| Lamp glass glow | `#e8b45c` (dim) · `#ffd98a` (warm) · `#fff4d0` (hot core) |
| Photo sepia | `#caa06b` inside `#c8912e` brass frame |

### 5. Animation timing

| Prop | Frames | fps | Loop | Read |
| --- | --- | --- | --- | --- |
| `ceilingFan` | 3 (blades 0°→30°→60°, 4-blade = 90° symmetry) | 12 | yes | continuous spin `0,1,2,0…` |
| `pendantLamp` | 2 (warm ↔ hot-core) | 3 | yes | slow filament flicker |
| `wallClock` | 2 (pendulum left ↔ right) | 2 | yes | 2-frame cycle already ping-pongs (1s period) |

Static props (`windowValance`, `menuBoard`, `tumblerShelf`, `familyPhotos`, `entryMat`): `fps: 0`, single frame. `prefers-reduced-motion` freezes all three animators to frame 0 automatically (handled in `Sprite.tsx`).

### 6. Claude-generation notes

- Deterministic draw order per cell: fill transparent → 1px ink silhouette (`#211915`) → flat base color → single top-left highlight → single bottom-right shadow → detail specks. Never randomize.
- **No anti-aliasing, no gradients, no partial alpha** — every pixel is one palette hex or fully transparent. Ban dithering except a deliberate 1px checker on large flat wood/slate faces.
- 1px ink outline on all outer edges, matching `props.png` / décor weight; interior seams may drop to a mid-tone line, never AA.
- Light source top-left: highlight ledges/tops, shadow undersides and right edges. Consistent across all cells so the sheet reads as one set.
- Anchor art to the stated in-cell position; leave the rest of the 32×32 cell transparent (never bleed into a neighbor cell).
- Animated frames differ **only** in the moving part (fan blades, filament brightness, pendulum bob) — body/frame pixels identical frame-to-frame to avoid jitter.

### 7. Wiring (one-liners, mirrors existing patterns)

- **`manifest.ts`** — add alongside `PROP`:
  ```ts
  import interiorUrl from "../assets/sprites/scene/interior_props.png";
  const INTERIOR: SpriteSheet = { src: interiorUrl, frameW: 32, frameH: 32, columns: 4, rows: 3 };
  export const FIXTURE = {
    ceilingFan:   { sheet: INTERIOR, frames: [0,1,2], fps: 12 },
    pendantLamp:  { sheet: INTERIOR, frames: [3,4],   fps: 3  },
    wallClock:    { sheet: INTERIOR, frames: [5,6],   fps: 2  },
    windowValance:{ sheet: INTERIOR, frames: [7],     fps: 0  },
    menuBoard:    { sheet: INTERIOR, frames: [8],     fps: 0  },
    tumblerShelf: { sheet: INTERIOR, frames: [9],     fps: 0  },
    familyPhotos: { sheet: INTERIOR, frames: [10],    fps: 0  },
    entryMat:     { sheet: INTERIOR, frames: [11],    fps: 0  },
  } satisfies Record<string, SpriteAnim>;
  ```
- **`layout.ts`** — add `FIXTURES` (wall) + `FLOOR_FIXTURES`, mirroring the `WINDOWS` / `PLANTS` shape, keyed to `FIXTURE`:
  ```ts
  export const FIXTURES = [
    { key: "ceilingFan", u: 0.33, heightPct: 0.90 }, { key: "ceilingFan", u: 0.67, heightPct: 0.90 },
    { key: "pendantLamp", u: 0.44, heightPct: 0.86 }, { key: "pendantLamp", u: 0.56, heightPct: 0.86 },
    { key: "wallClock", u: 0.72, heightPct: 0.80 },
    { key: "windowValance", u: 0.18, heightPct: 0.72 }, { key: "windowValance", u: 0.82, heightPct: 0.72 },
    { key: "menuBoard", u: 0.33, heightPct: 0.14 }, { key: "tumblerShelf", u: 0.67, heightPct: 0.14 },
    { key: "familyPhotos", u: 0.50, heightPct: 0.20 },
  ] as const;
  export const FLOOR_FIXTURES = [{ key: "entryMat", u: 0.50, v: 0.06 }] as const;
  ```
- **`RestaurantScene.tsx`** — two `.map`s next to the existing door/window/plant blocks: `FIXTURES` → `<Placed p={projectWall(f.u, f.heightPct)} anim={FIXTURE[f.key]} />`, `FLOOR_FIXTURES` → `<Placed p={project(f.u, f.v)} anim={FIXTURE[f.key]} />`. Both render before `<Customer>`, so their `z=0` (and the mat's low floor-z) keep them behind diners and behind the foreground `<Counter>`.

---

## Integration & render order

The three sheets in this spec drop onto the existing scene stack in one z-order,
back (drawn first) to front (drawn last):

```
back ┌─────────────────────────────────────────────────────────┐
     │ 1. Baked backdrop  (backdrop_<skin>.png, opaque room shell)
     │      + SceneBackdrop day/night tint overlays (CSS, code-drawn)
     │ 2. Window diorama, per window, at projectWall(u, ~0.55):
     │      sky → clouds → street → passerby → frame  (all wall z=0)
     │ 3. Wall fixtures  (ceilingFan, pendantLamp, wallClock,
     │      windowValance, menuBoard, tumblerShelf, familyPhotos; z=0)
     │ 4. Door sprite  (props.png index 2, u=0.5, z=0)
     │ 5. Placed décor  (WALL_SLOTS + player-bought décor)
     │ 6. Floor fixtures / plants / tables  (entryMat + PLANTS + tables,
     │      project() z rises toward the camera)
     │ 7. Customers  (project() z, interleave with floor items by depth)
     │ 8. Counter slab + curry dishes  (Counter.tsx, foreground)
front│ 9. OPEN/CLOSED sign  (top-center, z≈2500, above everything)
     └─────────────────────────────────────────────────────────┘
```

Items 1, 8 (slab), and 9 remain **code-drawn**; everything else is a sprite.
The window layers (item 2) all carry wall `z=0`, so they sit above the backdrop
but below any `project()`-placed floor content — a customer or table walking in
front of a window is correct depth-sorting, not a bug.

### PNG files this spec produces

- `src/assets/sprites/scene/backdrop_default.png` — **320×192**, opaque
- `src/assets/sprites/scene/backdrop_neon.png` — **320×192**, opaque
- `src/assets/sprites/scene/backdrop_zen.png` — **320×192**, opaque
- `src/assets/sprites/scene/backdrop_mumbai.png` — **320×192**, opaque
- `src/assets/sprites/scene/window_street.png` — **128×128** (4×4 @ 32×32), transparent
- `src/assets/sprites/scene/window_passerby.png` — **32×16** (2×1 @ 16×16), transparent
- `src/assets/sprites/scene/interior_props.png` — **128×96** (4×3 @ 32×32), transparent

Seven PNGs total (four backdrop variants + three shared sprite sheets).

**Note:** `SceneBackdrop`'s day/night ambient tint overlays and `Counter`'s
foreground slab (3px `bg-ink/40` back-edge line + wood slab) stay **code-drawn**
until the backdrop bake ships; the bake replaces only the static room shell, not
the lit overlays or the animated counter surface.

**Counter-face z-order:** the backdrop layer renders at the very back, so its
baked counter-face region (rows 135–192) can never occlude customers. When the
bake ships, `Counter.tsx` must render that region itself — same PNG, shown via
`background-position` offset (rows 135–192 slice) on its existing high-z slab
div — replacing the CSS gradient while keeping the slab's z-index above diners.
The backdrop's own counter rows then simply sit hidden behind it.
