import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore, useEffects } from "../hooks/useRecipeScore";
import { getAffinityData } from "../engine/affinityEngine";
import { handleClick, type ClickMods } from "../engine/clickEngine";
import { getDailySpecial, getDailyCraving } from "../engine/weekEngine";
import { INGREDIENTS } from "../engine/ingredients";
import { formatCurry } from "../lib/format";
import { playCook } from "../lib/sfx";
import type { Screen } from "../navigation";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { DayProgressBar } from "../components/DayProgressBar";
import { AffinityBadge } from "../components/AffinityBadge";
import { RestaurantScene } from "../scene/RestaurantScene";
import { FloatText, type Float } from "../components/FloatText";
import { ClickBurst } from "../components/ClickBurst";
import { PixelIcon } from "../components/PixelIcon";
import { TodayStrip } from "../components/TodayStrip";
import { FlavorTag } from "../components/FlavorTag";
import { RecipeNamingModal } from "../components/RecipeNamingModal";
import { StatChip } from "../components/arcade/StatChip";
import { Icon } from "../components/arcade/Icon";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { IS_DEMO } from "../target";
import { SteamCta } from "../components/SteamCta";
import { useCrazyCurry } from "../hooks/useCrazyCurry";

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
  const dayStarted = useGameStore((s) => s.dayStarted);
  const startDay = useGameStore((s) => s.startDay);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const totalCurryAllTime = useGameStore((s) => s.totalCurryAllTime);
  const highestTierSeen = useGameStore((s) => s.highestTierSeen);
  const lastWeekStars = useGameStore((s) => s.lastWeekStars);
  const franchiseStarsEarned = useGameStore((s) => s.franchiseStarsEarned);

  const demoEnded = IS_DEMO && weeksCompleted >= 1;

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
  const craving = getDailyCraving(currentDay, seed);
  const mods: ClickMods = {
    specialMultiplier: specialActive ? special.bonusMultiplier : 1,
    streakMultiplier: streakMult,
    craving,
  };

  const perCook = handleClick(slots, getAffinityData(seed).matrix, effects, mods).value;

  const crazy = useCrazyCurry(hasRecipe && dayStarted && !demoEnded);

  function cook(x: number, y: number) {
    if (!hasRecipe || !dayStarted) return; // shop is closed until the day opens
    const result = handleClick(slots, getAffinityData(seed).matrix, effects, mods);
    if (result.value.lte(0)) return;

    const crazyMult = crazy.registerCook();
    const value = crazyMult > 1 ? result.value.mul(crazyMult) : result.value;

    addCurry(value);
    registerClick();
    playCook();
    if (result.isSpecial) claimSpecial(currentDay);
    const outcome = logCook(slots);
    if (outcome.needsNaming) setNamingFp(outcome.fingerprint);
    setCookSignal((n) => n + 1);

    const id = floatId++;
    let label = "+" + formatCurry(value);
    if (crazyMult > 1) label += ` ×${crazyMult}!`;
    else if (result.isSpecial) label += " ×2!";
    setFloats((f) => [...f, { id, x, y, label }].slice(-12)); // cap under mash
    window.setTimeout(() => setFloats((f) => f.filter((fl) => fl.id !== id)), 800);
  }

  function cookFromButton() {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    // jitter so mashing the button doesn't stack identical bursts
    if (rect) cook(rect.width / 2 + (Math.random() * 48 - 24), rect.height * 0.45);
    else cook(0, 0);
  }

  // Spacebar cooks — same guarded path as the Cook! button. Skips form fields
  // and focused buttons so native keyboard behavior still works there.
  const cookFromButtonRef = useRef(cookFromButton);
  cookFromButtonRef.current = cookFromButton;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.tagName === "BUTTON" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault(); // no page scroll
      cookFromButtonRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

      <TodayStrip onMixIn={() => onNavigate("kitchen")} />

      {/* Restaurant scene + floats */}
      <div ref={sceneWrapRef} className="relative">
        <RestaurantScene
          cookSignal={cookSignal}
          onCook={cook}
          busy={hasRecipe && dayStarted}
          cravingMatched={score.cravingMatched ?? false}
        />
        <AnimatePresence>
          {floats.map((f) => (
            <div key={f.id}>
              <ClickBurst x={f.x} y={f.y} />
              <FloatText x={f.x} y={f.y} label={f.label} />
            </div>
          ))}
        </AnimatePresence>

        {/* Crazy Curry banner — keep clicking above the floor for the bonus */}
        {crazy.event && (
          <motion.div
            key={crazy.event.startedAt}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-none absolute left-1/2 top-10 z-40 w-max max-w-[90%] -translate-x-1/2 rounded-xl border-4 border-ink bg-curry-yellow px-4 py-2 text-center shadow-arcade"
          >
            <div className="flex items-center justify-center gap-1 font-display text-sm font-black uppercase tracking-wide text-ink">
              <Icon name="local_fire_department" fill size={18} className="text-tier-terrible" />
              Crazy Curry! Keep {crazy.event.floor}+ clicks/sec
            </div>
            <div
              className={`text-xs font-black uppercase tracking-wide ${
                crazy.onPace ? "text-tier-good" : "text-ink/60"
              }`}
            >
              {crazy.onPace
                ? `×${crazy.event.mult} bonus active!`
                : `×${crazy.event.mult} if you keep the pace`}
            </div>
            <motion.div
              className="mt-1 h-1.5 rounded-full bg-ink/80"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: crazy.event.durationMs / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </div>

      {/* Active recipe bar */}
      {demoEnded ? (
        <ArcadePanel className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <Icon name="emoji_events" fill size={30} className="text-tertiary" />
            <h2 className="font-display text-xl font-black uppercase text-ink">
              That's the demo!
            </h2>
          </div>
          <p className="text-sm font-semibold text-ink/70">
            Week 2's fresh affinity matrix is already waiting in your Kitchen —
            the full game lets you chase it week after week, with 45 ingredients,
            the 5th slot, skins, and the whole Franchise catalog.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <DemoStat
              icon="star"
              label="Curry all-time"
              value={formatCurry(totalCurryAllTime, 1)}
            />
            <DemoStat
              icon="restaurant"
              label="Best tier"
              value={
                lastWeekStars?.reasons.some((r) => r.includes("Legendary"))
                  ? "Legendary"
                  : lastWeekStars?.reasons.some((r) => r.includes("Great"))
                    ? "Great"
                    : highestTierSeen !== "none"
                      ? highestTierSeen
                      : "—"
              }
            />
            <DemoStat
              icon="stars"
              label="Stars earned"
              value={franchiseStarsEarned.toLocaleString()}
            />
          </div>
          <SteamCta label="Get the full game on Steam" />
        </ArcadePanel>
      ) : (
      <ArcadePanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        {hasRecipe ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {filled.map((id, i) => (
                  <span
                    key={i}
                    className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-white"
                  >
                    <PixelIcon id={id} icon={INGREDIENTS[id].icon} size={32} iconClassName={INGREDIENTS[id].color} />
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
              <div className="flex flex-wrap items-center gap-3">
                <AffinityBadge tier={score.tier} multiplier={score.multiplier} />
                <FlavorTag flavor={score.flavor} craving={craving} tier={score.tier} />
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

        {/* Primary action: build a recipe → open the day → cook. The day clock
            only starts when the player presses Start Day. */}
        <ArcadeButton
          size="xl"
          variant={!hasRecipe ? "tertiary" : !dayStarted ? "buy" : "primary"}
          onClick={
            !hasRecipe
              ? () => onNavigate("kitchen")
              : !dayStarted
                ? startDay
                : cookFromButton
          }
        >
          {!hasRecipe ? (
            <>
              <Icon name="skillet" fill size={26} />
              Open Kitchen
            </>
          ) : !dayStarted ? (
            <>
              <Icon name="play_arrow" fill size={28} />
              Start Day {currentDay}
            </>
          ) : (
            <>
              <Icon name="local_fire_department" fill size={28} />
              Cook!
            </>
          )}
        </ArcadeButton>
      </ArcadePanel>
      )}

      {namingFp && (
        <RecipeNamingModal fingerprint={namingFp} onClose={() => setNamingFp(null)} />
      )}
    </div>
  );
}

function DemoStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border-2 border-ink bg-cream-100 px-2 py-2 text-center">
      <Icon name={icon} fill size={18} className="text-primary" />
      <span className="font-display text-sm font-black capitalize text-ink">
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-wide text-ink/50">
        {label}
      </span>
    </div>
  );
}
