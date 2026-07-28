import { motion } from "framer-motion";
import {
  useGameStore,
  FEATURE_UNLOCK_DAY,
} from "../store/useGameStore";
import { IS_DEMO } from "../target";
import { Icon } from "./arcade/Icon";

// Guided-week feature intros: each side system gets a one-time card the day
// it unlocks (see FEATURE_UNLOCK_DAY), shown only in quiet pre-day moments so
// it never stacks on the day-choice or week-summary modals. The prestige card
// closes the tutorial for good.

interface IntroRow {
  icon: string;
  title: string;
  body: string;
}

interface IntroDef {
  id: string;
  badge: string;
  cta: string;
  day: number | null; // null = after the first week completes (prestige)
  rows: IntroRow[];
}

const INTROS: IntroDef[] = [
  {
    id: "gacha",
    badge: "Day 2 — The Gacha opens",
    cta: "Let's roll!",
    day: FEATURE_UNLOCK_DAY.gacha,
    rows: [
      {
        icon: "casino",
        title: "Roll for ingredients",
        body: "Spend curry on a spin. Every roll is unique — rarity sets how many bonuses it carries, and each bonus lands somewhere in its range.",
      },
      {
        icon: "inventory_2",
        title: "Equip three",
        body: "Your inventory keeps every roll, but only three can be equipped at once. Their bonuses stack onto every cook.",
      },
      {
        icon: "auto_awesome",
        title: "Chase Currylicious",
        body: "Six rarities, from Common up to Currylicious — the top tier carries six bonuses and almost never drops.",
      },
    ],
  },
  {
    id: "skills",
    badge: "Day 3 — Skill Tree",
    cta: "Show me the tree!",
    day: FEATURE_UNLOCK_DAY.skills,
    rows: [
      {
        icon: "account_tree",
        title: "Three curry branches",
        body: "Spice, Service and Hustle buy with curry — click power, crits and room, economy. They all reset when the week prestiges.",
      },
      {
        icon: "stars",
        title: "The star branch is permanent",
        body: "Stars from your week report buy the meta branch. Those nodes stay bought through every prestige.",
      },
    ],
  },
  {
    id: "prestige",
    badge: "Week complete — Prestige!",
    cta: "On to week 2!",
    day: null,
    rows: [
      {
        icon: "autorenew",
        title: "Weekly reset",
        body: "Your curry skill branches reset with the new week — re-buy them; each completed week they come back stronger (and pricier).",
      },
      {
        icon: "stars",
        title: "Franchise Stars",
        body: "Stars from your week report buy the permanent star branch — global multipliers, head-start curry and more. Find it on the Skills tab.",
      },
      {
        icon: "emoji_events",
        title: "What carries over",
        body: "Your rolled ingredients, badges and records stay yours. Chase a better week every week!",
      },
    ],
  },
];

export function FeatureIntroLayer() {
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const currentDay = useGameStore((s) => s.currentDay);
  const dayStarted = useGameStore((s) => s.dayStarted);
  const phase = useGameStore((s) => s.phase);
  const pendingDayChoices = useGameStore((s) => s.pendingDayChoices);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const introsSeen = useGameStore((s) => s.introsSeen);
  const markIntroSeen = useGameStore((s) => s.markIntroSeen);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  if (
    tutorialStep !== "week1" ||
    phase !== "cooking" ||
    dayStarted ||
    pendingDayChoices
  )
    return null;

  const intro = INTROS.find(
    (i) =>
      !introsSeen.includes(i.id) &&
      (i.day !== null
        ? currentDay >= i.day
        : weeksCompleted >= 1 && !IS_DEMO),
  );
  if (!intro) return null;

  const dismiss = () => {
    markIntroSeen(intro.id);
    if (intro.id === "prestige") setTutorialStep("done");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <span className="rounded-full border-2 border-ink bg-primary px-3 py-0.5 text-xs font-black uppercase tracking-widest text-white">
          {intro.badge}
        </span>

        <div className="mt-4 flex flex-col gap-4">
          {intro.rows.map((r) => (
            <div key={r.title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-tertiary-fixed shadow-arcade-sm">
                <Icon name={r.icon} fill size={24} className="text-primary" />
              </span>
              <div>
                <h3 className="font-display text-base font-black uppercase text-ink">
                  {r.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-ink/70">
                  {r.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="arcade-btn mt-5 flex w-full items-center justify-center gap-2 bg-primary py-3 text-lg uppercase text-white"
        >
          {intro.cta}
          <Icon name="local_fire_department" fill size={22} />
        </button>
      </motion.div>
    </div>
  );
}
