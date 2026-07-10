import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore } from "../hooks/useRecipeScore";
import { getDailyCraving } from "../engine/weekEngine";
import { CRAVING_MATCH_BONUS } from "../engine/recipeEngine";
import { FLAVOR_META } from "./FlavorTag";
import { Icon } from "./arcade/Icon";

// Town Craving bar — quiets down to a slim green "done" row once matched.
export function CravingBar() {
  const currentDay = useGameStore((s) => s.currentDay);
  const seed = useGameStore((s) => s.seed);
  const score = useRecipeScore();

  const craving = getDailyCraving(currentDay, seed);
  const cravingMeta = FLAVOR_META[craving];
  const matched = score.flavor !== null && score.flavor === craving;

  return (
    <div
      className={`arcade-box flex min-h-[3rem] items-center px-3 py-2 ${
        matched ? "bg-buy/20" : "bg-cream-100"
      }`}
    >
      {matched ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5"
        >
          <Icon name="check_circle" fill size={16} className="text-ink" />
          <span className="font-display text-xs font-black uppercase tracking-wide text-ink">
            Craving matched
          </span>
        </motion.div>
      ) : (
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <Icon name="storefront" fill size={14} className="text-primary" />
            <span className="font-display text-[11px] font-black uppercase tracking-wide text-ink">
              Town Craving
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-md border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-bold text-ink">
              <Icon name={cravingMeta.icon} className={cravingMeta.text} fill size={14} />
              {cravingMeta.label}
            </span>
            <span className="rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-black text-primary">
              ×{CRAVING_MATCH_BONUS}
            </span>
          </div>
          <span className="cramped-hide text-[11px] font-semibold text-ink/50">
            Cook this flavour for bonus curry
          </span>
        </div>
      )}
    </div>
  );
}
