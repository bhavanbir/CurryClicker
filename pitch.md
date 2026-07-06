# Curry Clicker — Pitch

**One-liner:** A curry-shop clicker where recipe *composition* is the strategy — build a recipe against a secret weekly affinity puzzle, tap to cook, chase a legendary curry, then prestige into a franchise and solve a fresh puzzle next week.

**Status:** Full single-player loop built, wired, and persisted. Fully offline (localStorage), no backend required. Ships as web game, gated demo, and Steam/Electron desktop from one codebase.

## Why it's different

Most clickers are pure number-go-up. Curry Clicker adds a deterministic, seeded 45×45 ingredient-affinity matrix that reshuffles every ISO week — so the core skill is *discovering* which ingredients synergize, not just buying upgrades. Prestige rewards skill (tier reached, cravings matched, journal coverage), not just time played.

## Key features

- **Weekly affinity puzzle** — seeded 45×45 matrix with guaranteed positive recipes, deterministic per ISO week (`src/engine/affinityEngine.ts`)
- **45 ingredients, 6 categories** — base 30 plus 3 unlockable franchise sets
- **Recipe tiers** — none → terrible → neutral → good → great → legendary, with a scoring multiplier curve
- **Five reward systems** — Daily Craving, Chef's Special, Recipe Streak, Discovery Moments, Cookbook with recipe-naming ceremony
- **Affinity Journal** — persistent grid of discovered ingredient pairs; doubles as the puzzle-solving tool
- **Franchise prestige** — weeks pay Franchise Stars for skill; Stars buy permanent meta-upgrades; rank climbs Street Stall → Curry Empire
- **Idle + active play** — click and auto engines on `break-infinity.js` big numbers
- **Isometric restaurant scene** — placeable decorations, customer AI, selectable skins
- **Three builds, one flag** — full game, gated web demo (`VITE_TARGET=demo`), Steam desktop with achievements plumbed end to end
- **Balance simulator** — headless engine sim for tuning (`scripts/balanceSim.ts`)

## Tech

React 18 + Vite + TypeScript · Zustand (persist) · Tailwind · Framer Motion · Electron + steamworks.js. Online half (auth, cloud save, leaderboard, IAP) is stubbed behind one typed seam (`src/lib/backend.ts`) — swap in Supabase without touching game code.

## What's next

Backend (Supabase auth/cloud save/leaderboard), Steam store finalization (real App ID, achievements dashboard), content depth (shop tiers, skins), balance pass.
