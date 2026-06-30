import { motion } from "framer-motion";

export interface Float {
  id: number;
  x: number;
  y: number;
  label: string;
}

// A single rising "+value" particle spawned at the cook position.
export function FloatText({ x, y, label }: Omit<Float, "id">) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.9 }}
      animate={{ opacity: 0, y: -72, scale: 1.35 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ left: x, top: y }}
      className="pointer-events-none absolute z-30 -translate-x-1/2 select-none font-display text-2xl font-black text-primary text-stroke-ink"
    >
      {label}
    </motion.div>
  );
}
