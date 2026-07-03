# Curry Clicker — Day 5 Progress & Strategy Report

_Date: 2026-06-29 · Branch `main` · Audience: project owner_

This document does three things:

1. **Where the project actually stands** — what's genuinely built and working.
2. **What remains for a _full shippable product_** (not just the MVP), grouped and effort-sized.
3. **The strategic call** — ship on **Steam ($2–5 premium)** vs. continue as a
   **web app (ads / cosmetic skins)** — with a clear recommendation.

---

## 1. Executive Summary

**The game client is far more complete than "MVP."** The entire single-player
loop and _all five_ "recipe reward" systems from the design doc are implemented,
wired, and persisted. What's missing is almost entirely **the online half of the
product** (accounts, cloud save, real leaderboard, payments) plus a layer of
**content depth, audio, and onboarding**.

**The most important strategic finding:** the codebase does **not** need a
rewrite to go to Steam. It's a pure TypeScript engine + React UI that already
runs fully offline on `localStorage`. It can be wrapped (Tauri/Electron) for
Steam **or** shipped as a web app from the _same source_. The real decision is a
**business-model** decision, not a technical one.

**Recommendation (detail in §4):** **Go premium on Steam at $3**, after a
focused content-depth + polish pass — and lean on Steamworks (accounts, cloud
saves, leaderboards, achievements) to _delete_ most of the expensive backend
work. The web "ads/skins" model is a revenue trap at solo-dev scale and forces
you to build and operate the entire backend + payments + ad stack yourself for
pennies-per-user returns.

---

## 2. Current State — What's Built (and Working)

Verified by reading the source (`src/`) against the three design docs and the
build spec's work-unit graph.

### ✅ Core game loop — complete
- 30 ingredients, 6 categories, rarity tiers (`engine/ingredients.ts`)
- **Seeded weekly affinity engine** — deterministic 30×30 matrix + 6 guaranteed
  positive recipes, derived from the ISO week (`engine/affinityEngine.ts`).
  _Note: this already works **with no server** — the seed comes from the week id._
- Recipe scoring + tiers (none → terrible → neutral → good → great → legendary)
  with the multiplier curve (`engine/recipeEngine.ts`)
- Click engine with `break_infinity.js` big numbers (`engine/clickEngine.ts`)
- Time-based **day/week loop**, day rollover, week summary, next-week reset
  (`hooks/useGameLoop.ts`, `store/useGameStore.ts`)
- `localStorage` persistence with Decimal serialization (persist v2)

### ✅ All five "reward" systems — complete and wired
| System | Status | Evidence |
|---|---|---|
| Chef's Special (daily duo, 2× bonus) | ✅ | `weekEngine.getDailySpecial`, `DailySpecialBanner`, claim tracking |
| Recipe Streak (stacking daily multiplier) | ✅ | `weekEngine.evaluateStreak`, applied in click pipeline |
| Discovery Moments (tier-unlock overlay) | ✅ | `TierDiscoveryOverlay` + `RewardsLayer` + `noteTierSeen` |
| Recipe Cookbook (per-week, deduped) | ✅ | `CookbookModal`, `logCook`, fingerprinting in `engine/cookbook.ts` |
| Naming Ceremony (great/legendary gating) | ✅ | `RecipeNamingModal`, `needsNaming` flow, `nameRecipe` |

### ✅ Economy & feedback — complete
- **Hot/Cold Aura** on ingredient cards (direction-only ring on hover)
  (`IngredientCard.tsx` — _this is built; an earlier note that it was missing was wrong_)
- **Affinity Lens** upgrade reveals exact pair values
- Upgrades + decorations buy with curry and apply immediately
  (`StoreScreen`, `engine/shopData.ts`, `engine/effects.ts`)
- **Auto-production** (CPS from decorations/upgrades, scaled by recipe mult)
- **10 badges**, evaluated live on cook/purchase (`engine/badges.ts`)
- Animated **restaurant scene** diorama (perspective room, counter fills with curry)

### ✅ Shell & UX
- Spicetone Arcade theme, Material Symbols, responsive (desktop top-nav / mobile bottom-nav)
- Settings (sound toggle + hard reset are live)

> **Bottom line:** the single-player experience is essentially a finished v1.
> If you deleted the leaderboard/login/cosmetics tabs, what's left is a coherent,
> shippable offline game today.

---

## 3. Gap Analysis — What Remains for a Full Shippable Product

Grouped by category, with rough **solo-dev effort** estimates. "P" = priority
for a paid Steam launch; "W" = additionally needed for the web-social model.

### A. Game content & balance — _the real gap for a premium title_  ⏱ 2–4 weeks
The systems are done; the **content volume is thin** — currently ~10 upgrades,
~10 decorations, 30 ingredients. That's an evening of play, not a $3 purchase.
- [ ] **P** Expand the upgrade/decoration tree (target 30–50 items, multiple tiers, prestige-style depth)
- [ ] **P** Long-game progression: a **prestige/rebirth** layer or multi-week
      meta so play extends past one week (clicker buyers expect _many_ hours)
- [ ] **P** More ingredients / unlockable ingredient sets
- [ ] **P** Economy balance pass (curve testing so curry costs feel earned, not grindy or trivial)
- [ ] **P** Real ingredient/decoration **art** (currently placeholder SVG sprite sheets; swap to Kenney CC0 or commissioned pixel art)

### B. Game polish & missing single-player features  ⏱ 1–2 weeks
- [ ] **P** **Sound + music** — `soundOn` is stored but no audio is played. Add
      howler.js, click SFX, discovery stingers, ambient kitchen loop. (High
      perceived-value per hour of work.)
- [ ] **P** **Onboarding tutorial** — no first-run guidance exists. Critical for
      both store reviews and web retention.
- [ ] **P** **XP / leveling** — referenced in design, not implemented; profile
      shows a static "Rising Star". Either build it or cut it from the UI.
- [ ] **P** Profile screen is static (hardcoded name/title) — wire to real stats
- [ ] Juice pass: more Framer Motion on transitions, haptics on mobile, reduced-motion audit
- [ ] Settings: music/SFX split, volume, accessibility

### C. Backend & online infrastructure  ⏱ 3–5 weeks _(web model)_ / ~3 days _(Steam model)_
This is the **single biggest fork** between the two strategies.
- [ ] **W** Auth (Supabase Auth + CAPTCHA) — `LoginScreen` is a form with no wiring
- [ ] **W** Cloud save sync + offline reconciliation (`backend.ts` is a no-op stub today)
- [ ] **W** Real leaderboard + Realtime — `LeaderboardScreen` shows hardcoded sample data
- [ ] **W** Score submission + **anti-cheat** plausibility checks (client-authoritative scores are trivially forgeable)
- [ ] **W** Weekly-seed edge function — _optional_; the seed is already derived
      locally from the ISO week, so a server is only needed if you want to
      _override_ or _rotate_ seeds centrally
- [ ] Friends / social graph (Phase 6)

> **Steam shortcut:** Steamworks provides accounts, **Steam Cloud** saves,
> **Steam Leaderboards**, and **Achievements** out of the box. Choosing Steam
> lets you _delete_ almost this entire section (you'd map the 10 badges to Steam
> achievements and submit scores to a Steam leaderboard instead of building
> Supabase + RLS + edge functions + anti-cheat infra).

### D. Monetization plumbing  ⏱ 2–3 weeks _(web)_ / ~3–5 days _(Steam)_
- [ ] **W** Stripe Checkout + webhook → entitlements table → `cosmeticsSlice`
- [ ] **W** Cosmetics system: restaurant skins / avatars / UI themes (currently an inert "Coming soon" preview)
- [ ] **W** Ad SDK integration (if ad-supported) + consent/GDPR banner
- [ ] **P (Steam)** Steamworks SDK integration (e.g. `steamworks.js`) + store page + $100 Steam Direct fee

### E. Launch, legal & ops  ⏱ 1–2 weeks
- [ ] Privacy policy + ToS (mandatory once you have accounts/payments/ads)
- [ ] GDPR/CCPA data-deletion flow (web accounts only)
- [ ] Analytics (retention, funnel) — none today
- [ ] Performance/bundle audit (Lighthouse)
- [ ] Error monitoring (Sentry)
- [ ] Marketing page / store page / capsule art / trailer
- [ ] `npm run typecheck` is currently broken (composite tsconfig conflict); only
      `npm run build` is green — fix before CI

**Rough total to "full product":**
- **Steam premium path:** ~**5–8 weeks** solo (content + polish dominate; backend mostly handed to Steam)
- **Web ads/skins path:** ~**10–14 weeks** solo (you build _and operate_ backend, payments, ads, legal yourself)

---

## 4. Strategic Decision — Steam vs. Web App

### First, kill the framing assumption
You asked whether it's "worth it to **pivot and rewrite** for Steam." **There is
no rewrite.** The engine (`src/engine/*`) is pure, deterministic TypeScript with
zero network dependence, and the app already runs offline. The same Vite build
wraps in **Tauri** (tiny, ~5–10 MB) or Electron for a Steam desktop binary. So
the question is purely **which business model**, not which codebase.

### The tension in the current design
The design doc was written for a **live-service web/mobile** game: shared weekly
seeds, weekly seasons, public leaderboards, cosmetic-only IAP, push notifications
on week reset. That's a _retention-and-virality_ model. A **premium Steam** game
is a _buy-once, play-offline_ model. The good news: the parts that make it
"live-service" (weekly seed, daily special, streaks) are **already local and
deterministic**, so they survive intact on Steam — you just swap the _social_
layer (Supabase leaderboard) for Steam Leaderboards.

### Honest comparison

| Factor | **Steam — $3 premium** | **Web — ads / cosmetic skins** |
|---|---|---|
| Revenue per user | **$3 × 70%** (Steam cut) = ~$2.10, paid up front | Web ad CPM ~$1–5 → **fractions of a cent/session**; web IAP converts ~1–3% of _engaged_ users |
| Backend you must build/operate | **~None** (Steam Cloud + Leaderboards + Achievements) | **Everything** (auth, cloud save, leaderboard, anti-cheat, Stripe, webhooks) + ongoing hosting + on-call |
| Legal/liability | Steam handles payments, tax, refunds, accounts | You own PII, GDPR, chargebacks, refunds, ad-consent |
| Anti-cheat pressure | Low (offline, no shared economy money) | **High** — client-authoritative scores + real money = abuse target |
| Discoverability | Hard (Steam is crowded; clickers are a skeptical niche) | Hard (SEO/virality), **but** game portals (Poki, CrazyGames) handle ads + traffic for rev-share |
| Time to revenue | Longer (need content depth + store approval) | Faster to _launch_, slow to _earn_ |
| Fit with current build | Excellent (offline, deterministic) | Excellent design fit, but huge unbuilt half |
| Ongoing cost | ~$0 after launch | Hosting + ad/payment fees + maintenance forever |

### Why ads are a trap at your scale
Web ad revenue is a **volume game**. At indie DAU (hundreds to low thousands),
ad income is literally a few dollars a month, and ads actively degrade a clicker's
feel. "No pay-to-win cosmetic skins" is the _right_ ethical model — but on the
open web it requires you to build the entire Stripe + entitlement + cosmetics
pipeline and then convert a low single-digit % of an audience you first have to
acquire for free. The math rarely clears the effort for a solo dev.

### Recommendation

**Primary: Premium on Steam at $2.99**, sequenced as:
1. **Content + polish sprint** (§3 A + B): more upgrade/decoration depth, a
   prestige layer, audio, onboarding, real art. This is what turns "a finished
   loop" into "worth $3."
2. **Steam integration** (§3 D-Steam): wrap in **Tauri**, map the 10 badges to
   **Steam Achievements**, push week scores to a **Steam Leaderboard**, use
   **Steam Cloud** for saves. This _replaces_ §3 C and §3 D-web entirely.
3. **Launch.** Steam gives you payments, accounts, refunds, and a leaderboard for
   free, plus an audience that _expects to pay_ — exactly matching a buy-once clicker.

**Why this over web:** it deletes the most expensive, riskiest, lowest-ROI work
(your own backend + payments + ads + anti-cheat + legal), monetizes at ~$2/user
instead of ~$0.001/session, and fits the offline-deterministic build you already
have. The trade is that you must invest in **content depth** first — but you'd
need that for _any_ paid model anyway.

**Hedge / best-of-both (recommended if you have time):**
- Keep a **free web build** as a **demo + marketing funnel** (instant-play, no
  install), ideally hosted on a **portal (CrazyGames/Poki)** that pays
  **rev-share and handles ads for you** — so you get web reach _without_ building
  an ad stack — with a "Get the full game on Steam" call-to-action.
- Ship the **paid, content-complete version on Steam.** Same repo, two targets.

This gives you web discoverability (free, viral, instant) feeding a premium Steam
conversion, while you never build or operate a backend, a payment system, or an
ad integration yourself.

**When the web-social model _would_ win:** only if you commit to it as a
live-service with real marketing muscle and expect **tens of thousands of DAU** —
at which point ads + cosmetics + a leaderboard community compound. For a solo dev
shipping a first title, that scale is the exception, not the plan.

---

## 5. Suggested Next Steps (concrete)

1. **Decide the model** (recommend: Steam premium, optional free web demo on a portal).
2. **Fix the build hygiene**: repair `npm run typecheck`, add CI on `npm run build`.
3. **Content sprint** — expand upgrades/decorations to 30–50 items + add a
   prestige loop; this is the gating item for any paid launch.
4. **Audio + onboarding** — highest perceived-value polish per hour.
5. **Swap placeholder art** for real pixel art (Kenney CC0 packs are already the planned source).
6. **Steam path:** prototype the **Tauri** wrapper + `steamworks.js`; map badges→achievements, week score→leaderboard. **Web path (only if chosen):** Supabase auth + cloud save + real leaderboard + Stripe.
7. **Legal + store page** before submission.

---

### Appendix — Feature status at a glance
| Area | Status |
|---|---|
| Core cook/click/week loop | ✅ Done |
| Affinity engine + guaranteed recipes | ✅ Done (server-free) |
| Chef's Special / Streak / Discovery / Cookbook / Naming | ✅ Done |
| Hot/Cold Aura + Affinity Lens | ✅ Done |
| Economy (upgrades, decorations, auto-prod) | ✅ Done |
| Badges (10) | ✅ Done |
| Restaurant scene diorama | ✅ Done (placeholder art) |
| Sound effects | ✅ Done — zero-dep Web Audio synth wired to the toggle |
| XP / leveling | ❌ Not built |
| Onboarding tutorial | ✅ Done — first-run 3-step tutorial |
| Content depth / prestige | ❌ Thin — biggest paid-launch gap |
| Real art assets | ⚠️ Placeholder SVGs |
| Auth / login | ❌ Form only, not wired |
| Cloud save | ❌ Stub (`backend.ts` no-op) |
| Leaderboard | ❌ Hardcoded sample data |
| Anti-cheat | ❌ Not built |
| Cosmetics / IAP | ❌ Inert "Coming soon" preview |
| Stripe / ads / Steamworks | ❌ Not built |
| Privacy/ToS/analytics/monitoring | ❌ Not built |
