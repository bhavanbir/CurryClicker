import { useGameStore } from "../store/useGameStore";
import { DAYS_PER_WEEK } from "../config";
import { IS_DEMO } from "../target";

export function DayProgressBar() {
  const currentDay = useGameStore((s) => s.currentDay);
  const dayProgress = useGameStore((s) => s.dayProgress);
  const dayStarted = useGameStore((s) => s.dayStarted);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const demoEnded = IS_DEMO && weeksCompleted >= 1;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink/55">
        {/* duplicates the header's Day chip — first to go when space is tight */}
        <span className="cramped-hide">
          Day {currentDay}/{DAYS_PER_WEEK}
        </span>
        <span className={dayStarted ? "" : "text-primary"}>
          {dayStarted
            ? `${Math.floor(dayProgress * 100)}%`
            : demoEnded
              ? "Demo complete"
              : "Ready — press Start Day"}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-linear"
          style={{ width: `${Math.min(dayProgress * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
