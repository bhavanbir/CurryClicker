import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveStorage } from "../lib/saveStorage";
import { unlockAchievement, submitWeekScore } from "../lib/desktop";
import { Decimal } from "../lib/decimal";
import type {
  DailySnapshot,
  DiscoveredRecipe,
  Placement,
  RecipeTier,
  SceneSkin,
  WeekStarAward,
} from "../types";
import {
  getCurrentWeekId,
  seedFromWeekId,
  evaluateStreak,
  getDailyCraving,
} from "../engine/weekEngine";
import { getAffinityData, affinityPairKey } from "../engine/affinityEngine";
import {
  computeRecipeScore,
  computeRecipeFlavor,
  TIER_ORDER,
} from "../engine/recipeEngine";
import { computeEffects } from "../engine/effects";
import { computeAutoProduction } from "../engine/autoEngine";
import { recipeFingerprint } from "../engine/cookbook";
import { evaluateBadges } from "../engine/badges";
import { UPGRADE_MAP, DECORATION_MAP } from "../engine/shopData";
import {
  FRANCHISE_UPGRADE_MAP,
  headStartCurry,
  journalInsightPairs,
  unlockedIngredientIds,
} from "../engine/franchiseData";
import { makeRng } from "../lib/rng";
import { WALL_PLACE_ORDER } from "../scene/walls";
import { BASE_UNLOCKED_SLOTS } from "../config";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";

export const SAVE_KEY = "curry-clicker-save";
export const SAVE_VERSION = 10;

// NOTE: MVP keeps a flat store. The framework's slice split
// (player/recipe/week/shop/cosmetics) is the Phase-2 refactor target.

export type GamePhase = "cooking" | "week_summary";

export interface CookOutcome {
  fingerprint: string;
  isNewDiscovery: boolean;
  needsNaming: boolean; // first great/legendary craft of this recipe
}

const EMPTY_SLOTS: (string | null)[] = [null, null, null, null, null];

export interface GameState {
  // --- player ---
  currentCurry: Decimal;
  totalCurryAllTime: Decimal;
  weekCurry: Decimal; // this week's leaderboard score
  highScore: Decimal; // best weekCurry ever reached
  clicksThisWeek: number;

  // --- settings ---
  sfxOn: boolean;
  musicOn: boolean;
  sfxVolume: number; // 0–1
  musicVolume: number; // 0–1
  hasOnboarded: boolean; // first-run tutorial dismissed

  // --- recipe ---
  slots: (string | null)[];

  // --- economy (Epic B) ---
  ownedDecorations: Record<string, number>; // id -> quantity
  purchasedUpgrades: string[]; // upgrade ids
  unlockedSlots: number; // derived from recipe_slot_unlock upgrades

  // --- rewards (Epic C) ---
  specialClaimDays: number[]; // days the Chef's Special was claimed this week
  recipeStreakDays: number;
  recipeStreakMultiplier: number;
  highestTierSeen: RecipeTier; // best tier reached this week (Discovery Moments)
  discoveredRecipes: Record<string, DiscoveredRecipe>; // this week's cookbook
  // Affinity Journal: pair-key (affinityPairKey) -> true affinity, filled in as
  // recipes are cooked through day-end. Undefined = pair not yet tested. Weekly.
  discoveredAffinities: Record<string, number>;
  unlockedBadges: string[]; // cumulative, never un-earned
  weeksCompleted: number;
  maxSlotsUsed: number; // most slots in a cooked recipe (Combo King)

  // --- franchise (prestige) ---
  franchiseStars: number; // spendable Star balance
  franchiseStarsEarned: number; // lifetime Stars earned; never decreases; drives rank
  franchiseUpgrades: string[]; // owned franchise upgrade ids
  cravingMatchDays: number; // days this week the day-end flavour matched the craving
  lastWeekStars: WeekStarAward | null; // Star breakdown for the last completed week

  // --- scene (Phase 3/4) ---
  decorationPlacements: Placement[]; // owned decorations placed on the floor
  activeSkin: SceneSkin; // selected restaurant backdrop

  // --- week ---
  phase: GamePhase;
  weekId: string;
  seed: number;
  currentDay: number; // 1–7
  dayProgress: number; // 0.0–1.0 within the current day
  dayStarted: boolean; // false until the player presses Start Day — clock paused
  autoProduction: Decimal; // derived: decoration + auto-clicker CPS × recipe mult
  todayCurry: Decimal;
  todayClicks: number;
  dailySnapshots: DailySnapshot[];

  // --- actions ---
  addCurry: (amount: Decimal) => void;
  registerClick: () => void;
  setAudio: (
    patch: Partial<Pick<GameState, "sfxOn" | "musicOn" | "sfxVolume" | "musicVolume">>,
  ) => void;
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  toggleIngredient: (id: string) => void;
  setIngredient: (slot: number, id: string | null) => void;
  clearRecipe: () => void;
  advanceDayProgress: (frac: number) => void;
  startDay: () => void;
  ensureCurrentWeek: () => void;
  startNewWeek: () => void;
  hardReset: () => void;

  // economy
  spendCurry: (amount: Decimal) => void;
  purchaseUpgrade: (id: string) => boolean;
  purchaseDecoration: (id: string) => boolean;
  buyFranchiseUpgrade: (id: string) => boolean;
  recomputeDerived: () => void;

  // rewards
  noteTierSeen: (tier: RecipeTier) => boolean; // returns true if newly highest
  claimSpecial: (day: number) => void;
  logCook: (slots: (string | null)[]) => CookOutcome;
  nameRecipe: (fingerprint: string, name: string) => void;
  refreshBadges: () => void;

  // scene
  placeDecoration: (decorationId: string, col: number, row: number) => boolean;
  removePlacement: (instanceId: string) => void;
  setActiveSkin: (skin: SceneSkin) => void;
}

const initialWeekId = getCurrentWeekId();

// Active recipe tier for the current slots, including decoration spice bonus.
function currentTier(s: GameState): RecipeTier {
  const eff = computeEffects(s.purchasedUpgrades, s.ownedDecorations, s.franchiseUpgrades);
  const { matrix } = getAffinityData(s.seed);
  return computeRecipeScore(s.slots, matrix, {
    spicePairBonus: eff.spicePairAffinityBonus,
  }).tier;
}

// Next free wall slot for auto-placing a bought decoration (col = slot index).
function nextFreeCell(placements: Placement[]): { col: number; row: number } | null {
  const used = new Set(placements.map((p) => p.col));
  for (const i of WALL_PLACE_ORDER) {
    if (!used.has(i)) return { col: i, row: 0 };
  }
  return null;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentCurry: new Decimal(0),
      totalCurryAllTime: new Decimal(0),
      weekCurry: new Decimal(0),
      highScore: new Decimal(0),
      clicksThisWeek: 0,

      sfxOn: true,
      musicOn: true,
      sfxVolume: 1,
      musicVolume: 0.7,
      hasOnboarded: false,

      slots: [...EMPTY_SLOTS],

      ownedDecorations: {},
      purchasedUpgrades: [],
      unlockedSlots: BASE_UNLOCKED_SLOTS,

      specialClaimDays: [],
      recipeStreakDays: 0,
      recipeStreakMultiplier: 1,
      highestTierSeen: "none",
      discoveredRecipes: {},
      discoveredAffinities: {},
      unlockedBadges: [],
      weeksCompleted: 0,
      maxSlotsUsed: 0,

      franchiseStars: 0,
      franchiseStarsEarned: 0,
      franchiseUpgrades: [],
      cravingMatchDays: 0,
      lastWeekStars: null,

      decorationPlacements: [],
      activeSkin: "default",

      phase: "cooking",
      weekId: initialWeekId,
      seed: seedFromWeekId(initialWeekId),
      currentDay: 1,
      dayProgress: 0,
      dayStarted: false,
      autoProduction: new Decimal(0),
      todayCurry: new Decimal(0),
      todayClicks: 0,
      dailySnapshots: [],

      addCurry: (amount) =>
        set((s) => {
          const weekCurry = s.weekCurry.add(amount);
          return {
            currentCurry: s.currentCurry.add(amount),
            totalCurryAllTime: s.totalCurryAllTime.add(amount),
            weekCurry,
            highScore: weekCurry.gt(s.highScore) ? weekCurry : s.highScore,
            todayCurry: s.todayCurry.add(amount),
          };
        }),

      registerClick: () =>
        set((s) => ({
          clicksThisWeek: s.clicksThisWeek + 1,
          todayClicks: s.todayClicks + 1,
        })),

      setAudio: (patch) => set(patch),

      completeOnboarding: () => set({ hasOnboarded: true }),

      replayOnboarding: () => set({ hasOnboarded: false }),

      toggleIngredient: (id) => {
        set((s) => {
          const slots = [...s.slots];
          const existing = slots.indexOf(id);
          if (existing !== -1) {
            slots[existing] = null;
            return { slots };
          }
          const free = slots.findIndex(
            (v, i) => v === null && i < s.unlockedSlots,
          );
          if (free === -1) return {}; // recipe full
          slots[free] = id;
          return { slots };
        });
        get().recomputeDerived();
      },

      setIngredient: (slot, id) => {
        set((s) => {
          if (slot < 0 || slot >= s.slots.length) return {};
          const slots = [...s.slots];
          slots[slot] = id;
          return { slots };
        });
        get().recomputeDerived();
      },

      clearRecipe: () => {
        set({ slots: [...EMPTY_SLOTS] });
        get().recomputeDerived();
      },

      advanceDayProgress: (frac) => {
        const weeksBefore = get().weeksCompleted;
        set((s) => {
          // Clock only runs while the day is open (player pressed Start Day).
          if (s.phase !== "cooking" || !s.dayStarted) return {};

          let dayProgress = s.dayProgress + frac;
          let currentDay = s.currentDay;
          let phase: GamePhase = s.phase;
          let dayStarted: boolean = s.dayStarted;
          let snapshots = s.dailySnapshots;
          let todayCurry = s.todayCurry;
          let todayClicks = s.todayClicks;
          let streakDays = s.recipeStreakDays;
          let streakMult = s.recipeStreakMultiplier;
          let weeksCompleted = s.weeksCompleted;
          let discoveredAffinities = s.discoveredAffinities;
          let cravingMatchDays = s.cravingMatchDays;
          let franchiseStars = s.franchiseStars;
          let franchiseStarsEarned = s.franchiseStarsEarned;
          let lastWeekStars = s.lastWeekStars;

          const tierAtDayEnd = currentTier(s);

          // Advance at most one day per pass: when the day ends we pause and wait
          // for the player to press Start Day again (no auto-rollover).
          if (dayProgress >= 1) {
            snapshots = [
              ...snapshots,
              {
                day: currentDay,
                curry: todayCurry.toString(),
                clicks: todayClicks,
                tierAtDayEnd,
              },
            ];

            const streak = evaluateStreak({ tierAtDayEnd }, streakDays);
            streakDays = streak.newStreakDays;
            streakMult = streak.newMultiplier;

            // Affinity Journal: reveal every pair in today's final recipe.
            const cookedIds = s.slots.filter((x): x is string => x !== null);
            if (cookedIds.length >= 2) {
              const { matrix } = getAffinityData(s.seed);
              let next = discoveredAffinities;
              for (let i = 0; i < cookedIds.length; i++) {
                for (let j = i + 1; j < cookedIds.length; j++) {
                  const key = affinityPairKey(cookedIds[i], cookedIds[j]);
                  if (next[key] === undefined) {
                    if (next === discoveredAffinities) next = { ...discoveredAffinities };
                    next[key] = matrix[cookedIds[i]]?.[cookedIds[j]] ?? 0;
                  }
                }
              }
              discoveredAffinities = next;
            }

            // Craving-match day: evaluate the day that is ENDING (currentDay is
            // still the ending day here, before the increment below).
            const endingCraving = getDailyCraving(currentDay, s.seed);
            const endingFlavor = computeRecipeFlavor(s.slots);
            if (endingFlavor !== null && endingFlavor === endingCraving) {
              cravingMatchDays += 1;
            }

            todayCurry = new Decimal(0);
            todayClicks = 0;
            currentDay += 1;
            dayStarted = false; // the next day waits for Start Day

            if (currentDay > 7) {
              phase = "week_summary";
              currentDay = 7;
              dayProgress = 1;
              weeksCompleted += 1;

              // Award Franchise Stars exactly once, here at week completion
              // (FRANCHISE_DESIGN.md). Inputs use the values just finalised
              // above for the last day of the week.
              const reasons: string[] = ["Completed the week"];
              let total = 1;
              if (TIER_ORDER[s.highestTierSeen] >= TIER_ORDER.great) {
                total += 1;
                reasons.push("Reached a Great recipe");
              }
              if (s.highestTierSeen === "legendary") {
                total += 1;
                reasons.push("Reached a Legendary recipe");
              }
              if (cravingMatchDays >= 4) {
                total += 1;
                reasons.push("Matched the craving on 4+ days");
              }
              if (Object.keys(discoveredAffinities).length >= 20) {
                total += 1;
                reasons.push("Discovered 20+ affinity pairs");
              }
              franchiseStars += total;
              franchiseStarsEarned += total;
              lastWeekStars = { total, reasons };
            } else {
              dayProgress = 0; // hold at the start of the next day
            }
          }

          return {
            dayProgress,
            currentDay,
            phase,
            dayStarted,
            dailySnapshots: snapshots,
            todayCurry,
            todayClicks,
            recipeStreakDays: streakDays,
            recipeStreakMultiplier: streakMult,
            weeksCompleted,
            discoveredAffinities,
            cravingMatchDays,
            franchiseStars,
            franchiseStarsEarned,
            lastWeekStars,
          };
        });
        const s2 = get();
        if (s2.weeksCompleted > weeksBefore) {
          // Submit the just-completed week's curry total to the Steam
          // leaderboard (no-op off-desktop). weekCurry isn't reset until
          // startNewWeek, so it still holds the final total here.
          submitWeekScore(s2.weekCurry.toNumber());
        }
      },

      startDay: () =>
        set((s) =>
          s.phase === "cooking" &&
          !s.dayStarted &&
          !(IS_DEMO && s.weeksCompleted >= 1)
            ? { dayStarted: true }
            : {},
        ),

      ensureCurrentWeek: () => {
        const id = getCurrentWeekId();
        if (get().weekId === id) return;
        set({ weekId: id, seed: seedFromWeekId(id) });
        get().startNewWeek();
      },

      startNewWeek: () => {
        const s = get();
        const seed = s.seed;

        // Journal Insight (franchise): pre-reveal N affinity pairs, seeded from
        // the week seed so the same pairs appear across reloads.
        const insightPairs = journalInsightPairs(s.franchiseUpgrades);
        const discoveredAffinities: Record<string, number> = {};
        if (insightPairs > 0) {
          const { matrix } = getAffinityData(seed);
          const ids = unlockedIngredientIds(s.franchiseUpgrades);
          const rng = makeRng(`${seed}-insight`);
          let attempts = 0;
          while (
            ids.length >= 2 &&
            Object.keys(discoveredAffinities).length < insightPairs &&
            attempts < 500
          ) {
            attempts++;
            const a = ids[Math.floor(rng() * ids.length)];
            const b = ids[Math.floor(rng() * ids.length)];
            if (a === b) continue;
            const key = affinityPairKey(a, b);
            if (discoveredAffinities[key] !== undefined) continue;
            discoveredAffinities[key] = matrix[a]?.[b] ?? 0;
          }
        }

        // Head Start (franchise): grant curry at the top of the week.
        const headStart = headStartCurry(s.franchiseUpgrades);

        set({
          phase: "cooking",
          currentDay: 1,
          dayProgress: 0,
          dayStarted: false,
          currentCurry:
            headStart > 0 ? s.currentCurry.add(new Decimal(headStart)) : s.currentCurry,
          weekCurry: new Decimal(0),
          todayCurry: new Decimal(0),
          todayClicks: 0,
          clicksThisWeek: 0,
          dailySnapshots: [],
          // weekly reward state resets; the matrix is new so recipes differ
          specialClaimDays: [],
          recipeStreakDays: 0,
          recipeStreakMultiplier: 1,
          highestTierSeen: "none",
          discoveredRecipes: {},
          discoveredAffinities,
          maxSlotsUsed: 0,
          cravingMatchDays: 0,
        });
        get().recomputeDerived();
        get().refreshBadges();
      },

      hardReset: () => {
        const id = getCurrentWeekId();
        set({
          currentCurry: new Decimal(0),
          totalCurryAllTime: new Decimal(0),
          weekCurry: new Decimal(0),
          highScore: new Decimal(0),
          clicksThisWeek: 0,
          hasOnboarded: true, // already a returning player; don't replay tutorial
          slots: [...EMPTY_SLOTS],
          ownedDecorations: {},
          purchasedUpgrades: [],
          unlockedSlots: BASE_UNLOCKED_SLOTS,
          specialClaimDays: [],
          recipeStreakDays: 0,
          recipeStreakMultiplier: 1,
          highestTierSeen: "none",
          discoveredRecipes: {},
          discoveredAffinities: {},
          unlockedBadges: [],
          weeksCompleted: 0,
          maxSlotsUsed: 0,
          franchiseStars: 0,
          franchiseStarsEarned: 0,
          franchiseUpgrades: [],
          cravingMatchDays: 0,
          lastWeekStars: null,
          decorationPlacements: [],
          activeSkin: "default",
          phase: "cooking",
          weekId: id,
          seed: seedFromWeekId(id),
          currentDay: 1,
          dayProgress: 0,
          dayStarted: false,
          autoProduction: new Decimal(0),
          todayCurry: new Decimal(0),
          todayClicks: 0,
          dailySnapshots: [],
        });
      },

      // --- economy ---

      spendCurry: (amount) =>
        set((s) => ({ currentCurry: s.currentCurry.sub(amount) })),

      purchaseUpgrade: (id) => {
        const s = get();
        const up = UPGRADE_MAP[id];
        if (!up) return false;
        if (IS_DEMO && id === "slot_5") return false;
        if (s.purchasedUpgrades.includes(id)) return false;
        if (up.prerequisiteUpgradeId && !s.purchasedUpgrades.includes(up.prerequisiteUpgradeId)) {
          return false;
        }
        const cost = new Decimal(up.cost);
        if (s.currentCurry.lt(cost)) return false;

        set((st) => ({
          currentCurry: st.currentCurry.sub(cost),
          purchasedUpgrades: [...st.purchasedUpgrades, id],
        }));
        get().recomputeDerived();
        get().refreshBadges();
        return true;
      },

      purchaseDecoration: (id) => {
        const s = get();
        const deco = DECORATION_MAP[id];
        if (!deco) return false;
        if (IS_DEMO && !DEMO_DECORATIONS.includes(id)) return false;
        const owned = s.ownedDecorations[id] ?? 0;
        if (owned >= deco.maxQuantity) return false;
        const cost = new Decimal(deco.cost);
        if (s.currentCurry.lt(cost)) return false;

        set((st) => ({
          currentCurry: st.currentCurry.sub(cost),
          ownedDecorations: { ...st.ownedDecorations, [id]: owned + 1 },
        }));
        // Auto-place it so the purchase immediately shows up in the shop. The
        // player can still reposition/remove it in the scene's Decorate mode.
        const cell = nextFreeCell(get().decorationPlacements);
        if (cell) {
          set((st) => ({
            decorationPlacements: [
              ...st.decorationPlacements,
              { instanceId: `${id}-${crypto.randomUUID()}`, decorationId: id, col: cell.col, row: cell.row },
            ],
          }));
        }
        get().recomputeDerived();
        return true;
      },

      buyFranchiseUpgrade: (id) => {
        if (IS_DEMO) return false;
        const s = get();
        const up = FRANCHISE_UPGRADE_MAP[id];
        if (!up) return false;
        if (s.franchiseUpgrades.includes(id)) return false;
        if (
          up.prerequisiteUpgradeId &&
          !s.franchiseUpgrades.includes(up.prerequisiteUpgradeId)
        ) {
          return false;
        }
        if (s.franchiseStars < up.cost) return false;

        set((st) => ({
          franchiseStars: st.franchiseStars - up.cost,
          franchiseUpgrades: [...st.franchiseUpgrades, id],
        }));
        // Reputation and Fourth Burner feed computeEffects (global mult / base
        // slots), so refresh derived economy values.
        get().recomputeDerived();
        return true;
      },

      placeDecoration: (decorationId, col, row) => {
        const s = get();
        const owned = s.ownedDecorations[decorationId] ?? 0;
        if (owned <= 0) return false;
        // Can't place more instances than you own.
        const placed = s.decorationPlacements.filter(
          (p) => p.decorationId === decorationId,
        ).length;
        if (placed >= owned) return false;

        const instanceId = `${decorationId}-${crypto.randomUUID()}`;
        set((st) => ({
          decorationPlacements: [
            ...st.decorationPlacements,
            { instanceId, decorationId, col, row },
          ],
        }));
        return true;
      },

      removePlacement: (instanceId) =>
        set((s) => ({
          decorationPlacements: s.decorationPlacements.filter(
            (p) => p.instanceId !== instanceId,
          ),
        })),

      setActiveSkin: (skin) =>
        set(IS_DEMO && skin !== "default" ? {} : { activeSkin: skin }),

      recomputeDerived: () =>
        set((s) => {
          const eff = computeEffects(s.purchasedUpgrades, s.ownedDecorations, s.franchiseUpgrades);
          const { matrix } = getAffinityData(s.seed);
          return {
            unlockedSlots: eff.unlockedSlots,
            autoProduction: computeAutoProduction(s.slots, matrix, eff),
          };
        }),

      // --- rewards ---

      noteTierSeen: (tier) => {
        const s = get();
        if (TIER_ORDER[tier] <= TIER_ORDER[s.highestTierSeen]) return false;
        set({ highestTierSeen: tier });
        get().refreshBadges();
        return true;
      },

      claimSpecial: (day) => {
        const s = get();
        if (s.specialClaimDays.includes(day)) return;
        set({ specialClaimDays: [...s.specialClaimDays, day] });
        get().refreshBadges();
      },

      logCook: (slots) => {
        const s = get();
        const ids = slots.filter((x): x is string => x !== null);
        const fingerprint = recipeFingerprint(slots);
        const eff = computeEffects(s.purchasedUpgrades, s.ownedDecorations, s.franchiseUpgrades);
        const { matrix } = getAffinityData(s.seed);
        const score = computeRecipeScore(slots, matrix, {
          spicePairBonus: eff.spicePairAffinityBonus,
        });

        const existing = s.discoveredRecipes[fingerprint];
        const isNewDiscovery = !existing && ids.length > 0;
        const isHighTier = score.tier === "great" || score.tier === "legendary";
        const needsNaming = isNewDiscovery && isHighTier;

        const maxSlotsUsed = Math.max(s.maxSlotsUsed, ids.length);

        if (isNewDiscovery) {
          const entry: DiscoveredRecipe = {
            fingerprint,
            ingredientIds: ids,
            tier: score.tier,
            multiplier: score.multiplier,
            discoveredDay: s.currentDay,
          };
          set({
            discoveredRecipes: { ...s.discoveredRecipes, [fingerprint]: entry },
            maxSlotsUsed,
          });
        } else if (maxSlotsUsed !== s.maxSlotsUsed) {
          set({ maxSlotsUsed });
        }
        get().refreshBadges();
        return { fingerprint, isNewDiscovery, needsNaming };
      },

      nameRecipe: (fingerprint, name) => {
        const s = get();
        const entry = s.discoveredRecipes[fingerprint];
        if (!entry) return;
        set({
          discoveredRecipes: {
            ...s.discoveredRecipes,
            [fingerprint]: { ...entry, name: name.slice(0, 32) },
          },
        });
        get().refreshBadges();
      },

      refreshBadges: () =>
        set((s) => {
          const maxDayClicks = Math.max(
            s.todayClicks,
            0,
            ...s.dailySnapshots.map((d) => d.clicks),
          );
          const namedRecipeCount = Object.values(s.discoveredRecipes).filter(
            (r) => r.name,
          ).length;
          const earned = evaluateBadges({
            totalCurry: s.totalCurryAllTime,
            maxDayClicks,
            weeksCompleted: s.weeksCompleted,
            discoveredCount: Object.keys(s.discoveredRecipes).length,
            highestTierSeen: s.highestTierSeen,
            maxSlotsInRecipe: s.maxSlotsUsed,
            specialClaimCount: s.specialClaimDays.length,
            recipeStreakDays: s.recipeStreakDays,
            namedRecipeCount,
          });
          const union = new Set([...s.unlockedBadges, ...earned]);
          if (union.size === s.unlockedBadges.length) return {};
          const next = [...union];
          for (const id of next) {
            if (!s.unlockedBadges.includes(id)) unlockAchievement(id);
          }
          return { unlockedBadges: next };
        }),
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: saveStorage,
      // Non-destructive migrations: older saves gain the new fields and keep all
      // prior progress. v2→v3 added the restaurant-scene slice; v3→v4 added the
      // onboarding flag; v4→v5 auto-places already-owned decorations; v5→v7 moves
      // decorations onto the back/side wall slots.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version < 3) {
          p.decorationPlacements = p.decorationPlacements ?? [];
          p.activeSkin = p.activeSkin ?? "default";
        }
        if (version < 4) {
          p.hasOnboarded = p.hasOnboarded ?? true;
        }
        if (version < 5) {
          const owned = (p.ownedDecorations as Record<string, number>) ?? {};
          const placements = [...((p.decorationPlacements as Placement[]) ?? [])];
          for (const [decoId, qty] of Object.entries(owned)) {
            const have = placements.filter((pl) => pl.decorationId === decoId).length;
            for (let i = have; i < qty; i++) {
              const cell = nextFreeCell(placements);
              if (!cell) break;
              placements.push({
                instanceId: `${decoId}-mig-${i}`,
                decorationId: decoId,
                col: cell.col,
                row: cell.row,
              });
            }
          }
          p.decorationPlacements = placements;
        }
        if (version < 7) {
          // Re-home decorations onto the back/side wall slots.
          const repacked: Placement[] = [];
          for (const pl of (p.decorationPlacements as Placement[]) ?? []) {
            const cell = nextFreeCell(repacked);
            if (!cell) break;
            repacked.push({ ...pl, col: cell.col, row: cell.row });
          }
          p.decorationPlacements = repacked;
        }
        if (version < 8) {
          // Affinity Lens upgrade removed in favour of the Affinity Journal.
          p.purchasedUpgrades = ((p.purchasedUpgrades as string[]) ?? []).filter(
            (id) => id !== "affinity_lens",
          );
          delete p.affinityLens;
          p.discoveredAffinities = p.discoveredAffinities ?? {};
        }
        if (version < 9) {
          // Franchise (prestige) system: new persistent + weekly fields.
          p.franchiseStars = p.franchiseStars ?? 0;
          p.franchiseStarsEarned = p.franchiseStarsEarned ?? 0;
          p.franchiseUpgrades = p.franchiseUpgrades ?? [];
          p.cravingMatchDays = p.cravingMatchDays ?? 0;
          p.lastWeekStars = p.lastWeekStars ?? null;
        }
        if (version < 10) {
          // Sound settings split into SFX + music toggles and volumes.
          const on = (p.soundOn as boolean) ?? true;
          p.sfxOn = on;
          p.musicOn = on;
          p.sfxVolume = 1;
          p.musicVolume = 0.7;
          delete p.soundOn;
        }
        return p as unknown as GameState;
      },
      // Decimals are persisted as strings and revived on load.
      partialize: (s) => ({
        currentCurry: s.currentCurry.toString(),
        totalCurryAllTime: s.totalCurryAllTime.toString(),
        weekCurry: s.weekCurry.toString(),
        highScore: s.highScore.toString(),
        todayCurry: s.todayCurry.toString(),
        autoProduction: s.autoProduction.toString(),
        clicksThisWeek: s.clicksThisWeek,
        sfxOn: s.sfxOn,
        musicOn: s.musicOn,
        sfxVolume: s.sfxVolume,
        musicVolume: s.musicVolume,
        hasOnboarded: s.hasOnboarded,
        todayClicks: s.todayClicks,
        slots: s.slots,
        ownedDecorations: s.ownedDecorations,
        purchasedUpgrades: s.purchasedUpgrades,
        unlockedSlots: s.unlockedSlots,
        specialClaimDays: s.specialClaimDays,
        recipeStreakDays: s.recipeStreakDays,
        recipeStreakMultiplier: s.recipeStreakMultiplier,
        highestTierSeen: s.highestTierSeen,
        discoveredRecipes: s.discoveredRecipes,
        discoveredAffinities: s.discoveredAffinities,
        unlockedBadges: s.unlockedBadges,
        weeksCompleted: s.weeksCompleted,
        maxSlotsUsed: s.maxSlotsUsed,
        franchiseStars: s.franchiseStars,
        franchiseStarsEarned: s.franchiseStarsEarned,
        franchiseUpgrades: s.franchiseUpgrades,
        cravingMatchDays: s.cravingMatchDays,
        lastWeekStars: s.lastWeekStars,
        decorationPlacements: s.decorationPlacements,
        activeSkin: s.activeSkin,
        phase: s.phase,
        weekId: s.weekId,
        seed: s.seed,
        currentDay: s.currentDay,
        dayProgress: s.dayProgress,
        dailySnapshots: s.dailySnapshots,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const dec = (v: unknown, fallback = "0") =>
          new Decimal((v as string) ?? fallback);
        return {
          ...current,
          ...(p as object),
          currentCurry: dec(p.currentCurry),
          totalCurryAllTime: dec(p.totalCurryAllTime),
          weekCurry: dec(p.weekCurry),
          highScore: dec(p.highScore),
          todayCurry: dec(p.todayCurry),
          autoProduction: dec(p.autoProduction),
        } as GameState;
      },
      // Recompute derived economy values from owned items after load.
      onRehydrateStorage: () => (state) => {
        state?.recomputeDerived();
      },
    },
  ),
);
