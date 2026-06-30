import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore, useEffects } from "../hooks/useRecipeScore";
import { getAffinityData } from "../engine/affinityEngine";
import { handleClick, type ClickMods } from "../engine/clickEngine";
import { getDailySpecial } from "../engine/weekEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { formatCurry } from "../lib/format";
import type { Screen } from "../navigation";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { DayProgressBar } from "../components/DayProgressBar";
import { AffinityBadge } from "../components/AffinityBadge";
import { RestaurantScene } from "../scene/RestaurantScene";
import { FloatText, type Float } from "../components/FloatText";
import { DailySpecialBanner } from "../components/DailySpecialBanner";
import { RecipeNamingModal } from "../components/RecipeNamingModal";
import { StatChip } from "../components/arcade/StatChip";
import { Icon } from "../components/arcade/Icon";

interface Props {
  onNavigate: (s: Screen) => void;
}

let floatId = 0;

export function GameplayScreen({ onNavigate }: Props) {
  const slots = useGameStore((s) => s.slots);
  const seed = useGameStore((s) => s.seed);
  const currentDay = useGameStore((s) => s.currentDay);
  const streakDays = useGameStore((s) => s.recipeStreakDays);
  const streakMult = useGameStore((s) => s.recipeStreakMultiplier);
  const addCurry = useGameStore((s) => s.addCurry);
  const registerClick = useGameStore((s) => s.registerClick);
  const claimSpecial = useGameStore((s) => s.claimSpecial);
  const logCook = useGameStore((s) => s.logCook);

  const score = useRecipeScore();
  const effects = useEffects();
  const [floats, setFloats] = useState<Float[]>([]);
  const [cookSignal, setCookSignal] = useState(0);
  const [namingFp, setNamingFp] = useState<string | null>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);

  const filled = slots.filter(Boolean) as string[];
  const hasRecipe = filled.length > 0;

  const special = getDailySpecial(currentDay, seed);
  const specialActive =
    slots.includes(special.ingredientA) && slots.includes(special.ingredientB);
  const mods: ClickMods = {
    specialMultiplier: specialActive ? special.bonusMultiplier : 1,
    streakMultiplier: streakMult,
  };

  const perCook = handleClick(slots, getAffinityData(seed).matrix, effects, mods).value;

  function cook(x: number, y: number) {
    if (!hasRecipe) return;
    const { value, floatLabel, isSpecial } = handleClick(
      slots,
      getAffinityData(seed).matrix,
      effects,
      mods,
    );
    if (value.lte(0)) return;

    addCurry(value);
    registerClick();
    if (isSpecial) claimSpecial(currentDay);
    const outcome = logCook(slots);
    if (outcome.needsNaming) setNamingFp(outcome.fingerprint);
    setCookSignal((n) => n + 1);

    const id = floatId++;
    const label = isSpecial ? `${floatLabel} ×2!` : floatLabel;
    setFloats((f) => [...f, { id, x, y, label }]);
    window.setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 800);
  }

  function cookFromButton() {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    if (rect) cook(rect.width / 2, rect.height * 0.45);
    else cook(0, 0);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <StatChip icon="calendar_today" label="Day" value={`${currentDay}/7`} />
        <ScoreDisplay />
        {streakDays >= 2 ? (
          <StatChip icon="whatshot" label="Streak" value={`${streakMult.toFixed(2)}×`} />
        ) : (
          <div className="w-[88px]" />
        )}
      </div>

      <DayProgressBar />

      <DailySpecialBanner onMixIn={() => onNavigate("kitchen")} />

      {/* Restaurant scene + floats */}
      <div ref={sceneWrapRef} className="relative">
        <RestaurantScene cookSignal={cookSignal} onCook={cook} busy={hasRecipe} />
        <AnimatePresence>
          {floats.map((f) => (
            <FloatText key={f.id} x={f.x} y={f.y} label={f.label} />
          ))}
        </AnimatePresence>
      </div>

      {/* Active recipe bar */}
      <div className="arcade-box flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        {hasRecipe ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {filled.map((id, i) => (
                  <span
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink bg-white"
                  >
                    <Icon name={INGREDIENTS[id].icon} className={INGREDIENTS[id].color} fill size={20} />
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => onNavigate("kitchen")}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border-2 border-dashed border-ink/40 text-ink/40"
                  aria-label="Edit recipe"
                >
                  <Icon name="edit" size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <AffinityBadge tier={score.tier} multiplier={score.multiplier} />
                <span className="text-sm font-bold text-ink/60">
                  +{formatCurry(perCook)} / cook
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
            <Icon name="info" className="text-primary" size={20} />
            No recipe yet — open the Kitchen to cook one up!
          </div>
        )}

        {/* COOK button */}
        <button
          type="button"
          onClick={hasRecipe ? cookFromButton : () => onNavigate("kitchen")}
          className={`arcade-btn flex items-center justify-center gap-2 px-8 py-4 font-display text-2xl uppercase text-white ${
            hasRecipe ? "bg-primary" : "bg-tertiary text-ink"
          }`}
        >
          {hasRecipe ? (
            <>
              <Icon name="local_fire_department" fill size={28} />
              Cook!
            </>
          ) : (
            <>
              <Icon name="skillet" fill size={26} />
              Open Kitchen
            </>
          )}
        </button>
      </div>

      {namingFp && (
        <RecipeNamingModal fingerprint={namingFp} onClose={() => setNamingFp(null)} />
      )}
    </div>
  );
}
