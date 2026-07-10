import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore } from "../hooks/useRecipeScore";
import { getDailyCraving } from "../engine/weekEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { AffinityBadge } from "./AffinityBadge";
import { FlavorTag } from "./FlavorTag";
import { PixelIcon } from "./PixelIcon";
import { Icon } from "./arcade/Icon";
import { ArcadeButton } from "./arcade/ArcadeButton";

interface Props {
  onStart: () => void;
  onChangeRecipe: () => void;
  onClose: () => void;
}

// Pre-day confirmation: one last look at the recipe before the clock opens.
export function StartDayModal({ onStart, onChangeRecipe, onClose }: Props) {
  const slots = useGameStore((s) => s.slots);
  const currentDay = useGameStore((s) => s.currentDay);
  const seed = useGameStore((s) => s.seed);
  const score = useRecipeScore();
  const craving = getDailyCraving(currentDay, seed);
  const filled = slots.filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="restaurant" className="text-primary" fill size={32} />
            <h2 className="font-display text-2xl font-black uppercase text-ink">
              Ready for Day {currentDay}?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink/50 hover:text-ink"
          >
            <Icon name="close" size={24} />
          </button>
        </div>
        <p className="mt-1 text-sm font-semibold text-ink/60">
          This is today's recipe — change it now or start cooking.
        </p>

        <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border-4 border-ink bg-cream-100 p-4">
          <div className="flex items-center gap-1.5">
            {filled.map((id, i) => (
              <span
                key={i}
                className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-ink bg-white"
                title={INGREDIENTS[id].name}
              >
                <PixelIcon
                  id={id}
                  icon={INGREDIENTS[id].icon}
                  size={36}
                  iconClassName={INGREDIENTS[id].color}
                />
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <AffinityBadge tier={score.tier} multiplier={score.multiplier} />
            <FlavorTag flavor={score.flavor} craving={craving} tier={score.tier} />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <ArcadeButton
            variant="tertiary"
            size="lg"
            className="flex-1"
            onClick={onChangeRecipe}
          >
            <Icon name="skillet" fill size={20} />
            Change recipe
          </ArcadeButton>
          <ArcadeButton variant="buy" size="lg" className="flex-1" onClick={onStart}>
            <Icon name="play_arrow" fill size={22} />
            Start Day {currentDay}
          </ArcadeButton>
        </div>
      </motion.div>
    </div>
  );
}
