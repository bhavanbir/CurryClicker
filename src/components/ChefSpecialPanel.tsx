import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { getDailySpecial } from "../engine/weekEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { Icon } from "./arcade/Icon";
import { PixelIcon } from "./PixelIcon";

// Chef's Special as a vertical card hugging the left edge (the right edge
// belongs to the Shop handle/drawer) — big ingredient sprites instead of the
// old text pills. Always visible on xl+ screens; between md and xl it folds
// into a left edge tab (mirroring the shop handle) so it never covers the
// scene. On mobile the special is discoverable from the Kitchen.
export function ChefSpecialPanel() {
  const currentDay = useGameStore((s) => s.currentDay);
  const seed = useGameStore((s) => s.seed);
  const slots = useGameStore((s) => s.slots);
  const claimDays = useGameStore((s) => s.specialClaimDays);
  const clearRecipe = useGameStore((s) => s.clearRecipe);
  const toggleIngredient = useGameStore((s) => s.toggleIngredient);
  const [expanded, setExpanded] = useState(false);

  const special = getDailySpecial(currentDay, seed);
  const a = INGREDIENTS[special.ingredientA];
  const b = INGREDIENTS[special.ingredientB];
  if (!a || !b) return null;

  const bothActive =
    slots.includes(special.ingredientA) && slots.includes(special.ingredientB);
  const claimed = claimDays.includes(currentDay);

  // Swap the whole recipe for the special's pair — clearRecipe first so both
  // toggles always land in free slots.
  function mixIn() {
    clearRecipe();
    toggleIngredient(special.ingredientA);
    toggleIngredient(special.ingredientB);
  }

  const card = (
    <div className="arcade-box relative flex flex-col items-center gap-2 p-3 shadow-arcade">
      {/* Close (collapse back to the edge tab) — only shown below xl */}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        aria-label="Collapse chef's special"
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 border-ink bg-white text-ink shadow-arcade-sm xl:hidden"
      >
        <Icon name="close" size={14} />
      </button>
      <div className="flex items-center gap-1">
        <Icon name="star" fill size={14} className="text-primary" />
        <span className="font-display text-[10px] font-black uppercase tracking-wide text-ink">
          Chef's Special
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <SpecialSprite id={special.ingredientA} icon={a.icon} color={a.color} name={a.name} />
        <Icon name="add" size={16} className="text-ink/50" />
        <SpecialSprite id={special.ingredientB} icon={b.icon} color={b.color} name={b.name} />
      </div>

      <span className="rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-black text-primary">
        ×2
      </span>

      {claimed ? (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-ink">
          <Icon name="check_circle" fill size={14} /> Claimed
        </span>
      ) : bothActive ? (
        <span className="flex items-center gap-1 rounded border-2 border-ink bg-primary px-2 py-1 text-[10px] font-black uppercase text-white">
          <Icon name="check" size={12} /> In recipe
        </span>
      ) : (
        <motion.button
          type="button"
          onClick={mixIn}
          whileTap={{ scale: 0.95 }}
          className="arcade-btn w-full bg-primary px-2 py-1.5 text-[10px] uppercase text-white"
        >
          Mix it in
        </motion.button>
      )}
    </div>
  );

  return (
    <>
      {/* Wide screens: always-visible floating panel */}
      <aside className="fixed left-3 top-24 z-30 hidden w-[124px] flex-col xl:flex">
        {card}
      </aside>

      {/* md–xl: edge tab that expands the same card in place */}
      {expanded ? (
        <aside className="fixed left-3 top-24 z-30 hidden w-[124px] flex-col md:flex xl:hidden">
          {card}
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Show chef's special"
          className="fixed left-0 top-24 z-30 hidden flex-col items-center gap-1.5 rounded-r-lg border-4 border-l-0 border-ink bg-primary px-1.5 py-4 text-white shadow-arcade transition-transform hover:translate-x-0.5 md:flex xl:hidden"
        >
          <Icon name="star" fill size={22} />
          <span className="text-xs font-black uppercase tracking-widest [writing-mode:vertical-rl]">
            Special
          </span>
        </button>
      )}
    </>
  );
}

function SpecialSprite({
  id,
  icon,
  color,
  name,
}: {
  id: string;
  icon: string;
  color: string;
  name: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-lg border-2 border-ink bg-white">
        <PixelIcon id={id} icon={icon} size={64} iconClassName={color} />
      </span>
      <span className="max-w-[100px] truncate text-[10px] font-bold text-ink">{name}</span>
    </div>
  );
}
