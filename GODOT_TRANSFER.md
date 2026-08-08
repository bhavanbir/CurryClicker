# CurryClicker → Godot Transfer Spec

Engine-agnostic spec for rebuilding CurryClicker in Godot 4.x. Covers the six
kept systems: **crit circles, gacha, day/week structure + boss, skill tree,
prestige, leaderboards** — plus the shared click/effects pipeline they all sit
on. All numbers are the live values from the web build (source file cited per
section; treat this doc as the contract, the TS files as tie-breaker).

**Explicitly NOT ported:** restaurant scene / diner tips, tutorial + feature
intros, badges/achievements, skins, demo build gating, web-specific anti-cheat
(isTrusted events, focus checks). The `expansion` skill effect only fed the
scene — keep the nodes but repoint the effect (suggestion below).

TODO:: Things that need to be rebuilt: a tutorial
TODO:: Things that I want to add: build variety, revamp the boss fights, rework customers (make them smart/interactive), add a tutorial where you talk to the head chef, input ur username, and he walks you through the basics, maybe add some sort of story
---

## 0. Core click loop (`src/engine/clickEngine.ts`, `GameplayScreen.tsx`)

Currency is **curry**. One "cook" (click / spacebar / tap) earns:

```
BASE_CLICK = 10

base  = max(1, floor((BASE_CLICK + flatClick) * clickMult * globalMult))
value = floor(base * crazyMult * critApplied * fireMult * dayModClickMult)
        where critApplied = 1 + (critMult - 1) * critPowerMult
```

- `crazyMult` / `fireMult` come from the two momentum systems (§7).
- `critMult` is 1 for a normal cook, or the circle's multiplier (§1).
- `dayModClickMult` from the active day modifier (§3.3), default 1.
- Anti-cheat click cap: max 25 cooks per rolling 1 s window; over-cap cooks are
  silently dropped. Worth keeping in Godot (cheap: array of timestamps).

`addCurry(value)` increments: `currentCurry`, `totalCurryAllTime`, `weekCurry`,
`todayCurry`, `dailyCurry`, and `highScore = max(highScore, weekCurry)`.

## 0.1 Effects pipeline (`src/engine/effects.ts`)

One pure function folds owned skill nodes + owned star nodes + the ≤3 equipped
gacha rolls into a flat struct. Recompute whenever any input changes (or just
on demand — it's cheap).

```
ActiveEffects {
  clickMult      = prestigeBaseClick(prestige)      # then ×(1+v) per source
  flatClick      = 0                                 # +v per source
  globalMult     = 1                                 # highest global_mult tier wins, never stacks
  critChanceMult = 1                                 # ×(1+v) per source
  critPowerMult  = 1                                 # ×(1+v) per source
  fireGainMult   = 1                                 # ×(1+v) per source
  spinCostMult   = 1                                 # ×(1-v) per source (discounts stack down)
  luck           = 0                                 # +v per source
  expansionLevel = 0                                 # max level owned (scene-only; see §4 note)
}
```

`head_start` effects are handled at week start, not here.

---

## 1. Crit circles (`GameplayScreen.tsx`)

A reaction minigame layered on cooking. At most **one circle live at a time**.

**Spawn:** every normal cook (critMult == 1), if no circle is up:

```
critChance = min(0.4 * dayModCritChanceMult * critChanceMult, 0.9)
```

Roll a tier from the weighted table, spawn at a uniform-random position inside
the play area with margin `size/2 + 8 px`. Clicking it before it expires cooks
once at `(x, y)` with `critMult = tier.mult`.

**Normal-day tier table** (weights sum to 100; low mult = big + slow,
high mult = tiny + fast — this is the anti-autoclicker bait):

| mult | weight | diameter px | lifetime ms |
|-----:|-------:|------------:|------------:|
| 1.1  | 40 | 96 | 10000 |
| 1.5  | 25 | 84 | 7000 |
| 2    | 15 | 72 | 5000 |
| 5    | 10 | 60 | 2500 |
| 10   | 6  | 48 | 1200 |
| 25   | 3  | 38 | 600 |
| 100  | 1  | 28 | 300 |

**Boss-day tier table** (§3.4 — no consolation tier, everything hits):

| mult | weight | diameter px | lifetime ms |
|-----:|-------:|------------:|------------:|
| 3   | 55 | 88 | 4000 |
| 10  | 30 | 64 | 2000 |
| 30  | 12 | 48 | 1000 |
| 100 | 3  | 32 | 500 |

**Jackpot chain:** after clicking a circle, chance to immediately spawn a
follow-up **one tier higher** (clamped to top tier):
`P = 0.35 - 0.10 * chainDepth`, max depth `CHAIN_CAP = 3`. Chained circles show
a 400 ms non-clickable "telegraph" (dashed outline at the spawn spot) before
going live.

**Bias-low rule** (Bubble Bonanza modifier): roll the tier twice, keep the
lower multiplier.

**Payout preview** shown on the circle: `×mult` label; actual payout includes
`critPowerMult` per the §0 formula.

**Reaction floor (anti-aimbot, optional):** clicks within 130 ms of the circle
going live are ignored. Circles despawn when the day ends/pauses.

**Juice:** shake magnitude `2 + critPower(mult) * 5.5` where
`critPower(m) = log10(m)/log10(100) * 2.4`; screen flash at mult ≥ 25; circle
shows a shrinking inner ring as its timer (linear, `tier.ms` duration).

## 2. Gacha (`src/engine/gacha.ts`)

Spins buy a **RolledIngredient** — CS:GO-style item with rarity + modifiers +
per-mod float.

**Rarities** (in order): common, uncommon, rare, epic, legendary, currylicious.

| rarity | weight /1000 | mod count | RARITY_SCALE |
|--------|---:|---:|---:|
| common      | 500 | 1 | 1.0 |
| uncommon    | 280 | 2 | 1.35 |
| rare        | 140 | 3 | 1.8 |
| epic        | 60  | 4 | 2.4 |
| legendary   | 18  | 5 | 3.2 |
| currylicious| 2   | 6 | 4.2 |

**Luck** (from effects) tilts the table: `weight_i * (1 + max(0, luck))^i`
(i = rarity index), then weighted-roll over the new totals.

**Mods:** pick `modCount` distinct types from the 6-type pool (no duplicates on
one item), each with `float ∈ [0,1)` uniform. Magnitude:

```
magnitude = (min + float * (max - min)) * RARITY_SCALE[rarity]
```

| mod type | [min, max] at scale 1 | feeds effect |
|----------|----------------------|--------------|
| click_mult    | 0.02 – 0.25 | clickMult ×(1+v) |
| flat_click    | 1 – 40      | flatClick +v |
| crit_chance   | 0.02 – 0.2  | critChanceMult ×(1+v) |
| crit_power    | 0.05 – 0.5  | critPowerMult ×(1+v) |
| fire_gain     | 0.05 – 0.4  | fireGainMult ×(1+v) |
| spin_discount | 0.01 – 0.12 | spinCostMult ×(1-v) |

Float display bands: <0.2 Bland, <0.4 Simmered, <0.6 Seasoned, <0.8 Rich,
else Sublime.

**Ingredient pools:** 60 ingredients, 10 per rarity. Copy the
`RARITY_INGREDIENTS` table from `src/engine/gacha.ts:240-313` verbatim — it's
pure data (id strings; pair with names/icons from `src/engine/ingredients.ts`).

**Spin price** (resets weekly via `spinCount`, inflates per prestige):

```
SPIN_BASE = 2000, SPIN_GROWTH = 1.06, SPIN_PRESTIGE_GROWTH = 1.35
cost = round(2000 * 1.06^spinCountThisWeek * 1.35^weeksCompleted * spinCostMult)
```

**Trade-up:** burn exactly **5 same-rarity** items → 1 guaranteed roll of the
next rarity (same mod construction, random ingredient from that pool). Not
allowed at currylicious (no next tier). Does **not** touch the spin price
ladder or spin counters. Burnt items are removed from the equipped set.

**Inventory:** hard cap **200** items. On overflow, drop the weakest
**unequipped** rolls by power score
`rollPower = Σ (RARITY_SCALE[rarity] * float)` over mods.

**Equip:** up to **3** items equipped; their mods enter the effects pipeline.

**Tracked stats:** `spinCount` (weekly), `totalSpins` (lifetime, used as spin
index on rolls), `epicPulls` (lifetime epic-or-better count),
`bestRarityThisWeek`, `bestRarityEver`.

RNG for spins is deliberately **unseeded** (player owns the machine; a known
seed enables save-scumming). Save-file validation (§8) is the integrity layer.

## 3. Day / week structure (`src/config.ts`, `useGameStore.ts`)

### 3.1 Clock

```
DAYS_PER_WEEK = 5
WEEK_DURATION_MS = 5 * 45_000        # 45 s per day (dev value; env-tunable)
DAY_DURATION_SECONDS = 45
```

- The day clock only runs after the player presses **Start Day**, and pauses
  via a pause toggle. `dayProgress ∈ [0,1]` advances by `dt / dayLength` each
  frame (Godot: `_process(delta)` on an autoload, or a `Timer`).
- Day length can be modified by the day modifier (`daySeconds` absolute
  override, or `dayLengthMult` relative).
- When `dayProgress ≥ 1`: snapshot the day (`{day, curry, clicks}` →
  `dailySnapshots`), zero `todayCurry`/`todayClicks`, `currentDay += 1`,
  clock stops (no auto-rollover — waits for next Start Day), active modifier
  clears.
- After day N ends (N+1 < boss day), offer next day's choices (§3.3). Never
  before the boss day.
- When `currentDay > DAYS_PER_WEEK`: week complete → phase `week_summary`,
  `weeksCompleted += 1`, award Stars (§5.2). Player then starts a new week
  (§5.1).

### 3.2 Real-calendar layer

Two identity strings, derived from the local clock:

- `dateId` = local `YYYY-MM-DD`. Rolling over at local midnight triggers the
  **daily full reset** (§5.3) and finalizes the daily leaderboard (§6).
- `weekId` = ISO-8601 week `YYYY-Wnn` (display/rollover only).
- Anti-cheat: both strings sort lexicographically — refuse **backward** jumps
  (persisted id is a monotonic guard against clock rewinds).
- `seed = fnv1a32(dateId)` — drives all deterministic daily content (rivals,
  day choices). FNV-1a: `h = 2166136261; h ^= byte; h *= 16777619` (32-bit).

### 3.3 End-of-day choices (`src/engine/dayChoices.ts`)

After each day (except into the boss day), offer up to 3 seeded
bonus-with-a-cost modifiers for the next day; the player picks one or declines.
Chosen modifiers don't reappear until the weekly reset.

Selection: shuffle the not-yet-used pool with a seeded RNG keyed
`"{seed}-daychoices-{day}"`, take 3. (Seeded RNG spec: xmur3 string-hash →
mulberry32; any deterministic PRNG works — Godot's `RandomNumberGenerator`
with `seed = fnv1a32(key)` is fine.)

| id | name | bonus | cost |
|----|------|-------|------|
| ghost_pepper   | Ghost Pepper Rush | clickMult ×100 | day lasts 4 s (`daySeconds: 4`) |
| bubble_bonanza | Bubble Bonanza | critChanceMult ×3 | crit tiers biased low (roll twice, keep lower) |
| rush_hour      | Rush Hour | clickMult ×3 | day length ×0.5 |
| hand_crafted   | Hand-Crafted | clickMult ×10 | critChanceMult ×0 (no circles) |
| marathon       | Marathon Prep | day length ×2 | clickMult ×0.75 |

### 3.4 Day-5 boss (`src/engine/boss.ts`)

- The last day of the week is a boss fight. **No day modifier** on boss day
  (any pending offer is cancelled).
- HP locks in when the player presses Start Day on day 5 (and persists so a
  mid-fight reload resumes the same boss):

```
BOSS_DIFFICULTY = 1.5, BOSS_MIN_HP = 1500
hp = max(1500, round(median(dailySnapshots.curry) * 1.5))   # median, not mean
```

- **Damage = curry earned, 1:1.** Every cook's final value (crits, On Fire,
  Crazy Curry included) is dealt to the boss. Crit circles spawn **on the
  boss's body** using the SUPER_TIERS table (§1).
- **Win** (HP → 0): week completes immediately — same summary and Star award
  as a timer finish, no bonus. Snapshot day 5, `weeksCompleted += 1`.
- **Loss** (day clock hits 1.0 with HP > 0):
  - Roll ONE random item from the gacha inventory as the sole **survivor**
    (roll and commit atomically — no reload re-rolls).
  - Wipe: `gachaInventory = [survivor]`, equipped = [survivor], skill nodes,
    week score — back to day 1 of a fresh week (§5.1 runs).
  - **No** Stars, **no** weeksCompleted bump.
  - Untouched: highScore, totalCurryAllTime, dailyCurry, franchiseStars,
    metaNodes, trophies.
  - Show a defeat screen: week score, HP left/max, the surviving item.

## 4. Skill tree (`src/engine/skillTree.ts`)

Radial graph on a **1800×1800 canvas**, decorative hub at center. Node position
from polar coords: `x = 900 + r*cos(a°)`, `y = 900 + r*sin(a°)` (screen coords,
0° = right, 90° = down). UI pans/zooms.

**Two layers:**
- **Curry branches** (spice / service / hustle + 9 bridge nodes) — 61 nodes,
  paid in curry, **wiped every weekly prestige**, cost inflates
  `round(cost * 1.5^weeksCompleted)`.
- **Star gates** (7 meta nodes) — paid in Franchise Stars, flat-priced,
  survive weekly prestige (wiped only by the daily reset). An owned gate stays
  a valid anchor after the wipe: next week you buy straight from it.

**Unlock rule: prereqs are OR** — a node opens as soon as ANY listed prereq is
owned (checked against the union of both layers). Empty prereqs = always open.

**Node data:** copy `SKILL_NODES` (61 entries, `skillTree.ts:54-125`) and
`META_NODES` (7 entries, `:131-139`) verbatim — plain data: id, branch, kind
(small/notable/gate), cost, r, a, name, icon, description, prereqs, effect.
Effect types map to §0.1; the three arms point at 270°/30°/150°, star gates sit
on the arm axes at r 330/560/770, bridges link neighbouring arms at r 430–470.

Star gate summary (permanent effects):

| id | cost ★ | effect |
|----|---:|--------|
| reputation_1 | 2 | global_mult ×1.25 |
| reputation_2 | 5 | global_mult ×1.5 |
| reputation_3 | 9 | global_mult ×2 (highest tier wins, no stacking) |
| head_start_1 | 2 | start each week with 500 curry |
| head_start_2 | 5 | start each week with 10,000 curry (highest wins) |
| showstopper  | 5 | crit_power +30% |
| fortune      | 3 | luck +0.2 |

**`expansion` effect note:** levels 1/3/5 grew the restaurant scene (diner
tips) which is not ported. Keep the nodes; simplest repoint is a small
`click_mult` or a passive-income line — decide at build time.

## 5. Prestige

### 5.1 Weekly prestige (`startNewWeek`)

Fires on week completion (timer or boss kill) and on boss loss. Resets:

- `skillNodes = []` (curry branches wiped; re-buy at ×1.5^prestige prices)
- `currentCurry = headStartCurry(metaNodes)` (0 without a Head Start gate)
- `spinCount = 0` (spin price ladder resets; `totalSpins` keeps counting)
- `weekCurry`, `todayCurry/Clicks`, `clicksThisWeek`, `dailySnapshots`,
  `bestRarityThisWeek`, day choices used-list, boss state → all zeroed
- back to day 1, clock stopped.

**Deliberately KEPT through weekly prestige:** the gacha inventory + equipped
set (the collection is the thing you keep — balance knob: wipe it if prestige
feels too easy), metaNodes, franchiseStars, weeksCompleted, lifetime records.

**Prestige power curve:** base click multiplier
`prestigeBaseClick(p) = min(1 + 0.25p, 4)` (caps at prestige 12) — feeds
`clickMult` in §0.1. Costs that inflate per prestige: skill nodes ×1.5^p,
spins ×1.35^p.

### 5.2 Franchise Stars (week-end award, `weekStars`)

Awarded exactly once per completed week (max 6):

| star | condition |
|---|---|
| 1 | always ("Completed the week") |
| +1 | weekCurry ≥ 1,000,000 |
| +1 | weekCurry ≥ 100,000,000 |
| +1 | pulled Epic+ this week |
| +1 | pulled Legendary+ this week |
| +1 | clicksThisWeek ≥ 2000 |

Stars are the meta currency (`franchiseStars` spendable balance,
`franchiseStarsEarned` today's total). Rank titles from lifetime-today earned:
0 Street Stall, 5 Corner Kitchen, 15 Local Favorite, 30 City Star,
50 Curry Empire.

### 5.3 Daily full reset (local midnight, `ensureCurrentDate`)

The outer prestige loop — each real calendar day is a fresh run:

1. Finalize yesterday's leaderboard placement → trophy (§6), submit score to
   Steam (if any curry was earned).
2. `bestFranchiseStars = max(bestFranchiseStars, franchiseStarsEarned)`.
3. Wipe: franchiseStars(+Earned), **metaNodes**, gacha inventory + equipped,
   spinCount, bestRarityThisWeek, currentCurry, weeksCompleted, lastWeekStars.
4. New `dateId` + seed, then run §5.1 for the week-scoped state.

**Survives everything:** highScore, totalCurryAllTime, trophies, badges,
bestFranchiseStars, bestRarityEver, totalSpins, epicPulls, settings, skins.

## 6. Leaderboards (`src/engine/dailyRivals.ts`, `LeaderboardScreen.tsx`)

Daily board: the player's `dailyCurry` vs **100 deterministic NPC rivals**,
reseeded per calendar day. (Stand-in for real Steam leaderboards — same design
works in Godot until/unless GodotSteam leaderboards replace it.)

**Rival generation** — seeded RNG keyed `"{seed}-rivals-{scale}"` where
`scale = 10^ceil(log10(max(highScore, 10000)))` (bucketed to the player's
order of magnitude so the field stays competitive but doesn't jitter mid-day):

```
for i in 0..99:
  name  = FIRST[rand] + LAST[rand]      # 20×20 curry-pun name parts, dedupe with a 10-99 suffix
  score = floor(scale * 2.5 * 0.92^i * (0.7 + 0.6*rand))
sort desc
```

Name parts: FIRST = Spicy, Garam, Tikka, Naan, Paneer, Masala, Chutney,
Vindaloo, Korma, Saffron, Cardamom, Turmeric, Ghee, Tandoori, Biryani, Cumin,
Chili, Pepper, Coco, Mango. LAST = Boi, Gorilla, Taco, Stop, Panic, Master,
Wizard, Ninja, King, Queen, Fiend, Machine, Storm, Legend, Goblin, Baron,
Rocket, Whisk, Ladle, Pot.

**Placement:** `rank = count(rivals with score > dailyCurry) + 1` (1–101).
UI shows the podium (top 3) plus rivals within ±2 ranks of the player.

**Trophies** (awarded at midnight rollover, only if `dailyCurry > 0`):
rank 1–5 → its own tier, ≤10 → "top10", ≤100 → "top100"; stored as
`{tier: count}` forever.

**Steam:** on rollover, submit the finished day's `dailyCurry`
(Godot: GodotSteam `uploadLeaderboardScore`, or no-op off Steam). Desktop
builds also anchor the clock to Steam server time so system-clock changes
can't force rollovers — worth keeping.

## 7. Momentum systems (feed circles + boss; small, keep them)

**On Fire** (`useOnFire.ts`) — heat meter 0–100, nothing persisted:
- +8 heat per cook (× `fireGainMult`), cap 100.
- Decay: 10/s within a 1.5 s grace window after the last cook, else 45/s.
- Stage 1 at heat ≥ 50 → all cooks ×1.25; Stage 2 at ≥ 85 → ×1.5.

**Crazy Curry** (`useCrazyCurry.ts`) — random click-rush events while a day is
running:
- Gap between events: uniform 45–90 s; first event of the day is clamped to
  fit inside the remaining day time (min 5 s gap) so ≥1 fires per day.
- Event lasts 8 s; tier random from {floor 3 cps → ×1.5, 5 cps → ×2,
  8 cps → ×3}.
- During an event, a cook pays the tier mult only if the player's click rate ≥
  floor. Rate = clicks in the last 2 s window (window start clamped to event
  start, denominator floored at 0.75 s so it's reachable from standstill).

## 8. Save data (single dict → JSON, Godot `user://save.json`)

Persist (schema mirrors `partialize` in `useGameStore.ts`):

```
currentCurry, totalCurryAllTime, weekCurry, highScore, todayCurry, todayClicks,
clicksThisWeek, settings (sfx/music/volumes/darkMode),
gachaInventory[{uid, ingredientId, rarity, mods[{type, float}], spin, at}],
equippedUids[≤3], spinCount, totalSpins, epicPulls,
bestRarityThisWeek, bestRarityEver,
skillNodes[], metaNodes[], weeksCompleted,
franchiseStars, franchiseStarsEarned, bestFranchiseStars, lastWeekStars,
phase, weekId, dateId, seed, currentDay, dayProgress, dailySnapshots,
dailyCurry, trophies{tier:count},
pendingDayChoices, activeDayModifierId, usedDayModifierIds,
bossHp, bossMaxHp          # null = no fight; persisted so reloads resume
```

Not persisted: `dayStarted`/`dayPaused` (reload always lands pre-day),
`bossDefeat` screen state.

**Load-time validation (the real anti-cheat — port this):**
- Clamp all currency numbers to finite, ≥0, cap 1e15 (counts cap 1e9).
- `dailyCurry ≤ totalCurryAllTime`.
- Re-validate every inventory roll: known ingredientId, rarity valid, mods
  array length == MOD_COUNT[rarity], mod types known + deduped, floats clamped
  to [0,1]. Drop invalid rolls; cap at 200; equipped uids must exist in
  inventory, deduped, ≤3.
- skillNodes/metaNodes filtered to known ids.
- Refuse backward `dateId`/`weekId` (lexicographic compare).

## 9. Godot mapping notes

- **GameState autoload** (singleton): all §8 state + the store actions
  (addCurry, spin, combine, equip, buySkillNode, startDay, damageBoss…).
  Signals instead of zustand subscriptions: `curry_changed`, `day_ended`,
  `week_completed`, `boss_defeated`, `boss_lost`, `roll_added`.
- **Day clock**: advance `dayProgress` in `_process(delta)` on the autoload,
  gated on `dayStarted and not dayPaused`; day length =
  `(dayMod.daySeconds ?? 45) * (dayMod.dayLengthMult ?? 1)`.
- **Seeded RNG**: `RandomNumberGenerator.new(); rng.seed = fnv1a32(key)` per
  keyed stream (rivals, day choices). Unseeded `randf()` for gacha/crits.
- **Data tables** (skill nodes, ingredients, rarity tables, tiers): plain
  GDScript const dictionaries/arrays in one `data/` script each, transcribed
  from the TS files cited above. No resource files needed.
- **Skill tree UI**: one `Node2D` under a pan/zoom `Camera2D`; draw edges with
  `draw_line`, nodes as buttons at `nodeXY`. The EDGES list is derived from
  prereqs (dedupe mutual bridge pairs).
- **Crit circles**: a single `Button`/`Area2D` child of the play area;
  `Tween` for the pop-in and the shrinking timer ring.
- **Steam**: GodotSteam for player name, leaderboard submit, achievements,
  server-time clock anchor. All optional — wrap in a `has_feature` check.
