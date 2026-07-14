import { useMemo } from "react";

// One-shot spice burst at the click point. Pure CSS animations (see
// .spice-particle/.spice-ring in index.css) so rapid clicking stays on the
// compositor. Parent removes it together with its FloatText after 800ms; the
// animation ends at opacity 0 by 450ms, so no cleanup of its own is needed.

// Palette rotates per burst (keyed by tint) so mashing keeps serving fresh
// colors instead of the same three.
const PALETTES = [
  ["bg-primary", "bg-tertiary", "bg-red-500"],
  ["bg-curry-yellow", "bg-curry-orange", "bg-primary"],
  ["bg-flavor-unique", "bg-red-500", "bg-curry-yellow"],
  ["bg-buy", "bg-tertiary", "bg-curry-orange"],
];

// power scales the burst to the moment: 0 routine cook, 1 crit, 2 jackpot.
export function ClickBurst({
  x,
  y,
  power = 0,
  tint = 0,
}: {
  x: number;
  y: number;
  power?: 0 | 1 | 2;
  tint?: number;
}) {
  const particles = useMemo(() => {
    const colors = PALETTES[tint % PALETTES.length];
    const count = 7 + power * 4;
    const reach = 1 + power * 0.5;
    return Array.from({ length: count }, (_, i) => {
      const a = (((i * 360) / count + Math.random() * 30 - 15) * Math.PI) / 180;
      const dist = (34 + Math.random() * 22) * reach;
      return {
        dx: Math.cos(a) * dist,
        dy: Math.sin(a) * dist,
        color: colors[i % colors.length],
      };
    });
  }, [power, tint]);

  const ringSize = power === 2 ? "h-16 w-16" : power === 1 ? "h-12 w-12" : "h-10 w-10";
  const dotSize = power === 2 ? "h-3 w-3" : "h-2 w-2";

  return (
    <div className="pointer-events-none absolute z-20" style={{ left: x, top: y }}>
      <span
        className={`spice-ring absolute ${ringSize} rounded-full border-4 border-ink/70`}
      />
      {particles.map((p, i) => (
        <span
          key={i}
          className={`spice-particle absolute ${dotSize} -translate-x-1/2 -translate-y-1/2 rounded-[1px] ${p.color}`}
          style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
