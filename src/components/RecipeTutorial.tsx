import { motion } from "framer-motion";
import { Icon } from "./arcade/Icon";

// Day-2 tutorial: clicking is second nature by now, so explain the recipe →
// affinity → keep-experimenting loop. Shown once, when the Kitchen first
// opens (tutorialStep "kitchen").

const LESSONS = [
  {
    icon: "skillet",
    title: "Recipes",
    body: "Pick up to 3 ingredients (more slots unlock in the Shop). Every cook earns curry based on how well they pair.",
  },
  {
    icon: "science",
    title: "The affinity matrix",
    body: "Every ingredient pair has a hidden affinity, from Terrible to Legendary — great pairs multiply your curry per click. Cook a recipe to taste-test its pairs; the Journal remembers what you learn.",
  },
  {
    icon: "whatshot",
    title: "Flavors",
    body: "Every ingredient is Spicy, Mild, Sweet, Savory or Unique. A recipe cooks as its most-used flavor — 2 Spicy + 1 Sweet makes a Spicy dish; an even tie comes out Unique.",
  },
  {
    icon: "autorenew",
    title: "Keep changing it",
    body: "The whole affinity matrix reshuffles every real-life day — yesterday's best recipe can be terrible today. Test new pairs and check the Journal daily!",
  },
];

export function RecipeTutorial({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <span className="rounded-full border-2 border-ink bg-primary px-3 py-0.5 text-xs font-black uppercase tracking-widest text-white">
          Day 2 — Chef School
        </span>

        <div className="mt-4 flex flex-col gap-4">
          {LESSONS.map((l) => (
            <div key={l.title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-tertiary-fixed shadow-arcade-sm">
                <Icon name={l.icon} fill size={24} className="text-primary" />
              </span>
              <div>
                <h3 className="font-display text-base font-black uppercase text-ink">
                  {l.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-ink/70">
                  {l.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onDone}
          className="arcade-btn mt-5 flex w-full items-center justify-center gap-2 bg-primary py-3 text-lg uppercase text-white"
        >
          Got it — let's cook!
          <Icon name="local_fire_department" fill size={22} />
        </button>
      </motion.div>
    </div>
  );
}
