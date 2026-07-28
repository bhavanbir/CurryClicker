import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { bossMaxHp } from "../engine/boss";
import { formatCurry } from "../lib/format";
import { DAYS_PER_WEEK } from "../config";
import { Icon } from "./arcade/Icon";
import { ArcadeButton } from "./arcade/ArcadeButton";

interface Props {
  onStart: () => void;
  onClose: () => void;
  // ponytail: kept optional so GameplayScreen can drop the prop on its own schedule.
}

// Pre-day confirmation: one tap between the player and the running clock.
export function StartDayModal({ onStart, onClose }: Props) {
  const currentDay = useGameStore((s) => s.currentDay);
  const snapshots = useGameStore((s) => s.dailySnapshots);

  // Last day of the week is the boss — the HP preview is computed the same way
  // startDay locks it in, so the number on the button is the number you fight.
  const boss = currentDay === DAYS_PER_WEEK;
  const hp = boss ? bossMaxHp(snapshots) : 0;

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
            <Icon
              name={boss ? "local_fire_department" : "restaurant"}
              className={boss ? "text-tier-terrible" : "text-primary"}
              fill
              size={32}
            />
            <h2 className="font-display text-2xl font-black uppercase text-ink">
              {boss ? "Boss Day!" : `Ready for Day ${currentDay}?`}
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
        {boss ? (
          <>
            <p className="mt-1 text-sm font-semibold text-ink/60">
              One hungry critic, one closing bell. Every cook is damage — crits,
              On Fire, all of it. Let the clock run out and the week burns:
              your score, your skill tree, and every ingredient but one.
            </p>
            <div className="mt-4 rounded-lg border-4 border-ink bg-tier-terrible p-3 text-center shadow-arcade">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/70">
                Boss HP
              </div>
              <div className="font-display text-3xl font-black text-white text-stroke-ink">
                {formatCurry(hp)}
              </div>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm font-semibold text-ink/60">
            The clock starts as soon as you do. Cook as much curry as you can.
          </p>
        )}

        <ArcadeButton
          variant="buy"
          size="lg"
          className="mt-5 w-full justify-center"
          onClick={onStart}
        >
          <Icon name={boss ? "local_fire_department" : "play_arrow"} fill size={22} />
          {boss ? "Face the Boss" : `Start Day ${currentDay}`}
        </ArcadeButton>
      </motion.div>
    </div>
  );
}
