import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { DAY_CHOICE_MAP } from "../engine/dayChoices";
import { Icon } from "./arcade/Icon";
import { ArcadeButton } from "./arcade/ArcadeButton";

// End-of-day offer: pick one bonus-with-a-cost modifier for the next day, or
// decline. Shows whenever the store has pending choices (day just ended, or a
// reload landed on an unanswered offer).
export function DayChoiceModal() {
  const pendingDayChoices = useGameStore((s) => s.pendingDayChoices);
  const currentDay = useGameStore((s) => s.currentDay);
  const chooseDayModifier = useGameStore((s) => s.chooseDayModifier);

  if (!pendingDayChoices) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <div className="flex items-center gap-2">
          <Icon name="restaurant_menu" className="text-primary" fill size={32} />
          <h2 className="font-display text-2xl font-black uppercase text-ink">
            Day {currentDay} Special Offer
          </h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-ink/60">
          Pick one deal for tomorrow — every bonus has a catch.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {pendingDayChoices.map((id) => {
            const c = DAY_CHOICE_MAP[id];
            if (!c) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => chooseDayModifier(id)}
                className="flex items-start gap-3 rounded-lg border-4 border-ink bg-white p-3 text-left shadow-arcade-sm transition-transform hover:-translate-y-0.5 hover:bg-cream-100"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-tertiary-fixed">
                  <Icon name={c.icon} fill size={24} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-extrabold uppercase text-ink">
                    {c.name}
                  </div>
                  <div className="text-sm font-semibold text-tier-good">+ {c.bonus}</div>
                  <div className="text-sm font-semibold text-tier-terrible">
                    − {c.cost}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <ArcadeButton
          variant="tertiary"
          size="lg"
          className="mt-4 w-full"
          onClick={() => chooseDayModifier(null)}
        >
          <Icon name="close" size={20} />
          No thanks, cook it straight
        </ArcadeButton>
      </motion.div>
    </div>
  );
}
