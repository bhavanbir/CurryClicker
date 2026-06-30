# Restaurant Scene Redesign — Progress Report

_Last updated: 2026-06-27_

A dynamic, pixel-art curry restaurant scene viewed **POV from above the
counter**: you look down over the counter out into the dining room, click to
cook, and curry piles up on the counter. Customers (coming next) will walk in,
sit, eat, and leave.

This file is the handoff for picking the work back up in a fresh chat.

---

## Decisions locked in

- **Perspective:** POV from *above the counter*, looking out + down into the room
  (2.5D, faked with a trapezoid floor — not true 3D).
- **Art:** pixel-art **sprite sheets** behind a manifest. Real art = **Kenney
  CC0 packs** (Tiny Town / RPG Urban / Toon Characters 1). Currently running on
  **placeholder SVG sheets** so nothing needs downloading. Swap procedure is in
  `src/assets/sprites/ASSETS.md`.
- **Décor placement (future):** player **drag-to-place** (Phase 3), which will
  need a new persisted store slice + a persist version bump (v2 → v3).
- **Design guidelines:** the `stitch_curry_clicker_arcade/` mockups are
  **ignored for this scene** (the user freed the visual direction). They still
  govern the rest of the app. Icons stay Material Symbols, not emoji.

---

## What's built (Phase 1 — DONE, build green)

Everything lives in **`src/scene/`** (plus sprite assets in
`src/assets/sprites/`). The old `src/components/RestaurantScene.tsx` was deleted
and `src/screens/GameplayScreen.tsx` repointed to `../scene/RestaurantScene`.

| File | Role |
| --- | --- |
| `scene/projection.ts` | 2.5D model. Normalized floor coords `(u,v)` → screen `%`, `scale`, `z`. Trapezoid floor (narrow at back wall, wide at front), foreshortening, an 8×5 floor grid, and `floorClipPath()`. Key tunables: `FLOOR_TOP_PCT` (40), `FLOOR_BOTTOM_PCT` (70), back/front width + scale consts. |
| `scene/Sprite.tsx` | Generic sprite-sheet animator. Stepped `background-position`, `image-rendering: pixelated`, ground-anchored to parent's bottom-center, `flip`, `prefers-reduced-motion` aware. Format-agnostic (SVG now, Kenney PNG later). |
| `scene/manifest.ts` | The only place that maps sprite ids → sheet + frame grid + animations. `PIXEL_SCALE = 3`. Sheets: `PROP` (table/plant/door/window), `CURRY_VARIANTS` (2 bowls), `CUSTOMER_ANIM` (idle/walk — ready for Phase 2). |
| `scene/layout.ts` | Fixed furniture in `(u,v)`: `TABLES` (each with seat offsets), `PLANTS`, `DOOR`, `WINDOWS`. |
| `scene/SceneBackdrop.tsx` | Back wall + clipped perspective floor + baseboard. Has a `skin` hook (only `default` today). |
| `scene/Counter.tsx` | Foreground counter as a top-down perspective slab with a **fillable curry grid**. `COLS×ROWS = 5×2`, `COUNTER_CAPACITY = 10`. Tunables: `DISH_BACK_Y`/`DISH_FRONT_Y`, scale lerp `0.42→0.72`. |
| `scene/RestaurantScene.tsx` | Orchestrator. Renders backdrop → wall props → plants → tables → counter. Keeps the original click-to-cook contract `{ cookSignal, onCook, busy }`. Tracks `filled`, incremented per cook, capped at `COUNTER_CAPACITY`. |
| `assets/sprites/*.svg` | Placeholder sheets: `props.svg` (4×1), `curry.svg` (2×1), `customer.svg` (3×1). All 16px grid. |
| `assets/sprites/ASSETS.md` | How to drop in real Kenney art with zero code changes. |

### Behavior today
- Static, perspective-projected room: wall with door + two windows, two corner
  plants, five tables (2 back + 3 front rows).
- Clicking the scene cooks (unchanged) and drops a curry bowl onto the counter,
  filling 10 slots back-to-front with a pop-in, then **stops — no overflow**.
- **No chef** (removed per feedback).

---

## How to run / verify

- Node is at `C:\Program Files\nodejs` and is **NOT on PATH** — prefix shells,
  e.g. (Git Bash): `export PATH="/c/Program Files/nodejs:$PATH"`.
- **Build gate (the real one):** `npm run build` (`tsc -b && vite build`). Green.
- ⚠️ `npm run typecheck` is **broken** (pre-existing, composite tsconfig
  conflict) — don't rely on it; use `npm run build`.
- Dev server: `npm run dev` → http://localhost:5173/ (Gameplay tab is default).

---

## What's next

- **Phase 2 — Customers (next up):** customer FSM + spawn director. Diner
  behavior (door → seat → eat → leave), plus "hang out" and "counter" variants.
  Make customers **pick up curry off the counter** so the filled counter becomes
  a living loop (frees slots). `customer.svg` + `CUSTOMER_ANIM` already exist;
  `TABLES` already carry seat offsets. New: `useCustomerDirector` hook + a
  `Customer` component, grid pathing around tables.
- **Phase 3 — Décor drag-to-place:** the Store sells décor (`engine/shopData.ts`,
  `ownedDecorations` in the store) but it's invisible in the scene. Add a
  `decorationPlacements` persisted slice (persist **v2 → v3** + non-destructive
  migration), an edit-mode tray + drag/drop snapping to the floor grid, and a
  `DecorationLayer`.
- **Phase 4 — Polish:** restaurant skins (wire `SceneBackdrop` `skin` prop +
  Store "Restaurant Skins"), customer mood faces, reduced-motion + perf pass.

---

## Pointers

- Persistent memory for this work: `restaurant-scene-redesign.md` (in the
  Claude memory dir) + `curry-clicker-build-spec.md`.
- Store + state: `src/store/useGameStore.ts` (`ownedDecorations`,
  `purchasedUpgrades`, persist version currently **2**).
- Shop catalogue: `src/engine/shopData.ts` (8 decorations, upgrades).
