# Curry Clicker — Complete Technical Framework

> **Spicetone Arcade** · Web-first clicker game · Weekly seasons · Cosmetics-only IAP

---

## 1. Project Overview

A clicker game where players run a curry shop. The core loop is:

1. **Build a recipe** from up to 5 of 30 ingredients in the Kitchen
2. **Click to cook** and accumulate curry score during a simulated 7-day week
3. **Spend curry** on Decorations (passive bonuses) and Upgrades (multipliers)
4. **Compete** on the weekly leaderboard
5. **Customise** the restaurant with real-money cosmetics (skins only — no pay-to-win)

Affinities between ingredients are **seeded weekly** (same for all players that week), creating a shared meta-puzzle. At least 6 guaranteed all-positive recipes are always present.

**Recipe reward systems** (woven throughout this document) deepen the crafting loop:
- **Discovery Moments** — animated tier unlock celebrations when a new affinity tier is first reached
- **Recipe Cookbook** — a persistent in-Kitchen collection of every recipe tried this week
- **Chef's Special** — a daily ingredient duo that earns a 2× day bonus when paired
- **Hot/Cold Aura** — visual feedback on ingredient cards while building a recipe
- **Recipe Streak** — stacking daily bonuses for maintaining a good-tier recipe
- **Naming Ceremony** — a gated modal that triggers when crafting a great/legendary recipe for the first time

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + Vite | Component model maps cleanly to screen architecture; fast HMR |
| **Styling** | Tailwind CSS + Spicetone token plugin | Design system from DESIGN.md is already token-based |
| **State** | Zustand (global store) + Immer (mutations) | Minimal boilerplate; easy slice pattern; time-travel debug |
| **Animation** | Framer Motion | Juicy click feedback, screen transitions, float-text particles, discovery celebrations |
| **Backend** | Supabase (Postgres + Auth + Realtime) | Leaderboard queries, user profiles, weekly seed storage |
| **IAP** | Stripe (web) / RevenueCat (if wrapped in Capacitor for mobile) | Cosmetics checkout, webhook to Supabase for entitlements |
| **Seeded RNG** | `seedrandom` (npm) | Deterministic weekly affinity matrix and Chef's Special from a shared seed |
| **Persistence** | Supabase DB (cloud) + `localStorage` (offline fallback) | Auto-sync on reconnect |
| **Fonts** | Montserrat + Inter via Google Fonts | Matches Spicetone design spec |
| **Icons** | Material Symbols Outlined (already in mockups) | |

---

## 3. Repository Structure

```
curry-clicker/
├── apps/
│   └── web/                         # Vite + React SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx              # Router + GlobalProviders
│       │   ├── screens/             # One file per major view
│       │   │   ├── GameplayScreen.tsx
│       │   │   ├── KitchenScreen.tsx
│       │   │   ├── StoreScreen.tsx
│       │   │   ├── LeaderboardScreen.tsx
│       │   │   └── ProfileScreen.tsx
│       │   ├── components/          # Shared UI components
│       │   │   ├── ClickTarget.tsx
│       │   │   ├── FloatText.tsx
│       │   │   ├── RecipeSlot.tsx
│       │   │   ├── IngredientCard.tsx    # Enhanced: renders hot/cold aura on hover
│       │   │   ├── AffinityBadge.tsx
│       │   │   ├── ScoreDisplay.tsx
│       │   │   ├── ShopItem.tsx
│       │   │   ├── WeekSummaryModal.tsx
│       │   │   ├── ToastNotification.tsx
│       │   │   ├── TierDiscoveryOverlay.tsx  # NEW: full-screen celebration on tier unlock
│       │   │   ├── CookbookModal.tsx         # NEW: recipe collection browser
│       │   │   ├── RecipeNamingModal.tsx      # NEW: naming ceremony for great/legendary
│       │   │   └── DailySpecialBanner.tsx    # NEW: Chef's Special highlighted pair
│       │   ├── engine/              # Pure game logic (no React)
│       │   │   ├── ingredients.ts   # 30 ingredient definitions
│       │   │   ├── affinityEngine.ts # Weekly seed → affinity matrix
│       │   │   ├── recipeEngine.ts  # Score multiplier calculation + tier detection
│       │   │   ├── clickEngine.ts   # Click value + auto-production
│       │   │   ├── shopEngine.ts    # Purchase validation + effects
│       │   │   └── weekEngine.ts    # Day progression, week summary, Chef's Special
│       │   ├── store/               # Zustand slices
│       │   │   ├── useGameStore.ts  # Root store composer
│       │   │   ├── slices/
│       │   │   │   ├── playerSlice.ts    # Includes streak tracking
│       │   │   │   ├── recipeSlice.ts    # Includes cookbook + discovery state
│       │   │   │   ├── shopSlice.ts
│       │   │   │   ├── weekSlice.ts      # Includes Chef's Special + highestTierSeen
│       │   │   │   └── cosmeticsSlice.ts
│       │   ├── hooks/
│       │   │   ├── useGameLoop.ts   # requestAnimationFrame tick
│       │   │   ├── useAutoSave.ts   # Debounced cloud sync
│       │   │   ├── useWeeklySeed.ts # Fetches/caches this week's seed
│       │   │   └── useIAP.ts        # Stripe checkout + entitlement check
│       │   ├── lib/
│       │   │   ├── supabase.ts
│       │   │   ├── rng.ts           # Seeded random utility wrappers
│       │   │   └── format.ts        # Big number formatting (1.2B etc.)
│       │   └── styles/
│       │       └── spicetone.css    # CSS custom properties from DESIGN.md
│       ├── public/
│       │   └── assets/
│       │       ├── ingredients/     # 30 SVG ingredient icons
│       │       ├── decorations/     # Shop decoration thumbnails
│       │       ├── skins/           # Restaurant background images
│       │       └── badges/          # Achievement badge icons
│       └── vite.config.ts

├── supabase/
│   ├── migrations/                  # SQL schema files
│   │   ├── 001_users.sql
│   │   ├── 002_leaderboard.sql
│   │   ├── 003_weekly_seeds.sql
│   │   ├── 004_purchases.sql
│   │   └── 005_saves.sql
│   └── functions/                   # Supabase Edge Functions
│       ├── generate-weekly-seed/    # Runs Sunday midnight UTC
│       ├── submit-score/            # Validates + upserts score
│       └── stripe-webhook/          # Grants cosmetic entitlements

└── shared/
    └── types/                       # Shared TypeScript interfaces
        └── index.ts
```

---

## 4. Data Models

### 4.1 Ingredient

```typescript
interface Ingredient {
  id: string;                  // e.g. "turmeric"
  name: string;                // Display name
  icon: string;                // Path to SVG asset
  baseValue: number;           // Curry contribution per use (1–10)
  category: IngredientCategory; // "spice" | "protein" | "vegetable" | "dairy" | "herb" | "oil"
  rarity: "common" | "uncommon" | "rare";
  description: string;
}
```

### 4.2 Affinity Matrix (computed weekly)

```typescript
// Stored in Supabase weekly_seeds table
interface WeeklySeed {
  week_id: string;             // ISO week string, e.g. "2026-W26"
  seed: number;                // Master integer seed
  guaranteed_recipes: string[][];  // Array of 6+ guaranteed positive combos
  expires_at: string;          // ISO timestamp of Sunday midnight UTC
}

// Derived client-side from seed — never stored raw in full
type AffinityMatrix = Record<string, Record<string, number>>;
// affinity[ingredientIdA][ingredientIdB] → float -1.0 to +2.0
// Symmetric: affinity[A][B] === affinity[B][A]
// Self-affinity is always 0 (not used)
```

### 4.3 Recipe

```typescript
interface Recipe {
  slots: (string | null)[];    // Array of up to 5 ingredient IDs, nulls = empty
  name?: string;               // Auto-generated or user-named after naming ceremony
  affinityScore: number;       // Sum of all pairwise affinities in recipe
  multiplier: number;          // Derived from affinityScore (see §6.3)
  curryPerClick: number;       // Final value after multipliers
  curryPerSecond: number;      // Auto-production value
  discoveredAt?: string;       // ISO timestamp when first crafted
  isFavorite?: boolean;
}

// Entry stored in the Cookbook (recipeSlice.discoveredRecipes)
interface CookbookEntry {
  fingerprint: string;         // Stable hash of sorted slot IDs — deduplicates across sessions
  slots: (string | null)[];
  name?: string;               // Set via naming ceremony if tier was great/legendary
  tier: RecipeTier;
  multiplier: number;
  discoveredAt: string;        // ISO timestamp
  isFavorite: boolean;
}
```

### 4.4 Player State

```typescript
interface PlayerState {
  userId: string;
  displayName: string;
  avatarStyle: string;           // Cosmetic avatar ID
  level: number;
  xp: number;
  totalCurryAllTime: number;
  currentCurry: number;          // Spendable currency
  weekCurry: number;             // This week's leaderboard score
  badges: string[];
  clicksThisWeek: number;
  daysCooked: number;

  // Recipe Streak — consecutive days where active recipe tier is good or above
  recipeStreakDays: number;      // Resets on any day ending with tier neutral/worse
  recipeStreakMultiplier: number; // Derived: day 2 = 1.05, day 5 = 1.15, day 7 = 1.25
}
```

### 4.5 Week State

```typescript
interface WeekState {
  weekId: string;
  currentDay: number;            // 1–7
  dayProgress: number;           // 0.0–1.0 within the current day
  phase: "active" | "summary";
  dailySnapshots: DailySnapshot[];

  // Discovery Moments — tracks which tiers have been seen this week to avoid re-triggering
  highestTierSeen: RecipeTier;

  // Chef's Special — deterministic from weekly seed + day number
  dailySpecial: {
    ingredientA: string;         // Ingredient ID
    ingredientB: string;         // Ingredient ID
    bonusMultiplier: number;     // Always 2.0 — applied to click value when both are in slots
    claimed: boolean;            // True once the player has cooked with both this day
  };
}

interface DailySnapshot {
  day: number;
  curryEarned: number;
  clicksMade: number;
  topRecipeUsed: string | null;  // Recipe slot fingerprint
  decorationBonus: number;
  specialClaimed: boolean;       // Whether Chef's Special bonus was active this day
  tierAtDayEnd: RecipeTier;      // For streak calculation
}
```

### 4.6 Shop

```typescript
interface Decoration {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;                  // In curry
  passiveCurryPerSec: number;
  passiveClickBonus: number;
  affinityBoostIds?: string[];   // Optional: boosts specific ingredient pair affinities
  owned: boolean;
  quantity: number;              // Stackable up to max
  maxQuantity: number;
}

interface Upgrade {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;                  // In curry
  effect: UpgradeEffect;
  tier: number;
  prerequisiteUpgradeId?: string;
  purchased: boolean;
}

type UpgradeEffect =
  | { type: "click_multiplier"; value: number }
  | { type: "auto_multiplier"; value: number }
  | { type: "affinity_boost"; ingredientIds: string[]; value: number }
  | { type: "recipe_slot_unlock"; slotIndex: number }      // unlock slots 4 & 5
  | { type: "click_per_sec"; value: number }               // auto-clicker
  | { type: "guaranteed_recipe_hint"; count: number };     // reveals extra guaranteed recipes
```

### 4.7 Cosmetics (IAP)

```typescript
interface RestaurantSkin {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  price_usd: number;
  owned: boolean;
  active: boolean;
}

interface AvatarSkin {
  id: string;
  name: string;
  spriteUrl: string;
  price_usd: number;
  owned: boolean;
}

interface UiTheme {
  id: string;
  name: string;
  cssClass: string;              // Applied to <body> for full-theme override
  price_usd: number;
  owned: boolean;
}
```

---

## 5. The 30 Ingredients

Balanced across 6 categories (5 each). Rarity affects visual badge on card.

| # | ID | Name | Category | Base Value | Rarity |
|---|---|---|---|---|---|
| 1 | `chili` | Chili | spice | 8 | common |
| 2 | `cumin` | Cumin | spice | 6 | common |
| 3 | `turmeric` | Turmeric | spice | 5 | common |
| 4 | `coriander_seed` | Coriander Seed | spice | 5 | common |
| 5 | `cardamom` | Cardamom | spice | 9 | uncommon |
| 6 | `cloves` | Cloves | spice | 6 | uncommon |
| 7 | `cinnamon` | Cinnamon | spice | 6 | uncommon |
| 8 | `nutmeg` | Nutmeg | spice | 7 | uncommon |
| 9 | `star_anise` | Star Anise | spice | 8 | rare |
| 10 | `saffron` | Saffron | spice | 10 | rare |
| 11 | `garlic` | Garlic | vegetable | 4 | common |
| 12 | `onion` | Onion | vegetable | 3 | common |
| 13 | `tomato` | Tomato | vegetable | 4 | common |
| 14 | `potato` | Potato | vegetable | 3 | common |
| 15 | `curry_leaf` | Curry Leaf | vegetable | 6 | uncommon |
| 16 | `pepper` | Pepper | vegetable | 5 | uncommon |
| 17 | `mustard_seed` | Mustard Seed | vegetable | 5 | uncommon |
| 18 | `fenugreek` | Fenugreek | vegetable | 6 | uncommon |
| 19 | `lemongrass` | Lemongrass | vegetable | 7 | rare |
| 20 | `tamarind` | Tamarind | vegetable | 8 | rare |
| 21 | `chicken` | Chicken | protein | 5 | common |
| 22 | `cashew` | Cashew | protein | 6 | common |
| 23 | `ginger` | Ginger | protein | 5 | common |
| 24 | `coconut` | Coconut | protein | 7 | uncommon |
| 25 | `paprika` | Paprika | protein | 6 | uncommon |
| 26 | `garam_masala` | Garam Masala | protein | 8 | rare |
| 27 | `yogurt` | Yogurt | dairy | 4 | common |
| 28 | `ghee` | Ghee | dairy | 5 | common |
| 29 | `salt` | Salt | dairy | 3 | common |
| 30 | `mint` | Mint | herb | 6 | uncommon |

> **Note:** "protein", "dairy", "herb", and "oil" categories can be renamed to better reflect the actual game flavour — these are architectural groupings that the UI can surface as tabs in the Kitchen pantry.

---

## 6. Affinity Engine

This is the most critical system. It must be:
- **Deterministic** — same seed → same matrix for all players all week
- **Guaranteed fun** — at least 6 discoverable fully-positive recipes always exist
- **Discoverable** — players can stumble onto positive combos through experimentation

### 6.1 Weekly Seed Generation (Edge Function, runs Sunday 00:00 UTC)

```typescript
// supabase/functions/generate-weekly-seed/index.ts

const INGREDIENT_IDS = [ /* all 30 IDs */ ];
const GUARANTEED_RECIPE_COUNT = 6;

function generateWeeklyData(seed: number) {
  const rng = seedrandom(seed.toString());
  
  // Step 1: Build raw pairwise affinity matrix
  const matrix: AffinityMatrix = {};
  for (const a of INGREDIENT_IDS) {
    matrix[a] = {};
    for (const b of INGREDIENT_IDS) {
      if (a === b) { matrix[a][b] = 0; continue; }
      // Symmetric — only generate for a < b alphabetically, mirror the rest
      if (a < b) {
        matrix[a][b] = (rng() * 3) - 1; // Range: -1.0 to +2.0
      }
    }
  }
  // Mirror
  for (const a of INGREDIENT_IDS)
    for (const b of INGREDIENT_IDS)
      if (b < a) matrix[a][b] = matrix[b][a];

  // Step 2: Carve out guaranteed positive recipes
  // Shuffle ingredient pool and pick combos where we force all pairs positive
  const guaranteed: string[][] = [];
  const shuffled = [...INGREDIENT_IDS].sort(() => rng() - 0.5);
  let pool = [...shuffled];
  
  while (guaranteed.length < GUARANTEED_RECIPE_COUNT && pool.length >= 3) {
    const size = 3 + Math.floor(rng() * 3); // 3, 4, or 5 ingredients
    const combo = pool.splice(0, size);
    
    // Force all pairs in this combo to be strongly positive
    for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        const val = 0.8 + rng() * 1.2; // +0.8 to +2.0
        matrix[combo[i]][combo[j]] = val;
        matrix[combo[j]][combo[i]] = val;
      }
    }
    guaranteed.push(combo);
    // Refill pool from unused ingredients when running low
    if (pool.length < 5) pool = [...shuffled].sort(() => rng() - 0.5);
  }

  return { matrix, guaranteed };
}
```

### 6.2 Client-Side Affinity Fetching

```typescript
// hooks/useWeeklySeed.ts
// On app load: fetch current week_id from Supabase
// The FULL matrix is derived client-side from the seed (not transmitted raw)
// This prevents easy extraction but keeps computation fast (<2ms for 30x30)
```

### 6.3 Recipe Scoring Formula

```typescript
// engine/recipeEngine.ts

function scoreRecipe(ingredientIds: string[], matrix: AffinityMatrix): RecipeScore {
  const ids = ingredientIds.filter(Boolean);
  if (ids.length === 0) return { affinityScore: 0, multiplier: 1, tier: "none" };

  let totalAffinity = 0;
  let pairCount = 0;
  
  // Sum all unique pairs
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      totalAffinity += matrix[ids[i]][ids[j]];
      pairCount++;
    }
  }
  
  const avgAffinity = pairCount > 0 ? totalAffinity / pairCount : 0;
  
  // Base values from ingredients
  const baseValue = ids.reduce((sum, id) => sum + INGREDIENTS[id].baseValue, 0);
  
  // Multiplier curve:
  // avgAffinity < -0.5  → 0.5x  (terrible combo, penalty)
  // avgAffinity -0.5–0  → 0.75x (slightly off)
  // avgAffinity 0–0.5   → 1.0x  (neutral)
  // avgAffinity 0.5–1.0 → 1.5x  (good synergy)
  // avgAffinity 1.0–1.5 → 2.0x  (great synergy)
  // avgAffinity > 1.5   → 3.0x  (legendary)
  const multiplier = affinityToMultiplier(avgAffinity);
  
  const tier = multiplierToTier(multiplier); // "terrible"|"neutral"|"good"|"great"|"legendary"
  
  return { affinityScore: totalAffinity, avgAffinity, multiplier, tier, baseValue };
}
```

### 6.4 Affinity Hint System

Players can unlock **Recipe Hints** via upgrades. These hints say something like:
- *"Cardamom and Saffron harmonise well this week"* (high pair affinity revealed)
- *"Avoid pairing Tomato with Coconut this week"* (negative pair warning)

Hints never directly reveal the guaranteed recipe — they nudge discovery.

### 6.5 Hot/Cold Aura (Ingredient Cards in Kitchen)

While the player hovers or drags an ingredient toward the crafting station, `IngredientCard.tsx` reads the affinity matrix to show a real-time directional aura against each currently slotted ingredient. This gives intuitive feedback without exposing raw numbers — it feels like taste intuition rather than a spreadsheet.

```typescript
// components/IngredientCard.tsx

interface IngredientCardProps {
  ingredient: Ingredient;
  hoveredIngredientId?: string;   // ID of ingredient being dragged/hovered
  activeSlots: (string | null)[];
  affinityMatrix: AffinityMatrix;
}

function getAuraClass(
  ingredientId: string,
  hoveredId: string | undefined,
  slots: (string | null)[],
  matrix: AffinityMatrix
): string {
  if (!hoveredId || hoveredId === ingredientId) return "";

  // Only show aura if this ingredient is already in a slot
  if (!slots.includes(ingredientId)) return "";

  const affinity = matrix[ingredientId]?.[hoveredId] ?? 0;

  if (affinity > 0.5)  return "ring-2 ring-green-400 shadow-green-300/50 shadow-md";
  if (affinity > 0)    return "ring-1 ring-green-300/60";
  if (affinity < -0.3) return "ring-2 ring-red-400 shadow-red-300/50 shadow-md";
  return "ring-1 ring-gray-400/30"; // neutral — subtle
}
```

- Direction only (green / red / grey) — actual values remain hidden unless **Affinity Lens** is purchased
- Aura only appears on cards already placed in a recipe slot, so it's a comparison signal, not a full grid reveal
- On mobile, the aura triggers on ingredient card press-hold, not hover

---

## 7. Click Engine

```typescript
// engine/clickEngine.ts

function computeClickValue(state: GameState): number {
  const { recipe, upgrades, decorations, week } = state;
  
  const recipeMultiplier = recipe.multiplier;               // From affinity engine
  const clickUpgradeMultiplier = getClickUpgrades(upgrades); // Stacked from purchased upgrades
  const decorationBonus = getDecorationClickBonus(decorations);

  // Chef's Special bonus — 2× day multiplier if both special ingredients are in active slots
  const specialBonus = computeSpecialBonus(recipe.slots, week.dailySpecial);
  
  // Base click = sum of ingredient baseValues * recipe multiplier
  const base = recipe.baseValue * recipeMultiplier;
  
  return Math.floor((base * clickUpgradeMultiplier + decorationBonus) * specialBonus);
}

function computeSpecialBonus(
  slots: (string | null)[],
  special: WeekState["dailySpecial"]
): number {
  const hasA = slots.includes(special.ingredientA);
  const hasB = slots.includes(special.ingredientB);
  return hasA && hasB ? special.bonusMultiplier : 1.0;
}

function computeAutoProduction(state: GameState): number {
  // Curry per second from decorations + auto-clicker upgrades
  const decorationCPS = getDecorationCPS(state.decorations);
  const autoClickerCPS = getAutoClickerCPS(state.upgrades);
  return (decorationCPS + autoClickerCPS) * state.recipe.multiplier;
}
```

### 7.1 Game Loop (requestAnimationFrame)

```typescript
// hooks/useGameLoop.ts
// Runs at ~60fps. Day progression is time-based not click-based.

const WEEK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;  // Real 7 days
// OR: compressed for testing — configurable via env var
// WEEK_DURATION_MS = 7 * 60 * 1000 (7 minutes = 1 simulated week)

function tick(deltaMs: number, store: GameStore) {
  // 1. Auto-production
  const curryEarned = store.autoProduction * (deltaMs / 1000);
  store.addCurry(curryEarned);
  
  // 2. Day progression
  store.advanceDayProgress(deltaMs / (WEEK_DURATION_MS / 7));
  
  // 3. Check for day rollover
  if (store.dayProgress >= 1.0) {
    store.snapshotDay();   // Captures tierAtDayEnd for streak calculation
    store.advanceDay();
  }
  
  // 4. Check for week end
  if (store.currentDay > 7) {
    store.endWeek();
  }
}
```

---

## 8. Chef's Special

A daily ingredient pairing — derived deterministically from the weekly seed and the current day — that earns a **2× click value bonus** when both ingredients are present in the active recipe. The same duo is shown to all players that day, creating a shared daily meta-moment.

### 8.1 Deriving the Daily Special

```typescript
// engine/weekEngine.ts

export function getDailySpecial(
  day: number,
  seed: number
): { ingredientA: string; ingredientB: string; bonusMultiplier: number } {
  const rng = seedrandom(`${seed}-special-day${day}`);
  const ids = Object.keys(INGREDIENTS);

  let a = ids[Math.floor(rng() * ids.length)];
  let b = ids[Math.floor(rng() * ids.length)];
  while (b === a) b = ids[Math.floor(rng() * ids.length)]; // Ensure distinct

  return { ingredientA: a, ingredientB: b, bonusMultiplier: 2.0 };
}
```

This runs once per day rollover inside `advanceDay()` and stores the result in `weekSlice.dailySpecial`. Because it's seeded, offline players who reconnect will always see the correct day's special.

### 8.2 UI — DailySpecialBanner

Displayed as a highlighted card near the top of `GameplayScreen` and again as a callout inside `KitchenScreen`:

```
┌─────────────────────────────────────────────────────┐
│  ⭐ TODAY'S SPECIAL  DAY 3                         │
│  Pair  🌶 Chili  +  🥛 Yogurt  for  2× clicks!   │
│  [✓ IN YOUR RECIPE]   or   [MIX IT IN →]          │
└─────────────────────────────────────────────────────┘
```

- Checks `recipe.slots` live — label switches from `[MIX IT IN →]` to `[✓ IN YOUR RECIPE]` the moment both ingredients are active
- When both are active, the banner pulses in Spicetone orange and click FloatText briefly shows `×2 SPECIAL` alongside the curry value
- `claimed` is set to `true` in `weekSlice.dailySpecial` the first time the player completes a click with both ingredients active; the banner then shows a soft green confirmation state

---

## 9. Recipe Streak

Consecutive days where the active recipe ends at tier `good` or above build a multiplier stack. Tier is evaluated at `snapshotDay()`.

### 9.1 Streak Multiplier Table

| Streak Days | Click Multiplier |
|---|---|
| 1 (baseline) | ×1.00 |
| 2 | ×1.05 |
| 3 | ×1.08 |
| 4 | ×1.12 |
| 5 | ×1.15 |
| 6 | ×1.20 |
| 7 (full week) | ×1.25 + Streak Master badge progress |

A streak breaks if any day ends with the recipe at tier `neutral` or below. The multiplier resets to ×1.00 the following day.

### 9.2 Streak Logic

```typescript
// engine/weekEngine.ts

const STREAK_MULTIPLIERS: Record<number, number> = {
  1: 1.00, 2: 1.05, 3: 1.08, 4: 1.12, 5: 1.15, 6: 1.20, 7: 1.25,
};

const STREAK_QUALIFYING_TIERS: RecipeTier[] = ["good", "great", "legendary"];

export function evaluateStreak(
  snapshot: DailySnapshot,
  currentStreakDays: number
): { newStreakDays: number; newMultiplier: number } {
  const qualifies = STREAK_QUALIFYING_TIERS.includes(snapshot.tierAtDayEnd);

  const newStreakDays = qualifies ? Math.min(currentStreakDays + 1, 7) : 0;
  const newMultiplier = STREAK_MULTIPLIERS[newStreakDays] ?? 1.0;

  return { newStreakDays, newMultiplier };
}
```

`evaluateStreak` is called inside `snapshotDay()` and the result written to `playerSlice.recipeStreakDays` and `playerSlice.recipeStreakMultiplier`. The streak multiplier is then factored into `computeClickValue` as an additional stacking multiplier on top of the recipe multiplier.

### 9.3 Streak UI

A small streak indicator appears on `GameplayScreen` below the score:

```
🔥 3-Day Streak   ×1.08
```

It pulses briefly when the streak counter increments at day rollover. Losing a streak shows a brief grey "Streak lost" toast rather than a harsh penalty state — the tone stays encouraging.

---

## 10. Shop System

### 10.1 Decorations (Curry Currency)

Bought with in-game curry. Provide passive production. Some have affinity bonuses.

| Name | Cost | Passive Effect | Special |
|---|---|---|---|
| Lucky Neko Cat | 5K curry | +2 CPS | — |
| Golden Spatula Statue | 10K curry | +5 CPS | — |
| Spice Rack Deluxe | 18K curry | +10 CPS | +0.2 affinity to all spice pairs |
| Retro Arcade Cabinet | 25K curry | +15 CPS | — |
| Tandoor Oven | 40K curry | +25 CPS | +1 click value per spice in recipe |
| Curry Shrine | 80K curry | +50 CPS | Reveals 1 guaranteed recipe pair |
| Neon Sign | 150K curry | +80 CPS | — |
| Auto-Ladle Machine | 300K curry | +150 CPS | Acts as 2 auto-clicks/sec |
| Crystal Pot | 750K curry | +300 CPS | Doubles affinity bonus on legendary recipes |
| Dimensional Spice Cabinet | 2M curry | +600 CPS | Unlocks 6th guaranteed recipe slot |

### 10.2 Upgrades (Curry Currency, Tiered)

```
Click Upgrades (T1→T3):
  Wooden Spoon     →  10K  → ×1.5 click value
  Steel Ladle      →  50K  → ×2.0 click value
  Golden Ladle     → 200K  → ×3.0 click value

Auto-Production Upgrades:
  Sous Chef        →  20K  → +10 CPS
  Kitchen Brigade  → 100K  → +50 CPS
  Industrial Pot   → 500K  → +200 CPS

Recipe Upgrades:
  4th Slot Unlock  →   5K  → unlocks 4-ingredient recipes
  5th Slot Unlock  →  25K  → unlocks 5-ingredient recipes
  Affinity Lens    →  15K  → shows pairwise affinity values in Kitchen (upgrades hot/cold aura to show numbers)
  Flavor Radar     →  30K  → highlights top 3 ingredients for current recipe

Hint Upgrades:
  Whisper of Spice →   8K  → reveals 1 ingredient pair with high affinity
  Spice Oracle     →  40K  → reveals all pairs for your active recipe
  Master Taster    → 150K  → reveals one complete guaranteed recipe
```

### 10.3 IAP Cosmetics (Real Money — No Gameplay Effect)

All IAP items are cosmetics only and clearly labelled as such.

**Restaurant Skins** (change background of click area):
- Neon Night — $4.99
- Cyberpunk Kitchen — $6.99
- Zen Garden Kitchen — $4.99
- Rooftop Mumbai — $7.99
- Space Station Galley — $9.99

**Chef Avatars** (profile + leaderboard avatar):
- Various illustrated chef characters — $2.99 each
- Bundle packs — $9.99 / $14.99

**UI Themes** (accent colour palette override):
- Midnight Masala (dark mode) — $3.99
- Cherry Blossom — $3.99
- Ocean Curry — $3.99

**Cosmetic Bundle** — $19.99 (best value, includes 3 skins + 5 avatars)

> **IAP Architecture:** Stripe Checkout (web) → webhook → Supabase `purchases` table → `cosmeticsSlice` reads entitlements on login. No server-side validation gap: the entitlement is only granted after Stripe confirms `payment_intent.succeeded`.

---

## 11. Screen Architecture

### 11.1 Gameplay Screen (Main)

**Route:** `/` or `/play`

```
┌─────────────────────────────────────────────────┐
│  DAY 3/7     [SCORE: 1,250]    [LEADERBOARD] [⚙]│
├──────────── CHEF'S SPECIAL ─────────────────────┤
│  ⭐ Pair  🌶 Chili  +  🥛 Yogurt  → 2× clicks  │
│  [✓ IN YOUR RECIPE]                             │
├─────────────────────────────────────────────────┤
│                                                 │
│         [Kitchen Background / Active Skin]      │
│              (clickable area — full width)      │
│                                                 │
│   Active Recipe: 🌶 Chili + 🌿 Cumin + ...     │
│   Affinity: ⭐⭐⭐ GREAT  [2.0×]              │
│   Curry/Click: 180    Auto: 42/sec              │
│   🔥 3-Day Streak  ×1.08                        │
│                                                 │
│              [ MIX! 🔄 ]   (big CTA)           │
├─────────────────────────────────────────────────┤
│  [🍳 KITCHEN]  [🏪 STORE]  [👨‍🍳 PROFILE]         │
└─────────────────────────────────────────────────┘
```

- Clicking the kitchen area triggers the click engine
- FloatText particles spawn at cursor with `+{value}` in Spicetone orange; when Chef's Special is active, an additional `×2 SPECIAL` particle spawns in gold
- The kitchen background is replaced by the active restaurant skin
- Day progress shown as a pill progress bar below the score
- "MIX!" button re-opens KitchenScreen for recipe editing
- Streak counter only shown if `recipeStreakDays >= 2`

### 11.2 Kitchen Screen

**Route:** `/kitchen`

```
┌─────────────────────────────────────────────────┐
│  ← KITCHEN              [📖 COOKBOOK]  [👤] [⚙] │
│  Combine ingredients to discover recipes!        │
├───── CHEF'S SPECIAL CALLOUT ────────────────────┤
│  ⭐ TODAY: Chili + Yogurt = 2× — [MIX THEM IN] │
├──────────── CRAFTING STATION ───────────────────┤
│  [🌶 Chili] + [🌿 Cumin] + [  +  ] → [CRAFT]   │
│  Affinity Preview: showing live score as you add │
│  (Ingredient cards glow green/red as you hover  │
│   a new pick — hot/cold aura without numbers)   │
├─────────────── PANTRY (30 items) ───────────────┤
│  [ALL] [SPICE] [VEG] [PROTEIN] [DAIRY] [HERB]   │
│                                                 │
│  [🧄 Garlic  15] [🧅 Onion  42] [🟡 Turmeric 8]│
│  [🫚 Ginger  23] [💚 Cardamom 5] ...           │
│                                                 │
│  Numbers = quantity held. "IN USE" = in recipe. │
│  Locked slots show 🔒 (unlock via Upgrades)     │
└─────────────────────────────────────────────────┘
```

- Live affinity preview updates as each ingredient is added/removed
- **Hot/Cold Aura** — when hovering/dragging a pantry ingredient, all currently-slotted ingredient cards glow green (positive affinity) or red (negative affinity); direction only, no numbers
- **Affinity Lens** upgrade (purchased in Store) upgrades the aura to show exact pair values
- Chef's Special callout appears at the top; tapping `[MIX THEM IN]` auto-places both ingredients into the first two available slots
- `[📖 COOKBOOK]` button opens the `CookbookModal` overlay
- CRAFT RECIPE button finalises + returns to Gameplay; if the result is great/legendary and is a new recipe (not in Cookbook), the **Naming Ceremony** modal fires before the Kitchen closes

### 11.3 Cookbook Modal

Accessible via the `[📖 COOKBOOK]` button in the Kitchen. Shows every recipe the player has tried this week.

```
┌─────────────────────────────────────────────────┐
│  📖 YOUR COOKBOOK                   Week 26/2026│
│  12 recipes discovered                     [✕]  │
├─────────────────────────────────────────────────┤
│  [🏆 LEGENDARY]                                │
│  ★ Turmeric Thunder   🌟🌟🌟🌟🌟   3.0×    │
│    Turmeric · Saffron · Cardamom · Ghee · Mint  │
│                                                 │
│  [⭐ GREAT]                                     │
│  Chili Sunrise        ⭐⭐⭐⭐     2.0×     │
│    Chili · Cumin · Lemongrass · Yogurt          │
│                                                 │
│  [✦ GOOD]                                       │
│  Unnamed              ✦✦✦         1.5×     │
│    Garlic · Tomato · Ginger                     │
│                                                 │
│  [· NEUTRAL / ·· TERRIBLE — collapsed by default]│
└─────────────────────────────────────────────────┘
```

- Grouped by tier, sorted by multiplier descending within each group
- Named recipes (from the Naming Ceremony) display in Spicetone orange; unnamed show "Unnamed" in grey
- Favourite star (⭐) on any entry sets `isFavorite` in `CookbookEntry`; the Craft button on a Cookbook entry re-loads those slots into the crafting station
- Silhouette placeholder rows for recipes not yet discovered are **not shown** — the Cookbook only shows what the player has tried (unlike a full Pokédex reveal); this avoids spoiling recipe counts

### 11.4 Store Screen

**Route:** `/store`

```
┌─────────────────────────────────────────────────┐
│ ← STORE                         ⭐ 125K Curry   │
├─────────────────────────────────────────────────┤
│  UPGRADES         DECORATIONS         COSMETICS  │
├─────────────────────────────────────────────────┤
│  [Upgrade Card]   [Decoration Card]  [IAP Card]  │
│  Wooden Spoon     Lucky Neko Cat     Neon Night  │
│  ×1.5 click       +2 CPS            Skin - $4.99│
│  [10K ⭐ BUY]    [5K ⭐ BUY]       [$4.99 BUY] │
└─────────────────────────────────────────────────┘
```

- Three tabs: Upgrades, Decorations, Cosmetics
- Buttons disable + grey out if insufficient curry
- IAP items open Stripe Checkout in a modal
- Owned cosmetics show "ACTIVE / ACTIVATE" toggle instead of price

### 11.5 Leaderboard Screen

**Route:** `/leaderboard`

```
┌─────────────────────────────────────────────────┐
│  Curry Clicker          [Leaderboard] [⚙]        │
├──────────── Top Chefs · SEASON 4 ───────────────┤
│                                                 │
│  1  🧑 SpicyBoi99    Master of Masala   14.2B   │
│  2  🧑 GaramGorilla                     12.8B   │
│  3  🧑 TikkaTaco                        10.1B   │
│  ⋮                                              │
│                ── YOU ──                        │
│ 42  🧑 CurryNewbie   Rising Star         4.2M   │
│ 43  🧑 VindalooViper                     4.1M   │
│                                                 │
│  [GLOBAL]  [FRIENDS]  [THIS WEEK] [ALL TIME]    │
└─────────────────────────────────────────────────┘
```

- Real-time via Supabase Realtime subscription on `leaderboard` table
- Current player always shown in context with neighbours
- Tabs: Global / Friends / This Week / All Time
- Season badge shown prominently (each week = one season)
- Clicking a row opens a read-only ProfileScreen for that player

### 11.6 Chef Profile Screen

**Route:** `/profile` or `/profile/:userId`

```
┌─────────────────────────────────────────────────┐
│  Curry Clicker                        [📊] [⚙]  │
│                                                 │
│           [Chef Avatar LVL 99]                  │
│           Spicy Master                          │
│           Legendary Sous Chef                   │
│                                                 │
│   TOTAL CURRY MADE: 14,502,890                  │
│   [342 Days Cooked]  [124.5 Clicks/Sec]         │
│                                                 │
│   Badges: [Spicy Boy] [Curry King] [Speedster]  │
│                                                 │
│   Current Gear:                                 │
│   [🥄 Golden Ladle  LVL 12  +500/click]         │
│   [🍲 Industrial Pot LVL 8  +1200 Auto/Sec]     │
└─────────────────────────────────────────────────┘
```

---

## 12. State Management (Zustand)

### 12.1 Store Shape

```typescript
// store/useGameStore.ts
const useGameStore = create<GameStore>()(
  immer(
    persist(
      (set, get) => ({
        ...playerSlice(set, get),
        ...recipeSlice(set, get),
        ...shopSlice(set, get),
        ...weekSlice(set, get),
        ...cosmeticsSlice(set, get),
      }),
      {
        name: "curry-clicker-save",
        storage: createJSONStorage(() => localStorage),
        // Cloud sync handled separately via useAutoSave hook
      }
    )
  )
);
```

### 12.2 Key Actions

```typescript
// playerSlice actions
addCurry(amount: number)        // Add to currentCurry + weekCurry + allTime
spendCurry(amount: number)      // Deduct from currentCurry (throws if insufficient)
addXP(amount: number)           // XP + level-up check
earnBadge(badgeId: string)      // Idempotent badge award
updateStreak(snapshot: DailySnapshot) // Calls evaluateStreak, updates recipeStreakDays + Multiplier

// recipeSlice actions
setIngredient(slot: number, id: string | null)  // Add/remove from recipe
computeRecipe()                                  // Recalculate multiplier; triggers discovery check
saveRecipe(name?: string)                        // Save to discovered recipes
logDiscoveredRecipe(recipe: Recipe)              // Upsert into cookbook; deduped by fingerprint
nameRecipe(fingerprint: string, name: string)    // Update CookbookEntry.name post-ceremony

// weekSlice actions
snapshotDay()                    // Saves daily stats including tierAtDayEnd; triggers evaluateStreak
advanceDay()                     // day++ and resets dayProgress; recomputes dailySpecial
endWeek()                        // Triggers WeekSummaryModal, submits score
startNewWeek()                   // Resets weekCurry, refreshes seed, clears highestTierSeen
checkSpecialClaimed(slots)       // Marks dailySpecial.claimed if both ingredients are present
triggerTierDiscovery(tier)       // Sets highestTierSeen; fires TierDiscoveryOverlay if tier is new

// shopSlice actions
purchaseDecoration(id: string)
purchaseUpgrade(id: string)
activateSkin(id: string)
```

---

## 13. Backend (Supabase)

### 13.1 Database Schema

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_id TEXT DEFAULT 'default',
  level INT DEFAULT 1,
  total_curry BIGINT DEFAULT 0,
  days_cooked INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly seeds (one row per week)
CREATE TABLE weekly_seeds (
  week_id TEXT PRIMARY KEY,         -- e.g. '2026-W26'
  seed BIGINT NOT NULL,
  guaranteed_recipes JSONB NOT NULL, -- Array of ingredient ID arrays
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ NOT NULL
);

-- Leaderboard (upsert weekly scores)
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  week_id TEXT NOT NULL,
  score BIGINT NOT NULL,
  recipe_fingerprint TEXT,           -- Hash of recipe used for #1 spot
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_id)
);
CREATE INDEX ON leaderboard(week_id, score DESC);

-- Game saves (cloud backup)
CREATE TABLE game_saves (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  save_data JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases (IAP entitlements)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  item_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_usd INT NOT NULL,           -- Cents
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.2 Row Level Security

```sql
-- Players can only read their own save data
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_save" ON game_saves
  USING (auth.uid() = user_id);

-- Leaderboard is public read, authenticated write
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "own_score" ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Purchases read-only for owner, write-only via service role (webhook)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_purchases" ON purchases FOR SELECT
  USING (auth.uid() = user_id);
```

### 13.3 Edge Functions

**`generate-weekly-seed`** (cron, Sunday 00:00 UTC)
- Generates new seed + guaranteed recipes
- Inserts into `weekly_seeds`
- Sends push notification / in-game alert to active players

**`submit-score`** (called on week end)
- Receives `{ userId, weekId, score, recipeFP }`
- Validates score is plausible (anti-cheat: compare against max possible score for the week given elapsed time)
- Upserts into `leaderboard`

**`stripe-webhook`** (POST from Stripe)
- Validates Stripe signature
- On `payment_intent.succeeded`: inserts into `purchases`
- IAP items are only ever granted server-side

---

## 14. Anti-Cheat Approach

Since score is accumulated client-side, soft server-side validation is used:

1. **Plausibility bound:** Server knows the week started N hours ago. Max theoretically achievable score = `maxClicksPerHour × N × maxMultiplier`. Scores above 3× this are flagged.
2. **Recipe fingerprint:** The recipe used for the top score is stored. Top-10 scores with implausible recipes trigger a manual review flag.
3. **Session telemetry (optional):** Client can batch-send click events every 60s. Server spot-checks that click rate never exceeds a human maximum (~20 CPS).
4. **No hard blocks:** Cheaters are flagged for review, not immediately banned — reduces false positives from extreme legitimate play.

---

## 15. Animation & Juice

All animations via Framer Motion:

```typescript
// FloatText.tsx — spawns on click at cursor position
<motion.div
  initial={{ opacity: 1, y: 0, scale: 1 }}
  animate={{ opacity: 0, y: -60, scale: 1.3 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
  className="pointer-events-none absolute font-label-bold text-primary-container"
>
  +{value}
</motion.div>

// When Chef's Special is active, a second FloatText spawns above the curry value:
<motion.div
  initial={{ opacity: 1, y: 0, scale: 1.2 }}
  animate={{ opacity: 0, y: -80, scale: 0.9 }}
  transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
  className="pointer-events-none absolute font-label-bold text-amber-400"
>
  ×2 SPECIAL
</motion.div>

// ClickTarget.tsx — kitchen area press animation
<motion.div
  whileTap={{ scale: 0.96 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
/>

// ScoreDisplay.tsx — pulse on score change
<motion.span
  key={score}   // re-mounts on score change = triggers animation
  initial={{ scale: 1.15 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 300, damping: 15 }}
/>

// WeekSummaryModal — slide-up celebration
<motion.div
  initial={{ y: "100%" }}
  animate={{ y: 0 }}
  exit={{ y: "100%" }}
  transition={{ type: "spring", damping: 20 }}
/>
```

### 15.1 Discovery Moments (TierDiscoveryOverlay)

Fires the first time a new affinity tier is reached this week. Intensity scales with tier:

```typescript
// components/TierDiscoveryOverlay.tsx

const TIER_CONFIG: Record<RecipeTier, TierDiscoveryConfig> = {
  good: {
    label: "GOOD SYNERGY!",
    color: "text-green-400",
    overlay: "bg-green-500/10",
    duration: 800,
    particles: 8,
  },
  great: {
    label: "GREAT SYNERGY!",
    color: "text-amber-400",
    overlay: "bg-amber-500/15",
    duration: 1200,
    particles: 16,
  },
  legendary: {
    label: "✨ LEGENDARY! ✨",
    color: "text-yellow-300",
    overlay: "bg-yellow-400/20",
    duration: 2000,
    particles: 32,
  },
};

// Full-screen shimmer overlay for legendary; burst flash for great; subtle pulse for good
// Pauses the game loop during the overlay (phase is briefly set to "discovery_celebration")
// Auto-dismisses after config.duration — no button needed for good/great; legendary
// has an optional "COOK IT!" CTA that dismisses and returns focus to the click area
```

The check lives in `computeRecipe()` in `recipeSlice`:

```typescript
// recipeSlice.ts — inside computeRecipe()
const newScore = scoreRecipe(slots, affinityMatrix);
const prevHighest = get().week.highestTierSeen;

if (TIER_ORDER[newScore.tier] > TIER_ORDER[prevHighest]) {
  get().triggerTierDiscovery(newScore.tier);
}
```

`TIER_ORDER` is `{ none: 0, terrible: 1, neutral: 2, good: 3, great: 4, legendary: 5 }` so the check is a simple integer comparison.

### 15.2 Naming Ceremony (RecipeNamingModal)

Fires once, after `CRAFT` is pressed, if the resulting recipe is `great` or `legendary` and its fingerprint is not already in the Cookbook.

```typescript
// components/RecipeNamingModal.tsx

// Modal slides up from the bottom (same spring as WeekSummaryModal)
// Shows: tier badge, ingredient list, multiplier
// Auto-generates a two-word name from a seeded list (e.g. "Crimson Blaze", "Golden Storm")
//   → players can accept the default or type their own (max 32 chars)
// On confirm: calls nameRecipe(fingerprint, name) and logDiscoveredRecipe(recipe)
// On skip: calls logDiscoveredRecipe(recipe) with name = undefined — shows as "Unnamed" in Cookbook

// The brief pause before the modal opens uses a 400ms delay after the CRAFT animation
// completes — the recipe slots animate into a "lock" state (slight golden shimmer)
// so the moment feels earned before the modal appears
```

---

## 16. Badge System

Badges are earned automatically when conditions are met, checked in `addCurry` / `snapshotDay` / `endWeek`:

| Badge | Condition |
|---|---|
| Spicy Boy | Make your first curry |
| Curry King | Earn 1M curry total |
| Speedster | Click 1,000 times in one day |
| Week Warrior | Complete a full 7-day week |
| Recipe Master | Discover 10 different recipes (Cookbook entries) |
| Synergy Seeker | Craft a Legendary affinity recipe |
| Top 10 Chef | Reach top 10 on the weekly leaderboard |
| Secret | (Hidden — complete a guaranteed recipe) |
| Cosmetic Collector | Own 5 IAP cosmetic items |
| Combo King | Use all 5 recipe slots in one recipe |
| Special Collector | Claim Chef's Special bonus 5 days in one week |
| Streak Master | Maintain a good-tier recipe for all 7 days in a week |
| Curator | Name 5 recipes via the Naming Ceremony |

---

## 17. Offline / Offline-First

```typescript
// useAutoSave.ts
// Every 30 seconds (debounced), sync state to Supabase
// On reconnect after offline: compare server timestamp vs local
// Take whichever is MORE RECENT (prevents rollback but avoids cheat injection)
// While offline: localStorage is source of truth
// Auto-production continues during offline: on reconnect, calculate
//   offlineCurry = autoProduction * offlineDurationSeconds * 0.5
//   (50% efficiency cap to limit offline abuse)
// dailySpecial is re-derived from seed on reconnect — no network call needed
```

---

## 18. Implementation Roadmap

### Phase 1 — Core Loop (Weeks 1–3)
- [ ] Vite + React + Tailwind + Spicetone tokens setup
- [ ] Zustand store (player, recipe, week slices)
- [ ] 30 ingredient definitions + SVG icons
- [ ] Affinity engine (seeded RNG, guaranteed recipes, scoring formula)
- [ ] Kitchen screen (pantry grid, crafting station, live affinity preview)
- [ ] **Hot/Cold Aura** on IngredientCard (direction-only, no numbers)
- [ ] Gameplay screen (click area, FloatText, score display, auto-production loop)
- [ ] localStorage persistence

### Phase 2 — Progression (Weeks 4–5)
- [ ] Week simulation (day counter, progress bar, week summary modal)
- [ ] **Chef's Special** (getDailySpecial, DailySpecialBanner, claim detection, ×2 FloatText)
- [ ] **Discovery Moments** (TierDiscoveryOverlay, highestTierSeen tracking, tier-scaled animation)
- [ ] **Recipe Streak** (evaluateStreak, streak indicator UI, streak multiplier in click engine)
- [ ] **Recipe Cookbook** (CookbookModal, logDiscoveredRecipe, fingerprint deduplication)
- [ ] **Naming Ceremony** (RecipeNamingModal, auto-name generator, post-CRAFT trigger)
- [ ] Shop screen (decorations + upgrades, purchase flow)
- [ ] Upgrades applied to click/auto values
- [ ] **Affinity Lens upgrade** upgrades aura from direction-only to numeric pair values
- [ ] Badge system (including Special Collector, Streak Master, Curator)
- [ ] XP + levelling

### Phase 3 — Backend (Weeks 6–7)
- [ ] Supabase project setup + migrations
- [ ] Auth (email/password + Google OAuth)
- [ ] Cloud save sync (useAutoSave) — Cookbook + streak state included in save_data JSONB
- [ ] Weekly seed Edge Function (cron)
- [ ] Leaderboard screen + Realtime subscription
- [ ] Score submission Edge Function + anti-cheat plausibility check

### Phase 4 — IAP & Cosmetics (Week 8)
- [ ] Restaurant skins (swap background image)
- [ ] Chef avatar selector
- [ ] Stripe Checkout integration
- [ ] Stripe webhook → purchases table → cosmeticsSlice
- [ ] Store cosmetics tab

### Phase 5 — Polish (Weeks 9–10)
- [ ] Full Framer Motion pass (click juice, screen transitions, week summary, discovery overlays)
- [ ] Mobile responsive layout (bottom-sheet shop on mobile; press-hold for hot/cold aura)
- [ ] Dark mode (Midnight Masala theme + system preference)
- [ ] Onboarding tutorial (first-time player guide to Kitchen + clicking + Chef's Special)
- [ ] Sound effects (optional — howler.js; discovery moment sounds scale with tier)
- [ ] Push notifications for week reset (web push API)

### Phase 6 — Launch Prep
- [ ] Performance audit (Lighthouse, bundle size)
- [ ] Anti-cheat telemetry
- [ ] Friends list (Supabase social graph or Clerk)
- [ ] Marketing page + SEO
- [ ] App Store wrapper via Capacitor (optional mobile port)

---

## 19. Key Design Decisions & Rationale

**Why a seeded weekly matrix?** — Creates a shared meta-conversation ("did you find the saffron combo this week?"). All players have equal access to the same optimal recipes, so the leaderboard is skill/time based, not luck based.

**Why guarantee 6 positive recipes?** — New players need to stumble onto at least one good combo in their first week or they'll churn. Six guarantees means casual players find one by day 3.

**Why cosmetics-only IAP?** — Respects the player base, avoids pay-to-win, keeps the weekly leaderboard fair. Players who spend money signal loyalty; they should be rewarded with expression, not power.

**Why Supabase over custom backend?** — Realtime subscriptions for the leaderboard are built-in. Auth, storage, and Postgres are all unified. Edge Functions handle the cron + webhook needs. Much faster to ship than a custom Node/Express server.

**Why Zustand over Redux?** — Clicker games have extremely frequent state mutations (60fps + every click). Zustand + Immer has less overhead per mutation than Redux Toolkit's reducers. Also far less boilerplate for a team likely to be 1–3 engineers.

**Why direction-only for the Hot/Cold Aura?** — Showing raw affinity numbers for free would short-circuit the discovery loop entirely. The aura gives enough signal to guide experimentation without replacing it. The Affinity Lens upgrade then monetises (in curry, not real money) the desire for precision.

**Why gate the Naming Ceremony to great/legendary?** — Naming everything would dilute the ceremony. Reserving it for high-tier recipes makes the modal feel like a reward rather than friction, and gives players a reason to push beyond neutral combos.

**Why derive Chef's Special from the weekly seed?** — Keeps it deterministic for all players and works offline. It also means no extra database table or edge function is needed — the daily special is a pure function of `(seed, day)`.

**Why track streak per day rather than per session?** — Day-based tracking rewards players who return each day, which aligns with the weekly competition structure. Session-based tracking would reward marathon sessions but not retention.
