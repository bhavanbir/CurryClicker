import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveStorage } from "../lib/saveStorage";
import { unlockAchievement, submitDayScore } from "../lib/desktop";
import type { DailySnapshot, SceneSkin, WeekStarAward } from "../types";
import {
  getCurrentWeekId,
  getCurrentDateId,
  seedFromWeekId,
} from "../engine/weekEngine";
import { getDailyRivals, placementFor, trophyTierFor } from "../engine/dailyRivals";
import { pickDayChoiceIds } from "../engine/dayChoices";
import { computeEffects } from "../engine/effects";
import { evaluateBadges } from "../engine/badges";
import {
  spin as rollSpin,
  spinCost,
  sanitizeRoll,
  capInventory,
  combineRoll,
  demoCap,
  nextRarity,
  rollPower,
  COMBINE_COST,
  MAX_INVENTORY,
  RARITIES,
  RARITY_ORDER,
  type GachaRarity,
  type RolledIngredient,
} from "../engine/gacha";
import {
  SKILL_NODES,
  SKILL_MAP,
  META_MAP,
  nodeCost,
  headStartCurry,
  type SkillNode as SkillNodeDef,
} from "../engine/skillTree";
import { bossMaxHp as bossHpFor } from "../engine/boss";
import { IS_DEMO } from "../target";
import { DAYS_PER_WEEK } from "../config";

export const SAVE_KEY = "curry-clicker-save";
export const SAVE_VERSION = 16;

// Guided first run, revealed one step at a time:
//   start   → only the scene + Start button visible (spotlight on Start)
//   cook    → day 1 runs; just mash — nav and side systems stay hidden
//   tabs    → day 1 done; nav revealed, spotlight points at the Gacha tab
//   gacha   → day-2 gacha tutorial shown on the Gacha screen
//   week1   → rest of the guided week; features unlock one day at a time
//   done    → full UI
export type TutorialStep = "start" | "cook" | "tabs" | "gacha" | "week1" | "done";

const TUTORIAL_STEPS: TutorialStep[] = [
  "start",
  "cook",
  "tabs",
  "gacha",
  "week1",
  "done",
];

// Guided week: the in-game day each side system joins the game (with a
// one-time intro card — see FeatureIntroLayer). Veterans skip all gates.
export const FEATURE_UNLOCK_DAY = { gacha: 2, skills: 3 } as const;
export type UnlockFeature = keyof typeof FEATURE_UNLOCK_DAY;

export function useFeatureUnlocked(f: UnlockFeature): boolean {
  return useGameStore(
    (s) => s.tutorialStep === "done" || s.currentDay >= FEATURE_UNLOCK_DAY[f],
  );
}

export type GamePhase = "cooking" | "week_summary";

// "none" = nothing pulled yet; otherwise the best rarity seen.
export type BestRarity = GachaRarity | "none";

export const MAX_EQUIPPED = 3;

const rarityIndex = (r: BestRarity): number =>
  r === "none" ? -1 : RARITY_ORDER[r];

// Tree prereqs are OR, checked against the union of both owned layers: any one
// owned neighbour opens a node, and an owned star gate survives the weekly wipe
// so it stays a valid anchor for the nodes hanging off it.
const unlocked = (
  node: SkillNodeDef,
  s: { skillNodes: string[]; metaNodes: string[] },
): boolean =>
  node.prereqs.length === 0 ||
  node.prereqs.some(
    (p) => s.skillNodes.includes(p) || s.metaNodes.includes(p),
  );

// Node ids grouped by curry branch — the "own a whole branch" badge check.
// Only each arm's inner cluster (out to the first notable) counts: the full
// radial branch runs past star gates and is not weekly-achievable.
const BRANCH_NODE_IDS: string[][] = Object.values(
  SKILL_NODES.filter((n) => n.r <= 250).reduce<Record<string, string[]>>(
    (m, n) => {
      (m[n.branch] ??= []).push(n.id);
      return m;
    },
    {},
  ),
);

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
  tutorialStep: TutorialStep; // guided first-run progress (see TutorialStep)
  introsSeen: string[]; // one-time feature intro cards already dismissed

  // --- gacha ---
  gachaInventory: RolledIngredient[]; // every roll held (capped at MAX_INVENTORY)
  equippedUids: string[]; // ≤ MAX_EQUIPPED uids into gachaInventory
  spinCount: number; // spins this week — drives the price curve
  totalSpins: number; // lifetime spins (spin index)
  epicPulls: number; // lifetime Epic-or-better pulls
  bestRarityThisWeek: BestRarity; // drives the weekly Star awards
  bestRarityEver: BestRarity; // lifetime record

  // --- skill tree ---
  skillNodes: string[]; // curry nodes — wiped on weekly prestige
  metaNodes: string[]; // star nodes — wiped only on the real-day reset

  unlockedBadges: string[]; // cumulative, never un-earned
  weeksCompleted: number;

  // --- franchise (prestige; resets every real calendar day) ---
  franchiseStars: number; // spendable Star balance
  franchiseStarsEarned: number; // Stars earned today; drives rank; wiped at midnight
  bestFranchiseStars: number; // most Stars earned in a single day; survives the daily reset
  lastWeekStars: WeekStarAward | null; // Star breakdown for the last completed week

  // --- scene ---
  activeSkin: SceneSkin; // selected restaurant backdrop

  // --- week ---
  phase: GamePhase;
  weekId: string;
  seed: number;
  currentDay: number; // 1–DAYS_PER_WEEK
  dayProgress: number; // 0.0–1.0 within the current day
  dayStarted: boolean; // false until the player presses Start Day — clock paused
  dayPaused: boolean; // mid-day pause; not persisted (a reload lands pre-day anyway)
  todayCurry: number;
  todayClicks: number;
  dailySnapshots: DailySnapshot[];

  // --- end-of-day choices ---
  pendingDayChoices: string[] | null; // up to 3 choice ids awaiting a pick (or decline)
  activeDayModifierId: string | null; // modifier applied to the current day
  usedDayModifierIds: string[]; // picked this week — excluded until the weekly reset

  // --- day-DAYS_PER_WEEK boss ---
  bossHp: number | null; // null = no fight in progress; 0 = beaten
  bossMaxHp: number | null; // HP the fight started at (see engine/boss.ts)
  // Post-mortem for a lost fight. Not persisted: the wipe itself is already
  // committed, this is just the screen that explains it.
  bossDefeat: {
    score: number; // week curry, before the wipe
    maxHp: number;
    hpLeft: number;
    kept: RolledIngredient | null; // the one roll that survived
  } | null;

  // --- actions ---
  addCurry: (amount: number) => void;
  registerClick: () => void;
  setAudio: (
    patch: Partial<Pick<GameState, "sfxOn" | "musicOn" | "sfxVolume" | "musicVolume">>,
  ) => void;
  toggleDark: () => void;
  setTutorialStep: (step: TutorialStep) => void;
  markIntroSeen: (id: string) => void;
  replayOnboarding: () => void;
  advanceDayProgress: (frac: number) => void;
  startDay: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  ensureCurrentWeek: () => void;
  ensureCurrentDate: () => void;
  chooseDayModifier: (id: string | null) => void;
  startNewWeek: () => void;
  hardReset: () => void;

  // boss
  damageBoss: (amount: number) => void;
  resolveBossLoss: () => void;
  dismissBossDefeat: () => void;

  // economy
  spendCurry: (amount: number) => void;

  // gacha
  spin: () => RolledIngredient | null; // null = can't afford
  combine: (uids: string[]) => RolledIngredient | null; // null = invalid trade-up
  equip: (uid: string) => void;
  unequip: (uid: string) => void;
  discardRoll: (uid: string) => void;

  // skill tree
  buySkillNode: (id: string) => boolean;
  buyMetaNode: (id: string) => boolean;

  refreshBadges: () => void;

  // scene
  setActiveSkin: (skin: SceneSkin) => void;
}

const initialWeekId = getCurrentWeekId();
const initialDateId = getCurrentDateId();

// Lifetime rarity records for one new roll.
function rarityRecords(
  s: Pick<GameState, "bestRarityThisWeek" | "bestRarityEver" | "epicPulls">,
  roll: RolledIngredient,
) {
  const i = RARITY_ORDER[roll.rarity];
  return {
    bestRarityThisWeek:
      i > rarityIndex(s.bestRarityThisWeek) ? roll.rarity : s.bestRarityThisWeek,
    bestRarityEver:
      i > rarityIndex(s.bestRarityEver) ? roll.rarity : s.bestRarityEver,
    epicPulls: s.epicPulls + (i >= RARITY_ORDER.epic ? 1 : 0),
  };
}

const equippedRolls = (s: GameState): RolledIngredient[] =>
  s.gachaInventory.filter((r) => s.equippedUids.includes(r.uid));

// Franchise Stars for a completed week, awarded exactly once at week end —
// from the clock running out on the last day, or from the boss going down.
// Six possible Stars: showing up, two earnings tiers, two gacha luck tiers,
// one grind tier.
function weekStars(
  s: Pick<
    GameState,
    | "weekCurry"
    | "clicksThisWeek"
    | "bestRarityThisWeek"
    | "franchiseStars"
    | "franchiseStarsEarned"
  >,
): Pick<GameState, "franchiseStars" | "franchiseStarsEarned" | "lastWeekStars"> {
  const reasons: string[] = ["Completed the week"];
  let total = 1;
  if (s.weekCurry >= 1_000_000) {
    total += 1;
    reasons.push("Earned 1M curry this week");
  }
  if (s.weekCurry >= 100_000_000) {
    total += 1;
    reasons.push("Earned 100M curry this week");
  }
  const bestPull = rarityIndex(s.bestRarityThisWeek);
  if (bestPull >= RARITY_ORDER.epic) {
    total += 1;
    reasons.push("Pulled an Epic ingredient");
  }
  if (bestPull >= RARITY_ORDER.legendary) {
    total += 1;
    reasons.push("Pulled a Legendary ingredient");
  }
  if (s.clicksThisWeek >= 2000) {
    total += 1;
    reasons.push("Cooked 2,000 times this week");
  }
  return {
    franchiseStars: s.franchiseStars + total,
    franchiseStarsEarned: s.franchiseStarsEarned + total,
    lastWeekStars: { total, reasons },
  };
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
      tutorialStep: "start",
      introsSeen: [],

      gachaInventory: [],
      equippedUids: [],
      spinCount: 0,
      totalSpins: 0,
      epicPulls: 0,
      bestRarityThisWeek: "none",
      bestRarityEver: "none",

      skillNodes: [],
      metaNodes: [],

      unlockedBadges: [],
      weeksCompleted: 0,

      franchiseStars: 0,
      franchiseStarsEarned: 0,
      bestFranchiseStars: 0,
      lastWeekStars: null,

      activeSkin: "default",

      phase: "cooking",
      weekId: initialWeekId,
      seed: seedFromWeekId(initialDateId),
      currentDay: 1,
      dayProgress: 0,
      dayStarted: false,
      dayPaused: false,
      todayCurry: 0,
      todayClicks: 0,
      dailySnapshots: [],

      pendingDayChoices: null,
      activeDayModifierId: null,
      usedDayModifierIds: [],

      bossHp: null,
      bossMaxHp: null,
      bossDefeat: null,

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

      setTutorialStep: (step) => set({ tutorialStep: step }),

      markIntroSeen: (id) =>
        set((s) =>
          s.introsSeen.includes(id) ? {} : { introsSeen: [...s.introsSeen, id] },
        ),

      replayOnboarding: () =>
        set({ hasOnboarded: false, tutorialStep: "start", introsSeen: [] }),

      advanceDayProgress: (frac) => {
        const cur = get();
        // Closing time on boss day with the boss still standing is a loss, not
        // a week end — it takes over before any of the completion logic runs.
        if (
          cur.phase === "cooking" &&
          cur.dayStarted &&
          !cur.dayPaused &&
          cur.dayProgress + frac >= 1 &&
          cur.currentDay === DAYS_PER_WEEK &&
          cur.bossHp !== null &&
          cur.bossHp > 0
        ) {
          get().resolveBossLoss();
          return;
        }

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
          let weeksCompleted = s.weeksCompleted;
          let franchiseStars = s.franchiseStars;
          let franchiseStarsEarned = s.franchiseStarsEarned;
          let lastWeekStars = s.lastWeekStars;
          let pendingDayChoices = s.pendingDayChoices;
          let activeDayModifierId = s.activeDayModifierId;
          let tutorialStep = s.tutorialStep;

          // Advance at most one day per pass: when the day ends we pause and wait
          // for the player to press Start Day again (no auto-rollover).
          if (dayProgress >= 1) {
            snapshots = [
              ...snapshots,
              { day: currentDay, curry: todayCurry, clicks: todayClicks },
            ];

            todayCurry = 0;
            todayClicks = 0;
            currentDay += 1;
            dayStarted = false; // the next day waits for Start Day (clears any pause below)
            // The day's modifier expires with the day; the next day's choices
            // are offered below (never at week end — the week summary takes over).
            activeDayModifierId = null;

            if (currentDay > DAYS_PER_WEEK) {
              phase = "week_summary";
              currentDay = DAYS_PER_WEEK;
              dayProgress = 1;
              weeksCompleted += 1;

              const stars = weekStars(s);
              franchiseStars = stars.franchiseStars;
              franchiseStarsEarned = stars.franchiseStarsEarned;
              lastWeekStars = stars.lastWeekStars;

              // Demo has no prestige loop to explain — the guided week ends
              // here (full game shows the prestige intro instead).
              if (IS_DEMO && tutorialStep !== "done") tutorialStep = "done";
            } else {
              dayProgress = 0; // hold at the start of the next day
              // Modifiers picked earlier this week don't come back around, and
              // the boss day never takes one — you face it as you are.
              const ids = pickDayChoiceIds(s.seed, currentDay, s.usedDayModifierIds);
              pendingDayChoices =
                currentDay === DAYS_PER_WEEK
                  ? null
                  : ids.length > 0
                    ? ids
                    : null;
            }

            // Tutorial: the first day ending flows into the tab tour — skip
            // the day-choice offer so the nav spotlight isn't buried.
            if (tutorialStep === "cook") {
              tutorialStep = "tabs";
              pendingDayChoices = null;
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
            tutorialStep,
            weeksCompleted,
            franchiseStars,
            franchiseStarsEarned,
            lastWeekStars,
          };
        });
      },

      startDay: () => {
        const s = get();
        if (
          s.phase !== "cooking" ||
          s.dayStarted ||
          (IS_DEMO && s.weeksCompleted >= 1)
        )
          return;
        if (s.tutorialStep === "start") {
          // First run: hand out one free roll so the very first tap already
          // cooks with an equipped ingredient — no Gacha detour before the
          // first win. Whatever rarity it lands on is kept (a lucky freebie
          // is a nice surprise, not a balance problem at spin 0).
          if (s.gachaInventory.length === 0) {
            const roll = rollSpin(s.totalSpins, 0);
            set((st) => ({
              gachaInventory: [roll],
              equippedUids: [roll.uid],
              totalSpins: st.totalSpins + 1,
              ...rarityRecords(st, roll),
            }));
          }
          set({ hasOnboarded: true, tutorialStep: "cook" });
        }
        // Boss day: lock the HP in from this week's pace. The null guard means
        // a mid-fight reload resumes the same boss (dayStarted isn't persisted,
        // so a reload always lands pre-day) instead of rerolling an easier one.
        // Any modifier a legacy save carried in is cleared — no deals with the
        // boss.
        if (s.currentDay === DAYS_PER_WEEK && s.bossHp === null) {
          const hp = bossHpFor(s.dailySnapshots);
          set({
            bossHp: hp,
            bossMaxHp: hp,
            activeDayModifierId: null,
            pendingDayChoices: null,
          });
        }
        set({ dayStarted: true, dayPaused: false });
      },

      togglePause: () =>
        set((s) => (s.dayStarted ? { dayPaused: !s.dayPaused } : {})),

      setPaused: (paused) =>
        set((s) => (s.dayStarted ? { dayPaused: paused } : {})),

      ensureCurrentWeek: () => {
        const id = getCurrentWeekId();
        if (get().weekId === id) return;
        if (id < get().weekId) return; // refuse backward clock jumps ("YYYY-Wnn" sorts)
        set({ weekId: id });
        get().startNewWeek();
      },

      ensureCurrentDate: () => {
        const id = getCurrentDateId();
        const s = get();
        if (s.dateId === id) return;
        // Anti-cheat: "YYYY-MM-DD" sorts lexicographically, so the persisted
        // dateId doubles as a monotonic guard. A backward clock jump would
        // otherwise re-trigger rollover (trophy + Steam submit per flap).
        if (id < s.dateId) return;

        // Finalize yesterday's daily-leaderboard placement into a trophy
        // before anything resets. Days with no play earn nothing.
        let trophies = s.trophies;
        if (s.dailyCurry > 0) {
          const rivals = getDailyRivals(seedFromWeekId(s.dateId), s.highScore);
          const tier = trophyTierFor(placementFor(s.dailyCurry, rivals));
          if (tier) trophies = { ...trophies, [tier]: (trophies[tier] ?? 0) + 1 };
          // Record the finished day's total on Steam (no-op off-desktop).
          submitDayScore(s.dailyCurry);
        }

        // A new real day is a full reset: record the daily-stars record, wipe
        // the star layer, the gacha collection and curry, then let
        // startNewWeek reset all week-scoped state against the new seed.
        // Profile records (highScore, trophies, badges, bestFranchiseStars,
        // bestRarityEver, totalSpins, epicPulls) and cosmetics survive.
        set({
          dateId: id,
          seed: seedFromWeekId(id),
          weekId: getCurrentWeekId(), // keep ensureCurrentWeek from re-resetting
          dailyCurry: 0,
          trophies,
          bestFranchiseStars: Math.max(s.bestFranchiseStars, s.franchiseStarsEarned),
          franchiseStars: 0,
          franchiseStarsEarned: 0,
          metaNodes: [],
          gachaInventory: [],
          equippedUids: [],
          spinCount: 0,
          bestRarityThisWeek: "none",
          lastWeekStars: null,
          currentCurry: 0,
          weeksCompleted: 0,
        });
        get().startNewWeek();
      },

      chooseDayModifier: (id) =>
        set((s) =>
          s.pendingDayChoices
            ? {
                pendingDayChoices: null,
                activeDayModifierId: id,
                usedDayModifierIds:
                  id !== null ? [...s.usedDayModifierIds, id] : s.usedDayModifierIds,
              }
            : {},
        ),

      startNewWeek: () => {
        set((s) => ({
          phase: "cooking" as GamePhase,
          currentDay: 1,
          dayProgress: 0,
          dayStarted: false,
          dayPaused: false,
          // Prestige: curry skill nodes reset each week (re-buy at scaled
          // prices), the bankroll starts over at the meta Head Start.
          skillNodes: [],
          currentCurry: headStartCurry(s.metaNodes),
          // BALANCE KNOB: gachaInventory + equippedUids deliberately SURVIVE
          // weekly prestige. The collection is the thing you keep; only the
          // spin price ladder resets. Wiping it here would make prestige feel
          // like a punishment — change this first if prestige feels too easy.
          spinCount: 0,
          bestRarityThisWeek: "none" as BestRarity,
          weekCurry: 0,
          todayCurry: 0,
          todayClicks: 0,
          clicksThisWeek: 0,
          dailySnapshots: [],
          pendingDayChoices: null,
          activeDayModifierId: null,
          usedDayModifierIds: [],
          bossHp: null,
          bossMaxHp: null,
        }));
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
          tutorialStep: "done",
          introsSeen: [],
          gachaInventory: [],
          equippedUids: [],
          spinCount: 0,
          totalSpins: 0,
          epicPulls: 0,
          bestRarityThisWeek: "none",
          bestRarityEver: "none",
          skillNodes: [],
          metaNodes: [],
          unlockedBadges: [],
          weeksCompleted: 0,
          franchiseStars: 0,
          franchiseStarsEarned: 0,
          bestFranchiseStars: 0,
          lastWeekStars: null,
          activeSkin: "default",
          phase: "cooking",
          weekId: id,
          seed: seedFromWeekId(dateId),
          currentDay: 1,
          dayProgress: 0,
          dayStarted: false,
          dayPaused: false,
          todayCurry: 0,
          todayClicks: 0,
          dailySnapshots: [],
          pendingDayChoices: null,
          activeDayModifierId: null,
          usedDayModifierIds: [],
          bossHp: null,
          bossMaxHp: null,
          bossDefeat: null,
        });
      },

      // --- boss ---

      damageBoss: (amount) => {
        const s = get();
        if (s.phase !== "cooking" || s.bossHp === null || s.bossHp <= 0) return;
        const hp = s.bossHp - amount;
        if (hp > 0) {
          set({ bossHp: hp });
          return;
        }
        // Boss down. A win is just the week completing on schedule: same
        // summary, same Stars, no bonus — beating it *is* the reward.
        set((st) => ({
          bossHp: 0,
          phase: "week_summary" as GamePhase,
          dayProgress: 1,
          dayStarted: false,
          dayPaused: false,
          weeksCompleted: st.weeksCompleted + 1,
          dailySnapshots: [
            ...st.dailySnapshots,
            { day: st.currentDay, curry: st.todayCurry, clicks: st.todayClicks },
          ],
          todayCurry: 0,
          todayClicks: 0,
          activeDayModifierId: null,
          ...weekStars(st),
          // Demo mirror of the timer path: the guided week ends here.
          tutorialStep:
            IS_DEMO && st.tutorialStep !== "done" ? "done" : st.tutorialStep,
        }));
        get().refreshBadges();
      },

      resolveBossLoss: () => {
        const s = get();
        // One roll walks out of the fire. Rolled and committed in the same
        // synchronous pass so a reload can't re-roll a better survivor.
        const kept =
          s.gachaInventory.length > 0
            ? s.gachaInventory[
                Math.floor(Math.random() * s.gachaInventory.length)
              ]
            : null;
        set({
          bossDefeat: {
            score: s.weekCurry,
            maxHp: s.bossMaxHp ?? 0,
            hpLeft: s.bossHp ?? 0,
            kept,
          },
          bossHp: null,
          bossMaxHp: null,
          gachaInventory: kept ? [kept] : [],
          equippedUids: kept ? [kept.uid] : [],
          lastWeekStars: null,
          // The features stay unlocked — losing shouldn't replay the tour.
          tutorialStep: s.tutorialStep === "week1" ? "done" : s.tutorialStep,
        });
        // Wipes the skill nodes and the week's score, back to day 1. No Stars
        // and no weeksCompleted bump: the week did not complete. Lifetime
        // records (highScore, totalCurryAllTime, dailyCurry, franchiseStars,
        // metaNodes) are untouched.
        get().startNewWeek();
      },

      dismissBossDefeat: () => set({ bossDefeat: null }),

      // --- economy ---

      spendCurry: (amount) =>
        set((s) => ({ currentCurry: s.currentCurry - amount })),

      // --- gacha ---

      spin: () => {
        const s = get();
        const eff = computeEffects(
          s.skillNodes,
          s.metaNodes,
          equippedRolls(s),
          s.weeksCompleted,
        );
        const cost = spinCost(s.spinCount, s.weeksCompleted, eff.spinCostMult);
        if (s.currentCurry < cost) return null;
        get().spendCurry(cost);

        const roll = rollSpin(s.totalSpins, eff.luck);
        set((st) => ({
          gachaInventory: capInventory(
            [...st.gachaInventory, roll],
            st.equippedUids,
          ),
          spinCount: st.spinCount + 1,
          totalSpins: st.totalSpins + 1,
          ...rarityRecords(st, roll),
        }));
        get().refreshBadges();
        return roll;
      },

      // Trade-up: five of one rarity burn for one guaranteed roll of the next.
      // Not a spin — the price ladder and lifetime spin counts stay put.
      combine: (uids) => {
        const s = get();
        if (uids.length !== COMBINE_COST) return null;
        if (new Set(uids).size !== COMBINE_COST) return null;
        const picked = uids.map((u) => s.gachaInventory.find((r) => r.uid === u));
        if (picked.some((r) => !r)) return null;
        const rarity = picked[0]!.rarity;
        if (picked.some((r) => r!.rarity !== rarity)) return null;
        const target = nextRarity(rarity);
        // A "guaranteed upgrade" that silently demo-caps back down is a scam.
        if (!target || demoCap(target) !== target) return null;

        const roll = combineRoll(target, s.totalSpins);
        const spent = new Set(uids);
        set((st) => {
          // Defensive: the UI blocks selecting equipped rolls, but a burnt uid
          // must never survive in the equipped set.
          const equippedUids = st.equippedUids.filter((u) => !spent.has(u));
          return {
            gachaInventory: capInventory(
              [...st.gachaInventory.filter((r) => !spent.has(r.uid)), roll],
              equippedUids,
            ),
            equippedUids,
            ...rarityRecords(st, roll),
          };
        });
        get().refreshBadges();
        return roll;
      },

      equip: (uid) => {
        set((s) => {
          if (s.equippedUids.includes(uid)) return {};
          if (s.equippedUids.length >= MAX_EQUIPPED) return {};
          if (!s.gachaInventory.some((r) => r.uid === uid)) return {};
          return { equippedUids: [...s.equippedUids, uid] };
        });
        get().refreshBadges(); // Combo King reads the equipped set
      },

      unequip: (uid) =>
        set((s) => ({ equippedUids: s.equippedUids.filter((u) => u !== uid) })),

      discardRoll: (uid) =>
        set((s) => ({
          gachaInventory: s.gachaInventory.filter((r) => r.uid !== uid),
          equippedUids: s.equippedUids.filter((u) => u !== uid),
        })),

      // --- skill tree ---

      buySkillNode: (id) => {
        const s = get();
        const node = SKILL_MAP[id];
        if (!node || s.skillNodes.includes(id)) return false;
        if (!unlocked(node, s)) return false;
        const cost = nodeCost(node, s.weeksCompleted);
        if (s.currentCurry < cost) return false;

        set((st) => ({
          currentCurry: st.currentCurry - cost,
          skillNodes: [...st.skillNodes, id],
        }));
        get().refreshBadges();
        return true;
      },

      buyMetaNode: (id) => {
        if (IS_DEMO) return false; // demo stops after one week — no meta layer
        const s = get();
        const node = META_MAP[id];
        if (!node || s.metaNodes.includes(id)) return false;
        if (!unlocked(node, s)) return false;
        const cost = nodeCost(node, s.weeksCompleted); // star nodes are flat-priced
        if (s.franchiseStars < cost) return false;

        set((st) => ({
          franchiseStars: st.franchiseStars - cost,
          metaNodes: [...st.metaNodes, id],
        }));
        return true;
      },

      setActiveSkin: (skin) => set({ activeSkin: skin }),

      refreshBadges: () =>
        set((s) => {
          const maxDayClicks = Math.max(
            s.todayClicks,
            0,
            ...s.dailySnapshots.map((d) => d.clicks),
          );
          const earned = evaluateBadges({
            totalCurry: s.totalCurryAllTime,
            maxDayClicks,
            weeksCompleted: s.weeksCompleted,
            distinctIngredients: new Set(
              s.gachaInventory.map((r) => r.ingredientId),
            ).size,
            bestRarityEver:
              s.bestRarityEver === "none" ? null : s.bestRarityEver,
            maxEquippedMods: equippedRolls(s).reduce(
              (sum, r) => sum + rollPower(r),
              0,
            ),
            epicPulls: s.epicPulls,
            fullBranches: BRANCH_NODE_IDS.filter((ids) =>
              ids.every((id) => s.skillNodes.includes(id)),
            ).length,
            inventorySize: s.gachaInventory.length,
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
      // v16 replaced the recipe/shop/franchise layer with the gacha + skill
      // tree. Nothing from the old economy maps onto the new one, so this is a
      // deliberate hard wipe: settings and permanent records survive, all
      // progress state starts fresh. (The incremental v3–v15 chain is gone.)
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version >= 16) return p as unknown as GameState;

        const hasOnboarded = (p.hasOnboarded as boolean) ?? true;
        // Old saves mid-recipe-tutorial: that beat is gone, so land them in the
        // guided week rather than on a step nothing advances past.
        const raw = p.tutorialStep === "kitchen" ? "week1" : p.tutorialStep;
        const tutorialStep: TutorialStep = TUTORIAL_STEPS.includes(
          raw as TutorialStep,
        )
          ? (raw as TutorialStep)
          : hasOnboarded
            ? "done"
            : "start";

        return {
          sfxOn: (p.sfxOn as boolean) ?? true,
          musicOn: (p.musicOn as boolean) ?? true,
          sfxVolume: (p.sfxVolume as number) ?? 1,
          musicVolume: (p.musicVolume as number) ?? 0.7,
          darkMode: (p.darkMode as boolean) ?? false,
          hasOnboarded,
          tutorialStep,
          highScore: p.highScore ?? 0,
          totalCurryAllTime: p.totalCurryAllTime ?? 0,
          trophies: p.trophies ?? {},
          unlockedBadges: p.unlockedBadges ?? [],
          bestFranchiseStars: p.bestFranchiseStars ?? 0,
          activeSkin: p.activeSkin ?? "default",
        } as unknown as GameState;
      },
      partialize: (s) => ({
        currentCurry: s.currentCurry,
        totalCurryAllTime: s.totalCurryAllTime,
        weekCurry: s.weekCurry,
        highScore: s.highScore,
        todayCurry: s.todayCurry,
        todayClicks: s.todayClicks,
        clicksThisWeek: s.clicksThisWeek,
        sfxOn: s.sfxOn,
        musicOn: s.musicOn,
        sfxVolume: s.sfxVolume,
        musicVolume: s.musicVolume,
        darkMode: s.darkMode,
        hasOnboarded: s.hasOnboarded,
        tutorialStep: s.tutorialStep,
        introsSeen: s.introsSeen,
        gachaInventory: s.gachaInventory,
        equippedUids: s.equippedUids,
        spinCount: s.spinCount,
        totalSpins: s.totalSpins,
        epicPulls: s.epicPulls,
        bestRarityThisWeek: s.bestRarityThisWeek,
        bestRarityEver: s.bestRarityEver,
        skillNodes: s.skillNodes,
        metaNodes: s.metaNodes,
        unlockedBadges: s.unlockedBadges,
        weeksCompleted: s.weeksCompleted,
        franchiseStars: s.franchiseStars,
        franchiseStarsEarned: s.franchiseStarsEarned,
        bestFranchiseStars: s.bestFranchiseStars,
        lastWeekStars: s.lastWeekStars,
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
        usedDayModifierIds: s.usedDayModifierIds,
        // bossDefeat is deliberately not persisted — the wipe it reports is
        // already committed to the save.
        bossHp: s.bossHp,
        bossMaxHp: s.bossMaxHp,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        // Older saves stored these as Decimal strings; Number() covers both.
        // Clamps are anti-cheat: hand-edited saves (Infinity, negatives,
        // absurd totals) load as sane values instead of being trusted.
        const num = (v: unknown, cap = 1e15) => {
          const n = Number(v ?? 0);
          return Number.isFinite(n) && n > 0 ? Math.min(n, cap) : 0;
        };
        const int = (v: unknown, cap = 1e9) => Math.floor(num(v, cap));
        const trophies = p.trophies
          ? Object.fromEntries(
              Object.entries(p.trophies as Record<string, unknown>).map(
                ([k, v]) => [k, Math.floor(num(v, 10000))],
              ),
            )
          : current.trophies;

        // Rolls are the save's most forgeable asset (a float of 9999 is a huge
        // multiplier), so every one is re-validated and the inventory capped.
        const gachaInventory = ((p.gachaInventory as unknown[]) ?? [])
          .slice(0, MAX_INVENTORY)
          .map(sanitizeRoll)
          .filter((r): r is RolledIngredient => r !== null);
        const uids = new Set(gachaInventory.map((r) => r.uid));
        const equippedUids = [
          ...new Set(((p.equippedUids as string[]) ?? []).filter((u) => uids.has(u))),
        ].slice(0, MAX_EQUIPPED);
        const rarity = (v: unknown): BestRarity =>
          RARITIES.includes(v as GachaRarity) ? (v as GachaRarity) : "none";

        return {
          ...current,
          ...(p as object),
          currentCurry: num(p.currentCurry),
          totalCurryAllTime: num(p.totalCurryAllTime),
          weekCurry: num(p.weekCurry),
          highScore: num(p.highScore),
          todayCurry: num(p.todayCurry),
          // A day's haul can't exceed the lifetime total.
          dailyCurry: Math.min(num(p.dailyCurry), num(p.totalCurryAllTime)),
          trophies,
          dailySnapshots: ((p.dailySnapshots as DailySnapshot[]) ?? []).map(
            (snap) => ({
              day: snap.day,
              curry: num(snap.curry),
              clicks: snap.clicks,
            }),
          ),
          gachaInventory,
          equippedUids,
          skillNodes: ((p.skillNodes as string[]) ?? []).filter(
            (id) => id in SKILL_MAP,
          ),
          metaNodes: ((p.metaNodes as string[]) ?? []).filter(
            (id) => id in META_MAP,
          ),
          spinCount: int(p.spinCount),
          totalSpins: int(p.totalSpins),
          epicPulls: int(p.epicPulls),
          bestRarityThisWeek: rarity(p.bestRarityThisWeek),
          bestRarityEver: rarity(p.bestRarityEver),
          // null = no fight in progress (pre-boss saves land here too); any
          // number goes through the same clamp as the rest of the economy.
          bossHp: p.bossHp == null ? null : num(p.bossHp),
          bossMaxHp: p.bossMaxHp == null ? null : num(p.bossMaxHp),
          bossDefeat: null,
        } as GameState;
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
