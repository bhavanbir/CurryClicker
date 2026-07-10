import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { Icon } from "./arcade/Icon";

// First-run welcome. Shown once (gated by the persisted `hasOnboarded` flag).
// Dismissing it also drops a starter recipe into the slots (see
// completeOnboarding) so the very next tap already cooks.

export function Onboarding() {
  const complete = useGameStore((s) => s.completeOnboarding);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <span className="rounded-full border-2 border-ink bg-primary px-3 py-0.5 text-xs font-black uppercase tracking-widest text-white">
          Welcome, Chef!
        </span>

        <div className="mt-5 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-ink bg-tertiary-fixed shadow-arcade">
            <Icon name="local_fire_department" fill size={36} className="text-primary" />
          </div>
          <h2 className="mt-3 font-display text-2xl font-black uppercase text-ink">
            Tap to cook curry!
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/70">
            We've started you off with a recipe — press Start Day, then tap your
            restaurant to cook. Better ingredient pairings mean more curry per
            tap; tweak yours anytime in the Kitchen.
          </p>
        </div>

        <button
          type="button"
          onClick={complete}
          className="arcade-btn mt-5 flex w-full items-center justify-center gap-2 bg-primary py-3 text-lg uppercase text-white"
        >
          Start Cooking
          <Icon name="local_fire_department" fill size={22} />
        </button>
      </motion.div>
    </div>
  );
}
