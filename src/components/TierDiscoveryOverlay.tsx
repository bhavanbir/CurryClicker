import { useEffect } from "react";
import { motion } from "framer-motion";
import type { RecipeTier } from "../types";
import { Icon } from "./arcade/Icon";

// Discovery Moments (framework §15.1). A celebratory flash the first time a new
// good/great/legendary tier is reached in a week. Auto-dismisses.
interface TierConfig {
  label: string;
  text: string;
  overlay: string;
  duration: number;
  particles: number;
}

const TIER_CONFIG: Partial<Record<RecipeTier, TierConfig>> = {
  good: { label: "GOOD SYNERGY!", text: "text-green-600", overlay: "bg-buy/15", duration: 1000, particles: 8 },
  great: { label: "GREAT SYNERGY!", text: "text-primary", overlay: "bg-primary/15", duration: 1400, particles: 16 },
  legendary: { label: "✨ LEGENDARY! ✨", text: "text-tertiary", overlay: "bg-tertiary/25", duration: 2200, particles: 28 },
};

export function TierDiscoveryOverlay({
  tier,
  onDone,
}: {
  tier: RecipeTier;
  onDone: () => void;
}) {
  const cfg = TIER_CONFIG[tier];

  useEffect(() => {
    if (!cfg) {
      onDone();
      return;
    }
    const t = window.setTimeout(onDone, cfg.duration);
    return () => window.clearTimeout(t);
  }, [cfg, onDone]);

  if (!cfg) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      className={`pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center ${cfg.overlay}`}
    >
      {Array.from({ length: cfg.particles }).map((_, i) => {
        const angle = (i / cfg.particles) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{
              x: Math.cos(angle) * 220,
              y: Math.sin(angle) * 220,
              opacity: 0,
              scale: 1.2,
            }}
            transition={{ duration: cfg.duration / 1000, ease: "easeOut" }}
            className="absolute"
          >
            <Icon name="star" fill size={20} className={cfg.text} />
          </motion.span>
        );
      })}
      <motion.div
        initial={{ scale: 0.5, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 240 }}
        className="arcade-box bg-white px-8 py-5"
      >
        <span className={`font-display text-3xl font-black uppercase text-stroke-ink ${cfg.text}`}>
          {cfg.label}
        </span>
      </motion.div>
    </motion.div>
  );
}
