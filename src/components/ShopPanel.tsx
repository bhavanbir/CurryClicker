import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { formatCurry } from "../lib/format";
import { UPGRADES, DECORATIONS, UPGRADE_MAP, upgradeCost, ladleValue } from "../engine/shopData";
import type { Upgrade, Decoration } from "../types";
import type { Screen } from "../navigation";
import { Icon } from "./arcade/Icon";
import { PixelIcon } from "./PixelIcon";
import { playPurchase } from "../lib/sfx";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";
import { SteamLockChip } from "./SteamCta";

// Shop tabs + item list, shared by the ShopDrawer (side sheet) and the
// full-page ShopScreen. Owns the tab state; chrome (header, scrim, motion)
// belongs to the host.

type Tab = "upgrades" | "decor";

// Static catalogue → static grouping, so upgrades are findable by type.
const UPGRADE_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: "Ladles",
    ids: [
      "wooden_spoon",
      "steel_ladle",
      "golden_ladle",
      "obsidian_ladle",
      "diamond_ladle",
      "celestial_ladle",
    ],
  },
  { label: "Knives", ids: ["chefs_knife", "damascus_knife", "legendary_cleaver"] },
  {
    label: "Kitchen Crew",
    ids: [
      "sous_chef",
      "kitchen_brigade",
      "industrial_pot",
      "curry_conveyor",
      "robot_kitchen",
      "curry_megaworks",
    ],
  },
  { label: "Delivery", ids: ["delivery_bicycle", "delivery_scooter", "delivery_fleet"] },
  {
    label: "Slots & Expansion",
    ids: ["slot_4", "slot_5", "expand_1", "expand_2", "expand_3", "expand_4", "expand_5"],
  },
];

if (import.meta.env.DEV) {
  // A new upgrade must be added to a group or it silently vanishes from the shop.
  const grouped = new Set(UPGRADE_GROUPS.flatMap((g) => g.ids));
  const missing = UPGRADES.filter((u) => !grouped.has(u.id)).map((u) => u.id);
  if (missing.length > 0 || grouped.size !== UPGRADES.length) {
    throw new Error(`UPGRADE_GROUPS out of sync with UPGRADES: missing [${missing}]`);
  }
}

export function ShopPanel({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const ownedDecorations = useGameStore((s) => s.ownedDecorations);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const purchaseUpgrade = useGameStore((s) => s.purchaseUpgrade);
  const purchaseDecoration = useGameStore((s) => s.purchaseDecoration);

  const [tab, setTab] = useState<Tab>("upgrades");

  const ownedUpgradeCount = UPGRADES.filter((u) =>
    purchasedUpgrades.includes(u.id),
  ).length;
  const ownedDecorCount = DECORATIONS.filter(
    (d) => (ownedDecorations[d.id] ?? 0) >= d.maxQuantity,
  ).length;

  return (
    <>
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
        {/* Nav shortcut, not a content tab — Franchise HQ is its own screen */}
        <TabButton
          active={false}
          onClick={() => onNavigate("franchise")}
          label="Franchise"
        />
      </div>

      {/* Items */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
        {tab === "upgrades" &&
          UPGRADE_GROUPS.map((group) => {
            const items = group.ids.map((id) => UPGRADE_MAP[id]);
            const ownedInGroup = items.filter((u) =>
              purchasedUpgrades.includes(u.id),
            ).length;
            return (
              <details key={group.label} open className="group/section">
                <summary className="flex cursor-pointer select-none items-center justify-between rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-black uppercase tracking-wide text-ink shadow-arcade-sm [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-1.5">
                    <Icon
                      name="chevron_right"
                      size={18}
                      className="transition-transform group-open/section:rotate-90"
                    />
                    {group.label}
                  </span>
                  <span className="text-[10px] font-bold text-ink/45">
                    {ownedInGroup}/{items.length}
                  </span>
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  {items.map((u) => {
                    const owned = purchasedUpgrades.includes(u.id);
                    const prereqMet =
                      !u.prerequisiteUpgradeId ||
                      purchasedUpgrades.includes(u.prerequisiteUpgradeId);
                    // Ladles grow with prestige — show the real
                    // multiplier, not the printed week-0 value.
                    const boosted =
                      u.effect.type === "click_multiplier"
                        ? ladleValue(u, weeksCompleted)
                        : null;
                    const item =
                      u.effect.type === "click_multiplier" &&
                      boosted !== null &&
                      boosted !== u.effect.value
                        ? {
                            ...u,
                            description: `×${boosted.toFixed(2)} cook value (prestige boost)`,
                          }
                        : u;
                    return (
                      <ShopCard
                        key={u.id}
                        item={item}
                        cost={upgradeCost(u, weeksCompleted)}
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
                </div>
              </details>
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

      </div>
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
  currentCurry: number;
  onBuy: () => boolean;
}) {
  const [justBought, setJustBought] = useState(false);
  const locked = !!lockedReason || steamLocked;
  const affordable = currentCurry >= cost;
  const buyable = !owned && !locked && affordable;
  const shortfall = cost - currentCurry;

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
              {formatCurry(cost, 0)}
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
