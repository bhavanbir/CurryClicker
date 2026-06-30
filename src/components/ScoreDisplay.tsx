import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { formatScore } from "../lib/format";

interface Props {
  showHighScore?: boolean;
}

// Big stroked arcade score. Pulses on change by re-mounting via `key`.
export function ScoreDisplay({ showHighScore = true }: Props) {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const highScore = useGameStore((s) => s.highScore);
  const text = formatScore(currentCurry);

  return (
    <div className="flex flex-col items-center leading-none">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
        Score
      </span>
      <motion.span
        key={text}
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
        className="font-display text-3xl font-black tabular-nums text-primary text-stroke-ink md:text-4xl"
      >
        {text}
      </motion.span>
      {showHighScore && (
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/45">
          High {formatScore(highScore)}
        </span>
      )}
    </div>
  );
}
