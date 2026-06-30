import type { RecipeTier } from "../types";

interface TierMeta {
  label: string;
  stars: string;
  text: string;
  bg: string;
}

export const TIER_META: Record<RecipeTier, TierMeta> = {
  none: { label: "Add ingredients", stars: "", text: "text-ink/50", bg: "bg-cream-100" },
  terrible: { label: "Terrible", stars: "··", text: "text-white", bg: "bg-tier-terrible" },
  neutral: { label: "Neutral", stars: "·", text: "text-white", bg: "bg-tier-neutral" },
  good: { label: "Good", stars: "✦✦✦", text: "text-white", bg: "bg-tier-good" },
  great: { label: "Great", stars: "★★★★", text: "text-white", bg: "bg-tier-great" },
  legendary: { label: "Legendary", stars: "★★★★★", text: "text-white", bg: "bg-tier-legendary" },
};

interface Props {
  tier: RecipeTier;
  multiplier: number;
}

export function AffinityBadge({ tier, multiplier }: Props) {
  const meta = TIER_META[tier];
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border-2 border-ink px-3 py-1 shadow-arcade-sm ${meta.bg} ${meta.text}`}
    >
      {meta.stars && <span className="text-sm">{meta.stars}</span>}
      <span className="font-display text-sm font-extrabold uppercase tracking-wide">
        {meta.label}
      </span>
      {tier !== "none" && (
        <span className="rounded bg-ink/20 px-1.5 py-0.5 font-display text-sm font-extrabold tabular-nums">
          {multiplier.toFixed(2)}×
        </span>
      )}
    </div>
  );
}
