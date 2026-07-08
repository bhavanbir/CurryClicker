import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import {
  FRANCHISE_UPGRADES,
  FRANCHISE_UPGRADE_MAP,
  franchiseRankFor,
} from "../engine/franchiseData";
import type { FranchiseUpgrade } from "../types";
import type { Screen } from "../navigation";
import { Icon } from "../components/arcade/Icon";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { playPurchase } from "../lib/sfx";
import { IS_DEMO } from "../target";
import { SteamCta, SteamLockChip } from "../components/SteamCta";

interface Props {
  onNavigate: (s: Screen) => void;
}

const GROUPS: { title: string; match: (u: FranchiseUpgrade) => boolean }[] = [
  { title: "Reputation", match: (u) => u.effect.type === "reputation" },
  { title: "Ingredient Sets", match: (u) => u.effect.type === "ingredient_set" },
  {
    title: "Week Perks",
    match: (u) =>
      u.effect.type !== "reputation" && u.effect.type !== "ingredient_set",
  },
];

export function FranchiseScreen({ onNavigate }: Props) {
  const franchiseStars = useGameStore((s) => s.franchiseStars);
  const franchiseStarsEarned = useGameStore((s) => s.franchiseStarsEarned);
  const franchiseUpgrades = useGameStore((s) => s.franchiseUpgrades);
  const buyFranchiseUpgrade = useGameStore((s) => s.buyFranchiseUpgrade);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Franchise"
        subtitle="Permanent upgrades bought with Franchise Stars — earned each week, kept forever."
        leading={
          <ArcadeButton size="sm" onClick={() => onNavigate("profile")}>
            <Icon name="arrow_back" size={18} />
            <span className="hidden sm:inline">Chef</span>
          </ArcadeButton>
        }
      />

      {/* Hero: rank + spendable Star balance */}
      <ArcadePanel
        shadow="md"
        className="flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-violet-100 to-cream-50 p-5 sm:flex-row"
      >
        <div className="text-center sm:text-left">
          <div className="text-xs font-black uppercase tracking-wider text-ink/55">
            Franchise Rank
          </div>
          <div className="font-display text-3xl font-black uppercase text-ink">
            {franchiseRankFor(franchiseStarsEarned)}
          </div>
          <div className="mt-1 text-xs font-bold text-ink/55">
            {franchiseStarsEarned.toLocaleString()} stars earned today
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border-4 border-ink bg-white px-4 py-2 shadow-arcade-sm">
          <Icon name="stars" fill size={36} className="text-violet-600" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-3xl font-black tabular-nums text-violet-700">
              {franchiseStars.toLocaleString()}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-ink/50">
              Stars to spend
            </span>
          </div>
        </div>
      </ArcadePanel>

      {IS_DEMO && (
        <ArcadePanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-ink/70">
            Franchise upgrades are part of the full game — your stars are ready
            to spend the moment you get there.
          </p>
          <SteamCta label="Get it on Steam" className="shrink-0" />
        </ArcadePanel>
      )}

      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-3 inline-block border-b-4 border-ink pb-0.5 font-display text-xl font-black uppercase">
            {group.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FRANCHISE_UPGRADES.filter(group.match).map((u) => (
              <UpgradeRow
                key={u.id}
                upgrade={u}
                owned={franchiseUpgrades.includes(u.id)}
                prereqMet={
                  !u.prerequisiteUpgradeId ||
                  franchiseUpgrades.includes(u.prerequisiteUpgradeId)
                }
                stars={franchiseStars}
                onBuy={() => {
                  if (buyFranchiseUpgrade(u.id)) {
                    playPurchase();
                    return true;
                  }
                  return false;
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UpgradeRow({
  upgrade,
  owned,
  prereqMet,
  stars,
  onBuy,
}: {
  upgrade: FranchiseUpgrade;
  owned: boolean;
  prereqMet: boolean;
  stars: number;
  onBuy: () => boolean;
}) {
  const [justBought, setJustBought] = useState(false);
  const locked = !owned && !prereqMet;
  const affordable = stars >= upgrade.cost;
  const buyable = !owned && !locked && affordable;
  const prereqName = upgrade.prerequisiteUpgradeId
    ? FRANCHISE_UPGRADE_MAP[upgrade.prerequisiteUpgradeId]?.name
    : undefined;

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
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-violet-100 ${locked ? "opacity-60 grayscale" : ""}`}
        >
          <Icon name={locked ? "lock" : upgrade.icon} className="text-ink" fill size={28} />
        </div>
        <div>
          <h3 className="font-display text-base font-extrabold leading-tight text-ink">
            {upgrade.name}
          </h3>
          <p className="text-xs font-semibold text-ink/55">{upgrade.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {locked ? (
          <span className="flex items-center gap-0.5 rounded border-2 border-dashed border-ink/40 bg-cream-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink/55">
            <Icon name="lock" fill size={11} />
            Needs {prereqName}
          </span>
        ) : (
          owned && (
            <span className="rounded border-2 border-ink bg-buy/30 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink">
              Owned
            </span>
          )
        )}
        <div className="relative">
          {IS_DEMO ? (
            <SteamLockChip />
          ) : (
          <ArcadeButton
            variant={buyable ? "tertiary" : "neutral"}
            size="sm"
            disabled={!buyable}
            onClick={handleBuy}
            className={!buyable ? "text-ink/50" : ""}
          >
            <Icon
              name="stars"
              fill
              size={14}
              className={buyable ? "text-violet-700" : "text-ink/40"}
            />
            {upgrade.cost}
          </ArcadeButton>
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
                <Icon name="check" fill size={18} className="text-ink" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!IS_DEMO && !owned && !locked && !affordable && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink/50">
            Need {upgrade.cost - stars} more
          </span>
        )}
      </div>
    </motion.div>
  );
}
