import { CRAVING_MATCH_BONUS } from "../engine/recipeEngine";
import type { Flavor, RecipeTier } from "../types";
import { Icon } from "./arcade/Icon";

interface FlavorMeta {
  label: string;
  icon: string;
  text: string;
}

export const FLAVOR_META: Record<Flavor, FlavorMeta> = {
  spicy: { label: "Spicy", icon: "local_fire_department", text: "text-flavor-spicy" },
  mild: { label: "Mild", icon: "air", text: "text-flavor-mild" },
  sweet: { label: "Sweet", icon: "cake", text: "text-flavor-sweet" },
  savory: { label: "Savory", icon: "ramen_dining", text: "text-flavor-savory" },
  unique: { label: "Unique", icon: "auto_awesome", text: "text-flavor-unique" },
};

interface FlavorTagProps {
  flavor: Flavor | null;
  craving: Flavor;
  tier: RecipeTier;
}

// Compact live indicator for the active-recipe bar (Gameplay) and the crafting
// station (Kitchen): the recipe's flavour vs. today's craving.
export function FlavorTag({ flavor, craving, tier }: FlavorTagProps) {
  const cravingMeta = FLAVOR_META[craving];

  if (!flavor) {
    return (
      <span
        title={`The town craves ${cravingMeta.label} today`}
        className="inline-flex items-center gap-1 rounded-lg border-2 border-dashed border-ink/40 bg-white px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink/50"
      >
        Craves
        <Icon name={cravingMeta.icon} className={cravingMeta.text} fill size={14} />
        {cravingMeta.label}
      </span>
    );
  }

  const meta = FLAVOR_META[flavor];
  const matched = flavor === craving;
  const capped = !matched && tier === "legendary";

  return (
    <span
      title={
        matched
          ? `Matches today's craving (×${CRAVING_MATCH_BONUS})`
          : capped
            ? `Off-craving legendary caps at Great — the town craves ${cravingMeta.label}`
            : `The town craves ${cravingMeta.label} today`
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-ink px-2 py-1 text-xs font-black uppercase tracking-wide text-ink shadow-arcade-sm ${
        matched ? "bg-buy" : "bg-white"
      }`}
    >
      <Icon name={meta.icon} className={meta.text} fill size={14} />
      {meta.label}
      {matched ? (
        <Icon name="check" size={14} />
      ) : capped ? (
        <Icon name="south" size={14} className="text-tier-great" />
      ) : null}
    </span>
  );
}
