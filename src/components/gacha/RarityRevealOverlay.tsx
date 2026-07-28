import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { GachaRarity } from "../../engine/gacha";
import { Icon } from "../arcade/Icon";
import { rarityColor } from "./rarityFx";

// Discovery Moment for a top-tier pull (framework §15.1) — the celebratory
// flash lifted from the old recipe-tier overlay, rekeyed by gacha rarity.
// Only the two rarities flagged `overlay` in rarityFx get one; anything more
// generous and the moment stops being a moment. Auto-dismisses.
interface RevealConfig {
  label: string;
  overlay: string;
  duration: number;
  particles: number;
}

const REVEAL: Partial<Record<GachaRarity, RevealConfig>> = {
  legendary: { label: "LEGENDARY!", overlay: "bg-tertiary/25", duration: 2200, particles: 28 },
  currylicious: { label: "CURRYLICIOUS!", overlay: "bg-primary/25", duration: 2800, particles: 44 },
};

export function RarityRevealOverlay({
  rarity,
  onDone,
}: {
  rarity: GachaRarity;
  onDone: () => void;
}) {
  const cfg = REVEAL[rarity];
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!cfg) {
      onDone();
      return;
    }
    const t = window.setTimeout(onDone, cfg.duration);
    return () => window.clearTimeout(t);
  }, [cfg, onDone]);

  if (!cfg) return null;

  const color = rarityColor(rarity);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      className={`pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center ${cfg.overlay}`}
    >
      {/* Reduced motion keeps the banner but drops the star spray entirely */}
      {!reduced && Array.from({ length: cfg.particles }).map((_, i) => {
        const angle = (i / cfg.particles) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{
              x: Math.cos(angle) * 240,
              y: Math.sin(angle) * 240,
              opacity: 0,
              scale: 1.2,
            }}
            transition={{ duration: cfg.duration / 1000, ease: "easeOut" }}
            className="absolute"
            style={{ color }}
          >
            <Icon name="star" fill size={20} />
          </motion.span>
        );
      })}
      <motion.div
        initial={reduced ? false : { scale: 0.5, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 240 }}
        className={`arcade-box px-8 py-5 ${
          rarity === "currylicious" ? "rarity-curry-surface" : "bg-white"
        }`}
      >
        <span
          className="font-display text-3xl font-black uppercase text-stroke-ink"
          style={{ color: rarity === "currylicious" ? "#fff" : color }}
        >
          {cfg.label}
        </span>
      </motion.div>
    </motion.div>
  );
}
