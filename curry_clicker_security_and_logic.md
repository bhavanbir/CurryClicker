# Curry Clicker — Security, Game Logic & Large Number Handling

> Companion to the main framework document. Covers every attack surface, how game
> logic is structured in code, how arbitrarily-large curry counts are stored and
> displayed, and the complete authentication lifecycle.

---

## Part 1 — How Game Logic Is Handled in Code

### 1.1 The State Machine

The game lives in a single Zustand store. Every meaningful action goes through a
typed action creator — nothing mutates state directly from a UI component.

```
IDLE ──[click]──► COOKING ──[week ends]──► WEEK_SUMMARY
                     │                          │
                     └──[new week starts]────────┘
```

The `phase` field in `weekSlice` drives which overlay is shown. This prevents
the game loop from running during the summary screen (so auto-production is
paused correctly).

```typescript
// store/slices/weekSlice.ts
type GamePhase = "idle" | "cooking" | "week_summary" | "loading";

interface WeekSlice {
  phase: GamePhase;
  currentDay: number;       // 1–7
  dayProgress: number;      // 0.0–1.0 within the current day
  weekId: string;           // ISO week identifier e.g. "2026-W26"
  weekCurry: Decimal;       // Accumulated this week (see Part 2 for Decimal)
  dailySnapshots: DailySnapshot[];
}
```

### 1.2 The Game Loop

A single `requestAnimationFrame` loop drives everything. React components
subscribe to store values — they do NOT drive timing.

```typescript
// hooks/useGameLoop.ts

import { useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";

export function useGameLoop() {
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(performance.now());

  const { phase, autoProduction, addCurrencyFromAuto, advanceDayProgress } =
    useGameStore();

  useEffect(() => {
    if (phase !== "cooking") return; // Pause during summary / loading

    function tick(now: number) {
      const deltaMs = Math.min(now - lastTickRef.current, 1000);
      // Clamp delta to 1 second — prevents massive catch-up if tab was hidden
      lastTickRef.current = now;

      const deltaSec = deltaMs / 1000;

      // Auto-production: curry earned passively
      if (autoProduction.gt(0)) {
        addCurrencyFromAuto(autoProduction.mul(deltaSec));
      }

      // Day progression
      advanceDayProgress(deltaSec / DAY_DURATION_SECONDS);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, autoProduction]);
}
```

**Why clamp delta to 1 second?** If the player switches tabs, `requestAnimationFrame`
throttles to ~1fps or pauses entirely. Without a clamp, returning after 5 minutes
would give a 300,000ms delta, awarding 5 minutes of auto-production in one tick.
We want offline production to be calculated separately (at a reduced rate), not
silently given as a giant tick.

### 1.3 Click Handler

```typescript
// engine/clickEngine.ts

import Decimal from "break-infinity.js";
import { INGREDIENTS } from "./ingredients";
import { AffinityMatrix } from "./affinityEngine";

export interface ClickResult {
  value: Decimal;
  floatLabel: string;  // "+1.2K" etc — pre-formatted for FloatText component
}

export function handleClick(
  recipe: ActiveRecipe,
  upgrades: PurchasedUpgrades,
  decorations: OwnedDecorations,
  affinityMatrix: AffinityMatrix
): ClickResult {
  // 1. Base value: sum of ingredient baseValues in recipe
  const baseValue = recipe.slots
    .filter(Boolean)
    .reduce((sum, id) => sum + INGREDIENTS[id!].baseValue, 0);

  // 2. Recipe multiplier from affinity engine
  const recipeMultiplier = computeRecipeMultiplier(recipe.slots, affinityMatrix);

  // 3. Upgrade click multiplier (stacked, multiplicative)
  const upgradeMultiplier = upgrades.clickMultipliers.reduce(
    (acc, m) => acc * m,
    1
  );

  // 4. Decoration flat bonus
  const decorationBonus = decorations
    .filter((d) => d.owned)
    .reduce((sum, d) => sum + d.passiveClickBonus, 0);

  const raw = new Decimal(baseValue)
    .mul(recipeMultiplier)
    .mul(upgradeMultiplier)
    .add(decorationBonus);

  return {
    value: raw.floor(),
    floatLabel: "+" + formatCurry(raw.floor()),
  };
}
```

### 1.4 Recipe Multiplier Pipeline

This is the heart of the affinity system. Every time a slot changes in the
Kitchen, this recomputes instantly (it's O(n²) for n ≤ 5, so effectively O(1)).

```typescript
// engine/recipeEngine.ts

export type RecipeTier =
  | "none"
  | "terrible"   // avg affinity < -0.3
  | "neutral"    // -0.3 to 0.3
  | "good"       // 0.3 to 0.8
  | "great"      // 0.8 to 1.3
  | "legendary"; // > 1.3

export interface RecipeScore {
  affinityScore: number;    // Raw sum of all pairwise affinities
  avgAffinity: number;      // Per-pair average
  multiplier: number;       // Final multiplier applied to click value
  tier: RecipeTier;
  pairBreakdown: PairScore[]; // For the Affinity Lens upgrade UI
}

export interface PairScore {
  a: string;      // ingredient ID
  b: string;      // ingredient ID
  affinity: number;
}

const MULTIPLIER_CURVE: [number, number][] = [
  // [avgAffinity threshold, multiplier]
  [-Infinity, 0.5],  // terrible
  [-0.3,      0.75],
  [0.3,       1.0],
  [0.8,       1.5],
  [1.3,       2.25],
  [1.6,       3.5],  // legendary — needs all 5 slots AND a great combo
];

export function computeRecipeScore(
  slots: (string | null)[],
  matrix: AffinityMatrix
): RecipeScore {
  const ids = slots.filter((s): s is string => s !== null);

  if (ids.length === 0) {
    return { affinityScore: 0, avgAffinity: 0, multiplier: 1,
             tier: "none", pairBreakdown: [] };
  }

  let totalAffinity = 0;
  let pairCount = 0;
  const pairBreakdown: PairScore[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const val = matrix[ids[i]]?.[ids[j]] ?? 0;
      totalAffinity += val;
      pairCount++;
      pairBreakdown.push({ a: ids[i], b: ids[j], affinity: val });
    }
  }

  const avgAffinity = pairCount > 0 ? totalAffinity / pairCount : 0;

  // Walk the curve from top down to find the correct multiplier
  let multiplier = 0.5;
  for (const [threshold, mult] of MULTIPLIER_CURVE) {
    if (avgAffinity >= threshold) multiplier = mult;
  }

  const tier = avgAffinityToTier(avgAffinity);

  return { affinityScore: totalAffinity, avgAffinity, multiplier,
           tier, pairBreakdown };
}
```

### 1.5 Auto-Production Calculation

```typescript
// Called once whenever upgrades or decorations change — not every frame
export function computeAutoProduction(
  recipe: ActiveRecipe,
  upgrades: PurchasedUpgrades,
  decorations: OwnedDecorations,
  matrix: AffinityMatrix
): Decimal {
  const recipeMultiplier = computeRecipeScore(recipe.slots, matrix).multiplier;

  const decorationCPS = decorations
    .filter((d) => d.owned)
    .reduce((sum, d) => sum + d.passiveCurryPerSec * d.quantity, 0);

  const autoClickerCPS = upgrades.autoClickersPerSec; // from auto-clicker upgrades

  // Auto-production is also subject to recipe multiplier — good recipes
  // boost both clicking AND passive income
  return new Decimal(decorationCPS + autoClickerCPS).mul(recipeMultiplier);
}
```

### 1.6 Week Progression & Summary

```typescript
// store/slices/weekSlice.ts (action implementations)

snapshotDay: () =>
  set((state) => {
    state.week.dailySnapshots.push({
      day: state.week.currentDay,
      curryEarned: state.week.todayCurry.toString(), // Stored as string
      clicksMade: state.week.todayClicks,
      topRecipeUsed: state.recipe.fingerprint,
      decorationBonus: computeDecorationCPS(state.shop.decorations),
    });
    state.week.todayCurry = new Decimal(0);
    state.week.todayClicks = 0;
  }),

advanceDay: () =>
  set((state) => {
    state.week.currentDay += 1;
    state.week.dayProgress = 0;
    if (state.week.currentDay > 7) {
      state.week.phase = "week_summary";
      // Score submission happens here — see Part 3
    }
  }),
```

---

## Part 2 — Handling Very Large Score Numbers

### 2.1 Why JavaScript Numbers Break

JavaScript uses IEEE 754 double-precision floats. The maximum **safe** integer is:

```
Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991  (~9 quadrillion)
```

In a clicker game with:
- 3.5× recipe multiplier
- 3× upgrade multiplier  
- 200 CPS auto-production
- 604,800 seconds per week (real-time)

A high-end player could accumulate: `3.5 × 3 × 200 × 604800 = ~1.27 billion per
week` at the low end. With stacked upgrades targeting 1000× multipliers (common
in idle games after a few seasons), scores can reach **10²⁰** or beyond. Native
`number` breaks at 9 × 10¹⁵. This means scores are corrupted silently — no
error is thrown, precision is just lost.

### 2.2 The Solution: `break-infinity.js`

`break-infinity.js` is the standard library for idle/clicker games. Unlike
`decimal.js` (general-purpose, slow) or `BigInt` (integers only, no float
multipliers), `break-infinity.js` stores numbers as `{ mantissa, exponent }` and
supports up to 10^(10^308). Every arithmetic operation returns a new Decimal.

```bash
npm install break-infinity.js
```

```typescript
// lib/decimal.ts — re-export with app-level defaults
export { Decimal } from "break-infinity.js";

// Everywhere in engine code:
import { Decimal } from "../lib/decimal";

const score = new Decimal("1.27e20");
const bonus = new Decimal(500);
const total = score.add(bonus);     // Decimal arithmetic
const doubled = total.mul(2);
total.gt(new Decimal("1e18"));     // true — comparison methods
total.toString();                   // "1.27e20"
```

### 2.3 Display Formatting

Never show raw scientific notation to players. Use suffix notation that feels
natural for a game:

```typescript
// lib/format.ts

import { Decimal } from "./decimal";

const SUFFIXES = [
  "",        // < 1,000
  "K",       // thousand
  "M",       // million
  "B",       // billion
  "T",       // trillion
  "Qa",      // quadrillion
  "Qi",      // quintillion
  "Sx",      // sextillion
  "Sp",      // septillion
  "Oc",      // octillion
  "No",      // nonillion
  "Dc",      // decillion
  // Extend as needed — clicker games regularly reach Dc and beyond
];

export function formatCurry(value: Decimal, decimals = 2): string {
  if (value.lt(1000)) return value.floor().toString();

  const log3 = Math.floor(value.log10().toNumber() / 3);
  const index = Math.min(log3, SUFFIXES.length - 1);

  if (index >= SUFFIXES.length) {
    // Beyond our suffix table — use scientific notation as fallback
    return value.toExponential(2);
  }

  const divisor = new Decimal(10).pow(index * 3);
  const display = value.div(divisor).toFixed(decimals);
  return `${display}${SUFFIXES[index]}`;
}

// Examples:
// formatCurry(new Decimal(0))          → "0"
// formatCurry(new Decimal(1250))       → "1.25K"
// formatCurry(new Decimal("1.27e20"))  → "127.00Qa"
// formatCurry(new Decimal("9.5e33"))   → "9.50Dc"

// For the score display (no decimals, abbreviated):
export function formatScore(value: Decimal): string {
  return formatCurry(value, 1);
}

// For precise UI (shop prices etc — round to nearest integer up to 1B):
export function formatPrice(value: Decimal): string {
  if (value.lt(1e9)) return value.floor().toNumber().toLocaleString();
  return formatCurry(value, 2);
}
```

### 2.4 Storing Large Numbers in the Database

`BIGINT` in Postgres caps at **9,223,372,036,854,775,807** (~9.2 quintillion).
While that sounds large, a veteran player in a long-running game can exceed it.

**Use `NUMERIC` (arbitrary precision) or `TEXT` for score storage:**

```sql
-- migrations/002_leaderboard.sql

CREATE TABLE leaderboard (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  week_id     TEXT NOT NULL,
  score       NUMERIC NOT NULL,         -- Arbitrary precision, not BIGINT
  score_text  TEXT NOT NULL,            -- "1.27e20" — for display without parsing
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_id)
);

-- Game saves also store Decimal values as strings in JSONB
CREATE TABLE game_saves (
  user_id      UUID PRIMARY KEY REFERENCES profiles(id),
  save_data    JSONB NOT NULL,    -- Decimals serialised as strings: "1.27e20"
  version      INT NOT NULL DEFAULT 1,
  saved_at     TIMESTAMPTZ DEFAULT NOW()
);
```

**Serialisation pattern in the save system:**

```typescript
// lib/saveSerializer.ts

// Before sending to Supabase — convert all Decimals to strings
export function serializeState(state: GameState): SerializedState {
  return {
    ...state,
    player: {
      ...state.player,
      currentCurry: state.player.currentCurry.toString(),
      totalCurryAllTime: state.player.totalCurryAllTime.toString(),
      weekCurry: state.player.weekCurry.toString(),
    },
    // Recurse for any nested Decimal fields
  };
}

// After loading from Supabase — revive strings back to Decimal
export function deserializeState(raw: SerializedState): GameState {
  return {
    ...raw,
    player: {
      ...raw.player,
      currentCurry: new Decimal(raw.player.currentCurry),
      totalCurryAllTime: new Decimal(raw.player.totalCurryAllTime),
      weekCurry: new Decimal(raw.player.weekCurry),
    },
  };
}
```

### 2.5 Leaderboard Ordering with NUMERIC

Postgres `NUMERIC` columns sort correctly with `ORDER BY score DESC` without any
special handling. The `score_text` column is stored for fast display without
parsing the full NUMERIC back into a Decimal on the client.

```sql
-- Example leaderboard query (used by Edge Function)
SELECT
  p.display_name,
  p.avatar_id,
  l.score_text,
  l.score,
  RANK() OVER (PARTITION BY l.week_id ORDER BY l.score DESC) AS rank
FROM leaderboard l
JOIN profiles p ON p.id = l.user_id
WHERE l.week_id = $1
ORDER BY l.score DESC
LIMIT 100;
```

---

## Part 3 — Authentication, Account Creation & CAPTCHA

### 3.1 Architecture Overview

```
Browser (React)
    │
    ├── Sign-up form ──────────────────────► Supabase Auth (email/password)
    │       │ CAPTCHA token first                    │
    │       │                               Email verification sent
    │       │                                        │
    ├── Login form ─────────────────────────────────►│
    │       │ CAPTCHA token first            JWT issued (access + refresh)
    │       │                                        │
    └── All API calls ───────────── Authorization: Bearer <JWT> ──► RLS
```

Supabase Auth handles the full lifecycle: account creation, email verification,
password reset, JWT issuance, and session refresh. We add CAPTCHA on top of
the sign-up and sign-in endpoints using Cloudflare Turnstile.

### 3.2 Why Cloudflare Turnstile (not reCAPTCHA)

- **Privacy:** Does not track users across sites (unlike reCAPTCHA v2/v3)
- **UX:** Usually invisible — no "click all the traffic lights" puzzles
- **Free:** Unlimited challenges at no cost
- **Supabase native support:** Supabase Auth has a `captchaToken` field built into
  `signUp` and `signInWithPassword` — no custom middleware needed

### 3.3 Supabase Auth Configuration (Dashboard settings)

```
Authentication → Settings:
  ✅ Enable email confirmations (required before first login)
  ✅ Enable CAPTCHA protection → select "Cloudflare Turnstile"
      Site Key: <from Cloudflare dashboard>
      Secret Key: <from Cloudflare dashboard>
  Minimum password length: 8
  ✅ Prevent use of leaked passwords (HaveIBeenPwned check)
  JWT expiry: 3600 seconds (1 hour)
  Refresh token rotation: enabled
  Reuse interval: 10 seconds
```

### 3.4 Sign-Up Flow (Frontend Code)

```typescript
// screens/auth/SignUpScreen.tsx

import Turnstile from "react-turnstile"; // npm install react-turnstile
import { supabase } from "../../lib/supabase";
import { validateSignUpForm } from "../../lib/validation";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"form" | "verify_email">("form");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation first (never rely on this alone)
    const validationError = validateSignUpForm({ email, password, displayName });
    if (validationError) { setError(validationError); return; }

    if (!captchaToken) {
      setError("Please complete the CAPTCHA check.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          captchaToken,                    // Supabase verifies this server-side
          data: { display_name: displayName.trim() }, // Stored in auth.users.raw_user_meta_data
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // Map Supabase error codes to user-friendly messages
        setError(mapAuthError(authError.message));
        return;
      }

      if (data.user?.identities?.length === 0) {
        // Email already registered — give the same message to prevent enumeration
        setError("If this email isn't registered, check your inbox for a verification link.");
        return;
      }

      setStage("verify_email");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "verify_email") {
    return <VerifyEmailPrompt email={email} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        maxLength={24}
        placeholder="Chef name"
        autoComplete="username"
        required
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        autoComplete="email"
        required
      />
      <PasswordInput
        value={password}
        onChange={setPassword}
        showStrengthMeter
      />
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        onVerify={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        onError={() => setCaptchaToken(null)}
        theme="light"
        refreshExpired="auto"
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <button type="submit" disabled={loading || !captchaToken}>
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
```

### 3.5 Login Flow

```typescript
// screens/auth/LoginScreen.tsx

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!captchaToken) { setError("Complete the CAPTCHA."); return; }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
      options: { captchaToken },
    });

    if (authError) {
      // NEVER distinguish "wrong email" from "wrong password" — 
      // that leaks account existence (user enumeration attack)
      setError("Incorrect email or password.");
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email}
             onChange={e => setEmail(e.target.value)}
             autoComplete="email" required />
      <input type="password" value={password}
             onChange={e => setPassword(e.target.value)}
             autoComplete="current-password" required />
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        onVerify={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        refreshExpired="auto"
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={!captchaToken}>Sign In</button>
      <a href="/auth/reset-password">Forgot password?</a>
    </form>
  );
}
```

### 3.6 Password Validation

```typescript
// lib/validation.ts

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < 8)
    errors.push("At least 8 characters required.");
  if (password.length > 128)
    errors.push("Password must be under 128 characters.");
  if (!/[A-Z]/.test(password))
    errors.push("Include at least one uppercase letter.");
  if (!/[0-9]/.test(password))
    errors.push("Include at least one number.");
  // Do NOT require special characters — NIST SP 800-63B recommends against it
  // as it makes passwords harder to remember without improving security

  return { valid: errors.length === 0, errors };
}

export function validateDisplayName(name: string): string | null {
  if (name.trim().length < 2) return "Chef name must be at least 2 characters.";
  if (name.trim().length > 24) return "Chef name must be 24 characters or fewer.";
  // Allow letters, numbers, spaces, underscores, hyphens
  if (!/^[\w\s\-]+$/u.test(name.trim()))
    return "Chef name can only contain letters, numbers, spaces, _ and -.";
  // Block homoglyph attacks (e.g. using Cyrillic А to impersonate Latin A)
  // Simple approach: restrict to Basic Latin + Latin Supplement for now
  if (/[^\u0000-\u024F]/.test(name))
    return "Chef name contains unsupported characters.";
  return null;
}

export function validateSignUpForm(fields: {
  email: string;
  password: string;
  displayName: string;
}): string | null {
  const nameError = validateDisplayName(fields.displayName);
  if (nameError) return nameError;

  if (!fields.email.includes("@")) return "Enter a valid email address.";

  const { valid, errors } = validatePassword(fields.password);
  if (!valid) return errors[0];

  return null;
}
```

### 3.7 Session Handling

```typescript
// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,          // Stores JWT in localStorage
      autoRefreshToken: true,        // Auto-refreshes before expiry
      detectSessionInUrl: true,      // Handles email verification redirects
      storageKey: "curry-clicker-auth",
    },
  }
);

// Auth state listener — drives the app's top-level routing
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) {
    useAuthStore.getState().setUser(session.user);
    loadCloudSave(session.user.id);   // Fetch save on login
  }
  if (event === "SIGNED_OUT") {
    useAuthStore.getState().clearUser();
    useGameStore.getState().resetToDefault();
  }
  if (event === "TOKEN_REFRESHED") {
    // Access token silently refreshed — no action needed
  }
  if (event === "USER_UPDATED") {
    // Email change confirmed etc.
    useAuthStore.getState().setUser(session!.user);
  }
});
```

### 3.8 Email Verification Callback

```typescript
// screens/auth/AuthCallbackScreen.tsx
// Route: /auth/callback

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function AuthCallbackScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the token exchange automatically when detectSessionInUrl=true
    // We just need to redirect once the session is confirmed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      } else {
        navigate("/login?error=verification_failed", { replace: true });
      }
    });
  }, []);

  return <LoadingScreen message="Verifying your account…" />;
}
```

---

## Part 4 — Web Server Attack Protections

### 4.1 Threat Model

| Attack | Where it hits | Primary defence | Secondary defence |
|---|---|---|---|
| Credential stuffing | Login endpoint | Turnstile CAPTCHA | Supabase rate limiting |
| Bot account creation | Sign-up endpoint | Turnstile CAPTCHA | Email verification |
| Brute-force password | Login endpoint | Account lockout (Supabase) | CAPTCHA |
| Score manipulation (cheating) | Submit-score function | Plausibility bounds | Telemetry audit |
| SQL injection | Any DB call | Parameterised queries (Supabase client) | RLS |
| XSS | Any user-visible string | React's JSX escaping | CSP header |
| CSRF | Cookie-based sessions | We use Bearer tokens (not cookies) | SameSite fallback |
| Clickjacking | Embedded iframes | X-Frame-Options header | CSP frame-ancestors |
| Data exfiltration | Direct DB access | RLS policies | Service role key never client-side |
| DDoS (volumetric) | CDN / Cloudflare | Cloudflare proxy | Auto-scaling |
| API abuse | Edge Functions | Rate limiting middleware | JWT required |
| Stripe webhook spoofing | Webhook endpoint | Signature verification | |
| Insecure direct object ref | Profile/save endpoints | RLS: `auth.uid() = user_id` | |
| Offline curry farming | Auto-production | Offline cap (50%) | Server-side plausibility |

### 4.2 Cloudflare Setup (First Line of Defence)

Put the entire app behind Cloudflare (free tier works). This handles:
- DDoS protection and L3/L4 traffic scrubbing automatically
- Bot management for the main game page (Turnstile covers auth; Bot Fight Mode
  covers the rest)
- WAF rules to block common attack patterns at the CDN layer before traffic
  even reaches Supabase

```
DNS setup:
  game.yourdomain.com  → Vite SPA (Cloudflare Pages or Vercel)
  Cloudflare proxy: ON (orange cloud) for all DNS records
```

**Cloudflare WAF rules to add (Security → WAF → Custom Rules):**

```
Rule 1 — Block empty User-Agent:
  (http.user_agent eq "")  → Block

Rule 2 — Challenge suspicious API calls:
  (http.request.uri.path contains "/functions/v1/" and
   not cf.bot_score gt 60)  → JS Challenge

Rule 3 — Rate limit score submission:
  (http.request.uri.path eq "/functions/v1/submit-score")
  → Rate limit: 5 requests per minute per IP → Block for 10 minutes
```

### 4.3 Supabase Edge Function: Rate Limiting

Supabase Edge Functions run on Deno. Add rate limiting manually using an
in-memory token bucket (resets on cold start — sufficient for most abuse cases;
upgrade to Redis/Upstash for persistent rate limiting at scale):

```typescript
// supabase/functions/_shared/rateLimiter.ts

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limitPerWindow: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limitPerWindow) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count++;
  return { allowed: true, retryAfterMs: 0 };
}
```

```typescript
// supabase/functions/submit-score/index.ts

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { verifyJWT } from "../_shared/auth.ts";

const MAX_SCORE_SUBMISSION_PER_USER_PER_HOUR = 10;
// Players can only submit their score once when the week ends.
// The limit exists to prevent a replay/retry attack flooding the leaderboard.

serve(async (req) => {
  // 1. Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 2. Verify JWT from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorised", { status: 401 });
  }

  const jwt = authHeader.slice(7);
  const user = await verifyJWT(jwt);
  if (!user) {
    return new Response("Unauthorised", { status: 401 });
  }

  // 3. Rate limit per user
  const { allowed, retryAfterMs } = checkRateLimit(
    `score:${user.id}`,
    MAX_SCORE_SUBMISSION_PER_USER_PER_HOUR,
    60 * 60 * 1000
  );
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        "Content-Type": "application/json",
      },
    });
  }

  // 4. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { weekId, score, scoreText, recipeFP } = body as Record<string, unknown>;

  if (typeof weekId !== "string" || typeof score !== "string" ||
      typeof scoreText !== "string") {
    return new Response("Invalid payload", { status: 400 });
  }

  // 5. Anti-cheat: plausibility bound
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: weekData } = await db
    .from("weekly_seeds")
    .select("active_from")
    .eq("week_id", weekId)
    .single();

  if (!weekData) {
    return new Response("Unknown week", { status: 400 });
  }

  const weekAgeHours =
    (Date.now() - new Date(weekData.active_from).getTime()) / 3_600_000;

  // Max theoretically achievable: 3.5× recipe × 3× upgrades × 1000 CPS
  // × weekAgeHours × 3600 seconds + click contribution
  const MAX_MULTIPLIER = 10.5; // recipe × upgrades max
  const MAX_CPS = 1000;
  const MAX_CPC = 5000; // curry per click max
  const MAX_CLICKS_PER_HOUR = 72_000; // 20 CPS * 3600

  const theoreticalMax =
    (MAX_CPS * weekAgeHours * 3600 + MAX_CLICKS_PER_HOUR * weekAgeHours * MAX_CPC) *
    MAX_MULTIPLIER * 3; // 3× safety buffer for edge cases

  // Parse the submitted score for comparison (stored as NUMERIC string)
  const scoreNum = parseFloat(score.toString());

  if (scoreNum > theoreticalMax) {
    // Log suspicious score but don't block — might be a legitimate veteran player
    // with maxed decorations. Flag for manual review instead.
    await db.from("suspicious_scores").insert({
      user_id: user.id,
      week_id: weekId,
      score,
      theoretical_max: theoreticalMax.toString(),
      flagged_at: new Date().toISOString(),
    });
    // Still allow the insert — banning here creates false positive risk
  }

  // 6. Upsert score (higher score wins if submitted multiple times)
  await db
    .from("leaderboard")
    .upsert(
      {
        user_id: user.id,
        week_id: weekId,
        score,
        score_text: scoreText,
        recipe_fingerprint: recipeFP ?? null,
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,week_id",
        ignoreDuplicates: false, // Upsert — replace with new if higher
      }
    );

  // Only replace if new score is higher
  await db.rpc("upsert_score_if_higher", {
    p_user_id: user.id,
    p_week_id: weekId,
    p_score: score,
    p_score_text: scoreText,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
```

```sql
-- Postgres function for conditional score upsert
-- (Supabase .rpc() call from Edge Function)
CREATE OR REPLACE FUNCTION upsert_score_if_higher(
  p_user_id UUID,
  p_week_id TEXT,
  p_score NUMERIC,
  p_score_text TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO leaderboard (user_id, week_id, score, score_text)
  VALUES (p_user_id, p_week_id, p_score, p_score_text)
  ON CONFLICT (user_id, week_id) DO UPDATE
    SET score = EXCLUDED.score,
        score_text = EXCLUDED.score_text,
        submitted_at = NOW()
    WHERE leaderboard.score < EXCLUDED.score;  -- Only update if new score is higher
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.4 HTTP Security Headers

Apply these on all responses — either via Cloudflare Transform Rules or a
response-headers middleware in the deployment platform (Vercel/Netlify config):

```typescript
// vercel.json (or netlify.toml equivalent)
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.tailwindcss.com https://fonts.googleapis.com",
            // 'unsafe-inline' needed for Tailwind CDN — swap for nonce-based CSP
            // when moving to a build-time Tailwind setup (Phase 5)
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
            "frame-src https://challenges.cloudflare.com https://js.stripe.com",
            "frame-ancestors 'none'",       // Blocks clickjacking
            "base-uri 'self'",
            "form-action 'self'"
          ].join("; ")
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

### 4.5 XSS Prevention

React's JSX escapes all interpolated strings by default. The main risk surfaces are:

**1. `dangerouslySetInnerHTML` — never use it.** If you need rich text, use a
sanitized markdown renderer (`dompurify` + `marked`).

**2. User-generated display names on the leaderboard.** React handles this for
free, but validate server-side too:

```typescript
// Server-side in the profiles trigger (Supabase SQL trigger)
CREATE OR REPLACE FUNCTION sanitize_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Strip any HTML/script tags (shouldn't exist after client validation,
  -- but defence in depth)
  NEW.display_name := regexp_replace(NEW.display_name, '<[^>]+>', '', 'g');
  -- Enforce length
  NEW.display_name := left(trim(NEW.display_name), 24);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sanitize_display_name
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sanitize_display_name();
```

**3. The recipe name field.** Players can name their saved recipes. These are
stored in JSONB (no SQL injection risk) and displayed in React (no XSS risk),
but cap length server-side:

```sql
ALTER TABLE game_saves ADD CONSTRAINT recipe_name_length
  CHECK (
    jsonb_array_length(save_data->'recipes') < 50
    -- Individual recipe name lengths are validated in the client and capped at 32 chars
  );
```

### 4.6 CORS Configuration

Supabase Edge Functions automatically restrict CORS to requests from your
configured site URL. Add explicit handling for the stripe-webhook function which
must accept Stripe's servers (no Origin header):

```typescript
// supabase/functions/_shared/cors.ts

export const ALLOWED_ORIGINS = [
  "https://yourgame.com",
  "https://www.yourgame.com",
  // Add preview URLs if using Vercel/Netlify preview deploys
];

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("Origin")),
    });
  }
  return null;
}
```

### 4.7 Stripe Webhook Signature Verification

The stripe-webhook function MUST verify Stripe's signature — without this,
anyone could POST a fake payment and grant themselves free cosmetics:

```typescript
// supabase/functions/stripe-webhook/index.ts

import Stripe from "https://esm.sh/stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const body = await req.text(); // Must read as text BEFORE parsing
  const sig = req.headers.get("stripe-signature");

  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    // This cryptographically verifies the signature using the webhook secret
    // A forged request will throw here
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Only handle successful payments
  if (event.type !== "payment_intent.succeeded") {
    return new Response("OK", { status: 200 });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const { user_id, item_id } = paymentIntent.metadata;

  if (!user_id || !item_id) {
    return new Response("Missing metadata", { status: 400 });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // Service role — bypasses RLS
  );

  // Idempotent insert — if the webhook fires twice (Stripe retries),
  // the UNIQUE constraint on stripe_payment_intent_id prevents a double grant
  await db.from("purchases").upsert(
    {
      user_id,
      item_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_usd: paymentIntent.amount,
    },
    { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }
  );

  return new Response("OK", { status: 200 });
});
```

### 4.8 Environment Variable Security

```bash
# .env.local (NEVER committed to git — add to .gitignore)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...         # Safe to expose — enforced by RLS
VITE_TURNSTILE_SITE_KEY=0x4AAAA...   # Safe to expose — only valid on your domain
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Safe to expose

# Supabase Edge Function secrets (stored in Supabase dashboard, NEVER in code)
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # NEVER expose to client — full DB access
STRIPE_SECRET_KEY=sk_live_...        # NEVER expose to client
STRIPE_WEBHOOK_SECRET=whsec_...      # NEVER expose to client
```

**The anon key is safe to be public** — it only allows operations permitted by
RLS policies. The service role key is never in frontend code.

### 4.9 SQL Injection Prevention

Supabase's JavaScript client uses parameterised queries by default. Direct string
concatenation into SQL is impossible through the client:

```typescript
// Safe — parameterised automatically
const { data } = await supabase
  .from("leaderboard")
  .select("*")
  .eq("week_id", userInput);  // Never interpolated as raw SQL

// If you ever write raw SQL (Edge Functions), use parameterised queries:
await db.rpc("upsert_score_if_higher", {
  p_user_id: user.id,         // Parameters — never string-concatenated
  p_week_id: weekId,
  p_score: score,
});
```

### 4.10 Game Save Integrity

The save data stored in Supabase is trusted on load — but the client
could in theory upload a modified save (e.g. setting `currentCurry` to
`"9.99e999"`). Prevent this with server-side save validation:

```typescript
// supabase/functions/save-game/index.ts

function validateSaveData(save: unknown): boolean {
  if (typeof save !== "object" || save === null) return false;
  const s = save as Record<string, unknown>;

  // Validate Decimal fields are plausible strings
  const decimalFields = ["currentCurry", "totalCurryAllTime", "weekCurry"];
  for (const field of decimalFields) {
    if (typeof s.player?.[field] !== "string") return false;
    const num = parseFloat(s.player[field] as string);
    if (isNaN(num) || num < 0) return false;
    // Cap at a physically achievable maximum (100 × theoretical max for current week)
    if (num > MAX_ACHIEVABLE_SCORE * 100) return false;
  }

  // Validate recipe slots
  const slots = s.recipe?.slots;
  if (!Array.isArray(slots) || slots.length > 5) return false;
  for (const slot of slots) {
    if (slot !== null && !VALID_INGREDIENT_IDS.has(slot)) return false;
  }

  return true;
}
```

---

## Part 5 — Security Checklist Before Launch

Work through this before opening to the public:

### Authentication
- [ ] Email verification enforced — unverified accounts cannot access game
- [ ] CAPTCHA on sign-up AND sign-in
- [ ] "Forgot password" flow sends email (never reveals if account exists)
- [ ] Password reset links expire after 15 minutes (Supabase default)
- [ ] Session tokens use `httpOnly` cookies or are stored in memory — NOT
      `localStorage` for sensitive tokens (Supabase handles this; just confirm
      your storage config)
- [ ] JWT expiry set to 1 hour with auto-refresh
- [ ] Refresh token rotation enabled
- [ ] Account lockout after 10 failed attempts (Supabase has `max_frequency` setting)

### Database
- [ ] RLS enabled on ALL tables
- [ ] Service role key never in frontend code or git history
- [ ] All user-generated content length-capped with DB constraints
- [ ] `suspicious_scores` table monitored (weekly review)
- [ ] Backup schedule set (Supabase auto-backup: daily for Pro plan)

### API / Edge Functions
- [ ] All functions require `Authorization: Bearer` header
- [ ] Rate limiting on score submission, profile update, and sign-up
- [ ] Stripe webhook verifies signature before any DB write
- [ ] CORS restricted to your domain only

### Frontend
- [ ] CSP header deployed and tested (use `report-only` mode first)
- [ ] No `dangerouslySetInnerHTML`
- [ ] All env vars beginning with `VITE_` audited — only public keys present
- [ ] No secrets in client bundle (audit with `grep -r "sk_live" dist/`)
- [ ] Dependency audit: `npm audit` — fix any high/critical

### Infrastructure
- [ ] Cloudflare proxy enabled (orange cloud) on all DNS records
- [ ] HSTS header present (`Strict-Transport-Security`)
- [ ] `X-Frame-Options: DENY` or `frame-ancestors 'none'` in CSP
- [ ] `X-Content-Type-Options: nosniff`

### IAP
- [ ] Stripe webhook endpoint uses `stripe.webhooks.constructEvent` — no signature skipping
- [ ] Cosmetic entitlements only granted after `payment_intent.succeeded` (not `created`)
- [ ] Purchase record is idempotent (UNIQUE on `stripe_payment_intent_id`)
- [ ] No gameplay advantage purchasable

### Score Integrity
- [ ] Plausibility bound checking in `submit-score` function
- [ ] `upsert_score_if_higher` prevents score rollback
- [ ] Week ID validated against `weekly_seeds` table before insert
- [ ] Leaderboard ranks display-only — never used to gate gameplay content
      (prevents rank manipulation from being a meaningful attack target)
