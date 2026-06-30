import { INGREDIENTS } from "../engine/ingredients";
import { Icon } from "./arcade/Icon";

interface Props {
  index: number; // 0-based slot index (shown as 1-based)
  ingredientId: string | null;
  locked?: boolean;
  onClick?: () => void;
}

// One numbered slot in the crafting station. Tap a filled slot to remove it.
export function RecipeSlot({ index, ingredientId, locked, onClick }: Props) {
  const ingredient = ingredientId ? INGREDIENTS[ingredientId] : null;

  if (locked) {
    return (
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md border-4 border-dashed border-ink/30 bg-cream-100 text-ink/30 md:h-[88px] md:w-[88px]">
        <Icon name="lock" size={26} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-[72px] w-[72px] flex-col items-center justify-center rounded-md border-4 border-ink shadow-arcade-sm transition-all md:h-[88px] md:w-[88px] ${
        ingredient ? "bg-white" : "border-dashed bg-cream-100"
      }`}
      title={ingredient ? `Remove ${ingredient.name}` : "Empty slot"}
    >
      <span className="absolute left-1 top-1 text-[10px] font-bold text-ink/40">
        {index + 1}
      </span>
      {ingredient ? (
        <>
          <Icon name={ingredient.icon} className={ingredient.color} fill size={34} />
          <span className="mt-0.5 max-w-full truncate px-1 text-[10px] font-bold text-ink">
            {ingredient.name}
          </span>
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-tier-terrible text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="close" size={14} />
          </span>
        </>
      ) : (
        <Icon name="add" className="text-ink/30" size={26} />
      )}
    </button>
  );
}
