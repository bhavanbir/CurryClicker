import { useMemo } from "react";

// One-shot spice burst at the click point. Pure CSS animations (see
// .spice-particle*/.spice-ring/.burst-core in index.css) so rapid clicking
// stays on the compositor. The parent removes the whole node after the
// animation window; nothing here needs cleanup of its own.

// Palette rotates per burst (keyed by tint) so mashing keeps serving fresh
// colors instead of the same three.
const PALETTES = [
  ["bg-primary", "bg-tertiary", "bg-red-500"],
  ["bg-curry-yellow", "bg-curry-orange", "bg-primary"],
  ["bg-flavor-unique", "bg-red-500", "bg-curry-yellow"],
  ["bg-buy", "bg-tertiary", "bg-curry-orange"],
];

// Explosions get the whole crayon box — gold core colors plus every accent.
const BIG_PALETTE = [
  "bg-curry-yellow",
  "bg-primary",
  "bg-red-500",
  "bg-rarity-rare",
  "bg-rarity-uncommon",
  "bg-rarity-epic",
  "bg-buy",
  "bg-white",
  "bg-curry-orange",
  "bg-rarity-curry",
];

// `power` is continuous (~0 routine cook … 2.4 for a ×100 jackpot, ~3 for a
// Currylicious gacha pull): particle count, reach, dot size and ring scale all
// ride it. At >= 1.5 the burst switches to explosion mode — ink-outlined
// confetti in the full palette, a white-hot core flash, and a spray wide
// enough that the top end escapes the scene frame entirely.
export function ClickBurst({
  x,
  y,
  power = 0,
  tint = 0,
}: {
  x: number;
  y: number;
  power?: number;
  tint?: number;
}) {
  const p = Math.min(3, Math.max(0, power));
  const big = p >= 1.5;

  const particles = useMemo(() => {
    const colors = big ? BIG_PALETTE : PALETTES[tint % PALETTES.length];
    const count = big
      ? Math.min(90, Math.round(24 + p * 22))
      : Math.min(20, Math.round(7 + p * 9));
    // Explosion reach: ~200px at the floor, ~450px+ at the top end — the
    // frame is ~400px tall, so jackpots visibly rain past its edges.
    const reach = big ? 1 + p * 1.5 : 1 + p * 0.6;
    const base = big ? 55 : 34;
    return Array.from({ length: count }, (_, i) => {
      const sparkle = big && i % 4 === 0; // slow white/gold drifters
      const a = (((i * 360) / count + Math.random() * 30 - 15) * Math.PI) / 180;
      const dist = (base + Math.random() * 30) * reach * (sparkle ? 0.55 : 1);
      return {
        dx: Math.cos(a) * dist,
        dy: Math.sin(a) * dist,
        color: sparkle
          ? i % 8 === 0
            ? "bg-white"
            : "bg-curry-yellow"
          : colors[i % colors.length],
        sizeMul: sparkle ? 0.5 : 0.7 + Math.random() * 0.6,
        round: Math.random() < 0.35,
        dur: big ? 0.65 + Math.random() * 0.45 + (sparkle ? 0.35 : 0) : 0.45,
        delay: sparkle ? 0.08 + Math.random() * 0.15 : 0,
        rot: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360),
      };
    });
  }, [p, tint, big]);

  const dot = big ? 11 + p * 6 : 8 + p * 3;
  const ringScale = big ? 1.4 + p * 3 : 1.4 + p * 1.1;

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: x, top: y, "--ring-scale": ringScale } as React.CSSProperties}
    >
      {/* white-hot flash at the impact point — explosions only */}
      {big && (
        <span
          className="burst-core absolute left-0 top-0 rounded-full bg-white"
          style={{
            width: 26 + p * 18,
            height: 26 + p * 18,
            boxShadow:
              "0 0 24px 10px rgb(var(--curry-yellow, 255 200 60) / 0.9)",
            "--core-scale": 1.8 + p,
          } as React.CSSProperties}
        />
      )}
      <span className="spice-ring absolute h-10 w-10 rounded-full border-4 border-ink/70" />
      {/* second, slower ring: the shockwave only the big hits earn */}
      {p >= 1.2 && (
        <span
          className="spice-shock absolute h-10 w-10 rounded-full border-4 border-ink/40"
          style={{ "--ring-scale": ringScale * 1.5 } as React.CSSProperties}
        />
      )}
      {particles.map((pt, i) => (
        <span
          key={i}
          className={`${big ? "spice-particle-big border-2 border-ink" : "spice-particle"} absolute -translate-x-1/2 -translate-y-1/2 ${
            pt.round ? "rounded-full" : "rounded-[1px]"
          } ${pt.color}`}
          style={
            {
              width: Math.round(dot * pt.sizeMul),
              height: Math.round(dot * pt.sizeMul),
              "--dx": `${pt.dx}px`,
              "--dy": `${pt.dy}px`,
              "--rot": `${pt.rot}deg`,
              "--dur": `${pt.dur}s`,
              "--delay": `${pt.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
