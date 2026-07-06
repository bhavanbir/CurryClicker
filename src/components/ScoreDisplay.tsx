import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { formatScore } from "../lib/format";

// Big stroked arcade score. Pulses on change by re-mounting via `key`.
// Gains roll up slot-machine style; spends snap down instantly.
// Tapping the "High" line opens a small popover explaining why the current
// score and the high score drift apart.
export function ScoreDisplay() {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const weekCurry = useGameStore((s) => s.weekCurry);
  const highScore = useGameStore((s) => s.highScore);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  const [display, setDisplay] = useState(currentCurry);
  const displayRef = useRef(currentCurry);
  useEffect(() => {
    if (reduced || currentCurry < displayRef.current) {
      displayRef.current = currentCurry;
      setDisplay(currentCurry);
      return;
    }
    // Retargets on every store change, so auto-production ticks just steer
    // the tween instead of fighting it.
    const c = animate(displayRef.current, currentCurry, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (v) => {
        displayRef.current = v;
        setDisplay(v);
      },
    });
    return () => c.stop();
  }, [currentCurry, reduced]);

  const text = formatScore(Math.floor(display));

  return (
    <div className="relative flex flex-col items-center leading-none">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
        Score
      </span>
      <motion.span
        key={currentCurry}
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
        className="font-display text-3xl font-black tabular-nums text-primary text-stroke-ink md:text-4xl"
      >
        {text}
      </motion.span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="What does High mean?"
        className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/55 underline decoration-dotted underline-offset-2"
      >
        High {formatScore(highScore)}
      </button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="arcade-box absolute top-full z-50 mt-2 w-64 -translate-x-1/2 p-3 text-left"
            style={{ left: "50%" }}
          >
            <ScoreRow label="Score" value={formatScore(currentCurry)}>
              Spendable curry — drops when you buy upgrades or decor.
            </ScoreRow>
            <ScoreRow label="This week" value={formatScore(weekCurry)}>
              Everything earned this week; spending never lowers it.
            </ScoreRow>
            <ScoreRow label="High score" value={formatScore(highScore)}>
              Your best single week's total, ever.
            </ScoreRow>
            <p className="mt-2 border-t-2 border-ink/10 pt-2 text-[11px] font-semibold leading-snug text-ink/60">
              Score drops when you spend — High Score tracks your best week's
              earnings, so they drift apart.
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: string;
}) {
  return (
    <div className="mb-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wide text-ink/60">
          {label}
        </span>
        <span className="font-display text-sm font-black tabular-nums text-ink">
          {value}
        </span>
      </div>
      <p className="text-[11px] font-semibold leading-snug text-ink/60">{children}</p>
    </div>
  );
}
