import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { Decimal } from "../lib/decimal";
import { formatCurry } from "../lib/format";
import { UPGRADES, DECORATIONS } from "../engine/shopData";
import { COSMETICS } from "../data/sampleData";
import type { Upgrade, Decoration } from "../types";
import { Icon } from "../components/arcade/Icon";
import { StatChip } from "../components/arcade/StatChip";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { playPurchase } from "../lib/sfx";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";
import { SteamLockChip } from "../components/SteamCta";

// Live store (WU-B3): upgrades + decorations buy with curry and apply
// immediately; cosmetics remain an inert IAP preview until Epic E.
export function StoreScreen() {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const ownedDecorations = useGameStore((s) => s.ownedDecorations);
  const purchaseUpgrade = useGameStore((s) => s.purchaseUpgrade);
  const purchaseDecoration = useGameStore((s) => s.purchaseDecoration);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Store"
        trailing={
          <StatChip icon="star" label="Curry" value={formatCurry(currentCurry, 1)} />
        }
      />

      {/* Upgrades */}
      <Section title="Upgrades">
        {UPGRADES.map((u) => {
          const owned = purchasedUpgrades.includes(u.id);
          const prereqMet =
            !u.prerequisiteUpgradeId ||
            purchasedUpgrades.includes(u.prerequisiteUpgradeId);
          return (
            <ShopRow
              key={u.id}
              item={u}
              statusLabel={owned ? "Owned" : undefined}
              owned={owned}
              locked={!owned && !prereqMet}
              steamLocked={IS_DEMO && u.id === "slot_5"}
              cost={u.cost}
              currentCurry={currentCurry}
              onBuy={() => {
                if (purchaseUpgrade(u.id)) {
                  playPurchase();
                  return true;
                }
                return false;
              }}
            />
          );
        })}
      </Section>

      {/* Decorations */}
      <Section title="Decorations">
        {DECORATIONS.map((d) => {
          const qty = ownedDecorations[d.id] ?? 0;
          const maxed = qty >= d.maxQuantity;
          const level =
            d.maxQuantity > 1 ? `${qty}/${d.maxQuantity}` : qty > 0 ? "Owned" : undefined;
          return (
            <ShopRow
              key={d.id}
              item={d}
              statusLabel={maxed ? (d.maxQuantity > 1 ? "Maxed" : "Owned") : level}
              owned={maxed}
              steamLocked={IS_DEMO && !DEMO_DECORATIONS.includes(d.id)}
              cost={d.cost}
              currentCurry={currentCurry}
              onBuy={() => {
                if (purchaseDecoration(d.id)) {
                  playPurchase();
                  return true;
                }
                return false;
              }}
            />
          );
        })}
      </Section>

      {/* Cosmetics (IAP preview — Epic E). Hidden in the demo: no real-money
          store in the offline "try the mechanics" build. */}
      {!IS_DEMO && (
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="inline-block border-b-4 border-ink pb-0.5 font-display text-xl font-black uppercase">
            Cosmetics
          </h2>
          <span className="rounded border-2 border-dashed border-ink/40 bg-cream-50 px-2 py-0.5 text-[10px] font-bold uppercase text-ink/55">
            Coming soon
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {COSMETICS.map((item) => (
            <ArcadePanel
              key={item.id}
              shadow="md"
              className="flex items-center justify-between gap-3 p-3 opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-md border-2 border-ink ${item.tone}`}>
                  <Icon name={item.icon} className="text-ink" fill size={28} />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold leading-tight text-ink">
                    {item.name}
                  </h3>
                  <p className="text-xs font-semibold text-ink/55">{item.desc}</p>
                </div>
              </div>
              <ArcadeButton variant="buy" size="sm" disabled className="shrink-0">
                {item.cost}
              </ArcadeButton>
            </ArcadePanel>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 inline-block border-b-4 border-ink pb-0.5 font-display text-xl font-black uppercase">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ShopRow({
  item,
  cost,
  statusLabel,
  owned,
  locked = false,
  steamLocked = false,
  currentCurry,
  onBuy,
}: {
  item: Upgrade | Decoration;
  cost: number;
  statusLabel?: string;
  owned: boolean;
  locked?: boolean;
  steamLocked?: boolean;
  currentCurry: Decimal;
  onBuy: () => boolean;
}) {
  const [justBought, setJustBought] = useState(false);
  locked = locked || steamLocked;
  const affordable = currentCurry.gte(new Decimal(cost));
  const buyable = !owned && !locked && affordable;
  const shortfall = new Decimal(cost).sub(currentCurry);

  const handleBuy = () => {
    if (!onBuy()) return;
    setJustBought(true);
    window.setTimeout(() => setJustBought(false), 450);
  };

  return (
    <motion.div
      animate={justBought ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`arcade-box flex items-center justify-between gap-3 p-3 shadow-arcade ${owned ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-md border-2 border-ink ${item.tone} ${locked ? "opacity-60 grayscale" : ""}`}
        >
          <Icon name={locked ? "lock" : item.icon} className="text-ink" fill size={28} />
        </div>
        <div>
          <h3 className="font-display text-base font-extrabold leading-tight text-ink">
            {item.name}
          </h3>
          <p className="text-xs font-semibold text-ink/55">{item.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {steamLocked ? (
          <SteamLockChip />
        ) : locked ? (
          <span className="flex items-center gap-0.5 rounded border-2 border-dashed border-ink/40 bg-cream-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink/55">
            <Icon name="lock" fill size={11} />
            Locked
          </span>
        ) : (
          statusLabel && (
            <span className="rounded border-2 border-ink bg-buy/30 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink">
              {statusLabel}
            </span>
          )
        )}
        <div className="relative">
          <button
            type="button"
            disabled={!buyable}
            onClick={handleBuy}
            className={`arcade-btn flex items-center gap-1 px-3 py-2 text-sm ${
              !owned && !locked && !affordable
                ? "bg-cream-50 text-ink/60 disabled:opacity-100"
                : "bg-primary text-white"
            }`}
          >
            <Icon
              name="star"
              fill
              size={14}
              className={buyable || owned || locked ? "text-white/90" : "text-ink/40"}
            />
            {formatCurry(new Decimal(cost), 0)}
          </button>
          <AnimatePresence>
            {justBought && (
              <motion.span
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-4 border-ink bg-buy"
              >
                <Icon name="check" fill size={18} className="text-ink" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!owned && !locked && !affordable && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink/50">
            Need {formatCurry(shortfall, 0)} more
          </span>
        )}
      </div>
    </motion.div>
  );
}
