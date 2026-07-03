import { useEffect } from "react";
import { motion } from "framer-motion";
import { Decimal } from "../lib/decimal";
import { playWeekComplete, playStarAward } from "../lib/sfx";
import { formatCurry } from "../lib/format";
import { useGameStore } from "../store/useGameStore";
import type { Screen } from "../navigation";
import { Icon } from "./arcade/Icon";
import { ArcadeButton } from "./arcade/ArcadeButton";
import { IS_DEMO } from "../target";
import { SteamCta } from "./SteamCta";

interface Props {
  onNavigate: (s: Screen) => void;
}

export function WeekSummaryModal({ onNavigate }: Props) {
  const weekId = useGameStore((s) => s.weekId);
  const weekCurry = useGameStore((s) => s.weekCurry);
  const clicksThisWeek = useGameStore((s) => s.clicksThisWeek);
  const snapshots = useGameStore((s) => s.dailySnapshots);
  const startNewWeek = useGameStore((s) => s.startNewWeek);
  const lastWeekStars = useGameStore((s) => s.lastWeekStars);

  useEffect(() => {
    playWeekComplete();
    if (!useGameStore.getState().lastWeekStars) return;
    const id = window.setTimeout(playStarAward, 700);
    return () => clearTimeout(id);
  }, []);

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

        {lastWeekStars && (
          <div className="mt-4 rounded-lg border-4 border-ink bg-violet-100 p-4 shadow-arcade">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-ink/60">
                Franchise Stars earned
              </span>
              <span className="flex items-center gap-1 font-display text-2xl font-black tabular-nums text-violet-700">
                +{lastWeekStars.total}
                <Icon name="stars" fill size={24} className="text-violet-600" />
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {lastWeekStars.reasons.map((reason) => (
                <div key={reason} className="flex items-center gap-2 text-sm">
                  <Icon name="stars" fill size={16} className="shrink-0 text-violet-600" />
                  <span className="font-semibold text-ink/70">{reason}</span>
                </div>
              ))}
            </div>
            <ArcadeButton
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                startNewWeek();
                onNavigate("franchise");
              }}
            >
              <Icon name="stars" fill size={18} className="text-violet-700" />
              Spend your stars
            </ArcadeButton>
          </div>
        )}

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

        {/* Demo funnel: the week-summary high is a natural conversion moment. */}
        {IS_DEMO && (
          <SteamCta label="Enjoying it? Get the full game" className="mt-3" />
        )}
      </motion.div>
    </div>
  );
}
