export interface Float {
  id: number;
  x: number;
  y: number;
  label: string;
  // Continuous burst power (ClickBurst rides it); FloatText clamps to its three
  // importance tiers: 0 routine, 1 crit/crazy, 2 jackpot.
  power?: number;
}

// Bigger moments get bigger, brighter, longer-lived numbers.
const POWER_CLASS = [
  "float-rise text-2xl text-primary",
  "float-rise text-4xl text-curry-yellow",
  "float-rise float-huge text-5xl text-white",
] as const;

// A single rising "+value" particle spawned at the cook position. Pure CSS
// (.float-rise in index.css), same compositor-only approach as ClickBurst.
export function FloatText({ x, y, label, power = 0 }: Omit<Float, "id">) {
  const tier = Math.max(0, Math.min(2, Math.round(power))) as 0 | 1 | 2;
  return (
    <div
      style={{ left: x, top: y }}
      className={`pointer-events-none absolute z-30 select-none font-display font-black text-stroke-ink ${POWER_CLASS[tier]}`}
    >
      {label}
    </div>
  );
}
