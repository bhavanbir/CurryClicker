import type { ReactNode } from "react";
import { useGameStore } from "../store/useGameStore";
import { Decimal } from "../lib/decimal";
import { formatCurry } from "../lib/format";
import { UPGRADES, DECORATIONS } from "../engine/shopData";
import { COSMETICS } from "../data/sampleData";
import type { Upgrade, Decoration } from "../types";
import { Icon } from "../components/arcade/Icon";

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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-black uppercase text-ink text-stroke-ink">
          Store
        </h1>
        <div className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-tertiary-fixed px-3 py-1.5 shadow-arcade-sm">
          <Icon name="star" className="text-primary" fill size={18} />
          <span className="font-display font-black tabular-nums">
            {formatCurry(currentCurry, 1)}
          </span>
        </div>
      </div>

      {/* Upgrades */}
      <Section title="Upgrades">
        {UPGRADES.map((u) => {
          const owned = purchasedUpgrades.includes(u.id);
          const prereqMet =
            !u.prerequisiteUpgradeId ||
            purchasedUpgrades.includes(u.prerequisiteUpgradeId);
          const affordable = currentCurry.gte(new Decimal(u.cost));
          return (
            <ShopRow
              key={u.id}
              item={u}
              statusLabel={owned ? "Owned" : !prereqMet ? "Locked" : undefined}
              disabled={owned || !prereqMet || !affordable}
              dimmed={owned}
              cost={u.cost}
              onBuy={() => purchaseUpgrade(u.id)}
            />
          );
        })}
      </Section>

      {/* Decorations */}
      <Section title="Decorations">
        {DECORATIONS.map((d) => {
          const qty = ownedDecorations[d.id] ?? 0;
          const maxed = qty >= d.maxQuantity;
          const affordable = currentCurry.gte(new Decimal(d.cost));
          const level =
            d.maxQuantity > 1 ? `${qty}/${d.maxQuantity}` : qty > 0 ? "Owned" : undefined;
          return (
            <ShopRow
              key={d.id}
              item={d}
              statusLabel={maxed ? (d.maxQuantity > 1 ? "Maxed" : "Owned") : level}
              disabled={maxed || !affordable}
              dimmed={maxed}
              cost={d.cost}
              onBuy={() => purchaseDecoration(d.id)}
            />
          );
        })}
      </Section>

      {/* Cosmetics (IAP preview — Epic E) */}
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
            <div
              key={item.id}
              className="arcade-box flex items-center justify-between gap-3 p-3 opacity-80"
              style={{ boxShadow: "4px 4px 0 0 #191c1e" }}
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
              <button type="button" disabled className="arcade-btn shrink-0 bg-buy px-3 py-2 text-sm text-ink">
                {item.cost}
              </button>
            </div>
          ))}
        </div>
      </section>
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
  disabled,
  dimmed,
  onBuy,
}: {
  item: Upgrade | Decoration;
  cost: number;
  statusLabel?: string;
  disabled: boolean;
  dimmed: boolean;
  onBuy: () => void;
}) {
  return (
    <div
      className={`arcade-box flex items-center justify-between gap-3 p-3 ${dimmed ? "opacity-60" : ""}`}
      style={{ boxShadow: "4px 4px 0 0 #191c1e" }}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-14 w-14 items-center justify-center rounded-md border-2 border-ink ${item.tone}`}>
          <Icon name={item.icon} className="text-ink" fill size={28} />
        </div>
        <div>
          <h3 className="font-display text-base font-extrabold leading-tight text-ink">
            {item.name}
          </h3>
          <p className="text-xs font-semibold text-ink/55">{item.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {statusLabel && (
          <span className="rounded border-2 border-ink bg-buy/30 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink">
            {statusLabel}
          </span>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={onBuy}
          className="arcade-btn flex items-center gap-1 bg-primary px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="star" fill size={14} className="text-white/90" />
          {formatCurry(new Decimal(cost), 0)}
        </button>
      </div>
    </div>
  );
}
