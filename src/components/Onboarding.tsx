import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { Icon } from "./arcade/Icon";

// First-run tutorial. Shown once (gated by the persisted `hasOnboarded` flag),
// it teaches the core loop so a demo player isn't dropped in cold.

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: "skillet",
    title: "Build a recipe",
    body: "Head to the Kitchen and combine up to 5 ingredients. Some pairings love each other, some clash — the cards glow to hint hot or cold.",
  },
  {
    icon: "local_fire_department",
    title: "Cook to earn curry",
    body: "Tap your shop to cook. Great-tasting recipes multiply every tap. Cooked dishes pile on the counter — and customers wander in to eat them.",
  },
  {
    icon: "auto_awesome",
    title: "A fresh puzzle weekly",
    body: "Ingredient affinities are reshuffled every week, so the best recipe always changes. Spend curry on upgrades & décor, and chase the daily Chef's Special.",
  },
];

export function Onboarding() {
  const complete = useGameStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full border-2 border-ink bg-primary px-3 py-0.5 text-xs font-black uppercase tracking-widest text-white">
            Welcome, Chef!
          </span>
          <button
            type="button"
            onClick={complete}
            className="text-xs font-bold uppercase text-ink/50 hover:text-ink"
          >
            Skip
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-ink bg-tertiary-fixed shadow-arcade">
            <Icon name={s.icon} fill size={36} className="text-primary" />
          </div>
          <h2 className="mt-3 font-display text-2xl font-black uppercase text-ink">
            {s.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/70">{s.body}</p>
        </div>

        {/* Progress dots */}
        <div className="mt-5 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full border-2 border-ink ${
                i === step ? "bg-primary" : "bg-white"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((n) => n - 1)}
              className="arcade-btn flex items-center justify-center gap-1 bg-white px-4 py-3 uppercase text-ink"
            >
              <Icon name="arrow_back" size={20} /> Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? complete() : setStep((n) => n + 1))}
            className="arcade-btn flex flex-1 items-center justify-center gap-2 bg-primary py-3 text-lg uppercase text-white"
          >
            {last ? "Start Cooking" : "Next"}
            <Icon name={last ? "local_fire_department" : "arrow_forward"} fill={last} size={22} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
