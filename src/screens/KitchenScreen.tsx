import { useMemo, useState, type ReactNode } from "react";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore } from "../hooks/useRecipeScore";
import { getAffinityData } from "../engine/affinityEngine";
import { getDailyCraving } from "../engine/weekEngine";
import { randomNeutralRecipe } from "../engine/recipeEngine";
import { CATEGORIES, INGREDIENT_LIST, INGREDIENTS } from "../engine/ingredients";
import { unlockedIngredientIds } from "../engine/franchiseData";
import { IS_DEMO, DEMO_LOCKED_INGREDIENT_SET } from "../target";
import type { Ingredient } from "../types";
import type { Screen } from "../navigation";
import { AffinityBadge } from "../components/AffinityBadge";
import { FlavorTag } from "../components/FlavorTag";
import { RecipeSlot } from "../components/RecipeSlot";
import { IngredientCard } from "../components/IngredientCard";
import { CookbookModal } from "../components/CookbookModal";
import { Icon } from "../components/arcade/Icon";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";

interface Props {
  onNavigate: (s: Screen) => void;
}

type Filter = "all" | Ingredient["category"];

export function KitchenScreen({ onNavigate }: Props) {
  const slots = useGameStore((s) => s.slots);
  const seed = useGameStore((s) => s.seed);
  const currentDay = useGameStore((s) => s.currentDay);
  const unlockedSlots = useGameStore((s) => s.unlockedSlots);
  const discoveredCount = useGameStore((s) => Object.keys(s.discoveredRecipes).length);
  const franchiseUpgrades = useGameStore((s) => s.franchiseUpgrades);
  const setIngredient = useGameStore((s) => s.setIngredient);
  const toggleIngredient = useGameStore((s) => s.toggleIngredient);
  const setRecipe = useGameStore((s) => s.setRecipe);
  const clearRecipe = useGameStore((s) => s.clearRecipe);

  const score = useRecipeScore();
  const { matrix } = getAffinityData(seed);
  const craving = getDailyCraving(currentDay, seed);

  const [filter, setFilter] = useState<Filter>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cookbookOpen, setCookbookOpen] = useState(false);

  const unlockedIds = useMemo(() => {
    const ids = unlockedIngredientIds(franchiseUpgrades);
    return new Set(
      IS_DEMO ? ids.filter((id) => !DEMO_LOCKED_INGREDIENT_SET.has(id)) : ids,
    );
  }, [franchiseUpgrades]);

  const visible = useMemo(() => {
    const list =
      filter === "all"
        ? INGREDIENT_LIST
        : INGREDIENT_LIST.filter((i) => i.category === filter);
    return [...list].sort(
      (a, b) => Number(!unlockedIds.has(a.id)) - Number(!unlockedIds.has(b.id)),
    );
  }, [filter, unlockedIds]);

  const filledCount = slots.filter(Boolean).length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <PageHeader
        title="Kitchen"
        subtitle="Combine ingredients to discover curry recipes!"
        leading={
          <ArcadeButton size="sm" onClick={() => onNavigate("journal")}>
            <Icon name="science" fill size={18} className="text-primary" />
            <span className="hidden sm:inline">Journal</span>
          </ArcadeButton>
        }
        trailing={
          <ArcadeButton size="sm" onClick={() => setCookbookOpen(true)}>
            <Icon name="menu_book" fill size={18} className="text-primary" />
            <span className="hidden sm:inline">Cookbook</span>
            <span className="rounded border-2 border-ink bg-tertiary-fixed px-1 text-xs font-black">
              {discoveredCount}
            </span>
          </ArcadeButton>
        }
      />

      {/* Crafting station */}
      <ArcadePanel as="section" className="p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {slots.map((id, i) => (
              <RecipeSlot
                key={i}
                index={i}
                ingredientId={id}
                locked={i >= unlockedSlots}
                hoveredId={hoveredId}
                matrix={matrix}
                onClick={() => id && setIngredient(i, null)}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <AffinityBadge tier={score.tier} multiplier={score.multiplier} />
              <FlavorTag flavor={score.flavor} craving={craving} tier={score.tier} />
            </div>
            <div className="flex gap-2">
              <ArcadeButton
                size="sm"
                onClick={() =>
                  setRecipe(randomNeutralRecipe([...unlockedIds], unlockedSlots, matrix))
                }
              >
                <Icon name="casino" size={18} />
                Random
              </ArcadeButton>
              <ArcadeButton size="sm" onClick={clearRecipe} disabled={filledCount === 0}>
                <Icon name="delete" size={18} />
                Clear
              </ArcadeButton>
              <ArcadeButton
                variant="primary"
                className="text-sm"
                onClick={() => onNavigate("gameplay")}
                disabled={filledCount === 0}
              >
                <Icon name="local_fire_department" fill size={18} />
                Cook It
              </ArcadeButton>
            </div>
          </div>
        </div>
        {/* Reserve the line's height always so hovering doesn't shift the pantry. */}
        <p
          className={`mt-3 min-h-4 text-center text-xs font-semibold text-ink/55 transition-opacity ${
            hoveredId && filledCount > 0 ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!(hoveredId && filledCount > 0)}
        >
          {hoveredId && filledCount > 0
            ? `Glowing slots show how ${INGREDIENTS[hoveredId]?.name} pairs with your recipe`
            : " "}
        </p>
      </ArcadePanel>

      {/* Pantry */}
      <section>
        <div className="mb-3 flex items-end justify-between border-b-4 border-ink pb-1">
          <h2 className="font-display text-xl font-black uppercase text-ink">Pantry</h2>
          <span className="rounded border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold text-ink/60">
            {unlockedIds.size} Items
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterTab>
          {CATEGORIES.map((c) => (
            <FilterTab
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </FilterTab>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {visible.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              inRecipe={slots.includes(ingredient.id)}
              locked={!unlockedIds.has(ingredient.id)}
              steamLocked={IS_DEMO && !unlockedIds.has(ingredient.id)}
              slots={slots}
              hoveredId={hoveredId}
              matrix={matrix}
              onClick={() => {
                if (unlockedIds.has(ingredient.id)) toggleIngredient(ingredient.id);
              }}
              onHover={setHoveredId}
            />
          ))}
        </div>
      </section>

      {cookbookOpen && <CookbookModal onClose={() => setCookbookOpen(false)} />}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all ${
        active ? "bg-primary text-white shadow-arcade-sm" : "bg-white text-ink/65"
      }`}
    >
      {children}
    </button>
  );
}
