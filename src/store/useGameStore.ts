import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveStorage } from "../lib/saveStorage";
import { unlockAchievement, submitWeekScore } from "../lib/desktop";
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
  getCurrentDateId,
  seedFromWeekId,
  evaluateStreak,
  getDailyCraving,
  getWeeklyRumor,
} from "../engine/weekEngine";
import { getDailyRivals, placementFor, trophyTierFor } from "../engine/dailyRivals";
import { pickDayChoiceIds } from "../engine/dayChoices";
import { COLLECTION_SET_MAP, setProgress } from "../engine/collections";
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
import { UPGRADE_MAP, DECORATION_MAP, upgradeCost } from "../engine/shopData";
import {
  FRANCHISE_UPGRADE_MAP,
  headStartCurry,
  journalInsightPairs,
  unlockedIngredientIds,
} from "../engine/franchiseData";
import { makeRng } from "../lib/rng";
import { WALL_PLACE_ORDER } from "../scene/walls";
import { BASE_UNLOCKED_SLOTS, TASTE_COOKS_TO_REVEAL } from "../config";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";

export const SAVE_KEY = "curry-clicker-save";
export const SAVE_VERSION = 12;

// NOTE: MVP keeps a flat store. The framework's slice split
// (player/recipe/week/shop/cosmetics) is the Phase-2 refactor target.

export type GamePhase = "cooking" | "week_summary";

export interface CookOutcome {
  fingerprint: string;
  isNewDiscovery: boolean;
  needsNaming: boolean; // first great/legendary craft of this recipe
  tastedPairs: number; // pairs newly revealed by this cook (taste-to-reveal)
  rumorReward?: number; // curry paid out for cooking the Weekly Rumor
}

const EMPTY_SLOTS: (string | null)[] = [null, null, null, null, null];

export interface GameState {
  // --- player ---
  currentCurry: number;
  totalCurryAllTime: number;
  weekCurry: number; // this in-game week's running total
  highScore: number; // best weekCurry ever reached
  clicksThisWeek: number;

  // --- daily leaderboard (calendar-day scoped) ---
  dateId: string; // local calendar date the seed + daily score belong to
  dailyCurry: number; // curry earned this calendar date — the leaderboard score
  trophies: Record<string, number>; // placement tier (see trophyTierFor) -> count

  // --- settings ---
  sfxOn: boolean;
  musicOn: boolean;
  sfxVolume: number; // 0–1
  musicVolume: number; // 0–1
  darkMode: boolean;
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
  rumorClaimed: boolean; // this week's Rumored Recipe cooked & paid out
  claimedSets: string[]; // collection sets claimed this week
  unlockedBadges: string[]; // cumulative, never un-earned
  weeksCompleted: number;
  maxSlotsUsed: number; // most slots in a cooked recipe (Combo King)

  // --- franchise (prestige; resets every real calendar day) ---
  franchiseStars: number; // spendable Star balance
  franchiseStarsEarned: number; // Stars earned today; drives rank; wiped at midnight
  bestFranchiseStars: number; // most Stars earned in a single day; survives the daily reset
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
  dayPaused: boolean; // mid-day pause; not persisted (a reload lands pre-day anyway)
  autoProduction: number; // derived: decoration + auto-clicker CPS × recipe mult
  todayCurry: number;
  todayClicks: number;
  dailySnapshots: DailySnapshot[];

  // --- end-of-day choices ---
  pendingDayChoices: string[] | null; // 3 choice ids awaiting a pick (or decline)
  activeDayModifierId: string | null; // modifier applied to the current day

  // --- actions ---
  addCurry: (amount: number) => void;
  registerClick: () => void;
  setAudio: (
    patch: Partial<Pick<GameState, "sfxOn" | "musicOn" | "sfxVolume" | "musicVolume">>,
  ) => void;
  toggleDark: () => void;
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  toggleIngredient: (id: string) => void;
  setIngredient: (slot: number, id: string | null) => void;
  clearRecipe: () => void;
  advanceDayProgress: (frac: number) => void;
  startDay: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  ensureCurrentWeek: () => void;
  ensureCurrentDate: () => void;
  chooseDayModifier: (id: string | null) => void;
  startNewWeek: () => void;
  hardReset: () => void;

  // economy
  spendCurry: (amount: number) => void;
  purchaseUpgrade: (id: string) => boolean;
  purchaseDecoration: (id: string) => boolean;
  buyFranchiseUpgrade: (id: string) => boolean;
  recomputeDerived: () => void;

  // rewards
  noteTierSeen: (tier: RecipeTier) => boolean; // returns true if newly highest
  claimSpecial: (day: number) => void;
  logCook: (slots: (string | null)[]) => CookOutcome;
  nameRecipe: (fingerprint: string, name: string) => void;
  claimSet: (id: string) => void;
  refreshBadges: () => void;

  // scene
  placeDecoration: (decorationId: string, col: number, row: number) => boolean;
  removePlacement: (instanceId: string) => void;
  setActiveSkin: (skin: SceneSkin) => void;
}

const initialWeekId = getCurrentWeekId();
const initialDateId = getCurrentDateId();

// Journal Insight (franchise): pre-reveal N affinity pairs, seeded so the same
// pairs appear across reloads. Used at week start and at date reseed.
function insightAffinities(
  seed: number,
  franchiseUpgrades: string[],
): Record<string, number> {
  const discoveredAffinities: Record<string, number> = {};
  const insightPairs = journalInsightPairs(franchiseUpgrades);
  if (insightPairs <= 0) return discoveredAffinities;
  const { matrix } = getAffinityData(seed);
  const ids = unlockedIngredientIds(franchiseUpgrades);
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
  return discoveredAffinities;
}

// Active recipe tier for the current slots, including decoration spice bonus.
function currentTier(s: GameState): RecipeTier {
  const eff = computeEffects(
    s.purchasedUpgrades,
    s.ownedDecorations,
    s.franchiseUpgrades,
    s.weeksCompleted,
  );
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
      currentCurry: 0,
      totalCurryAllTime: 0,
      weekCurry: 0,
      highScore: 0,
      clicksThisWeek: 0,

      dateId: initialDateId,
      dailyCurry: 0,
      trophies: {},

      sfxOn: true,
      musicOn: true,
      sfxVolume: 1,
      musicVolume: 0.7,
      darkMode: false,
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
      rumorClaimed: false,
      claimedSets: [],
      unlockedBadges: [],
      weeksCompleted: 0,
      maxSlotsUsed: 0,

      franchiseStars: 0,
      franchiseStarsEarned: 0,
      bestFranchiseStars: 0,
      franchiseUpgrades: [],
      cravingMatchDays: 0,
      lastWeekStars: null,

      decorationPlacements: [],
      activeSkin: "default",

      phase: "cooking",
      weekId: initialWeekId,
      seed: seedFromWeekId(initialDateId),
      currentDay: 1,
      dayProgress: 0,
      dayStarted: false,
      dayPaused: false,
      autoProduction: 0,
      todayCurry: 0,
      todayClicks: 0,
      dailySnapshots: [],

      pendingDayChoices: null,
      activeDayModifierId: null,

      addCurry: (amount) =>
        set((s) => {
          const weekCurry = s.weekCurry + amount;
          return {
            currentCurry: s.currentCurry + amount,
            totalCurryAllTime: s.totalCurryAllTime + amount,
            weekCurry,
            highScore: Math.max(weekCurry, s.highScore),
            todayCurry: s.todayCurry + amount,
            dailyCurry: s.dailyCurry + amount,
          };
        }),

      registerClick: () =>
        set((s) => ({
          clicksThisWeek: s.clicksThisWeek + 1,
          todayClicks: s.todayClicks + 1,
        })),

      setAudio: (patch) => set(patch),

      toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),

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

      advanceDayProgress: (frac) =>
        set((s) => {
          // Clock only runs while the day is open (player pressed Start Day)
          // and not paused.
          if (s.phase !== "cooking" || !s.dayStarted || s.dayPaused) return {};

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
          let pendingDayChoices = s.pendingDayChoices;
          let activeDayModifierId = s.activeDayModifierId;

          const tierAtDayEnd = currentTier(s);

          // Advance at most one day per pass: when the day ends we pause and wait
          // for the player to press Start Day again (no auto-rollover).
          if (dayProgress >= 1) {
            snapshots = [
              ...snapshots,
              {
                day: currentDay,
                curry: todayCurry,
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

            todayCurry = 0;
            todayClicks = 0;
            currentDay += 1;
            dayStarted = false; // the next day waits for Start Day (clears any pause below)
            // The day's modifier expires with the day; the next day's choices
            // are offered below (never at week end — the week summary takes over).
            activeDayModifierId = null;

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
              pendingDayChoices = pickDayChoiceIds(s.seed, currentDay);
            }
          }

          return {
            dayProgress,
            currentDay,
            phase,
            dayStarted,
            dayPaused: dayStarted ? s.dayPaused : false,
            dailySnapshots: snapshots,
            todayCurry,
            todayClicks,
            pendingDayChoices,
            activeDayModifierId,
            recipeStreakDays: streakDays,
            recipeStreakMultiplier: streakMult,
            weeksCompleted,
            discoveredAffinities,
            cravingMatchDays,
            franchiseStars,
            franchiseStarsEarned,
            lastWeekStars,
          };
        }),

      startDay: () =>
        set((s) =>
          s.phase === "cooking" &&
          !s.dayStarted &&
          !(IS_DEMO && s.weeksCompleted >= 1)
            ? { dayStarted: true, dayPaused: false }
            : {},
        ),

      togglePause: () =>
        set((s) => (s.dayStarted ? { dayPaused: !s.dayPaused } : {})),

      setPaused: (paused) =>
        set((s) => (s.dayStarted ? { dayPaused: paused } : {})),

      ensureCurrentWeek: () => {
        const id = getCurrentWeekId();
        if (get().weekId === id) return;
        set({ weekId: id });
        get().startNewWeek();
      },

      ensureCurrentDate: () => {
        const id = getCurrentDateId();
        const s = get();
        if (s.dateId === id) return;

        // Finalize yesterday's daily-leaderboard placement into a trophy
        // before anything resets. Days with no play earn nothing.
        let trophies = s.trophies;
        if (s.dailyCurry > 0) {
          const rivals = getDailyRivals(seedFromWeekId(s.dateId), s.highScore);
          const tier = trophyTierFor(placementFor(s.dailyCurry, rivals));
          if (tier) trophies = { ...trophies, [tier]: (trophies[tier] ?? 0) + 1 };
          // Record the finished day's total on Steam (no-op off-desktop).
          submitWeekScore(s.dailyCurry);
        }

        // A new real day is a full prestige reset: record the daily-stars
        // record, wipe the franchise layer + curry + prestige level, then let
        // startNewWeek reset all week-scoped state (upgrades, discoveries,
        // streaks) against the new seed. Profile records (highScore, trophies,
        // badges, bestFranchiseStars) and cosmetics survive.
        set({
          dateId: id,
          seed: seedFromWeekId(id),
          weekId: getCurrentWeekId(), // keep ensureCurrentWeek from re-resetting
          dailyCurry: 0,
          trophies,
          bestFranchiseStars: Math.max(s.bestFranchiseStars, s.franchiseStarsEarned),
          franchiseStars: 0,
          franchiseStarsEarned: 0,
          franchiseUpgrades: [],
          lastWeekStars: null,
          currentCurry: 0,
          weeksCompleted: 0,
        });
        get().startNewWeek();
      },

      chooseDayModifier: (id) =>
        set((s) =>
          s.pendingDayChoices
            ? { pendingDayChoices: null, activeDayModifierId: id }
            : {},
        ),

      startNewWeek: () => {
        const s = get();
        const discoveredAffinities = insightAffinities(s.seed, s.franchiseUpgrades);

        // Head Start (franchise): grant curry at the top of the week.
        const headStart = headStartCurry(s.franchiseUpgrades);

        set({
          phase: "cooking",
          currentDay: 1,
          dayProgress: 0,
          dayStarted: false,
          dayPaused: false,
          // Prestige: upgrades reset each week (re-buy at scaled prices with
          // stronger ladles); decorations persist.
          purchasedUpgrades: [],
          currentCurry: s.currentCurry + headStart,
          weekCurry: 0,
          todayCurry: 0,
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
          rumorClaimed: false,
          claimedSets: [],
          maxSlotsUsed: 0,
          cravingMatchDays: 0,
          pendingDayChoices: null,
          activeDayModifierId: null,
        });
        get().recomputeDerived();
        get().refreshBadges();
      },

      hardReset: () => {
        const id = getCurrentWeekId();
        const dateId = getCurrentDateId();
        set({
          currentCurry: 0,
          totalCurryAllTime: 0,
          weekCurry: 0,
          highScore: 0,
          clicksThisWeek: 0,
          dateId,
          dailyCurry: 0,
          trophies: {},
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
          rumorClaimed: false,
          claimedSets: [],
          unlockedBadges: [],
          weeksCompleted: 0,
          maxSlotsUsed: 0,
          franchiseStars: 0,
          franchiseStarsEarned: 0,
          bestFranchiseStars: 0,
          franchiseUpgrades: [],
          cravingMatchDays: 0,
          lastWeekStars: null,
          decorationPlacements: [],
          activeSkin: "default",
          phase: "cooking",
          weekId: id,
          seed: seedFromWeekId(dateId),
          currentDay: 1,
          dayProgress: 0,
          dayStarted: false,
          dayPaused: false,
          autoProduction: 0,
          todayCurry: 0,
          todayClicks: 0,
          dailySnapshots: [],
          pendingDayChoices: null,
          activeDayModifierId: null,
        });
      },

      // --- economy ---

      spendCurry: (amount) =>
        set((s) => ({ currentCurry: s.currentCurry - amount })),

      purchaseUpgrade: (id) => {
        const s = get();
        const up = UPGRADE_MAP[id];
        if (!up) return false;
        if (IS_DEMO && id === "slot_5") return false;
        if (s.purchasedUpgrades.includes(id)) return false;
        if (up.prerequisiteUpgradeId && !s.purchasedUpgrades.includes(up.prerequisiteUpgradeId)) {
          return false;
        }
        const cost = upgradeCost(up, s.weeksCompleted);
        if (s.currentCurry < cost) return false;

        set((st) => ({
          currentCurry: st.currentCurry - cost,
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
        const cost = deco.cost;
        if (s.currentCurry < cost) return false;

        set((st) => ({
          currentCurry: st.currentCurry - cost,
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
          const eff = computeEffects(
            s.purchasedUpgrades,
            s.ownedDecorations,
            s.franchiseUpgrades,
            s.weeksCompleted,
          );
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
        const eff = computeEffects(
          s.purchasedUpgrades,
          s.ownedDecorations,
          s.franchiseUpgrades,
          s.weeksCompleted,
        );
        const { matrix } = getAffinityData(s.seed);
        const score = computeRecipeScore(slots, matrix, {
          spicePairBonus: eff.spicePairAffinityBonus,
        });

        const existing = s.discoveredRecipes[fingerprint];
        const isNewDiscovery = !existing && ids.length > 0;
        const isHighTier = score.tier === "great" || score.tier === "legendary";
        const needsNaming = isNewDiscovery && isHighTier;

        const maxSlotsUsed = Math.max(s.maxSlotsUsed, ids.length);
        const cookCount = (existing?.cookCount ?? 0) + 1;

        // Taste-to-reveal: enough cooks of one recipe reveal its pairs in the
        // Journal mid-day (day-end reveal stays as the safety net; both skip
        // already-known pairs). ">=" so pre-feature saves fire on next cook.
        let tastedPairs = 0;
        let discoveredAffinities = s.discoveredAffinities;
        if (cookCount >= TASTE_COOKS_TO_REVEAL && ids.length >= 2) {
          for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
              const key = affinityPairKey(ids[i], ids[j]);
              if (discoveredAffinities[key] === undefined) {
                if (discoveredAffinities === s.discoveredAffinities)
                  discoveredAffinities = { ...s.discoveredAffinities };
                discoveredAffinities[key] = matrix[ids[i]]?.[ids[j]] ?? 0;
                tastedPairs++;
              }
            }
          }
        }

        if (ids.length > 0) {
          const entry: DiscoveredRecipe = isNewDiscovery
            ? {
                fingerprint,
                ingredientIds: ids,
                tier: score.tier,
                multiplier: score.multiplier,
                discoveredDay: s.currentDay,
                cookCount,
              }
            : { ...existing!, cookCount };
          set({
            discoveredRecipes: { ...s.discoveredRecipes, [fingerprint]: entry },
            maxSlotsUsed,
            discoveredAffinities,
          });
        } else if (maxSlotsUsed !== s.maxSlotsUsed) {
          set({ maxSlotsUsed });
        }

        // Weekly Rumor: superset containment claims it (cooking MORE than the
        // rumored combo still counts; early guesses before full reveal too).
        let rumorReward: number | undefined;
        if (!s.rumorClaimed && ids.length > 0) {
          const rumor = getWeeklyRumor(s.seed);
          if (rumor && rumor.every((id) => ids.includes(id))) {
            // ponytail: 5% of week earnings, floor 2k — scales with the player
            rumorReward = Math.max(2_000, Math.floor(get().weekCurry * 0.05));
            set({ rumorClaimed: true });
            get().addCurry(rumorReward);
          }
        }

        get().refreshBadges();
        return { fingerprint, isNewDiscovery, needsNaming, tastedPairs, rumorReward };
      },

      claimSet: (id) => {
        const s = get();
        if (s.claimedSets.includes(id)) return;
        const cs = COLLECTION_SET_MAP[id];
        if (!cs || setProgress(cs, s.discoveredAffinities) < cs.target) return;
        set({ claimedSets: [...s.claimedSets, id] });
        // ponytail: 2% of week earnings, floor 1k — same self-scaling knob
        get().addCurry(Math.max(1_000, Math.floor(s.weekCurry * 0.02)));
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
        if (version < 11) {
          // Daily leaderboard + end-of-day choices. The seed is now derived
          // from the calendar date; ensureCurrentDate reseeds on first load.
          p.dateId = p.dateId ?? "";
          p.dailyCurry = p.dailyCurry ?? 0;
          p.trophies = p.trophies ?? {};
          p.pendingDayChoices = p.pendingDayChoices ?? null;
          p.activeDayModifierId = p.activeDayModifierId ?? null;
        }
        if (version < 12) {
          // Prestige became a daily loop; seed the all-time record from the
          // old lifetime total so existing players don't open to 0.
          p.bestFranchiseStars = p.bestFranchiseStars ?? p.franchiseStarsEarned ?? 0;
        }
        return p as unknown as GameState;
      },
      partialize: (s) => ({
        currentCurry: s.currentCurry,
        totalCurryAllTime: s.totalCurryAllTime,
        weekCurry: s.weekCurry,
        highScore: s.highScore,
        todayCurry: s.todayCurry,
        autoProduction: s.autoProduction,
        clicksThisWeek: s.clicksThisWeek,
        sfxOn: s.sfxOn,
        musicOn: s.musicOn,
        sfxVolume: s.sfxVolume,
        musicVolume: s.musicVolume,
        darkMode: s.darkMode,
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
        rumorClaimed: s.rumorClaimed,
        claimedSets: s.claimedSets,
        unlockedBadges: s.unlockedBadges,
        weeksCompleted: s.weeksCompleted,
        maxSlotsUsed: s.maxSlotsUsed,
        franchiseStars: s.franchiseStars,
        franchiseStarsEarned: s.franchiseStarsEarned,
        bestFranchiseStars: s.bestFranchiseStars,
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
        dateId: s.dateId,
        dailyCurry: s.dailyCurry,
        trophies: s.trophies,
        pendingDayChoices: s.pendingDayChoices,
        activeDayModifierId: s.activeDayModifierId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        // Older saves stored these as Decimal strings; Number() covers both.
        const num = (v: unknown) => Number(v ?? 0);
        return {
          ...current,
          ...(p as object),
          currentCurry: num(p.currentCurry),
          totalCurryAllTime: num(p.totalCurryAllTime),
          weekCurry: num(p.weekCurry),
          highScore: num(p.highScore),
          todayCurry: num(p.todayCurry),
          dailyCurry: num(p.dailyCurry),
          autoProduction: num(p.autoProduction),
          dailySnapshots: ((p.dailySnapshots as DailySnapshot[]) ?? []).map(
            (snap) => ({ ...snap, curry: Number(snap.curry) }),
          ),
        } as GameState;
      },
      // Recompute derived economy values from owned items after load.
      onRehydrateStorage: () => (state) => {
        state?.recomputeDerived();
      },
    },
  ),
);

// Dark mode lives on <html> so Tailwind's `.dark` variables apply everywhere,
// including body-portaled modals. Applied here (not a component effect) so it
// runs before first render, and the subscribe covers rehydration on desktop
// (async save file), toggles, hard resets, and save imports alike.
const applyDark = (on: boolean) =>
  document.documentElement.classList.toggle("dark", on);
applyDark(useGameStore.getState().darkMode);
useGameStore.subscribe((s, prev) => {
  if (s.darkMode !== prev.darkMode) applyDark(s.darkMode);
});
