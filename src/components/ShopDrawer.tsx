import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { Decimal } from "../lib/decimal";
import { formatCurry } from "../lib/format";
import { UPGRADES, DECORATIONS, UPGRADE_MAP } from "../engine/shopData";
import { COSMETICS } from "../data/sampleData";
import type { Upgrade, Decoration } from "../types";
import { Icon } from "./arcade/Icon";
import { PixelIcon } from "./PixelIcon";
import { ArcadeButton } from "./arcade/ArcadeButton";
import { playPurchase } from "../lib/sfx";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";
import { SteamLockChip } from "./SteamCta";

// Right-side slide-out shop. Replaces the old full-page Store route: non-modal
// on desktop (no scrim — keep click-cooking while browsing), modal full-width
// sheet with scrim on mobile. A fixed edge tab opens it when closed.

type Tab = "upgrades" | "decor" | "cosmetics";

export function ShopDrawer({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const ownedDecorations = useGameStore((s) => s.ownedDecorations);
  const purchaseUpgrade = useGameStore((s) => s.purchaseUpgrade);
  const purchaseDecoration = useGameStore((s) => s.purchaseDecoration);

  const [tab, setTab] = useState<Tab>("upgrades");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ownedUpgradeCount = UPGRADES.filter((u) =>
    purchasedUpgrades.includes(u.id),
  ).length;
  const ownedDecorCount = DECORATIONS.filter(
    (d) => (ownedDecorations[d.id] ?? 0) >= d.maxQuantity,
  ).length;

  return (
    <>
      {/* Edge handle — desktop only; BottomNav's Store button covers mobile */}
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open store"
          className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-lg border-4 border-r-0 border-ink bg-primary px-1.5 py-4 text-white shadow-arcade transition-transform hover:-translate-x-0.5 md:flex"
        >
          <Icon name="storefront" fill size={22} />
          <span className="text-xs font-black uppercase tracking-widest [writing-mode:vertical-rl]">
            Shop
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim — mobile only; desktop stays interactive for cook-while-shopping */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[46] bg-ink/50 md:hidden"
            />
            <motion.aside
              role="dialog"
              aria-label="Store"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="shop-surface fixed inset-y-0 right-0 z-[47] flex w-full flex-col border-l-4 border-ink shadow-[-8px_0_0_0_#191c1e] md:w-[400px]"
            >
              {/* Header — solid band + striped awning so the shop reads as a storefront */}
              <div className="flex items-center gap-2 bg-primary px-4 py-3">
                <Icon name="storefront" fill size={26} className="text-white" />
                <h2 className="font-display text-2xl font-black uppercase text-white text-stroke-ink">
                  Store
                </h2>
                <div className="ml-auto flex items-center gap-1.5 rounded-lg border-2 border-ink bg-tertiary-fixed px-3 py-1.5 shadow-arcade-sm">
                  <Icon name="star" className="text-primary" fill size={18} />
                  <span className="font-display text-sm font-black tabular-nums text-ink">
                    {formatCurry(currentCurry, 1)}
                  </span>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close store"
                  className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-white text-ink shadow-arcade-sm transition-transform hover:-translate-y-0.5"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              {/* Awning stripe */}
              <div className="shop-awning h-3 shrink-0 border-b-4 border-t-2 border-ink" />

              {/* Tabs */}
              <div className="flex gap-2 border-b-2 border-ink/10 px-4 py-3">
                <TabButton
                  active={tab === "upgrades"}
                  onClick={() => setTab("upgrades")}
                  label="Upgrades"
                  count={`${ownedUpgradeCount}/${UPGRADES.length}`}
                />
                <TabButton
                  active={tab === "decor"}
                  onClick={() => setTab("decor")}
                  label="Decor"
                  count={`${ownedDecorCount}/${DECORATIONS.length}`}
                />
                {!IS_DEMO && (
                  <TabButton
                    active={tab === "cosmetics"}
                    onClick={() => setTab("cosmetics")}
                    label="Skins"
                  />
                )}
              </div>

              {/* Items */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
                {tab === "upgrades" &&
                  UPGRADES.map((u) => {
                    const owned = purchasedUpgrades.includes(u.id);
                    const prereqMet =
                      !u.prerequisiteUpgradeId ||
                      purchasedUpgrades.includes(u.prerequisiteUpgradeId);
                    return (
                      <ShopCard
                        key={u.id}
                        item={u}
                        cost={u.cost}
                        statusLabel={owned ? "Owned" : undefined}
                        owned={owned}
                        lockedReason={
                          !owned && !prereqMet
                            ? `Requires ${UPGRADE_MAP[u.prerequisiteUpgradeId!]?.name ?? "previous upgrade"}`
                            : undefined
                        }
                        steamLocked={IS_DEMO && u.id === "slot_5"}
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

                {tab === "decor" &&
                  DECORATIONS.map((d) => {
                    const qty = ownedDecorations[d.id] ?? 0;
                    const maxed = qty >= d.maxQuantity;
                    const level =
                      d.maxQuantity > 1
                        ? `${qty}/${d.maxQuantity}`
                        : qty > 0
                          ? "Owned"
                          : undefined;
                    return (
                      <ShopCard
                        key={d.id}
                        item={d}
                        cost={d.cost}
                        statusLabel={
                          maxed ? (d.maxQuantity > 1 ? "Maxed" : "Owned") : level
                        }
                        owned={maxed}
                        steamLocked={IS_DEMO && !DEMO_DECORATIONS.includes(d.id)}
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

                {tab === "cosmetics" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="rounded border-2 border-dashed border-ink/40 bg-cream-50 px-2 py-0.5 text-[10px] font-bold uppercase text-ink/55">
                        Coming soon
                      </span>
                    </div>
                    {COSMETICS.map((item) => (
                      <div
                        key={item.id}
                        className="arcade-box flex items-center justify-between gap-3 p-3 opacity-80 shadow-arcade"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-md border-2 border-ink ${item.tone}`}
                          >
                            <Icon name={item.icon} className="text-ink" fill size={28} />
                          </div>
                          <div>
                            <h3 className="font-display text-base font-extrabold leading-tight text-ink">
                              {item.name}
                            </h3>
                            <p className="text-xs font-semibold text-ink/55">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <ArcadeButton variant="buy" size="sm" disabled className="shrink-0">
                          {item.cost}
                        </ArcadeButton>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border-2 border-ink px-2 py-2 text-sm font-black uppercase tracking-wide transition-all ${
        active ? "bg-primary text-white shadow-arcade-sm" : "bg-white text-ink/70 hover:text-ink"
      }`}
    >
      {label}
      {count && (
        <span className={`ml-1 text-[10px] font-bold ${active ? "text-white/80" : "text-ink/45"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ShopCard({
  item,
  cost,
  statusLabel,
  owned,
  lockedReason,
  steamLocked = false,
  currentCurry,
  onBuy,
}: {
  item: Upgrade | Decoration;
  cost: number;
  statusLabel?: string;
  owned: boolean;
  lockedReason?: string;
  steamLocked?: boolean;
  currentCurry: Decimal;
  onBuy: () => boolean;
}) {
  const [justBought, setJustBought] = useState(false);
  const locked = !!lockedReason || steamLocked;
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
      className={`arcade-box flex flex-col gap-2.5 p-3 shadow-arcade ${
        owned ? "opacity-60" : ""
      } ${buyable ? "ring-2 ring-buy ring-offset-2" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-ink ${item.tone} ${
            locked ? "opacity-60 grayscale" : ""
          }`}
        >
          {locked ? (
            <Icon name="lock" fill size={30} className="text-ink" />
          ) : (
            <PixelIcon id={item.id} icon={item.icon} size={44} iconClassName="text-ink" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-[15px] font-extrabold leading-tight text-ink">
              {item.name}
            </h3>
            {statusLabel && !locked && (
              <span className="shrink-0 rounded border-2 border-ink bg-buy/30 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink">
                {statusLabel}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-semibold leading-snug text-ink/60">
            {item.description}
          </p>
        </div>
      </div>

      {/* Full-width action bar */}
      <div className="relative">
        {steamLocked ? (
          <div className="flex justify-center rounded-lg border-2 border-dashed border-ink/40 bg-cream-50 py-1.5">
            <SteamLockChip />
          </div>
        ) : lockedReason ? (
          <div className="flex items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink/40 bg-cream-50 py-2 text-xs font-black uppercase text-ink/55">
            <Icon name="lock" fill size={13} />
            {lockedReason}
          </div>
        ) : owned && statusLabel ? (
          <div className="rounded-lg border-2 border-ink bg-buy/30 py-1.5 text-center text-xs font-black uppercase text-ink">
            {statusLabel}
          </div>
        ) : (
          <button
            type="button"
            disabled={!buyable}
            onClick={handleBuy}
            className={`arcade-btn flex w-full items-center justify-between px-3 py-2.5 text-base ${
              buyable ? "bg-buy text-ink" : "bg-cream-50 text-ink/60 disabled:opacity-100"
            }`}
          >
            <span className="flex items-center gap-1 font-display font-black tabular-nums">
              <Icon
                name="star"
                fill
                size={16}
                className={buyable ? "text-primary" : "text-ink/40"}
              />
              {formatCurry(new Decimal(cost), 0)}
            </span>
            <span className="text-sm font-black uppercase tracking-wider">
              {buyable ? "Buy" : `Need ${formatCurry(shortfall, 0)} more`}
            </span>
          </button>
        )}
        <AnimatePresence>
          {justBought && (
            <motion.span
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-4 border-ink bg-buy"
            >
              <Icon name="check" fill size={20} className="text-ink" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
