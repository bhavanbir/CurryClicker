import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { INGREDIENTS } from "../engine/ingredients";
import type { DiscoveredRecipe, RecipeTier } from "../types";
import { Icon } from "./arcade/Icon";

// Cookbook (framework §11.3). Every recipe tried this week, grouped by tier.
const TIER_META: Record<RecipeTier, { label: string; badge: string }> = {
  legendary: { label: "Legendary", badge: "bg-tertiary text-ink" },
  great: { label: "Great", badge: "bg-primary text-white" },
  good: { label: "Good", badge: "bg-buy text-ink" },
  neutral: { label: "Neutral", badge: "bg-cream-200 text-ink" },
  terrible: { label: "Terrible", badge: "bg-stone-300 text-ink" },
  none: { label: "—", badge: "bg-cream-200 text-ink" },
};

const GROUP_ORDER: RecipeTier[] = [
  "legendary",
  "great",
  "good",
  "neutral",
  "terrible",
];

export function CookbookModal({ onClose }: { onClose: () => void }) {
  const weekId = useGameStore((s) => s.weekId);
  const recipes = useGameStore((s) => s.discoveredRecipes);

  const all = Object.values(recipes);
  const grouped = GROUP_ORDER.map((tier) => ({
    tier,
    items: all
      .filter((r) => r.tier === tier)
      .sort((a, b) => b.multiplier - a.multiplier),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="arcade-box flex max-h-[85vh] w-full max-w-md flex-col p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="menu_book" fill size={26} className="text-primary" />
            <h2 className="font-display text-2xl font-black uppercase text-ink">
              Cookbook
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink bg-white"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mt-1 text-xs font-bold text-ink/50">
          {all.length} discovered · {weekId}
        </p>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {grouped.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-ink/50">
              <Icon name="restaurant" size={36} />
              <p className="text-sm font-semibold">
                No recipes yet — cook something in the Kitchen!
              </p>
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.tier}>
              <span
                className={`inline-block rounded border-2 border-ink px-2 py-0.5 text-xs font-black uppercase ${TIER_META[g.tier].badge}`}
              >
                {TIER_META[g.tier].label}
              </span>
              <div className="mt-2 space-y-2">
                {g.items.map((r) => (
                  <RecipeRow key={r.fingerprint} recipe={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function RecipeRow({ recipe }: { recipe: DiscoveredRecipe }) {
  return (
    <div className="rounded-md border-2 border-ink bg-white p-2">
      <div className="flex items-center justify-between">
        <span
          className={`font-display text-sm font-extrabold ${recipe.name ? "text-primary" : "text-ink/50"}`}
        >
          {recipe.name ?? "Unnamed"}
        </span>
        <span className="font-display text-sm font-black tabular-nums text-ink">
          {recipe.multiplier.toFixed(2)}×
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {recipe.ingredientIds.map((id) => {
          const ing = INGREDIENTS[id];
          if (!ing) return null;
          return (
            <span
              key={id}
              className="flex items-center gap-1 rounded border border-ink/30 bg-cream-50 px-1 py-0.5 text-[10px] font-bold text-ink/70"
            >
              <Icon name={ing.icon} className={ing.color} fill size={12} />
              {ing.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
