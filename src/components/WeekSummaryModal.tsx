import { motion } from "framer-motion";
import { Decimal } from "../lib/decimal";
import { formatCurry } from "../lib/format";
import { useGameStore } from "../store/useGameStore";
import { Icon } from "./arcade/Icon";

export function WeekSummaryModal() {
  const weekId = useGameStore((s) => s.weekId);
  const weekCurry = useGameStore((s) => s.weekCurry);
  const clicksThisWeek = useGameStore((s) => s.clicksThisWeek);
  const snapshots = useGameStore((s) => s.dailySnapshots);
  const startNewWeek = useGameStore((s) => s.startNewWeek);

  const bestDay = snapshots.reduce<{ day: number; curry: Decimal } | null>(
    (best, snap) => {
      const c = new Decimal(snap.curry);
      if (!best || c.gt(best.curry)) return { day: snap.day, curry: c };
      return best;
    },
    null,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <div className="flex items-center gap-2">
          <Icon name="emoji_events" className="text-tertiary" fill size={32} />
          <h2 className="font-display text-2xl font-black uppercase text-ink">
            Week Complete!
          </h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-ink/50">{weekId}</p>

        <div className="mt-5 rounded-lg border-4 border-ink bg-tertiary-fixed p-4 text-center shadow-arcade">
          <div className="text-xs font-bold uppercase tracking-wide text-ink/60">
            This week's curry
          </div>
          <div className="font-display text-4xl font-black text-primary text-stroke-ink">
            {formatCurry(weekCurry, 1)}
          </div>
          <div className="mt-1 text-xs font-bold text-ink/60">
            {clicksThisWeek.toLocaleString()} cooks
            {bestDay && (
              <> · best Day {bestDay.day} ({formatCurry(bestDay.curry, 1)})</>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {snapshots.map((snap) => (
            <div
              key={snap.day}
              className="flex items-center justify-between rounded px-3 py-1.5 text-sm odd:bg-cream-100"
            >
              <span className="font-semibold text-ink/60">Day {snap.day}</span>
              <span className="font-display font-extrabold tabular-nums text-ink">
                {formatCurry(new Decimal(snap.curry), 1)}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={startNewWeek}
          className="arcade-btn mt-6 flex w-full items-center justify-center gap-2 bg-primary py-3 text-lg uppercase text-white"
        >
          Start Next Week
          <Icon name="arrow_forward" size={22} />
        </button>
      </motion.div>
    </div>
  );
}
