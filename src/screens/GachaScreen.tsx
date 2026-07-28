import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useGameStore, MAX_EQUIPPED } from "../store/useGameStore";
import { useEffects } from "../hooks/useEffects";
import {
  RARITIES,
  RARITY_ORDER,
  spinCost,
  nextRarity,
  demoCap,
  COMBINE_COST,
  type GachaRarity,
  type RolledIngredient,
} from "../engine/gacha";
import { INGREDIENTS } from "../engine/ingredients";
import { formatCurry } from "../lib/format";
import { flashScene, shakeScene } from "../lib/juice";
import { Icon } from "../components/arcade/Icon";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { StatChip } from "../components/arcade/StatChip";
import { PixelIcon } from "../components/PixelIcon";
import { ClickBurst } from "../components/ClickBurst";
import { GachaReel } from "../components/gacha/GachaReel";
import { RollCard } from "../components/gacha/RollCard";
import { RarityRevealOverlay } from "../components/gacha/RarityRevealOverlay";
import { rarityColor, rarityFx } from "../components/gacha/rarityFx";

// The spice draw. Spin spends curry and pushes the roll straight into the
// store; the reel below is presentation on top of a result that already
// happened, which is why a mid-spin reload can't lose a pull.

// The rarity a trade-up out of `r` actually pays out in this build — null when
// there's nothing above it, or the demo caps what's above it.
function tradeUp(r: GachaRarity): GachaRarity | null {
  const t = nextRarity(r);
  return t && demoCap(t) === t ? t : null;
}

function EquipSlot({
  roll,
  onClick,
}: {
  roll?: RolledIngredient;
  onClick?: () => void;
}) {
  if (!roll) {
    return (
      <div className="flex h-20 flex-1 flex-col items-center justify-center gap-1 rounded-xl border-4 border-dashed border-ink/30 text-ink/40">
        <Icon name="add" size={22} />
        <span className="text-[10px] font-bold uppercase tracking-wide">Empty</span>
      </div>
    );
  }
  const ing = INGREDIENTS[roll.ingredientId];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${ing?.name ?? roll.ingredientId} — tap to unequip`}
      className="arcade-box flex h-20 flex-1 flex-col items-center justify-center gap-1 p-1 ring-2 ring-inset transition-transform hover:-translate-y-0.5"
      style={{ "--tw-ring-color": rarityColor(roll.rarity) } as React.CSSProperties}
    >
      <PixelIcon id={roll.ingredientId} icon={ing?.icon ?? "restaurant"} size={32} />
      <span className="w-full truncate px-1 text-center text-[10px] font-bold leading-none text-ink">
        {ing?.name ?? roll.ingredientId}
      </span>
    </button>
  );
}

export function GachaScreen() {
  const inventory = useGameStore((s) => s.gachaInventory);
  const equippedUids = useGameStore((s) => s.equippedUids);
  const spinCount = useGameStore((s) => s.spinCount);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const currentCurry = useGameStore((s) => s.currentCurry);
  const spin = useGameStore((s) => s.spin);
  const equip = useGameStore((s) => s.equip);
  const unequip = useGameStore((s) => s.unequip);
  const discardRoll = useGameStore((s) => s.discardRoll);
  const combine = useGameStore((s) => s.combine);
  const effects = useEffects();
  const reduced = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [pending, setPending] = useState<RolledIngredient | null>(null);
  const [hero, setHero] = useState<RolledIngredient | null>(null);
  const [burst, setBurst] = useState<{ uid: string; power: number } | null>(null);
  const [overlay, setOverlay] = useState<GachaRarity | null>(null);
  const [filter, setFilter] = useState<GachaRarity | "all">("all");
  const [combineMode, setCombineMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const cost = spinCost(spinCount, weeksCompleted, effects.spinCostMult);
  const affordable = currentCurry >= cost;

  // First pick locks the rarity for the rest of the tray.
  const pickedRarity = inventory.find((r) => r.uid === picked[0])?.rarity;
  const target = pickedRarity ? nextRarity(pickedRarity) : null;
  const demoBlocked = !!target && demoCap(target) !== target;

  // Affordance dot: does the player hold five spare of anything tradeable?
  const canCombineAny = useMemo(() => {
    const eq = new Set(equippedUids);
    const counts = new Map<GachaRarity, number>();
    for (const r of inventory) {
      if (eq.has(r.uid) || !tradeUp(r.rarity)) continue;
      const n = (counts.get(r.rarity) ?? 0) + 1;
      if (n >= COMBINE_COST) return true;
      counts.set(r.rarity, n);
    }
    return false;
  }, [inventory, equippedUids]);

  // Equipped first, then the good stuff, then the fresh stuff.
  const sorted = useMemo(() => {
    const eq = new Set(equippedUids);
    return [...inventory].sort(
      (a, b) =>
        Number(eq.has(b.uid)) - Number(eq.has(a.uid)) ||
        RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] ||
        b.at - a.at,
    );
  }, [inventory, equippedUids]);
  const visible = filter === "all" ? sorted : sorted.filter((r) => r.rarity === filter);

  const reveal = useCallback(
    (roll: RolledIngredient) => {
      const fx = rarityFx[roll.rarity];
      setPending(null);
      setHero(roll);
      if (!reduced) {
        if (fx.shake) shakeScene(rootRef.current, fx.shake);
        if (fx.flash) flashScene(flashRef.current);
        // Inverse of ClickBurst's own count formula (count = 7 + power·9), so
        // the FX table's particle counts land exactly. ClickBurst derives its
        // ring scale and palette from the same number.
        setBurst({ uid: roll.uid, power: (fx.particles - 7) / 9 });
      }
      if (fx.overlay) setOverlay(roll.rarity);
    },
    [reduced],
  );

  // The burst animates itself out (~1.7s at the top end); drop it so a rapid
  // re-spin remounts.
  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(null), 1800);
    return () => window.clearTimeout(t);
  }, [burst]);

  function handleSpin() {
    if (pending) return;
    const roll = spin();
    if (!roll) return; // couldn't afford it
    setOverlay(null);
    setHero(null);
    if (reduced) reveal(roll);
    else setPending(roll);
  }

  function exitCombine() {
    setCombineMode(false);
    setPicked([]);
  }

  function togglePick(uid: string) {
    setPicked((p) =>
      p.includes(uid)
        ? p.filter((u) => u !== uid)
        : p.length >= COMBINE_COST
          ? p
          : [...p, uid],
    );
  }

  // Same celebration path as a spin — the reel, then reveal().
  function handleCombine() {
    if (pending) return;
    const roll = combine(picked);
    if (!roll) return;
    exitCombine();
    setOverlay(null);
    setHero(null);
    if (reduced) reveal(roll);
    else setPending(roll);
  }

  const heroEquipped = hero ? equippedUids.includes(hero.uid) : false;
  const heroInInventory = hero ? inventory.some((r) => r.uid === hero.uid) : false;

  return (
    <div ref={rootRef} className="relative mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Rests at opacity 0 — flashScene() drives it */}
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-40 rounded-xl opacity-0"
      />

      <PageHeader
        title="Inventory"
        subtitle="Spend curry, pull ingredients, equip your best three."
        trailing={
          <StatChip
            icon="inventory_2"
            label="Held"
            value={inventory.length.toString()}
          />
        }
      />

      {/* Equipped — the only three that actually do anything */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink">
            Equipped
          </h2>
          <span className="text-xs font-bold text-ink/50">
            {equippedUids.length} / {MAX_EQUIPPED}
          </span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: MAX_EQUIPPED }, (_, i) => {
            const roll = inventory.find((r) => r.uid === equippedUids[i]);
            return (
              <EquipSlot
                key={equippedUids[i] ?? `empty-${i}`}
                roll={roll}
                onClick={roll ? () => unequip(roll.uid) : undefined}
              />
            );
          })}
        </div>
      </section>

      {/* Reel bay */}
      <div className="relative min-h-32">
        {pending ? (
          <div className="h-32">
            <GachaReel result={pending} onLanded={() => reveal(pending)} />
          </div>
        ) : hero ? (
          <ArcadePanel className="flex flex-col gap-3 p-3">
            <RollCard roll={hero} equipped={heroEquipped} />
            <div className="flex flex-wrap gap-2">
              {heroInInventory &&
                (heroEquipped ? (
                  <ArcadeButton size="sm" onClick={() => unequip(hero.uid)}>
                    Unequip
                  </ArcadeButton>
                ) : (
                  <ArcadeButton
                    size="sm"
                    variant="buy"
                    disabled={equippedUids.length >= MAX_EQUIPPED}
                    onClick={() => equip(hero.uid)}
                  >
                    {equippedUids.length >= MAX_EQUIPPED ? "Slots full" : "Equip"}
                  </ArcadeButton>
                ))}
              {heroInInventory && !heroEquipped && (
                <ArcadeButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    discardRoll(hero.uid);
                    setHero(null);
                  }}
                >
                  Discard
                </ArcadeButton>
              )}
              <ArcadeButton size="sm" onClick={() => setHero(null)}>
                Keep spinning
              </ArcadeButton>
            </div>
          </ArcadePanel>
        ) : (
          <ArcadePanel className="flex h-32 items-center justify-center gap-2">
            <Icon name="casino" fill size={26} className="text-primary" />
            <span className="font-display text-xl font-black uppercase tracking-widest text-ink/50">
              Ready
            </span>
          </ArcadePanel>
        )}

        {/* Landing burst, centred on the bay */}
        {burst && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="relative">
              <ClickBurst key={burst.uid} x={0} y={0} power={burst.power} tint={2} />
            </div>
          </div>
        )}
      </div>

      <ArcadeButton
        variant="primary"
        size="lg"
        disabled={!!pending || !affordable}
        onClick={handleSpin}
        className={affordable && !pending && inventory.length === 0 ? "animate-pulse" : ""}
      >
        <Icon name="casino" fill size={22} />
        Spin — {formatCurry(cost)}
      </ArcadeButton>

      {/* Inventory */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink">
            Pantry
          </h2>
          <ArcadeButton
            size="sm"
            variant={combineMode ? "primary" : "neutral"}
            className="relative"
            onClick={() => (combineMode ? exitCombine() : setCombineMode(true))}
          >
            <Icon name="merge" size={18} />
            Combine
            {!combineMode && canCombineAny && (
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-ink bg-primary" />
            )}
          </ArcadeButton>
        </div>

        {combineMode && (
          <ArcadePanel className="flex flex-wrap items-center gap-2 p-3">
            <span className="font-display text-sm font-black uppercase tracking-wider text-ink">
              {picked.length}/{COMBINE_COST}{" "}
              {pickedRarity ? rarityFx[pickedRarity].label : "— pick five of a kind"}
            </span>
            {target && (
              <span
                className="rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                style={{ backgroundColor: rarityColor(target) }}
              >
                → guaranteed {rarityFx[target].label}
              </span>
            )}
            <span className="flex-1" />
            <ArcadeButton
              size="sm"
              variant="buy"
              disabled={picked.length !== COMBINE_COST || demoBlocked || !!pending}
              onClick={handleCombine}
            >
              {demoBlocked ? "Full game" : "Combine"}
            </ArcadeButton>
            <ArcadeButton size="sm" onClick={exitCombine}>
              Cancel
            </ArcadeButton>
          </ArcadePanel>
        )}

        <div className="flex flex-wrap gap-1.5">
          {(["all", ...RARITIES] as const).map((r) => {
            const on = filter === r;
            const color = r === "all" ? undefined : rarityColor(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => setFilter(r)}
                className={`rounded-full border-2 border-ink px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-transform hover:-translate-y-0.5 ${
                  on ? "text-white shadow-arcade-sm" : "bg-white text-ink/60"
                }`}
                style={on ? { backgroundColor: color ?? "rgb(var(--ink))" } : undefined}
              >
                {r === "all" ? "All" : rarityFx[r].label}
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <ArcadePanel className="p-6 text-center text-sm font-bold text-ink/50">
            {inventory.length === 0
              ? "Nothing in the pantry yet — take a spin."
              : "No rolls of that rarity."}
          </ArcadePanel>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {visible.map((roll) => {
              const eq = equippedUids.includes(roll.uid);
              const sel = picked.includes(roll.uid);
              // In combine mode: equipped, top-tier and off-rarity rolls are out.
              const lock =
                !combineMode || sel
                  ? null
                  : eq
                    ? "Equipped"
                    : !nextRarity(roll.rarity)
                      ? "Top tier"
                      : pickedRarity && roll.rarity !== pickedRarity
                        ? ""
                        : null;
              return (
                <div
                  key={roll.uid}
                  className={`relative ${lock !== null ? "pointer-events-none opacity-40" : ""}`}
                >
                  <RollCard
                    roll={roll}
                    compact
                    equipped={eq}
                    selected={sel}
                    onClick={
                      lock !== null
                        ? undefined
                        : combineMode
                          ? () => togglePick(roll.uid)
                          : () => setHero(roll)
                    }
                  />
                  {lock && (
                    <span className="absolute inset-x-1 bottom-1 rounded bg-ink px-1 text-center text-[8px] font-black uppercase text-white">
                      {lock}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {overlay && (
          <RarityRevealOverlay rarity={overlay} onDone={() => setOverlay(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
