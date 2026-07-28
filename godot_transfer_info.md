# CurryClicker — Godot Transfer Document

Complete reference of every feature, system, formula, and gameplay rule in CurryClicker (v0.8.0, React + Zustand + Electron + steamworks.js), written so the game can be rebuilt in Godot without reading the original source. File references point at the current codebase for verification.

---

## 1. High-Level Architecture

- **Genre:** session-based incremental clicker. No idle/offline income — curry comes only from active cooking (clicks) and diner tips.
- **Time model:** one central `requestAnimationFrame` loop (`src/hooks/useGameLoop.ts`) advances a day timer; everything else subscribes to a single global store (`src/store/useGameStore.ts`). Godot equivalent: one `_process(delta)` on an autoload singleton — not per-node timers.
- **Two nested loops:**
  - **In-game week** = 7 in-game days. Default day length: 45 real seconds (`WEEK_DURATION_MS = 7 * 45 * 1000`, env-overridable; a "real week" production value of 604,800,000 ms exists as intent). Completing a week = soft prestige (shop upgrades wiped, curry reset, Franchise Stars awarded).
  - **Real calendar day** = hard prestige + daily leaderboard cycle. At local midnight the daily score finalizes into trophies/Steam, and the franchise layer + curry + week count fully reset. The affinity matrix, craving, special, rivals all reseed from the new date.
- **Screens:** gameplay (cook), kitchen (recipe builder), shop, franchise, profile, leaderboard (hidden in demo), affinity journal, settings. Plain screen-switch navigation, no router.
- **Builds:** `full` and `demo` (`VITE_TARGET`). Demo differences listed in §17.

### Key constants (src/config.ts)
| Constant | Value |
|---|---|
| `WEEK_DURATION_MS` | 315,000 (dev; 45 s/day) |
| `DAYS_PER_WEEK` | 7 |
| `DAY_DURATION_SECONDS` | 45 |
| `BASE_UNLOCKED_SLOTS` | 3 |
| `MAX_SLOTS` | 5 (demo: 4) |
| `GUARANTEED_RECIPE_COUNT` | 6 per week |
| `TASTE_COOKS_TO_REVEAL` | 25 cooks |

---

## 2. Core Day/Week Loop

### Day lifecycle
1. Day starts **paused** — player must press **Start Day** (`StartDayModal` shows the current recipe, its tier badge, and flavor vs today's craving; buttons: Change Recipe / Start Day N).
2. While `dayStarted && !dayPaused && phase == "cooking"`, the loop adds `deltaSec / daySeconds` to `dayProgress` (delta clamped to 1 s so a backgrounded app never dumps a catch-up tick — this is what disables offline progress).
3. `daySeconds` = active day modifier's absolute `daySeconds`, else `45 * (dayLengthMult ?? 1)`.
4. When `dayProgress >= 1` the day ends (never more than one day per tick):
   - Push a `DailySnapshot { day, curry, clicks, tierAtDayEnd }`.
   - Evaluate the recipe streak (§7.3).
   - **Reveal all affinity pairs** of the final cooked recipe into the Journal (`discoveredAffinities`).
   - If the ending recipe's flavor matched today's craving → `cravingMatchDays += 1`.
   - Reset `todayCurry`/`todayClicks`, `currentDay += 1`, `dayStarted = false`, clear the active day modifier.
   - Day 2–7: offer next-day choices (§7.4). Day > 7: week completes.
5. Mid-day pause exists (`togglePause`); opening the Recipe Naming modal auto-pauses (and auto-unpauses only if it wasn't manually paused).

### Week completion
- `phase = "week_summary"`, `weeksCompleted += 1`.
- **Franchise Stars awarded exactly once here** (max 5):
  - +1 always ("Completed the week")
  - +1 if `highestTierSeen >= great`
  - +1 if `highestTierSeen == legendary`
  - +1 if `cravingMatchDays >= 4`
  - +1 if ≥ 20 affinity pairs discovered
- `WeekSummaryModal` shows week curry, clicks, best day, per-day breakdown, stars + reasons. "Start Next Week" → `startNewWeek()`.

### `startNewWeek()` (soft prestige)
- Day 1, `dayProgress 0`, phase cooking.
- **`purchasedUpgrades = []`** (re-buy at scaled prices, see §9.4), `currentCurry = headStartCurry(franchise)` (0 / 500 / 10,000).
- Resets: weekCurry, clicks, snapshots, discoveredRecipes, streak, highestTierSeen, claimedSets, maxSlotsUsed, cravingMatchDays, specialClaimDays, day-modifier pools.
- `discoveredAffinities` re-seeded with the franchise Insight perk's pre-revealed pairs (3 or 6).
- **Decorations persist across weeks.** The affinity matrix does NOT reshuffle here — only on real-date change.

### Real calendar rollover (`ensureCurrentDate`, hard prestige)
Checked on load and every 30 s (with Steam server-time sync, §15):
1. Refuse **backward** date jumps (`newId < dateId` lexicographically — anti-cheat monotonic guard). Same for week ids.
2. Finalize yesterday: if `dailyCurry > 0`, compute rivals for yesterday's seed, get placement + trophy tier, increment `trophies[tier]`, and `submitDayScore(dailyCurry)` to Steam.
3. Full reset: new `dateId`, `seed = FNV1a(dateId)`, `weekId`, `dailyCurry = 0`, `bestFranchiseStars = max(best, franchiseStarsEarned)`, franchise stars/upgrades wiped, `currentCurry = 0`, `weeksCompleted = 0`, then `startNewWeek()`.
4. **Survivors of everything:** `highScore`, `totalCurryAllTime`, `trophies`, `unlockedBadges`, `bestFranchiseStars`, decorations/placements/skin, settings, tutorial state.

---

## 3. Ingredients (60 total)

`Ingredient = { id, name, icon, color, baseValue, category, flavor, rarity, description, set? }`

- Categories: spice, vegetable, protein, dairy, herb. Flavors (orthogonal): spicy, mild, sweet, savory, unique. Rarity: common/uncommon/rare.
- 30 base ingredients (always available) + 6 franchise sets × 5 (unlocked by owning the matching `set_*` franchise upgrade).
- Daily specials, cravings pool, and guaranteed recipes draw from **base ingredients only**.

### Base 30 (id — baseValue, category, flavor, rarity)
**Spices:** chili 8 spicy · cumin 6 savory · turmeric 5 savory · coriander_seed 5 savory · cardamom 9 sweet U · cloves 6 sweet U · cinnamon 6 sweet U · nutmeg 7 sweet U · star_anise 8 unique R · saffron 10 unique R
**Vegetables:** garlic 4 savory · onion 3 savory · tomato 4 savory · potato 3 mild · curry_leaf 6 savory U · pepper 5 spicy U · mustard_seed 5 spicy U · fenugreek 6 unique U · lemongrass 7 unique R · tamarind 8 sweet R
**Proteins:** chicken 5 savory · cashew 6 mild · ginger 5 spicy · coconut 7 mild U · paprika 6 spicy U · garam_masala 8 spicy R
**Dairy:** yogurt 4 mild · ghee 5 mild · salt 3 savory
**Herbs:** mint 6 mild U
(U = uncommon, R = rare; unmarked = common.)

### Franchise sets (5 each)
- **coastal:** shrimp 5, kokum 6, malvani_masala 7, sea_salt 4, lime_leaf 6
- **street:** chaat_masala 6, green_chutney 4, pav 4, jaggery 5, seekh_kebab 7
- **royal:** silver_leaf 12, kewra_water 9, rose_petals 8, dried_apricot 8, white_pepper 10
- **himalayan:** yak_butter 7, black_cardamom 9, timur_pepper 10, buckwheat 5, juniper_berry 6
- **tandoor:** charcoal_smoke 8, naan_crisp 4, kasuri_methi 7, black_salt 5, tandoori_paneer 7
- **mithai:** khoya 8, pistachio 7, rose_syrup 6, cardamom_sugar 9, saffron_milk 10

---

## 4. Seeded RNG & Determinism (critical for port)

`makeRng(seed)` (src/lib/rng.ts) = **xmur3** string hash → **mulberry32** PRNG, returning floats in [0,1). All "same for every player today" content derives from it. To keep cross-platform parity, Godot must replicate both with exact 32-bit unsigned integer math (`Math.imul` = 32-bit multiply; charCodeAt = UTF-16 code unit).

A second hash, **FNV-1a 32-bit** (`seedFromWeekId` in weekEngine: offset 2166136261, prime 16777619), turns the date string into the integer master seed.

**Seed strings (must match byte-for-byte):**
- Affinity matrix: bare integer seed = `FNV1a(dateId)` where `dateId` = local `"YYYY-MM-DD"`
- Chef's Special: `"${seed}-special-day${day}"`
- Daily craving: `"${seed}-craving-day${day}"`
- Day choices: `"${seed}-daychoices-${day}"`
- Rivals: `"${seed}-rivals-${scale}"`
- Recipe name suggestion: `"name-${fingerprint}"`

RNG **consumption order** matters too (e.g. the affinity matrix draws once per `a < b` string-compare pair in ingredient-list order; guaranteed recipes consume the same stream afterward). The only non-seeded random gameplay: crit spawns/positions, `randomNeutralRecipe` (onboarding helper), Crazy Curry timing, customer behavior — all local, use any RNG.

---

## 5. Affinity System (the weekly puzzle)

`buildAffinityData(seed)` (src/engine/affinityEngine.ts):
1. One rng stream. For every unordered pair among all 60 ingredients: `value = rng()*3 - 1` → **[-1.0, +2.0]**, stored symmetric, self = 0.
2. **6 guaranteed positive recipes** carved afterward (overwriting): Fisher–Yates-shuffle the 30 base ids; repeatedly take `3 + floor(rng()*3)` (3–5) ingredients from the front; overwrite every pair inside each combo with `0.8 + rng()*1.2` → **[+0.8, +2.0]**; reshuffle a fresh base list when the pool runs low.
3. Result memoized per seed. Pair keys for the Journal: `"${min}|${max}"` (note: `|` separator; recipe fingerprints use `+`).

Players discover affinities by: cooking (day-end reveals all pairs of the final recipe), tasting (25 cooks of one recipe reveals its pairs mid-day), and the franchise Insight perk (3/6 pairs pre-revealed weekly).

---

## 6. Recipe Scoring

`computeRecipeScore(slots, matrix, { spicePairBonus, craving })` (src/engine/recipeEngine.ts):

1. Sum affinity over every unordered pair of slotted ingredients; add `spicePairBonus` to any spice+spice pair (from Spice Rack +0.2 / Masala Dabba +0.15 decorations). `avgAffinity = total / pairCount`.
2. **Tier from average** (`avgAffinityToTier`): `>1.3` legendary · `≥0.8` great · `≥0.3` good · `≥-0.3` neutral · else terrible. Single ingredient (no pairs) = neutral.
3. **Multiplier curve** (independent table — walked top-down, last threshold ≤ avg wins):
   `-∞ → 0.5 · -0.3 → 0.75 · 0.3 → 1.0 · 0.8 → 1.5 · 1.3 → 2.25 · 1.6 → 3.5`
   ⚠️ Deliberate quirk to preserve: legendary **tier** starts at avg > 1.3, but the ×3.5 multiplier needs avg ≥ 1.6. A recipe in (1.3, 1.6) shows legendary but pays 2.25. Single ingredient → multiplier 1.
4. `baseValue` = sum of slotted ingredients' baseValues.
5. **Flavor** = most common flavor among slots; ties → `"unique"`; empty → null.
6. **Craving adjustment** (effective fields only; raw preserved):
   - Match → `effectiveMultiplier = multiplier × 1.35` (`CRAVING_MATCH_BONUS`).
   - Mismatch AND raw tier legendary → capped: `effectiveTier = "great"`, `effectiveMultiplier = 2.25`.

Tier order: none 0, terrible 1, neutral 2, good 3, great 4, legendary 5. Tier multipliers: 1 / 0.5 / 1.0 / 1.5 / 2.25 / 3.5.

### Recipe identity & naming (src/engine/cookbook.ts)
- Fingerprint = non-null slot ids **sorted ascending, joined with `"+"`** (order-free set identity).
- Suggested name = seeded pick of one of 15 adjectives (Crimson, Golden, Blazing, Royal, Mystic, Smoky, Velvet, Thunder, Saffron, Midnight, Emerald, Spiced, Wild, Sacred, Molten) + one of 15 nouns (Blaze, Storm, Feast, Dream, Inferno, Symphony, Sunrise, Tempest, Whisper, Crown, Mirage, Cascade, Ember, Nirvana, Riot), seeded by `"name-" + fingerprint`.
- **Naming Ceremony:** first cook of a NEW great/legendary recipe fires the naming modal (day auto-pauses); dice re-rolls, 32-char cap, skippable ("Unnamed").
- `randomNeutralRecipe`: onboarding/Random-button helper — up to 40 shuffled samples, keep the first whose tier is neutral or good (never terrible, never a free great+ that would trigger the ceremony on a new player's first tap).

---

## 7. Daily Events & Modifiers

### 7.1 Chef's Special
Deterministic pair of two distinct base ingredients per (seed, day). Both slotted → `specialMultiplier = 2.0` on every cook. `ChefSpecialPanel` has a "Mix it in" that clears and slots the pair. Claimable once/day (`specialClaimDays`, feeds a badge).

### 7.2 Daily Craving
One of the 5 flavors per (seed, day). Matching recipe flavor → ×1.35; mismatched legendary is capped to great (§6). UI: `CravingBar` shows the craving + ×1.35, collapses to "Craving matched" when satisfied.

### 7.3 Recipe Streak
Consecutive days that END at tier good+ build a persistent multiplier; a neutral-or-worse day end resets to 0.
`STREAK_MULTIPLIERS`: 0–1 days → 1.0 · 2 → 1.05 · 3 → 1.08 · 4 → 1.12 · 5 → 1.15 · 6 → 1.2 · 7 → 1.25 (capped at 7 days).

### 7.4 End-of-Day Choices (day modifiers)
After days 1–6 (skipped after tutorial day 1), player is offered up to 3 of the 5 modifiers (seeded pick, excluding ones already used this week) or may decline. Applies to the NEXT day only; cleared at that day's end.

| id | name | bonus | cost |
|---|---|---|---|
| ghost_pepper | Ghost Pepper Rush | clickMult ×100 | day is 4 seconds |
| bubble_bonanza | Bubble Bonanza | crit spawn chance ×3 | crit rolls biased low (roll twice, keep lower) |
| rush_hour | Rush Hour | clickMult ×3 | day length ×0.5 |
| hand_crafted | Hand-Crafted | clickMult ×10 | critChanceMult 0 (no crit circles) |
| marathon | Marathon Prep | day length ×2 | clickMult ×0.75 |

`clickMult` multiplies every cook's payout; `daySeconds`/`dayLengthMult` change the loop's day length; `critChanceMult`/`critBiasLow` feed crit spawning (§8.3).

---

## 8. Cooking: Click Pipeline, Crits, Momentum

### 8.1 The cook value formula (src/engine/clickEngine.ts + GameplayScreen)
Per cook:
```
base = floor(
  ( recipeBaseValue × effectiveMultiplier × effects.clickMultiplier
    + effects.flatClickBonus
    + effects.spiceClickBonusPerSpice × spiceCountInRecipe )    // tandoor bonus
  × streakMultiplier
  × specialMultiplier          // 2 if Chef's Special pair slotted
  × effects.decorSetMultiplier
  × effects.globalMultiplier ) // franchise reputation

final = floor(base × crazyCurryMult × critMult × onFireMult × dayModifier.clickMult)
```
The inner block is computed by the engine; the outer momentum/crit/day-mod multipliers are applied at the cook call site before `addCurry(final)`.

`addCurry(v)` increments: `currentCurry` (spendable), `totalCurryAllTime`, `weekCurry`, `todayCurry`, `dailyCurry` (leaderboard score), and `highScore = max(weekCurry, highScore)`.

### 8.2 Cook input & anti-cheat gate (order matters)
1. No cook unless a recipe is slotted, the day is started, and not paused.
2. **Focus gate:** window must have focus. **Trusted-input gate:** a real (`isTrusted`) pointerdown/pointerup/keydown must have occurred within the last **100 ms** (global capture listeners record the timestamp; synthetic events don't).
3. **CPS cap 25** over a rolling 1-second window; excess cooks are **silently dropped** (no feedback for autoclickers). Humans peak ~15–20 CPS; Crazy Curry's top floor is 8.
4. **Spacebar cook:** Space (non-repeat, not in a form control) cooks at the current pointer position if it's over the scene, else at scene center with ±24 px jitter; if the pointer hovers a live crit circle, Space clicks the crit instead.
5. Diner tips (§12.5) bypass momentum multipliers: `tip = max(1, floor(perCookBase × 0.2 × (1 + expansionLevel)))`.

### 8.3 Critical circles
Timed bonus targets that spawn inside the scene; clicking one performs a cook at its position with the tier's multiplier.

**Tier table** (weights sum 100; low = common/big/slow, high = rare/tiny/fast):
| mult | weight | size px | lifetime ms |
|---|---|---|---|
| 1.1 | 40 | 96 | 10,000 |
| 1.5 | 25 | 84 | 7,000 |
| 2 | 15 | 72 | 5,000 |
| 5 | 10 | 60 | 2,500 |
| 10 | 6 | 48 | 1,200 |
| 25 | 3 | 38 | 600 |
| 100 | 1 | 28 | 300 |

- **Spawn:** rolled only on normal (non-crit) cooks while no circle is up: `chance = min(0.4 × dayMod.critChanceMult, 0.9)`. Position uniform in the scene rect inset by `size/2 + 8`. `critBiasLow` → roll the tier twice, keep the lower.
- **Reaction floor (anti-cheat):** clicks within **130 ms** of the circle going live are ignored (sub-human aim-lock rejection; random placement means a real hit needs ~200 ms+).
- **Jackpot chain:** on a successful crit click, chance `0.35 − 0.1 × chainDepth` (35% → 25% → 15%, cap 3) spawns a circle **one tier higher**. Chained circles show a 400 ms non-interactive "telegraph" ring first (their `liveAt` starts at telegraph, so the reaction floor is pre-satisfied).
- Juice: shake small at mult ≥ 5, shake large + screen flash at ≥ 25; rising zap SFX scaled to mult; inner ring shrinks over the lifetime as a countdown.

### 8.4 On Fire (heat meter, always on)
- +8 heat per cook, cap 100. Decay: 10 heat/s within a 1.5 s grace window after each cook (≈1.25 CPS sustains), then 45 heat/s (full bar drains ≈2.2 s). 100 ms tick.
- Stages: heat ≥ 50 → ×1.25 "Heating up"; heat ≥ 85 → ×1.5 "ON FIRE" (glow overlay + shake on ignition). Cook SFX pitch rises with heat.

### 8.5 Crazy Curry (random rush events)
- Active while a recipe is slotted and the day is running. Event every 45–90 s (uniform), lasts 8 s. First event of a day is clamped to fit in the remaining day time (`gap = max(5000, min(gap, remaining − 8000 − 2000))`) — soft guarantee of ≥1 per day.
- Tier picked uniformly: floor 3 CPS → ×1.5 · floor 5 → ×2 · floor 8 → ×3. During the event, each cook computes rolling CPS over a 2 s window (min 0.75 s denominator); at/above the floor it pays the multiplier, else ×1.
- Event start: star-award jingle + small shake.

### 8.6 Click milestones (per-day spam rewards, visual only)
Fire when `todayClicks + 1` hits: 15 "COMBO ×15!", 40 "HEATING UP!", 100 "CURRY FRENZY!", 250 "UNSTOPPABLE!", 500 "LADLE LEGEND!", 1000 "SPICE GOD!". The 100+ ones use higher-power float text + small shake.

---

## 9. Shop (curry-priced, weekly)

### 9.1 Upgrades (26, one-time, chained by prerequisite)
**Ladle chain** (click_multiplier, prestige-scaled §9.4): wooden_spoon 10k ×1.5 → steel_ladle 50k ×2 → golden_ladle 200k ×3 → obsidian_ladle 800k ×4 → diamond_ladle 10M ×5 → celestial_ladle 60M ×6 (uncapped by prestige).
**Knife chain** (click_multiplier, NOT prestige-scaled): chefs_knife 30k ×1.5 → damascus_knife 150k ×2 → legendary_cleaver 700k ×2.5.
**Kitchen crew** (flat +/click): sous_chef 20k +3 → kitchen_brigade 100k +12 → industrial_pot 500k +50 → curry_conveyor 2M +200 → robot_kitchen 20M +750 → curry_megaworks 100M +2500.
**Delivery** (flat): delivery_bicycle 40k +6 → delivery_scooter 250k +30 → delivery_fleet 1.2M +125.
**Recipe slots:** slot_4 5k (4th slot) → slot_5 25k (5th; blocked in demo).
**Restaurant Expansion** (cosmetic scene growth + faster/more diners, levels 1–5): 8k → 30k → 90k → 250k → 600k.

Click multipliers stack **multiplicatively**; flat bonuses add.

### 9.2 Decorations (20, stackable to maxQuantity, flat +/click)
potted_tulsi 3k +1 ×4 · neko 5k +1 ×3 · wind_chimes 8k +1 ×3 · spatula 10k +2 ×3 · copper_pots 15k +2 ×2 · spice_rack 18k +3 (spicePairAffinity +0.2) · rangoli 22k +3 · arcade 25k +4 ×2 · masala_dabba 35k +4 (spicePairAffinity +0.15) · tandoor 40k +6 (spiceClickBonus +1/spice) · koi_tank 60k +9 · shrine 80k +12 · jukebox 110k +15 · pepper_mill 120k +10 (spiceClickBonus +2/spice) · neon_sign 150k +20 · chandelier 220k +25 · auto_ladle 300k +45 · fountain 450k +50 · elephant_statue 2.5M +90 · rooftop_garden 5M +160. (Unlisted max = 1.)
Repeat-copy cost: `round(cost × 1.75^ownedQty)`.

### 9.3 Decoration sets (own all pieces → multiplicative cook bonus, stack together)
cozy (tulsi+neko+chimes) ×1.1 · spice_lord (rack+dabba+mill+tandoor) ×1.25 · golden_hour (spatula+chandelier+neon_sign) ×1.15 · zen_garden (koi+fountain+rangoli) ×1.2 · showtime (arcade+jukebox+copper_pots) ×1.15.

### 9.4 Prestige scaling (weekly, src/engine/shopData.ts)
`p = weeksCompleted` (resets each real day):
- All upgrade costs: `round(cost × 1.5^p)`.
- Ladle values (and bare-hands base click): `printed × (1 + 0.25p)`, capped at 4× printed (~p 12); celestial_ladle uncapped. Knives unscaled.
- Effects aggregation (`computeEffects`): clickMultiplier starts at the prestige-scaled bare-hands base, multiplies in each ladle/knife; flat bonuses and decoration bonuses add; `unlockedSlots = min(max(franchise base, slot upgrades), cap)`; `globalMultiplier` = franchise reputation.

### 9.5 Goal bar
Gameplay screen shows progress toward the cheapest eligible unpurchased item; pulses "READY!" when affordable. Shop exists as both a full page and a right-hand slide-out drawer (cook while shopping).

---

## 10. Franchise (Stars meta-layer, resets each real day)

Stars are earned at week completion (§2) and spent on permanent-for-the-day upgrades. 15 upgrades, "highest tier wins" (no stacking), chained prerequisites:

| id | cost | effect |
|---|---|---|
| reputation_1/2/3 | 2 / 5 / 9 | global multiplier ×1.25 / ×1.5 / ×2 |
| set_coastal/street/royal/himalayan/tandoor/mithai | 3 / 6 / 8 / 10 / 12 / 15 | unlock that ingredient set |
| head_start_1/2 | 2 / 3 | +500 / +10,000 curry at week start |
| insight_1/2 | 3 / 5 | 3 / 6 affinity pairs pre-revealed per week |
| fourth_burner | 6 | weeks start with 4 recipe slots |

**Ranks** by Stars earned today: 0 Street Stall · 5 Corner Kitchen · 15 Local Favorite · 30 City Star · 50 Curry Empire. `bestFranchiseStars` (best single day) is the permanent profile record and the Steam "prestige" figure.

---

## 11. Leaderboard, Trophies, Badges, Collections

### 11.1 Daily rivals (src/engine/dailyRivals.ts)
100 deterministic NPC rivals per calendar day, scaled to the player:
- `scale = 10^ceil(log10(max(highScore, 10000)))` (order-of-magnitude bucket so ranks don't jitter mid-day).
- Seeded rng `"${seed}-rivals-${scale}"`. Names = 20 first (Spicy, Garam, Tikka, Naan, Paneer, Masala, Chutney, Vindaloo, Korma, Saffron, Cardamom, Turmeric, Ghee, Tandoori, Biryani, Cumin, Chili, Pepper, Coco, Mango) × 20 last (Boi, Gorilla, Taco, Stop, Panic, Master, Wizard, Ninja, King, Queen, Fiend, Machine, Storm, Legend, Goblin, Baron, Rocket, Whisk, Ladle, Pot); duplicates get a 10–99 suffix.
- Score i (0–99): `floor(scale × 2.5 × 0.92^i × (0.7 + 0.6×rng()))`, sorted descending.
- Placement = rivals strictly above player + 1. Leaderboard score = `dailyCurry`. Player row shows Steam persona name or "You".

### 11.2 Trophies
At date rollover, yesterday's placement converts to a trophy tier: ranks 1–5 individual, ≤10 "top10", ≤100 "top100". Repeatable counters per tier, permanent.

### 11.3 Badges (10, permanent; mapped to Steam achievements)
spicy_boy (first curry) · curry_king (lifetime ≥ 1M) · speedster (≥1000 clicks in a day) · week_warrior (1 week done) · recipe_master (10 recipes discovered) · synergy (a legendary seen) · combo_king (5-slot recipe cooked) · special_collector (Chef's Special claimed 5 days in a week) · streak_master (7-day streak) · curator (5 recipes named).
Steam API names are the SCREAMING_SNAKE versions (synergy → SYNERGY_SEEKER).

### 11.4 Collections (Affinity Journal sets, weekly claims)
Progress = discovered pairs where BOTH members are in the pool: Spice Cabinet (spices, target 10) · Produce Aisle (vegetables, 10) · Protein Counter (proteins, 6) · Journal Scholar (any, 30). Targets clamp to pool pair-count (pools shrink in demo). Claim reward: `max(1000, floor(weekCurry × 0.02))` curry.

---

## 12. The Restaurant Scene (pseudo-3D diorama)

Player looks over a foreground counter into a perspective dining room. Pixel-art sprite sheets, `PIXEL_SCALE = 3`, bottom-center anchored, painter's-order z.

### 12.1 Projection (src/scene/projection.ts) — the load-bearing math
Floor in normalized coords `u ∈ [0,1]` (left→right), `v ∈ [0,1]` (back wall→counter). Output = % of scene rect + scale + z:
```
FLOOR_TOP=40% FLOOR_BOTTOM=70%           # floor band on screen
BACK_LEFT=26% BACK_RIGHT=74%             # narrow at back
FRONT_LEFT=-4% FRONT_RIGHT=104%          # wide at front
BACK_SCALE=0.62 FRONT_SCALE=1.18
FORESHORTEN=0.55; ty = t + (t² − t)×0.55 # depth ease (far rows bunch)
xPct = lerp(lerp(26,-4,t), lerp(74,104,t), u)
yPct = lerp(40, 70, ty);  scale = lerp(0.62, 1.18, t);  z = round(t×1000)
```
Walls occupy 0–40% height; `projectWall(u, heightPct)` places fixtures. Floor grid 8×5 for cell helpers.

### 12.2 Layout (src/scene/layout.ts)
- **Tables:** 5 at expansion level 0 — (0.35,0.33) (0.65,0.33) (0.2,0.67) (0.5,0.67) (0.8,0.67); each expansion level 1–5 adds a symmetric pair: L1 (0.35,0.5)(0.65,0.5), L2 (0.2,0.5)(0.8,0.5), L3 (0.2,0.33)(0.8,0.33), L4 (0.35,0.67)(0.65,0.67), L5 (0.5,0.5)(0.5,0.33). Two seats per table at `du = ±0.06`.
- Door at wall u 0.5; windows at wall (0.18, 0.55)/(0.82, 0.55); corner plants (0.05,0.46)/(0.96,0.52); wall fixtures: 2 ceiling fans, 2 pendant lamps, wall clock, 2 window valances, menu board, tumbler shelf, family photos; entry mat on floor; chef spot (0.5, 0.84).

### 12.3 Sprites & skins
- Sheets (16 px grid unless noted): props (table/plant/door), 2 customer sheets × 4 palette rows = **8 customer variants** (idle + 2-frame walk @6fps), curry dishes (5 color variants), window street 32×32 (4 day-phase skies/streets + clouds + frame), passerby, interior props 32×32 (animated fans @12fps, lamps @3fps, clock @2fps).
- **Backdrops:** one baked 320×192 PNG per skin. 4 skins: default "Curry House", neon "Neon Night", zen "Zen Garden", mumbai "Rooftop Mumbai" — free cosmetics; dark mode forces neon.
- Ambient day tint tracks `dayProgress`: warm morning gradient fades out by mid-day, amber/purple evening fades in after (skipped on neon).

### 12.4 Counter & dishes
5×2 grid = capacity 10 dishes. Each cook adds a dish (cap 10); diners consume them. Dish scale lerps 0.42→0.72 front row, z above the room. Counter face is a slice of the baked backdrop.

### 12.5 Customers (src/hooks/useCustomerDirector.ts — an FSM)
- Runs while the shop is "open" (day running, not editing) and dishes are on the counter.
- `MAX_CUSTOMERS = min(6 + expansionLevel×2, seatCount)`. Spawn attempt every `max(700, 1700 − expansionLevel×180)` ms.
- On spawn: random free seat, **reserve a dish immediately** (prevents double-claims, visibly drains the counter), 1-in-10 chance of being "expressive" (mood bubbles), snapshot whether the craving was matched at serve time.
- Lifecycle: enter at door → walk 1500 ms → eat 3500 ms → **pay tip via `onFed`** (`max(1, floor(perCookBase × 0.2 × (1 + expansionLevel)))`) → walk out 1500 ms → despawn. Craving-matched diners get special happy bubbles + star sparkles.
- Shop closes (day end/pause/recipe cleared): everyone switches to leaving immediately.

### 12.6 Windows & decor placement
- Windows: 5-layer mini diorama (sky → clouds → street → passerby → frame); day phase quantized from `dayProgress` (<0.15 dawn, <0.55 midday, <0.85 dusk, else night); a passerby crosses every 20–40 s.
- **Decorate mode:** overlay editor; tap to place owned decorations anywhere (`xPct` clamped 3–97, `yPct` 10–70). Depth scale `0.7 + yPct/100 × 0.45`; z = `round(yPct)+1`. Purchases auto-place at the next free spot. Editor also hosts the skin picker and shows set-bonus progress.

### 12.7 Juice
- ClickBurst particle spray at the cook point (7 + 4×power particles, ring + dots, ≤450 ms, pure CSS/compositor).
- FloatText "+value" risers (3 power sizes; suffixes `CRIT ×N!`, `×N!`, `×2!`, `🔥×N`; max 12 live; 800–1100 ms).
- Score display rolls up on gains (0.35 s easeOut), snaps down on spends, spring-pulses on change.
- Scene shake (2 magnitudes), jackpot white flash, on-fire glow, dish pop-in. All skipped under reduced-motion.

### 12.8 Audio (src/lib/sfx.ts) — fully synthesized, zero audio files
Web Audio oscillators: cook blip (pitch rises with On Fire heat), crit rising zap (2–4 steps by mult), purchase ka-ching, discovery arpeggios per tier, week-complete fanfare, star-award pentatonic. Ambient music: Cmaj7→Am7→Fmaj7→G9 loop, 2.4 s per chord, scheduled ahead of the audio clock, arpeggio alternating per step. Separate SFX/music volumes; starts after first user gesture. In Godot: either port the synth recipe or replace with baked audio assets.

---

## 13. Tutorial & Progressive Reveal

`tutorialStep`: `start → cook → tabs → kitchen → week1 → done`.
- **start:** only the scene + Start button visible (nav hidden), spotlight on Start. Pressing it seeds a starter recipe (`randomNeutralRecipe`) if slots are empty.
- **cook:** day 1, mashing only; nav/shop hidden. Day 1 end → **tabs** (nav revealed, spotlight on Kitchen; the day-choice offer is suppressed this one time).
- **kitchen:** recipe/affinity tutorial in the Kitchen screen (entering the kitchen during "tabs" advances the step).
- **week1:** guided rest of week; features unlock by day: shop day 3, craving day 4, special day 5 (`FEATURE_UNLOCK_DAY`). After `done`, everything is always on.
- One-time feature intro cards tracked in `introsSeen`. `hardReset()` keeps `tutorialStep = "done"` (a reset player skips the tutorial); a separate "replay onboarding" resets it to `start`.

---

## 14. Save System & Full State Shape

Zustand persist, `SAVE_KEY = "curry-clicker-save"`, `SAVE_VERSION = 15`. Web: localStorage. Desktop: `save.json` in Electron userData (Steam Auto-Cloud syncs it), writes debounced 1000 ms, flushed on quit. Same JSON either way.

### Persisted fields (grouped)
- **Economy:** currentCurry, totalCurryAllTime, weekCurry, highScore, todayCurry, todayClicks, clicksThisWeek
- **Daily leaderboard:** dateId, dailyCurry, trophies{tier→count}
- **Settings:** sfxOn, musicOn, sfxVolume (1), musicVolume (0.7), darkMode, hasOnboarded, tutorialStep, introsSeen
- **Recipe/shop:** slots[5], ownedDecorations{id→qty}, purchasedUpgrades[], unlockedSlots
- **Rewards:** specialClaimDays[], recipeStreakDays, recipeStreakMultiplier, highestTierSeen, discoveredRecipes{fingerprint→{ids,tier,mult,name?,discoveredDay,cookCount}}, discoveredAffinities{pairKey→value}, claimedSets[], unlockedBadges[], weeksCompleted, maxSlotsUsed
- **Franchise:** franchiseStars, franchiseStarsEarned, bestFranchiseStars, franchiseUpgrades[], cravingMatchDays, lastWeekStars{total,reasons}
- **Scene:** decorationPlacements[{instanceId, decorationId, xPct, yPct}], activeSkin
- **Week:** phase, weekId, seed, currentDay, dayProgress, dailySnapshots[], pendingDayChoices, activeDayModifierId, usedDayModifierIds
- **NOT persisted:** dayStarted, dayPaused (reload always lands pre-day → fresh Start Day required), all momentum/customer/crit state.

### Load-time plausibility clamps (anti-cheat — port these)
- Every currency field: reject non-finite/negative, cap at **1e15**.
- `dailyCurry ≤ totalCurryAllTime`. Trophy counts capped 10,000/tier. Snapshot currys clamped. Placements with non-finite coords re-homed.
- On rehydrate: recompute derived effects (`unlockedSlots` etc.) from owned items — never trust the persisted derived value.

### Migrations
15 cumulative versions exist (added scene placements, franchise fields, sound split, daily leaderboard, tutorial step, placement healing, removed old auto-production & affinity-lens features). For Godot, start fresh at one schema; only relevant if importing old saves.

---

## 15. Anti-Cheat Cluster (complete list to replicate)

1. **Trusted input:** cook must trace to a real OS input event within 100 ms (synthetic events don't count). Godot: only cook from real InputEvents.
2. **Focus gate:** no cooks while the window is unfocused (blocks background autoclickers).
3. **CPS cap 25** (rolling 1 s), silently dropped.
4. **Crit reaction floor 130 ms** after a circle goes live (blocks aim-lock scripts; positions are random).
5. **Server-time clock anchor:** every 30 s poll Steam `getServerRealTime()`; `clockOffsetMs = serverEpoch×1000 − Date.now()`; all date/week rollover checks use the offset clock (local timezone still decides midnight). Web/no-Steam: offset 0.
6. **Monotonic date/week guards:** backward jumps of `dateId`/`weekId` (lexicographic compare) are refused — no re-farming trophies by clock-flapping.
7. **Save clamps** (§14).
8. **Steam stat max-merge:** `submitDayScore` clamps to [0, 2^31−1] and never lowers the recorded best.
9. **DevTools disabled** in production desktop builds.

---

## 16. Steam / Desktop Integration

- **steamworks.js** (v0.4.x), App ID from `CURRY_STEAM_APPID` env, currently 480 (Spacewar test — needs real ID).
- Renderer bridge `window.curryDesktop` (context-isolated preload → IPC): `readSave`, `writeSave`, `unlockAchievement(id)`, `submitDayScore(value)`, `getSteamPlayerName`, `getServerTime`. All optional-chained no-ops on web.
- **Leaderboard is NOT the real Steam leaderboard API** (unavailable in steamworks.js) — best single-calendar-day curry is stored as int stat `daily_curry_best` (max-merge). Godot: GodotSteam exposes real leaderboards; this could be upgraded.
- 10 achievements = the badges (§11.3). Overlay enabled. External links open in system browser; window.open denied; single-instance lock; 1280×800 window (min 960×640).
- Save file = userData/save.json for Steam Auto-Cloud.

---

## 17. Demo Build Differences

- 12 of the 30 base ingredients locked (star_anise, saffron, lemongrass, tamarind, garam_masala, cloves, nutmeg, curry_leaf, mustard_seed, paprika, coconut, mint) — every flavor stays craving-matchable.
- Only 2 decorations purchasable (potted_tulsi, neko). Max 4 recipe slots (slot_5 blocked). No franchise purchases. Leaderboard screen hidden.
- Capped at 1 completed week (`startDay` refuses afterward); tutorial force-completes at week end; Steam CTA in the week summary; feedback modal (web only).

---

## 18. Number Formatting

- `formatCurry`: < 1000 exact integer; else suffixes K/M/B/T, `value / 1000^i` with configurable decimals, capped at T (~1e12 display).
- `formatScore`: always ≥ 4 significant figures (decimals = 4 − leading digits).

---

## 19. Porting Checklist (Godot-specific)

1. Autoload singleton = the game store; one `_process(delta)` drives `dayProgress` (clamp delta to 1 s).
2. Port xmur3 + mulberry32 + FNV-1a with exact 32-bit unsigned math if daily content must match the web/Electron version; otherwise any seeded RNG works but breaks cross-version parity.
3. Rebuild the trapezoid projection (§12.1) — it's ~15 lines of lerps; sprites bottom-anchored, z-index from depth.
4. Replace `setTimeout` chains (customers, crits, floats) with `Timer`/`create_timer`; replace `crypto.randomUUID()` placement ids with a counter.
5. Keep the two tier/multiplier tables independent (§6 quirk).
6. Reassemble the full multiplier stack at the cook call site (§8.1) — the store only ever receives the final integer.
7. Port the anti-cheat cluster (§15) and save clamps (§14) — they're behavioral rules, not web-specific.
8. GodotSteam: achievements map 1:1; consider upgrading `daily_curry_best` stat to a real leaderboard.
9. Audio is currently synthesized (§12.8) — decide between porting the synth recipe (AudioStreamGenerator) or baking assets.
