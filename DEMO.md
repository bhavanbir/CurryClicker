# Curry Clicker — Web Demo

The **demo** is a gated taste of the game: one complete week 1 arc — build
recipes, test pairs, chase a legendary, finish the week, and *see* week 2's
fresh affinity matrix arrive — with the long game Steam-locked but visible.
It's a static site that runs entirely in the browser against `localStorage`,
so it's free to host anywhere.

It's the **same codebase** as the full game, selected at build time by
`VITE_TARGET=demo` (see `src/target.ts`, which also holds the demo-gate
lists). There is no separate branch.

## What the demo includes

- The full week-1 cook → recipe → affinity → reward loop (Chef's Special,
  Streaks, Discovery Moments, Cookbook, Naming Ceremony, badges).
- 18 of the 30 base ingredients, recipe slots up to 4, the 2 cheapest
  decorations, and the default restaurant skin.
- Franchise Stars are still *earned* at the week-1 summary, and the Franchise
  screen stays browsable — a taste of the prestige loop.
- Week 2 starts and its fresh affinity matrix is visible in the Kitchen, so
  the weekly-reset hook lands before the gate closes.
- **Export Save** (Settings → Data): download your save file and import it in
  the full game — no lost progress.
- First-run onboarding, synthesised sound effects, 7-minute compressed weeks.

## What the demo locks (visible, Steam-tagged) or hides

- **Week 2 onward** — the day can't be started after week 1; an end-of-demo
  recap + Steam CTA replaces the Start Day button.
- **12 ingredients** (all 5 base rares + 7 uncommons), the **5th recipe
  slot**, all but the 2 cheapest **decorations**, all non-default **skins**,
  and every **Franchise purchase** — shown with lock + "Steam" tags, never
  buyable. Daily Specials only ever feature demo-unlocked ingredients.
- **Leaderboard** and **Login/accounts** (online-only) — removed from nav.
- **Cosmetics / IAP** store section — hidden.
- "Get it on Steam" CTAs appear on Profile, Settings, the Week Summary, the
  Franchise screen, and the end-of-demo panel. Point them at your store page
  via `VITE_STEAM_URL`.

## Run & build

```bash
npm install
npm run dev:demo        # local dev, demo mode  → http://localhost:5173
npm run build:demo      # production build       → dist/
npm run preview         # serve the built dist/ locally
```

`build:demo` runs `tsc -b && vite build --mode demo`, which loads `.env.demo`
(`VITE_TARGET=demo`). The default `npm run build` produces the full-game target.

Set the Steam link for the build:

```bash
# .env.demo (or pass at build time)
VITE_STEAM_URL=https://store.steampowered.com/app/XXXXXX/Curry_Clicker/
```

## Deploy (static hosting)

`dist/` is plain static files — host on any of:

- **itch.io** — zip `dist/` and upload as an HTML5 project (great for game-demo
  reach; players run it in-browser).
- **Vercel / Netlify / Cloudflare Pages** — point at the repo, set the build
  command to `npm run build:demo` and the output dir to `dist`.
- **GitHub Pages** — push `dist/` to a `gh-pages` branch.

No server, database, or environment secrets are required for the demo.

## Funnel idea

Keep the demo free and frictionless (instant play, no install) as the top of the
funnel; the "Get it on Steam" CTAs convert engaged players into buyers of the
content-complete paid build. See `day5progress.md` for the full strategy.
