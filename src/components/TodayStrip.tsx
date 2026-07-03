import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore } from "../hooks/useRecipeScore";
import { getDailySpecial, getDailyCraving } from "../engine/weekEngine";
import { CRAVING_MATCH_BONUS } from "../engine/recipeEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { FLAVOR_META } from "./FlavorTag";
import { Icon } from "./arcade/Icon";

interface Props {
  onMixIn?: () => void; // navigate to the Kitchen
}

// Merged Chef's Special + Town Craving strip. Each half quiets down to a slim
// green "done" row once its bonus is secured, so the strip stops shouting.
export function TodayStrip({ onMixIn }: Props) {
  const currentDay = useGameStore((s) => s.currentDay);
  const seed = useGameStore((s) => s.seed);
  const slots = useGameStore((s) => s.slots);
  const claimDays = useGameStore((s) => s.specialClaimDays);
  const score = useRecipeScore();

  const special = getDailySpecial(currentDay, seed);
  const a = INGREDIENTS[special.ingredientA];
  const b = INGREDIENTS[special.ingredientB];
  const hasSpecial = Boolean(a && b);

  const craving = getDailyCraving(currentDay, seed);
  const cravingMeta = FLAVOR_META[craving];

  const bothActive =
    slots.includes(special.ingredientA) && slots.includes(special.ingredientB);
  const claimed = claimDays.includes(currentDay);
  const matched = score.flavor !== null && score.flavor === craving;

  return (
    <div
      className={`arcade-box grid overflow-hidden ${hasSpecial ? "sm:grid-cols-2" : ""}`}
    >
      {hasSpecial && (
        <div
          className={`flex min-h-[3rem] items-center px-3 py-2 ${
            claimed ? "bg-buy/20" : bothActive ? "bg-primary/15" : "bg-tertiary-fixed"
          }`}
        >
          {claimed ? (
            <Done label="Special claimed" />
          ) : (
            <motion.div
              key={bothActive ? "active" : "idle"}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon name="star" fill size={14} className="text-primary" />
                  <span className="font-display text-[11px] font-black uppercase tracking-wide text-ink">
                    Chef's Special
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Pill icon={a.icon} color={a.color} name={a.name} />
                  <Icon name="add" size={12} className="text-ink/50" />
                  <Pill icon={b.icon} color={b.color} name={b.name} />
                  <span className="rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-black text-primary">
                    ×2
                  </span>
                </div>
              </div>

              {bothActive ? (
                <span className="flex shrink-0 items-center gap-1 rounded border-2 border-ink bg-primary px-2 py-1 text-xs font-black uppercase text-white">
                  <Icon name="check" size={14} /> In recipe
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onMixIn}
                  className="arcade-btn shrink-0 bg-primary px-2.5 py-1.5 text-xs uppercase text-white"
                >
                  Mix it in
                  <Icon name="arrow_forward" size={14} />
                </button>
              )}
            </motion.div>
          )}
        </div>
      )}

      <div
        className={`flex min-h-[3rem] items-center px-3 py-2 ${
          hasSpecial ? "border-t-4 border-ink sm:border-l-4 sm:border-t-0" : ""
        } ${matched ? "bg-buy/20" : "bg-cream-100"}`}
      >
        {matched ? (
          <Done label="Craving matched" />
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Done({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5"
    >
      <Icon name="check_circle" fill size={16} className="text-ink" />
      <span className="font-display text-xs font-black uppercase tracking-wide text-ink">
        {label}
      </span>
    </motion.div>
  );
}

function Pill({ icon, color, name }: { icon: string; color: string; name: string }) {
  return (
    <span className="flex items-center gap-1 rounded-md border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-bold text-ink">
      <Icon name={icon} className={color} fill size={14} />
      {name}
    </span>
  );
}
