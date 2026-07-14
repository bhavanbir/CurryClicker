import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { INGREDIENTS, INGREDIENT_IDS } from "../engine/ingredients";
import { avgAffinityToTier } from "../engine/recipeEngine";
import { COLLECTION_SETS, setProgress, type CollectionSet } from "../engine/collections";
import { playStarAward } from "../lib/sfx";
import { TIER_META } from "../components/AffinityBadge";
import type { Ingredient } from "../types";
import type { Screen } from "../navigation";
import { Icon } from "../components/arcade/Icon";
import { PixelIcon } from "../components/PixelIcon";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";

interface Props {
  onNavigate: (s: Screen) => void;
}

interface DiscoveredPair {
  key: string;
  a: Ingredient;
  b: Ingredient;
  value: number;
}

const TOTAL_PAIRS = (INGREDIENT_IDS.length * (INGREDIENT_IDS.length - 1)) / 2;

export function AffinityJournalScreen({ onNavigate }: Props) {
  const discoveredAffinities = useGameStore((s) => s.discoveredAffinities);
  const reduced = useReducedMotion() ?? false;

  const pairs = useMemo<DiscoveredPair[]>(
    () =>
      Object.entries(discoveredAffinities)
        .flatMap(([key, value]) => {
          const [idA, idB] = key.split("|");
          const a = INGREDIENTS[idA];
          const b = INGREDIENTS[idB];
          return a && b ? [{ key, a, b, value }] : [];
        })
        .sort((p, q) => q.value - p.value),
    [discoveredAffinities],
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <PageHeader
        title="Affinity Journal"
        subtitle="Every pair you've tasted this week — proven, not guessed."
        leading={
          <ArcadeButton size="sm" onClick={() => onNavigate("kitchen")}>
            <Icon name="arrow_back" size={18} />
            <span className="hidden sm:inline">Kitchen</span>
          </ArcadeButton>
        }
      />

      {/* Collection sets — know N pairs within each pool, claim for curry */}
      <div className="grid grid-cols-2 gap-2">
        {COLLECTION_SETS.map((cs) => (
          <SetCard key={cs.id} cs={cs} />
        ))}
      </div>

      <div className="flex items-end justify-between border-b-4 border-ink pb-1">
        <h2 className="font-display text-xl font-black uppercase text-ink">
          Tested Pairs
        </h2>
        <span className="rounded border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold text-ink/60">
          {pairs.length} / {TOTAL_PAIRS} Known
        </span>
      </div>

      {pairs.length === 0 ? (
        <ArcadePanel className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-ink bg-cream-100">
            <Icon name="science" fill size={34} className="text-ink/40" />
          </div>
          <p className="font-display text-lg font-black uppercase text-ink">
            Nothing tasted yet
          </p>
          <p className="max-w-sm text-sm font-semibold text-ink/60">
            Cook a recipe through a full day and every ingredient pair in it is
            revealed here — its true affinity, recorded for the rest of the week.
          </p>
          <ArcadeButton
            variant="primary"
            className="mt-1"
            onClick={() => onNavigate("kitchen")}
          >
            <Icon name="skillet" fill size={20} />
            Build a recipe
          </ArcadeButton>
        </ArcadePanel>
      ) : (
        <div className="flex flex-col gap-2">
          {pairs.map((p, i) => (
            <PairRow key={p.key} pair={p} index={i} reduced={reduced} />
          ))}
        </div>
      )}
    </div>
  );
}

function SetCard({ cs }: { cs: CollectionSet }) {
  const discoveredAffinities = useGameStore((s) => s.discoveredAffinities);
  const claimedSets = useGameStore((s) => s.claimedSets);
  const claimSet = useGameStore((s) => s.claimSet);

  const progress = useMemo(
    () => setProgress(cs, discoveredAffinities),
    [cs, discoveredAffinities],
  );
  const claimed = claimedSets.includes(cs.id);
  const complete = progress >= cs.target;

  return (
    <div className="arcade-box flex flex-col gap-2 p-3">
      <div className="flex items-center gap-1.5">
        <Icon name={cs.icon} fill size={18} className="text-primary" />
        <span className="truncate font-display text-xs font-black uppercase text-ink">
          {cs.name}
        </span>
        <span className="ml-auto shrink-0 text-xs font-bold tabular-nums text-ink/60">
          {progress}/{cs.target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-white">
        <div
          className={`h-full transition-[width] duration-300 ${complete ? "bg-buy" : "bg-curry-yellow"}`}
          style={{ width: `${(progress / cs.target) * 100}%` }}
        />
      </div>
      {claimed ? (
        <div className="flex items-center gap-1 text-xs font-bold text-ink/50">
          <Icon name="check_circle" fill size={14} />
          Claimed
        </div>
      ) : complete ? (
        <ArcadeButton
          size="sm"
          variant="buy"
          onClick={() => {
            claimSet(cs.id);
            playStarAward();
          }}
        >
          Claim
        </ArcadeButton>
      ) : null}
    </div>
  );
}

function PairRow({
  pair,
  index,
  reduced,
}: {
  pair: DiscoveredPair;
  index: number;
  reduced: boolean;
}) {
  const meta = TIER_META[avgAffinityToTier(pair.value)];
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        delay: reduced ? 0 : Math.min(index * 0.03, 0.4),
      }}
      className="arcade-box flex items-center gap-2 p-3"
    >
      <PairIngredient ingredient={pair.a} />
      <Icon name="add" size={16} className="shrink-0 text-ink/40" />
      <PairIngredient ingredient={pair.b} />
      <span
        className={`ml-auto shrink-0 rounded-lg border-2 border-ink px-2.5 py-1 font-display text-sm font-extrabold tabular-nums shadow-arcade-sm ${meta.bg} ${meta.text}`}
      >
        {pair.value > 0 ? "+" : ""}
        {pair.value.toFixed(2)}
      </span>
    </motion.div>
  );
}

function PairIngredient({ ingredient }: { ingredient: Ingredient }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-cream-50">
        <PixelIcon id={ingredient.id} icon={ingredient.icon} size={22} iconClassName={ingredient.color} />
      </div>
      <span className="truncate text-sm font-bold text-ink">{ingredient.name}</span>
    </div>
  );
}
