// End-of-day choices: after each in-game day the player picks one of 3 seeded
// bonus-with-a-cost modifiers for the next day, or declines. The active
// modifier is cleared at that day's end.

import { makeRng } from "../lib/rng";

export interface DayModifier {
  id: string;
  name: string;
  icon: string; // material symbol
  bonus: string;
  cost: string;
  clickMult?: number; // per-click curry multiplier
  autoMult?: number; // auto-production multiplier (0 disables it)
  daySeconds?: number; // absolute day length override
  dayLengthMult?: number; // relative day length
  critChanceMult?: number; // crit-circle spawn chance multiplier
  critBiasLow?: boolean; // skew crit circles toward low multipliers
}

export const DAY_CHOICES: DayModifier[] = [
  {
    id: "ghost_pepper",
    name: "Ghost Pepper Rush",
    icon: "local_fire_department",
    bonus: "Every cook is worth ×100",
    cost: "The day lasts only 4 seconds",
    clickMult: 100,
    daySeconds: 4,
  },
  {
    id: "bubble_bonanza",
    name: "Bubble Bonanza",
    icon: "bubble_chart",
    bonus: "Bonus circles appear 3× as often",
    cost: "Big-multiplier circles are much rarer",
    critChanceMult: 3,
    critBiasLow: true,
  },
  {
    id: "slow_simmer",
    name: "Slow Simmer",
    icon: "self_improvement",
    bonus: "Auto-production ×5",
    cost: "Cooks are worth ×0.25",
    autoMult: 5,
    clickMult: 0.25,
  },
  {
    id: "rush_hour",
    name: "Rush Hour",
    icon: "bolt",
    bonus: "All curry ×3",
    cost: "The day is half as long",
    clickMult: 3,
    autoMult: 3,
    dayLengthMult: 0.5,
  },
  {
    id: "hand_crafted",
    name: "Hand-Crafted",
    icon: "back_hand",
    bonus: "Cooks are worth ×10",
    cost: "Auto-production is switched off",
    clickMult: 10,
    autoMult: 0,
  },
  {
    id: "marathon",
    name: "Marathon Prep",
    icon: "timer",
    bonus: "The day lasts twice as long",
    cost: "All curry ×0.75",
    clickMult: 0.75,
    autoMult: 0.75,
    dayLengthMult: 2,
  },
];

export const DAY_CHOICE_MAP: Record<string, DayModifier> = Object.fromEntries(
  DAY_CHOICES.map((c) => [c.id, c]),
);

// Up to 3 distinct choice ids for the day, deterministic per (seed, day).
// `exclude` drops modifiers already picked this week — once chosen, a deal
// doesn't reappear until the weekly reset.
export function pickDayChoiceIds(seed: number, day: number, exclude: string[] = []): string[] {
  const rng = makeRng(`${seed}-daychoices-${day}`);
  const pool = DAY_CHOICES.filter((c) => !exclude.includes(c.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3).map((c) => c.id);
}
