import { useMemo } from "react";

// One-shot spice burst at the click point. Pure CSS animations (see
// .spice-particle/.spice-ring in index.css) so rapid clicking stays on the
// compositor. Parent removes it together with its FloatText after 800ms; the
// animation ends at opacity 0 by 450ms, so no cleanup of its own is needed.

const COLORS = ["bg-primary", "bg-tertiary", "bg-red-500"];
const BASE_ANGLES = [0, 51, 103, 154, 206, 257, 309]; // 7 spokes

export function ClickBurst({ x, y }: { x: number; y: number }) {
  const particles = useMemo(
    () =>
      BASE_ANGLES.map((deg, i) => {
        const a = ((deg + Math.random() * 30 - 15) * Math.PI) / 180;
        const dist = 34 + Math.random() * 22;
        return {
          dx: Math.cos(a) * dist,
          dy: Math.sin(a) * dist,
          color: COLORS[i % COLORS.length],
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute z-20" style={{ left: x, top: y }}>
      <span className="spice-ring absolute h-10 w-10 rounded-full border-4 border-ink/70" />
      {particles.map((p, i) => (
        <span
          key={i}
          className={`spice-particle absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[1px] ${p.color}`}
          style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
