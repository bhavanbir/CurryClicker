import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Decimal } from "../lib/decimal";
import type { DailySnapshot, DiscoveredRecipe, RecipeTier } from "../types";
import {
  getCurrentWeekId,
  seedFromWeekId,
  evaluateStreak,
} from "../engine/weekEngine";
import { getAffinityData } from "../engine/affinityEngine";
import { computeRecipeScore, TIER_ORDER } from "../engine/recipeEngine";
import { computeEffects } from "../engine/effects";
import { computeAutoProduction } from "../engine/autoEngine";
import { recipeFingerprint } from "../engine/cookbook";
import { evaluateBadges } from "../engine/badges";
import { UPGRADE_MAP, DECORATION_MAP } from "../engine/shopData";
import { BASE_UNLOCKED_SLOTS } from "../config";

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
  soundOn: boolean;

  // --- recipe ---
  slots: (string | null)[];

  // --- economy (Epic B) ---
  ownedDecorations: Record<string, number>; // id -> quantity
  purchasedUpgrades: string[]; // upgrade ids
  unlockedSlots: number; // derived from recipe_slot_unlock upgrades
  affinityLens: boolean; // derived from the Affinity Lens upgrade

  // --- rewards (Epic C) ---
  specialClaimDays: number[]; // days the Chef's Special was claimed this week
  recipeStreakDays: number;
  recipeStreakMultiplier: number;
  highestTierSeen: RecipeTier; // best tier reached this week (Discovery Moments)
  discoveredRecipes: Record<string, DiscoveredRecipe>; // this week's cookbook
  unlockedBadges: string[]; // cumulative, never un-earned
  weeksCompleted: number;
  maxSlotsUsed: number; // most slots in a cooked recipe (Combo King)

  // --- week ---
  phase: GamePhase;
  weekId: string;
  seed: number;
  currentDay: number; // 1–7
  dayProgress: number; // 0.0–1.0 within the current day
  autoProduction: Decimal; // derived: decoration + auto-clicker CPS × recipe mult
  todayCurry: Decimal;
  todayClicks: number;
  dailySnapshots: DailySnapshot[];

  // --- actions ---
  addCurry: (amount: Decimal) => void;
  registerClick: () => void;
  setSoundOn: (on: boolean) => void;
  toggleIngredient: (id: string) => void;
  setIngredient: (slot: number, id: string | null) => void;
  clearRecipe: () => void;
  advanceDayProgress: (frac: number) => void;
  ensureCurrentWeek: () => void;
  startNewWeek: () => void;
  hardReset: () => void;

  // economy
  spendCurry: (amount: Decimal) => void;
  purchaseUpgrade: (id: string) => boolean;
  purchaseDecoration: (id: string) => boolean;
  recomputeDerived: () => void;

  // rewards
  noteTierSeen: (tier: RecipeTier) => boolean; // returns true if newly highest
  claimSpecial: (day: number) => void;
  logCook: (slots: (string | null)[]) => CookOutcome;
  nameRecipe: (fingerprint: string, name: string) => void;
  refreshBadges: () => void;
}

const initialWeekId = getCurrentWeekId();

// Active recipe tier for the current slots, including decoration spice bonus.
function currentTier(s: GameState): RecipeTier {
  const eff = computeEffects(s.purchasedUpgrades, s.ownedDecorations);
  const { matrix } = getAffinityData(s.seed);
  return computeRecipeScore(s.slots, matrix, {
    spicePairBonus: eff.spicePairAffinityBonus,
  }).tier;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentCurry: new Decimal(0),
      totalCurryAllTime: new Decimal(0),
      weekCurry: new Decimal(0),
      highScore: new Decimal(0),
      clicksThisWeek: 0,

      soundOn: true,

      slots: [...EMPTY_SLOTS],

      ownedDecorations: {},
      purchasedUpgrades: [],
      unlockedSlots: BASE_UNLOCKED_SLOTS,
      affinityLens: false,

      specialClaimDays: [],
      recipeStreakDays: 0,
      recipeStreakMultiplier: 1,
      highestTierSeen: "none",
      discoveredRecipes: {},
      unlockedBadges: [],
      weeksCompleted: 0,
      maxSlotsUsed: 0,

      phase: "cooking",
      weekId: initialWeekId,
      seed: seedFromWeekId(initialWeekId),
      currentDay: 1,
      dayProgress: 0,
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

      setSoundOn: (on) => set({ soundOn: on }),

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

      advanceDayProgress: (frac) =>
        set((s) => {
          if (s.phase !== "cooking") return {};

          let dayProgress = s.dayProgress + frac;
          let currentDay = s.currentDay;
          let phase: GamePhase = s.phase;
          let snapshots = s.dailySnapshots;
          let todayCurry = s.todayCurry;
          let todayClicks = s.todayClicks;
          let streakDays = s.recipeStreakDays;
          let streakMult = s.recipeStreakMultiplier;
          let weeksCompleted = s.weeksCompleted;

          const tierAtDayEnd = currentTier(s);

          while (dayProgress >= 1) {
            dayProgress -= 1;
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

            todayCurry = new Decimal(0);
            todayClicks = 0;
            currentDay += 1;

            if (currentDay > 7) {
              phase = "week_summary";
              currentDay = 7;
              dayProgress = 1;
              weeksCompleted += 1;
              break;
            }
          }

          return {
            dayProgress,
            currentDay,
            phase,
            dailySnapshots: snapshots,
            todayCurry,
            todayClicks,
            recipeStreakDays: streakDays,
            recipeStreakMultiplier: streakMult,
            weeksCompleted,
          };
        }),

      ensureCurrentWeek: () => {
        const id = getCurrentWeekId();
        if (get().weekId === id) return;
        set({ weekId: id, seed: seedFromWeekId(id) });
        get().startNewWeek();
      },

      startNewWeek: () => {
        set({
          phase: "cooking",
          currentDay: 1,
          dayProgress: 0,
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
          maxSlotsUsed: 0,
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
          slots: [...EMPTY_SLOTS],
          ownedDecorations: {},
          purchasedUpgrades: [],
          unlockedSlots: BASE_UNLOCKED_SLOTS,
          affinityLens: false,
          specialClaimDays: [],
          recipeStreakDays: 0,
          recipeStreakMultiplier: 1,
          highestTierSeen: "none",
          discoveredRecipes: {},
          unlockedBadges: [],
          weeksCompleted: 0,
          maxSlotsUsed: 0,
          phase: "cooking",
          weekId: id,
          seed: seedFromWeekId(id),
          currentDay: 1,
          dayProgress: 0,
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
        const owned = s.ownedDecorations[id] ?? 0;
        if (owned >= deco.maxQuantity) return false;
        const cost = new Decimal(deco.cost);
        if (s.currentCurry.lt(cost)) return false;

        set((st) => ({
          currentCurry: st.currentCurry.sub(cost),
          ownedDecorations: { ...st.ownedDecorations, [id]: owned + 1 },
        }));
        get().recomputeDerived();
        return true;
      },

      recomputeDerived: () =>
        set((s) => {
          const eff = computeEffects(s.purchasedUpgrades, s.ownedDecorations);
          const { matrix } = getAffinityData(s.seed);
          return {
            unlockedSlots: eff.unlockedSlots,
            affinityLens: eff.affinityLens,
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
        const eff = computeEffects(s.purchasedUpgrades, s.ownedDecorations);
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
          return { unlockedBadges: [...union] };
        }),
    }),
    {
      name: "curry-clicker-save",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Decimals are persisted as strings and revived on load.
      partialize: (s) => ({
        currentCurry: s.currentCurry.toString(),
        totalCurryAllTime: s.totalCurryAllTime.toString(),
        weekCurry: s.weekCurry.toString(),
        highScore: s.highScore.toString(),
        todayCurry: s.todayCurry.toString(),
        autoProduction: s.autoProduction.toString(),
        clicksThisWeek: s.clicksThisWeek,
        soundOn: s.soundOn,
        todayClicks: s.todayClicks,
        slots: s.slots,
        ownedDecorations: s.ownedDecorations,
        purchasedUpgrades: s.purchasedUpgrades,
        unlockedSlots: s.unlockedSlots,
        affinityLens: s.affinityLens,
        specialClaimDays: s.specialClaimDays,
        recipeStreakDays: s.recipeStreakDays,
        recipeStreakMultiplier: s.recipeStreakMultiplier,
        highestTierSeen: s.highestTierSeen,
        discoveredRecipes: s.discoveredRecipes,
        unlockedBadges: s.unlockedBadges,
        weeksCompleted: s.weeksCompleted,
        maxSlotsUsed: s.maxSlotsUsed,
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
