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
    id: "shop",
    badge: "Day 3 — The Shop opens",
    cta: "Show me the goods!",
    day: FEATURE_UNLOCK_DAY.shop,
    rows: [
      {
        icon: "storefront",
        title: "Upgrades",
        body: "Spend curry on ladles, knives and helpers — every cook is worth more. There's a new Shop tab, plus a goal bar tracking your next buy.",
      },
      {
        icon: "chair",
        title: "Decorations",
        body: "Decor earns curry on its own, even while you rest. Press Decorate on the scene to arrange your restaurant however you like.",
      },
    ],
  },
  {
    id: "craving",
    badge: "Day 4 — Town Craving",
    cta: "I'll cook what they crave!",
    day: FEATURE_UNLOCK_DAY.craving,
    rows: [
      {
        icon: "restaurant",
        title: "The town craves a flavor",
        body: "Each day the town wants one flavor — Spicy, Mild, Sweet, Savory or Unique. Match it and every cook earns ×1.35.",
      },
      {
        icon: "whatshot",
        title: "Cooking to a flavor",
        body: "A recipe takes its most-used ingredient flavor: stack Spicy ingredients for a Spicy dish. A tie comes out Unique.",
      },
    ],
  },
  {
    id: "special",
    badge: "Day 5 — Chef's Special",
    cta: "Chef, yes chef!",
    day: FEATURE_UNLOCK_DAY.special,
    rows: [
      {
        icon: "star",
        title: "Today's featured pair",
        body: "Every day two ingredients are the Chef's Special. Cook with both in your recipe to claim a ×2 bonus for the day.",
      },
      {
        icon: "left_panel_open",
        title: "Where it lives",
        body: "Look for the star tab on the left edge of the scene — peek at today's pair and Mix It In with one tap.",
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
        body: "Your Shop upgrades reset with the new week — re-buy them; each completed week they come back stronger (and pricier). And remember: the affinity matrix reshuffles every real-life day.",
      },
      {
        icon: "stars",
        title: "Franchise Stars",
        body: "Stars from your week report buy permanent perks in the Franchise shop — new ingredients, head-start curry and more. Find it in your Chef profile.",
      },
      {
        icon: "emoji_events",
        title: "What carries over",
        body: "Decorations, badges and records stay yours. Chase a better week every week!",
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
