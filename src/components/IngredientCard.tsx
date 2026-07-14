import type { AffinityMatrix, Ingredient, IngredientSet } from "../types";
import { FRANCHISE_UPGRADES } from "../engine/franchiseData";
import { affinityRing } from "../lib/affinityUi";
import { Icon } from "./arcade/Icon";
import { PixelIcon } from "./PixelIcon";
import { FLAVOR_META } from "./FlavorTag";

interface Props {
  ingredient: Ingredient;
  inRecipe: boolean;
  locked?: boolean; // franchise set not yet unlocked
  steamLocked?: boolean; // demo build: only in the full game
  slots: (string | null)[];
  hoveredId: string | null;
  matrix: AffinityMatrix;
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
// green (positive affinity) or red (negative).
function auraRing(
  ingredientId: string,
  hoveredId: string | null,
  slots: (string | null)[],
  matrix: AffinityMatrix,
): string {
  if (!hoveredId || hoveredId === ingredientId) return "";
  if (!slots.includes(ingredientId)) return "";
  return affinityRing(matrix[ingredientId]?.[hoveredId] ?? 0);
}

export function IngredientCard({
  ingredient,
  inRecipe,
  locked = false,
  steamLocked = false,
  slots,
  hoveredId,
  matrix,
  onClick,
  onHover,
}: Props) {
  const aura = locked ? "" : auraRing(ingredient.id, hoveredId, slots, matrix);
  const setName = ingredient.set ? SET_NAME[ingredient.set] : undefined;
  const flavor = FLAVOR_META[ingredient.flavor];
  const flavorPip = (
    <span title={`${flavor.label} flavor`} className="absolute left-1.5 top-1.5">
      <Icon name={flavor.icon} fill size={14} className={flavor.text} />
    </span>
  );

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
        {flavorPip}
        <PixelIcon
          id={ingredient.id}
          icon={ingredient.icon}
          size={32}
          className="opacity-50 grayscale"
          iconClassName={ingredient.color}
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
      {flavorPip}
      <PixelIcon id={ingredient.id} icon={ingredient.icon} size={32} iconClassName={ingredient.color} />
      <span className="w-full truncate px-0.5 text-center text-[11px] font-bold leading-tight text-ink">
        {ingredient.name}
      </span>
      <span className="text-[10px] font-bold text-ink/55">+{ingredient.baseValue}</span>
      {inRecipe && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-ink/10 text-[10px] font-extrabold uppercase tracking-wide text-ink">
          In Use
        </span>
      )}
    </button>
  );
}
