import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { INGREDIENTS } from "../engine/ingredients";
import { suggestRecipeName } from "../engine/cookbook";
import { AffinityBadge } from "./AffinityBadge";
import { Icon } from "./arcade/Icon";
import { PixelIcon } from "./PixelIcon";

// Naming Ceremony (framework §15.2). Fires once when a new great/legendary
// recipe is first cooked. Accept the suggested name or type your own; skipping
// leaves the recipe "Unnamed" in the Cookbook.
export function RecipeNamingModal({
  fingerprint,
  onClose,
}: {
  fingerprint: string;
  onClose: () => void;
}) {
  const recipe = useGameStore((s) => s.discoveredRecipes[fingerprint]);
  const nameRecipe = useGameStore((s) => s.nameRecipe);
  const [name, setName] = useState(() => suggestRecipeName(fingerprint));

  if (!recipe) return null;

  function confirm() {
    const trimmed = name.trim();
    if (trimmed) nameRecipe(fingerprint, trimmed);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-sm p-6"
      >
        <div className="flex flex-col items-center text-center">
          <span className="font-display text-xs font-black uppercase tracking-widest text-primary">
            New recipe discovered!
          </span>
          <div className="mt-2">
            <AffinityBadge tier={recipe.tier} multiplier={recipe.multiplier} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
            {recipe.ingredientIds.map((id) => {
              const ing = INGREDIENTS[id];
              if (!ing) return null;
              return (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-bold text-ink"
                >
                  <PixelIcon id={ing.id} icon={ing.icon} size={14} iconClassName={ing.color} />
                  {ing.name}
                </span>
              );
            })}
          </div>
        </div>

        <label className="mt-5 block text-xs font-black uppercase tracking-wide text-ink/60">
          Name your creation
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            className="w-full rounded-md border-4 border-ink bg-cream-50 px-3 py-2 font-display text-lg font-extrabold text-ink outline-none focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setName(suggestRecipeName(`${fingerprint}-${Math.floor(name.length)}`))}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-4 border-ink bg-tertiary-fixed"
            aria-label="Suggest another name"
            title="Suggest another"
          >
            <Icon name="casino" size={20} className="text-primary" />
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="arcade-btn flex-1 bg-white py-2.5 uppercase text-ink"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={confirm}
            className="arcade-btn flex-[2] bg-primary py-2.5 uppercase text-white"
          >
            <Icon name="check" size={20} /> Name it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
