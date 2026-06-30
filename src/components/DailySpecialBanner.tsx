import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { getDailySpecial } from "../engine/weekEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { Icon } from "./arcade/Icon";

interface Props {
  onMixIn?: () => void; // navigate to the Kitchen
}

// Chef's Special (framework §8.2). Shows the day's duo; pulses orange when both
// ingredients are active; turns green once claimed today.
export function DailySpecialBanner({ onMixIn }: Props) {
  const currentDay = useGameStore((s) => s.currentDay);
  const seed = useGameStore((s) => s.seed);
  const slots = useGameStore((s) => s.slots);
  const claimDays = useGameStore((s) => s.specialClaimDays);

  const special = getDailySpecial(currentDay, seed);
  const a = INGREDIENTS[special.ingredientA];
  const b = INGREDIENTS[special.ingredientB];
  if (!a || !b) return null;

  const bothActive =
    slots.includes(special.ingredientA) && slots.includes(special.ingredientB);
  const claimed = claimDays.includes(currentDay);

  return (
    <motion.div
      animate={bothActive && !claimed ? { scale: [1, 1.015, 1] } : { scale: 1 }}
      transition={{ duration: 1, repeat: bothActive && !claimed ? Infinity : 0 }}
      className={`arcade-box flex items-center justify-between gap-3 p-3 ${
        claimed
          ? "bg-buy/20"
          : bothActive
            ? "bg-primary/15"
            : "bg-tertiary-fixed"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Icon name="star" fill size={16} className="text-primary" />
            <span className="font-display text-xs font-black uppercase tracking-wide text-ink">
              Today's Special · Day {currentDay}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Pill icon={a.icon} color={a.color} name={a.name} />
            <Icon name="add" size={14} className="text-ink/50" />
            <Pill icon={b.icon} color={b.color} name={b.name} />
            <span className="ml-1 rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-black text-primary">
              ×2
            </span>
          </div>
        </div>
      </div>

      {claimed ? (
        <span className="flex shrink-0 items-center gap-1 rounded border-2 border-ink bg-buy px-2 py-1 text-xs font-black uppercase text-ink">
          <Icon name="check" size={14} /> Claimed
        </span>
      ) : bothActive ? (
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
