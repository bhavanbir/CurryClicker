# Curry Clicker — Spicetone Arcade

A clicker game where you run a curry shop: build a recipe, tap to cook, and
chase a legendary curry over a simulated week — then prestige into a franchise
and do it again on a fresh weekly affinity puzzle.

One TypeScript engine + React UI, running **fully offline** against
`localStorage`. The same source ships three ways from one codebase:

- **Full web/desktop game** (`VITE_TARGET=full`, default)
- **Gated web demo** (`VITE_TARGET=demo`) — see `DEMO.md`
- **Steam desktop build** — Electron wrapper, see `electron/`

No accounts or backend are required to play; the online half (auth, cloud save,
real leaderboard, payments) is stubbed behind a typed seam.

## What's built and working

The entire single-player loop is implemented, wired, and persisted.

**Core loop**
- **45 ingredients** across 6 categories — base 30 plus 3 franchise sets
  (`src/engine/ingredients.ts`).
- **Seeded weekly affinity engine** — deterministic 45×45 matrix + guaranteed
  positive recipes derived from the ISO week (`src/engine/affinityEngine.ts`).
- **Recipe scoring + tiers** (none → terrible → neutral → good → great →
  legendary) with the multiplier curve from the logic doc
  (`src/engine/recipeEngine.ts`).
- **Click + auto engines** with `break-infinity.js` big numbers
  (`src/engine/clickEngine.ts`, `autoEngine.ts`).
- **Day / week loop** — `requestAnimationFrame` tick with a 1s delta clamp, day
  rollover, and a slide-up **Week Summary** that reseeds and starts the next
  week (`src/hooks/useGameLoop.ts`, `src/engine/weekEngine.ts`).

**Recipe reward systems** (all five from the design doc)
- **Daily Craving** — flavor demand each day; matching lifts tier/value.
- **Chef's Special** — daily featured ingredient bonus.
- **Recipe Streak** — consecutive good-tier days compound a multiplier.
- **Discovery Moments / Tier reveals** — first-time tier overlays.
- **Cookbook + Naming Ceremony** — save and name recipes you discover.
- **Affinity Journal** — the discovered-pairs grid (`AffinityJournalScreen`).

**Franchise prestige** (`FRANCHISE_DESIGN.md`, `src/engine/franchiseData.ts`)
- Week completion pays **Franchise Stars** for skill (tier reached, cravings
  matched, journal coverage).
- Stars buy permanent meta-upgrades (Reputation multipliers, ingredient sets,
  head start, journal insight, extra burner) via `FranchiseScreen`.
- **Franchise Rank** (Street Stall → Curry Empire) derived from lifetime Stars,
  replacing the old XP idea.

**Shop, scene, and shell**
- **Store** — curry-priced upgrades + decorations buy and apply immediately;
  cosmetics section is an inert IAP preview (`src/screens/StoreScreen.tsx`,
  `src/engine/shopData.ts`).
- **Isometric Restaurant Scene** — placeable decorations, customer director,
  selectable skins (`src/scene/`).
- **Onboarding**, synthesised **sound effects** (`src/lib/sfx.ts`), settings
  with **Export/Import Save**, animated arcade UI (Tailwind + Framer Motion).

**Distribution & tooling**
- **Demo gating** — one flag (`src/target.ts`) locks week 2+, rare ingredients,
  the 5th slot, most decorations/skins, and every franchise purchase (shown
  Steam-tagged), and hides Leaderboard/Login/IAP. See `DEMO.md`.
- **Steam desktop** — Electron main/preload/steam bridge; achievements + a
  weekly-score stat plumbed end to end (`electron/`).
- **Balance simulator** — headless engine sim for tuning costs/multipliers
  (`scripts/balanceSim.ts`, `npx tsx scripts/balanceSim.ts`).

## What remains (not yet built)

Almost everything left is the **online half** of the product plus polish.

**Backend / online (stubbed today)**
- **Accounts / auth** — `LoginScreen` is a scaffold; no real sign-up/login.
  Target: Supabase Auth + Cloudflare Turnstile.
- **Cloud save** — `backend.saveGame` is a no-op; only localStorage persists.
- **Real leaderboard** — `LeaderboardScreen` shows static sample data; needs the
  Supabase query + realtime subscription. The typed seam is `src/lib/backend.ts`
  (currently `localOnlyBackend`).
- **IAP / payments** — cosmetics store is preview-only; no Stripe wiring.

**Steam finalization**
- Replace placeholder **App ID 480** (Spacewar) with the real one
  (`electron/steam.cjs`, `CURRY_STEAM_APPID`).
- Real leaderboard **upload** — current `steamworks.js` version exposes stats,
  not the ISteamUserStats leaderboard API, so the week score is written as an
  int stat stand-in; swap when the binding supports it.
- Configure achievements/stats in the Steamworks partner dashboard; sign,
  package, and store-page setup (`VITE_STEAM_URL`).

**Content & polish**
- More upgrade/decoration tiers and price bands (shop is intentionally shallow).
- Additional skins and the real cosmetic/skin store (Phase 4 markers in
  `src/scene/skins.ts`).
- Audio pass, additional onboarding/tutorialization, and balance tuning against
  the simulator.

See `day5progress.md` for the full state audit and the Steam-vs-web strategy
call (recommendation: premium on Steam).

## Run it

Requires Node.js 18+ and npm.

```bash
npm install
npm run dev          # full game        → http://localhost:5173
npm run dev:demo     # gated web demo
npm run desktop:dev  # Electron desktop shell (Steam bridge)
```

Build / other scripts:

```bash
npm run build          # full-game static build → dist/
npm run build:demo     # demo build (loads .env.demo)
npm run preview        # serve built dist/ locally
npm run typecheck      # tsc -b
npm run desktop:build  # build + electron-builder (Steam package)
```

### Compressed week (dev default)

A full in-game week is **7 minutes** by default so the day/week/summary loop is
observable. Override in `.env`:

```bash
VITE_WEEK_DURATION_MS=420000   # 7 min (default). Production: 604800000 (7 days)
```

## Tech stack

React 18 + Vite + TypeScript · Tailwind CSS · Zustand (persist) ·
Framer Motion · break-infinity.js · seedrandom · Electron + steamworks.js
(desktop).
