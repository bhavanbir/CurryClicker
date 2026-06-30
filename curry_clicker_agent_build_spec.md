# Curry Clicker — Agent Build Spec

> **Audience: a coding agent, not a human team.** This document replaces the
> human-oriented roadmap in `curry_clicker_framework.md` (now kept only as
> design/background reference, alongside `curry_clicker_security_and_logic.md`
> and the `stitch_curry_clicker_arcade/` mockups).
>
> It is a **dependency-ordered graph of small, self-contained work-units**. Each
> unit is sized to be completed and verified in a single focused session by one
> agent, and states exactly: its goal, what it depends on, the files it
> touches, the contracts/signatures it must honour, the invariants it must not
> break, and a **runnable acceptance check**.

---

## 0. How an agent uses this spec

1. **Read §1–§4 once** (ground truth, conventions, contracts, design tokens).
2. **Pick the lowest-numbered `pending` work-unit whose dependencies are all
   `done`.** Do not start a unit with unmet dependencies.
3. Implement only that unit's manifest. Do not refactor unrelated files.
4. **Run the unit's Acceptance check.** It must pass. Then run the global gate
   (§2.2). Only then is the unit `done`.
5. Update the unit's status box in §5 (`pending` → `done`) in this file.

Golden rules:

- **One source of truth per concept.** Currency math → `break_infinity.js`
  `Decimal` only. Affinity → `affinityEngine`. Never duplicate.
- **No network client outside `src/lib/backend.ts`.** Screens call the
  `Backend` interface; never import `@supabase/supabase-js` elsewhere.
- **Determinism:** anything weekly/daily derives from the seed (see §3).
- **Verify, don't assume.** A unit is not done until its acceptance command
  exits 0 / shows the stated behaviour.

---

## 1. Ground truth — current architecture & state

The project is a **single Vite + React + TypeScript SPA at the repo root**
(NOT the monorepo in `framework.md` §3). Backend is stubbed; the game runs
fully offline on `localStorage`.

### 1.1 Stack (installed, verified building)

| Concern | Choice | Notes |
|---|---|---|
| Build | Vite 5 + React 18 + TS 5 (strict) | `npm run dev` / `build` |
| Styling | Tailwind 3 | tokens in `tailwind.config.js` |
| State | Zustand 4 + `persist` | **flat** store, Decimals as strings |
| Big numbers | `break_infinity.js` | **underscore** package name |
| Animation | Framer Motion 11 | |
| Seeded RNG | `seedrandom` | |
| Icons | Material Symbols Outlined | via `<Icon>`; **not emoji** |
| Fonts | Montserrat / Inter / Press Start 2P | |

### 1.2 File map (what exists today)

```
src/
  config.ts                 WEEK_DURATION_MS, DAY_DURATION_SECONDS, UNLOCKED_SLOTS, GUARANTEED_RECIPE_COUNT
  types.ts                  Ingredient, AffinityMatrix/Data, RecipeTier, RecipeScore, DailySnapshot
  navigation.ts             Screen union, PRIMARY_NAV
  lib/
    decimal.ts              re-export Decimal
    format.ts               formatCurry / formatScore
    rng.ts                  makeRng(seed)
    backend.ts              Backend interface + localOnlyBackend stub  <-- THE BACKEND SEAM
  data/sampleData.ts        SCAFFOLD stub content (shop/badges/ranks)
  engine/                   PURE logic, no React
    ingredients.ts          30 ingredients (id,name,icon,color,baseValue,category,rarity)
    affinityEngine.ts       buildAffinityData(seed) + getAffinityData(seed) [memoised]
    recipeEngine.ts         computeRecipeScore, avgAffinityToTier, TIER_ORDER, MULTIPLIER_CURVE
    clickEngine.ts          computeClickValue, handleClick
    weekEngine.ts           getCurrentWeekId, seedFromWeekId
  store/useGameStore.ts     flat Zustand store (see §3.2)
  hooks/                    useGameLoop, useWeeklySeed, useRecipeScore
  components/
    arcade/                 Icon, ArcadeButton, ArcadePanel, StatChip   <-- DESIGN KIT
    shell/                  TopBar, BottomNav
    RestaurantScene.tsx     animated diorama (customers + cook pops)
    IngredientCard, RecipeSlot, AffinityBadge, ScoreDisplay, FloatText,
    DayProgressBar, WeekSummaryModal
  screens/                  Gameplay, Kitchen, Store, Leaderboard, Profile, Settings, Login
  App.tsx                   shell + state-based screen routing
```

### 1.3 What is DONE (verified: `tsc` + `vite build` exit 0)

- Core loop: build recipe → COOK (button + scene click) → curry accrues →
  time-based day/week rollover → Week Summary → next week.
- Spicetone Arcade theme (light/cream, hard borders + offset shadows, Material
  Symbols, Montserrat/Inter).
- Responsive shell: desktop top-nav, mobile bottom-nav.
- Animated `RestaurantScene` (customers enter/dine/leave; cook pops).
- `localStorage` persistence; `highScore`; `soundOn` setting.
- **Scaffold only** (stub data, inert buttons): Store, Leaderboard, Profile,
  Settings (sound + reset are live), Login (form, auth not wired).

### 1.4 What is NOT built (the pending graph in §5)

Economy (shop/upgrades/decorations effects), auto-production, the five reward
systems (Chef's Special, Recipe Streak, Cookbook, Discovery Moments, Naming
Ceremony), badges, XP, and the entire backend (auth, cloud save, weekly-seed
edge function, leaderboard + realtime, score submission + anti-cheat, Stripe
IAP).

---

## 2. Conventions for agents

### 2.1 Coding rules

- TypeScript strict. No `any` in exported signatures. Prefer `import type`.
- Components are functions; no `React.*` namespace without importing the member
  (the modern JSX transform does not provide it).
- Tailwind class names must appear as **complete literal strings** in source
  (the JIT scanner cannot see `` `text-${x}` ``). Dynamic colour values
  (ingredient `color`, shop `tone`) are already stored as full class strings —
  keep that pattern.
- New currency-bearing state is a `Decimal`; add it to the store's
  `partialize` (as `.toString()`) **and** `merge` (revive via `new Decimal`).
- New screens: add to `Screen` union (`navigation.ts`) + render switch
  (`App.tsx`); add to `PRIMARY_NAV` only if it belongs in the nav bar.

### 2.2 Global gate (run for EVERY unit before marking done)

```bash
npm run typecheck      # tsc -b, must exit 0
npm run build          # tsc -b && vite build, must exit 0
```

Many units add a **behavioural** acceptance check on top (stated per unit). For
UI units, the check is: `npm run dev`, perform the stated interaction, observe
the stated result. For pure-logic units, prefer a tiny temporary node/vitest
assertion (see §6) over manual checking.

### 2.3 Definition of done

A unit is done when: (a) its manifest files exist/are modified, (b) its
contracts/invariants hold, (c) its acceptance check passes, (d) the global gate
passes, (e) its status box here is updated.

---

## 3. Canonical data contracts & invariants

These are fixed. Do not change them without a migration unit.

### 3.1 Determinism

- `weekId = getCurrentWeekId()` (ISO-8601 week, e.g. `2026-W26`).
- `seed = seedFromWeekId(weekId)` (FNV-1a, 32-bit).
- `getAffinityData(seed)` → `{ matrix, guaranteed }`, memoised by seed.
- `matrix[a][b] === matrix[b][a]`, `matrix[a][a] === 0`, range ≈ `[-1, 2]`.
- ≥ `GUARANTEED_RECIPE_COUNT` (6) fully-positive recipes per week.
- Daily things (Chef's Special) MUST derive from `(seed, day)` — never random
  at runtime (offline players must reproduce them).

### 3.2 Store shape (flat) — invariants

- `slots: (string|null)[]` length 5; only indices `< UNLOCKED_SLOTS` fillable.
- Decimal fields: `currentCurry, totalCurryAllTime, weekCurry, highScore,
  todayCurry, autoProduction`. All persisted as strings, revived on load.
- `addCurry` updates currentCurry + totalCurryAllTime + weekCurry + todayCurry,
  and bumps `highScore` when `weekCurry` exceeds it.
- `phase ∈ {"cooking","week_summary"}`; the game loop only ticks while
  `cooking`.
- Day rollover and week end happen **only** inside `advanceDayProgress`.

### 3.3 Tiers (from `security_and_logic.md`, authoritative over framework.md)

`avgAffinity` → tier: `<-0.3 terrible | [-0.3,0.3) neutral | [0.3,0.8) good |
[0.8,1.3) great | >1.3 legendary`. Multiplier curve in `recipeEngine.ts`.

---

## 4. Design system reference — "Spicetone Arcade"

Source of truth: `stitch_curry_clicker_arcade/*/code.html`. Tokens are encoded
in `tailwind.config.js` + `src/index.css`. Agents building UI MUST reuse the
kit, not re-derive styles.

- **Palette:** cream bg (`cream`/`cream-50/100/200`), `primary #ff8c00`,
  `tertiary`, `ink #191c1e`, `buy #4ade80`, `tier.*`.
- **Signature:** `border-4 border-ink` + hard offset shadow (`shadow-arcade*`,
  zero blur). Use the `.arcade-box` (panel) and `.arcade-btn` (press-down
  control) classes, or the `<ArcadeButton>/<ArcadePanel>/<StatChip>` kit.
- **Type:** `font-display` (Montserrat) for scores/headlines, `font-body`
  (Inter) for text, `.text-stroke-ink` for arcade stroke.
- **Icons:** always `<Icon name="material_symbol_name" />`. Never emoji.
- **Responsive:** desktop = `TopBar` nav; mobile (`md:hidden`) = `BottomNav`.
  Content wraps in `max-w-container` (1200px).

---

## 5. Work-unit graph

Status legend: `[done]` `[pending]`. Dependencies reference unit IDs.

### Epic A — Foundation & UI  (all `[done]`)

- **WU-A1 `[done]`** Arcade theme + kit (`tailwind.config`, `index.css`,
  `index.html`, `components/arcade/*`).
- **WU-A2 `[done]`** Material Symbols on 30 ingredients (`engine/ingredients.ts`).
- **WU-A3 `[done]`** Responsive shell + nav (`navigation.ts`, `components/shell/*`,
  `App.tsx`).
- **WU-A4 `[done]`** Dynamic restaurant scene (`components/RestaurantScene.tsx`).
- **WU-A5 `[done]`** Gameplay + COOK (`screens/GameplayScreen.tsx`).
- **WU-A6 `[done]`** Kitchen (`screens/KitchenScreen.tsx`).
- **WU-A7 `[done]`** Scaffold Store/Leaderboard/Profile/Settings/Login
  (`screens/*`, `data/sampleData.ts`).

### Epic B — Economy (deps: A)

- **WU-B1 `[done]` Shop data model + slices.** Deps: A7.
  - Files: `engine/shopData.ts` (typed Decoration[] & Upgrade[] from
    framework §10, replacing `data/sampleData` shop stubs), extend store with
    `ownedDecorations`, `purchasedUpgrades`, actions `purchaseDecoration(id)`,
    `purchaseUpgrade(id)` (use `spendCurry`, throw on insufficient).
  - Contracts: `spendCurry(amount: Decimal)`; persist new fields (string maps).
  - Invariant: a purchase only mutates state if `currentCurry.gte(cost)`.
  - Acceptance: buy an upgrade in dev → currency drops by cost; re-buy blocked.
- **WU-B2 `[done]` Apply upgrade/decoration effects.** Deps: B1.
  - Files: `engine/clickEngine.ts` (add upgrade click multiplier + decoration
    flat bonus per `security_and_logic.md §1.3`), `engine/autoEngine.ts`
    (`computeAutoProduction`), wire `autoProduction` in store; the existing
    game loop already pays out `autoProduction`.
  - Acceptance: owning a +CPS decoration makes idle curry rise; a ×click
    upgrade raises `+X/cook`.
- **WU-B3 `[done]` Store screen → live purchasing.** Deps: B1,B2.
  - Files: `screens/StoreScreen.tsx` (replace inert buttons; disable when
    unaffordable; show owned/level). Remove shop stubs from `sampleData`.
  - Acceptance: full buy loop works; CPS/▾click reflect in Gameplay.
- **WU-B4 `[done]` Slot-unlock upgrades.** Deps: B1.
  - Make `UNLOCKED_SLOTS` dynamic from purchased `recipe_slot_unlock` upgrades.

### Epic C — Reward systems (deps: A; C5 deps C4)

Each maps to a framework section; keep logic in `engine/`, UI in `components/`.

- **WU-C1 `[done]` Chef's Special** (framework §8). `engine/weekEngine.ts`
  `getDailySpecial(day, seed)`; store `dailySpecial`; `DailySpecialBanner`;
  2× bonus in `clickEngine` when both ingredients slotted. Acceptance: banner
  shows duo; cooking with both shows ×2.
- **WU-C2 `[done]` Recipe Streak** (framework §9). `evaluateStreak` in
  `weekEngine`; `recipeStreakDays/Multiplier` in store, evaluated at day
  rollover; streak chip on Gameplay. Acceptance: 2 good days → ×1.05.
- **WU-C3 `[done]` Discovery Moments** (framework §15.1). `highestTierSeen`
  in store; `TierDiscoveryOverlay`; fire when a new tier is first reached.
- **WU-C4 `[done]` Cookbook** (framework §11.3). `discoveredRecipes` map
  (fingerprint-deduped) in store; `logDiscoveredRecipe`; `CookbookModal`.
- **WU-C5 `[done]` Naming Ceremony** (framework §15.2). Deps: C4. Fires on
  first great/legendary craft; `RecipeNamingModal`; `nameRecipe(fp,name)`.
- **WU-C6 `[done]` Badges + XP** (framework §16). `engine/badges.ts`
  evaluated in `addCurry`/rollover; wire Profile badges to real state.

### Epic D — Backend integration (deps: A; see §6 for the detailed plan)

- **WU-D1 `[pending]` Supabase client + env.** `lib/supabase.ts`, `.env`
  vars, `authStore`. Implements nothing game-facing yet.
- **WU-D2 `[pending]` Auth flow** (Login/SignUp live). Deps: D1. Wires
  `screens/LoginScreen.tsx` + Turnstile; `onAuthStateChange` routing.
- **WU-D3 `[pending]` Cloud save** (`game_saves`). Deps: D1. Implement
  `Backend.saveGame`; `useAutoSave` (debounced); serialize/deserialize Decimals.
- **WU-D4 `[pending]` Weekly seed source.** Deps: D1. `Backend.fetchWeeklySeed`
  reads `weekly_seeds`; `useWeeklySeed` prefers server seed, falls back to
  local. Edge function `generate-weekly-seed` (cron).
- **WU-D5 `[pending]` Leaderboard live.** Deps: D1. Implement
  `Backend.getLeaderboard` + Realtime; replace `SAMPLE_RANKS`.
- **WU-D6 `[pending]` Score submission + anti-cheat.** Deps: D4,D5. Edge
  function `submit-score` (plausibility bound, `upsert_score_if_higher`);
  call on week end.

### Epic E — IAP & polish (deps: D)

- **WU-E1 `[pending]` Stripe checkout + webhook** (security_and_logic §4.7).
  `useIAP`, `stripe-webhook` edge fn → `purchases` → `cosmeticsSlice`.
- **WU-E2 `[pending]` Cosmetics apply** (restaurant skins/themes swap).
- **WU-E3 `[pending]` Security headers + CSP** (security_and_logic §4.4) in
  deploy config. **WU-E4 `[pending]`** Sound (howler), onboarding, a11y pass.

---

## 6. Backend integration plan (Epic D detail)

This is the concrete plan for **Login, Leaderboard, and Settings/account** that
the scaffold leaves stubbed. The single integration seam already exists:
`src/lib/backend.ts` (`interface Backend`, `localOnlyBackend`). Implementing
Epic D means writing a `supabaseBackend: Backend` and swapping the exported
`backend`.

### 6.1 Env (`.env`, never committed)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...          # safe to expose (RLS-enforced)
VITE_TURNSTILE_SITE_KEY=...         # safe to expose
VITE_STRIPE_PUBLISHABLE_KEY=...     # safe to expose
# Edge-function secrets (Supabase dashboard, NEVER client):
# SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

### 6.2 Schema (`supabase/migrations/`) — from security_and_logic §2.4/§4

`profiles`, `weekly_seeds`, `leaderboard` (score `NUMERIC` + `score_text`),
`game_saves` (JSONB, Decimals as strings), `purchases` (unique
`stripe_payment_intent_id`), `suspicious_scores`. RLS on every table.

### 6.3 Auth (WU-D2) — security_and_logic §3

- `lib/supabase.ts`: `createClient(url, anon, { auth: { persistSession,
  autoRefreshToken, detectSessionInUrl } })`.
- `LoginScreen`: replace the stub `submit` with `supabase.auth.signUp` /
  `signInWithPassword`, passing `options.captchaToken` from `react-turnstile`.
  Keep enumeration-safe error copy ("Incorrect email or password").
- `authStore` (zustand): `user`, `setUser`, `clearUser`; driven by
  `onAuthStateChange`. On `SIGNED_IN` → `Backend.loadSave`; on `SIGNED_OUT` →
  `hardReset`. Add `/auth/callback` handling (needs router — see note).
- Settings/Profile: show real user, add Sign out.
- Acceptance: real signup → email verify → session persists across reload.

### 6.4 Leaderboard (WU-D5)

- `Backend.getLeaderboard(weekId)` → top-N from `leaderboard` joined to
  `profiles`, ordered by `score DESC`.
- Subscribe via Supabase Realtime on `leaderboard` for the current `weekId`;
  update list in place. Splice the player's own row in context.
- `LeaderboardScreen` swaps `SAMPLE_RANKS` for this data; Refresh re-queries.

### 6.5 Score submission + anti-cheat (WU-D6)

- Edge fn `submit-score`: JWT required, per-user rate limit, **plausibility
  bound** (compare to max achievable for elapsed week time; flag, don't block),
  `upsert_score_if_higher` RPC. Called from `endWeek`.

### 6.6 Settings/account wiring

- Settings "Account" group: live email + Sign out (D2).
- Sound toggle already persists; on D3, settings ride along in `game_saves`.

> **Routing note:** auth verification (`/auth/callback`) and deep links need
> real routes. WU-D1 should introduce `react-router-dom` and migrate the
> `App.tsx` state-switch to routes (small, mechanical). Until then nav is
> state-based.

---

## 7. Acceptance appendix

- **Pure-logic units:** add a throwaway check, e.g. a `scripts/check.mjs` run
  with `node`, asserting invariants (matrix symmetry; ≥6 guaranteed recipes
  all-positive; tier boundaries), then delete it. Or add `vitest` as a unit if
  a standing test suite is desired (not yet present).
- **Store units:** assert persistence round-trips (Decimal → string → Decimal).
- **UI units:** `npm run dev`, perform the interaction, observe the result; the
  global gate (§2.2) must also pass.
- **Backend units:** verify against a real Supabase project; never mark done
  against mocks alone.
```
