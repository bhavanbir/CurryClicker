# Build Instructions — Curry Clicker

How to set up and build this project from scratch on a new machine.

## 1. Prerequisites

- **Node.js 20 LTS or newer** — https://nodejs.org (includes npm). Verify:
  ```sh
  node --version
  npm --version
  ```
- **Git** — https://git-scm.com. Verify: `git --version`
- (Desktop builds only, Windows) no extra tooling needed — `electron-builder` targets NSIS out of the box.

## 2. Get the code

```sh
git clone <repo-url> CurryClicker
cd CurryClicker
```

(Or copy the project folder — everything needed is in the repo; `node_modules/`, `dist/`, and `release/` are regenerated.)

## 3. Install dependencies

```sh
npm install
```

This pulls React, Vite, TypeScript, Tailwind, Electron, and `steamworks.js` (a native module — it ships prebuilt binaries, no compiler needed).

## 4. Run in development (web)

```sh
npm run dev        # full game
npm run dev:demo   # gated demo variant
```

Open the URL Vite prints (default http://localhost:5173). The game runs fully offline against `localStorage` — no backend setup required.

## 5. Build for production (web)

```sh
npm run build        # full game  → dist/
npm run build:demo   # demo build → dist/
```

`npm run preview` serves the built `dist/` locally to verify it.

## 6. Desktop (Electron / Steam) build

```sh
npm run desktop:dev     # run the game inside Electron for development
npm run desktop:build   # web build + electron-builder → installer in release/
```

The Windows build produces an NSIS installer under `release/`. Steam features (achievements, stats) only activate when launched with Steam running; without it the game falls back gracefully.

## 7. Optional tooling

```sh
npm run typecheck              # TypeScript check only
npx tsx scripts/balanceSim.ts  # headless balance simulator
```

## Troubleshooting

- **`npm install` warns about build scripts** — `esbuild` is allowlisted in `package.json` (`allowScripts`); other script warnings are safe to ignore.
- **Port 5173 busy** — Vite picks the next free port automatically; use the URL it prints.
- **Old save state acting up** — clear the site's `localStorage` (or use Settings → Export/Import Save).
