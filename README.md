# Curry Clicker — MVP (core loop)

A clicker game where you run a curry shop. This is the **MVP core loop** built
from `curry_clicker_framework.md` and `curry_clicker_security_and_logic.md`:

> Build a recipe → tap to cook → watch curry accumulate over a simulated week.

It runs **fully offline** against `localStorage`. No accounts, no backend.

## What's in the MVP

- **30 ingredients** across 6 categories (`src/engine/ingredients.ts`)
- **Seeded weekly affinity engine** — deterministic 30×30 matrix + 6 guaranteed
  positive recipes derived from the ISO week (`src/engine/affinityEngine.ts`)
- **Recipe scoring + tiers** (none → terrible → neutral → good → great →
  legendary) using the multiplier curve from the logic doc
  (`src/engine/recipeEngine.ts`)
- **Click engine** with `break-infinity.js` big numbers (`src/engine/clickEngine.ts`)
- **Kitchen screen** — pantry, crafting station, live affinity preview, and the
  direction-only **Hot/Cold aura** on slotted ingredients
- **Gameplay screen** — big tap-to-cook target, rising `+value` FloatText juice,
  animated score, time-based day progress
- **Day / week loop** — `requestAnimationFrame` tick with a 1s delta clamp, day
  rollover, and a slide-up **Week Summary** that starts the next week
- **localStorage persistence** (zustand `persist`; Decimals stored as strings)
- **Typed backend stub** (`src/lib/backend.ts`) — the seam for the Phase-3/4
  Supabase + Stripe wiring; the MVP uses the no-op `localOnlyBackend`.

## Not in the MVP (deferred)

Shop / upgrades / decorations, Chef's Special, Recipe Streak, Cookbook,
Discovery Moments, Naming Ceremony, leaderboard, auth, IAP, cloud sync. The
store and folder layout leave room for these (see the framework doc roadmap).

## Run it

Requires Node.js 18+ and npm.

```bash
npm install
npm run dev      # opens http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

### Compressed week (dev default)

A full in-game week is **7 minutes** by default so the day/week/summary loop is
observable. Override in `.env`:

```bash
VITE_WEEK_DURATION_MS=420000   # 7 min (default). Production: 604800000 (7 days)
```

## Tech stack

React 18 + Vite + TypeScript · Tailwind CSS · Zustand (persist) ·
Framer Motion · break-infinity.js · seedrandom.
