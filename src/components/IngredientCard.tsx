import type { AffinityMatrix, Ingredient, IngredientSet } from "../types";
import { FRANCHISE_UPGRADES } from "../engine/franchiseData";
import { Icon } from "./arcade/Icon";

interface Props {
  ingredient: Ingredient;
  inRecipe: boolean;
  locked?: boolean; // franchise set not yet unlocked
  steamLocked?: boolean; // demo build: only in the full game
  slots: (string | null)[];
  hoveredId: string | null;
  matrix: AffinityMatrix;
  lens?: boolean; // Affinity Lens upgrade: show exact pair affinity on hover
  onClick: () => void;
  onHover: (id: string | null) => void;
}

const SET_NAME: Partial<Record<IngredientSet, string>> = Object.fromEntries(
  FRANCHISE_UPGRADES.flatMap((u) =>
    u.effect.type === "ingredient_set" ? [[u.effect.set, u.name]] : [],
  ),
);

const RARITY_DOT: Record<Ingredient["rarity"], string> = {
  common: "bg-rarity-common",
  uncommon: "bg-rarity-uncommon",
  rare: "bg-rarity-rare",
};

// Hot/Cold aura: when a pantry card is hovered, cards already IN the recipe glow
// green (positive affinity) or red (negative). Direction only — exact values are
// a Phase-2 "Affinity Lens" upgrade.
function auraRing(
  ingredientId: string,
  hoveredId: string | null,
  slots: (string | null)[],
  matrix: AffinityMatrix,
): string {
  if (!hoveredId || hoveredId === ingredientId) return "";
  if (!slots.includes(ingredientId)) return "";
  const affinity = matrix[ingredientId]?.[hoveredId] ?? 0;
  if (affinity > 0.5) return "ring-4 ring-tier-good";
  if (affinity > 0) return "ring-2 ring-tier-good/60";
  if (affinity < -0.3) return "ring-4 ring-tier-terrible";
  return "ring-2 ring-ink/15";
}

export function IngredientCard({
  ingredient,
  inRecipe,
  locked = false,
  steamLocked = false,
  slots,
  hoveredId,
  matrix,
  lens = false,
  onClick,
  onHover,
}: Props) {
  const aura = locked ? "" : auraRing(ingredient.id, hoveredId, slots, matrix);
  const setName = ingredient.set ? SET_NAME[ingredient.set] : undefined;

  if (locked) {
    return (
      <div
        title={
          steamLocked
            ? "Locked — available in the full game on Steam"
            : setName
              ? `Locked — unlock with the ${setName} (Franchise)`
              : "Locked"
        }
        className="relative flex aspect-square cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border-4 border-dashed border-ink/40 bg-cream-50 p-1.5 opacity-70"
      >
        <Icon
          name={ingredient.icon}
          className={`${ingredient.color} opacity-50 grayscale`}
          fill
          size={30}
        />
        <span className="w-full truncate px-0.5 text-center text-[11px] font-bold leading-tight text-ink/50">
          {ingredient.name}
        </span>
        <span className="flex items-center gap-0.5 text-[9px] font-black uppercase leading-tight text-ink/50">
          <Icon name="lock" fill size={10} />
          {steamLocked ? "Steam" : (setName ?? "Locked")}
        </span>
      </div>
    );
  }

  // Affinity Lens: exact pair value shown on an in-recipe card while hovering
  // another pantry item.
  const lensValue =
    lens && hoveredId && hoveredId !== ingredient.id && slots.includes(ingredient.id)
      ? (matrix[ingredient.id]?.[hoveredId] ?? 0)
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={() => onHover(ingredient.id)}
      onPointerLeave={() => onHover(null)}
      title={ingredient.description}
      className={`arcade-btn relative flex aspect-square flex-col items-center justify-center gap-1 p-1.5 ${
        inRecipe ? "bg-primary/15" : "bg-white"
      } ${aura}`}
    >
      <span
        className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-ink ${RARITY_DOT[ingredient.rarity]}`}
      />
      <Icon name={ingredient.icon} className={ingredient.color} fill size={30} />
      <span className="w-full truncate px-0.5 text-center text-[11px] font-bold leading-tight text-ink">
        {ingredient.name}
      </span>
      <span className="text-[10px] font-bold text-ink/55">+{ingredient.baseValue}</span>
      {inRecipe && lensValue === null && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-ink/10 text-[10px] font-extrabold uppercase tracking-wide text-ink">
          In Use
        </span>
      )}
      {lensValue !== null && (
        <span
          className={`absolute inset-x-1 bottom-1 z-10 rounded border border-ink px-1 py-0.5 text-center text-[11px] font-black tabular-nums ${
            lensValue > 0 ? "bg-tier-good text-ink" : lensValue < 0 ? "bg-tier-terrible text-white" : "bg-white text-ink"
          }`}
        >
          {lensValue > 0 ? "+" : ""}
          {lensValue.toFixed(2)}
        </span>
      )}
    </button>
  );
}
