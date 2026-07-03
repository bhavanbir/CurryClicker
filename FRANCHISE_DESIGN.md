# Franchise System — Design Doc (Phase 1, Steam release)

_Status: approved design, implementation in progress. This is the contract for
the engine/content/UI work — deviations need a note in the PR/summary._

## Why

The weekly reset is already the core loop (affinity matrix reseeds, journal and
cookbook wipe, the player chases a better week). The Franchise system turns
that reset into the prestige trigger itself: **finishing a week pays Franchise
Stars; Stars buy permanent meta-upgrades that make every future week richer.**
No separate "rebirth" mechanic, no wiping progress the player didn't expect to
lose.

Design goals:
- Extend the long game past one week (clicker buyers expect many hours).
- Reward *skill* (tier reached, cravings matched, journal coverage), not just
  time spent.
- Expand the ingredient roster in purchasable sets so the affinity-matrix
  puzzle keeps growing.
- Replace the unbuilt XP/leveling system (the Profile's static "Rising Star"
  title) with Franchise rank.

## Earning Stars

Awarded once, at week completion (when the week summary is shown / the new
week starts). All inputs already exist in the store.

| Achievement that week | Stars |
|---|---|
| Completing the week (always) | +1 |
| `highestTierSeen` ≥ great | +1 |
| `highestTierSeen` = legendary | +1 (stacks with the great star → +2 total) |
| Cravings matched on ≥ 4 days (see counter below) | +1 |
| Affinity Journal: ≥ 20 pairs discovered that week | +1 |

Max 6/week. A new per-week counter `cravingMatchDays` is needed: a day counts
if the recipe flavor matched the craving at day-end (evaluate in the same
day-rollover code that snapshots the day).

Two persistent fields:
- `franchiseStars` — spendable balance.
- `franchiseStarsEarned` — lifetime total, never decreases; drives rank.

Both survive week resets. `hardReset` wipes them (it's "delete save").

## Spending Stars — meta-upgrade catalog

Permanent, one-time purchases (tiers are separate ids, prerequisite = previous
tier). Stored as `franchiseUpgrades: string[]`.

| Id | Name | Cost | Effect |
|---|---|---|---|
| `reputation_1` | Reputation I | 2★ | Permanent ×1.25 all curry earned |
| `reputation_2` | Reputation II | 5★ | ×1.5 (replaces I) |
| `reputation_3` | Reputation III | 9★ | ×2 (replaces II) |
| `set_coastal` | Coastal Set | 3★ | +5 ingredients (see Content) |
| `set_street` | Street Food Set | 6★ | +5 ingredients |
| `set_royal` | Royal Set | 8★ | +5 ingredients |
| `head_start_1` | Head Start I | 2★ | Start each week with 500 curry |
| `head_start_2` | Head Start II | 3★ | 10,000 curry (replaces I) |
| `insight_1` | Journal Insight I | 3★ | 3 random pairs pre-revealed each week |
| `insight_2` | Journal Insight II | 5★ | 6 pairs (replaces I) |
| `fourth_burner` | Fourth Burner | 6★ | Weeks start with 4 recipe slots unlocked |

Total sink: 52★ ≈ 11–24 played weeks depending on skill (sim-tuned; casual
~12, active ~11, idle ~24).

Integration point: `computeEffects` (engine/effects.ts) grows franchise-aware
inputs (or a parallel `computeFranchiseEffects`) feeding: global multiplier
into the click/auto pipeline, starting curry + pre-revealed journal pairs +
base slots into `startNewWeek`.

## Franchise Rank (replaces XP)

Derived from `franchiseStarsEarned`, displayed as the Profile title and in the
week summary:

| Lifetime ★ | Title |
|---|---|
| 0–4 | Street Stall |
| 5–14 | Corner Kitchen |
| 15–29 | Local Favorite |
| 30–49 | City Star |
| 50+ | Curry Empire |

## Content expansion

### Ingredients: 30 → 45
Three sets of 5, each themed, each spanning flavors/categories/rarities so a
set meaningfully expands the puzzle (don't make a set all-one-flavor):
- **Coastal** (`set_coastal`): seafood/coastal theme (e.g. shrimp, kokum,
  curry-fish, sea salt, lime leaf — content author's call).
- **Street Food** (`set_street`): street-cart theme.
- **Royal** (`set_royal`): luxury theme (higher baseValues, more rare rarity).

Mechanics:
- New optional field on `Ingredient`: `set?: "coastal" | "street" | "royal"`.
  Absent = base roster.
- The affinity matrix builds over ALL 45 ingredients always (deterministic
  regardless of unlocks). Locked ingredients simply don't appear in the
  pantry (or appear Steam/franchise-locked — UI wave's call).
- `getDailySpecial` and `getDailyCraving` draw from the BASE 30 only, so a
  special never features an ingredient the player can't use. (Craving is a
  flavor, unaffected — but keep the flavor distribution sane.)
- Guaranteed positive combos (`GUARANTEED_RECIPE_COUNT`) must keep working;
  seed them from the base roster so week 1 players always have findable
  recipes.

### Upgrades & decorations: ~10+10 → ~30–45 total
Extend `shopData.ts` (curry-priced, unchanged system — this is separate from
franchise star upgrades):
- Upgrade chains get more tiers (cook value ×, curry/sec, spawn/expansion).
- New decorations across price bands, mapped to existing effect types.
- Costs follow the existing curve conventions; the simulator validates.

## Balance simulator

`scripts/balanceSim.ts` — headless, imports the pure engine (no React/DOM),
simulates N weeks of plausible play (clicks/sec archetypes: idle / casual /
active), prints per-week curry, purchases affordable, stars earned, and weeks
needed to buy out the franchise catalog. Run via `npx tsx scripts/balanceSim.ts`.
Used to tune: shop costs, star costs, reputation multipliers.

## Explicitly out of scope for Phase 1
- Demo gating of franchise features (Phase 3).
- Steam achievements for franchise milestones (Phase 4).
- Any XP/leveling system — cut permanently; rank replaces it.
