import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { Decimal } from "../lib/decimal";
import { UPGRADES, DECORATIONS } from "../engine/shopData";
import type { Screen } from "../navigation";
import { Icon } from "./arcade/Icon";
import { IS_DEMO, DEMO_DECORATIONS } from "../target";

// Bottom-right toast that fires the first time the player can afford a new,
// not-yet-owned shop item (upgrade or decoration). Tapping it opens the Store.
//
// We "prime" the already-affordable set silently on mount so a returning player
// isn't flooded — toasts only fire when a threshold is crossed during play.

interface Toast {
  key: string;
  name: string;
  icon: string;
  tone: string;
}

const VISIBLE = 3; // cap stacked toasts
const DISMISS_MS = 5000;

export function ShopNotifier({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const ownedDecorations = useGameStore((s) => s.ownedDecorations);

  const notified = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const buyable: Toast[] = [];

    for (const u of UPGRADES) {
      if (IS_DEMO && u.id === "slot_5") continue;
      if (purchasedUpgrades.includes(u.id)) continue;
      if (u.prerequisiteUpgradeId && !purchasedUpgrades.includes(u.prerequisiteUpgradeId)) continue;
      if (currentCurry.gte(new Decimal(u.cost))) {
        buyable.push({ key: u.id, name: u.name, icon: u.icon, tone: u.tone });
      }
    }
    for (const d of DECORATIONS) {
      if (IS_DEMO && !DEMO_DECORATIONS.includes(d.id)) continue;
      if ((ownedDecorations[d.id] ?? 0) >= d.maxQuantity) continue;
      if (currentCurry.gte(new Decimal(d.cost))) {
        buyable.push({ key: d.id, name: d.name, icon: d.icon, tone: d.tone });
      }
    }

    // First pass: remember what's already affordable without toasting.
    if (!primed.current) {
      buyable.forEach((b) => notified.current.add(b.key));
      primed.current = true;
      return;
    }

    const fresh = buyable.filter((b) => !notified.current.has(b.key));
    if (fresh.length === 0) return;

    fresh.forEach((b) => notified.current.add(b.key));
    setToasts((list) => [...list, ...fresh].slice(-VISIBLE));
    fresh.forEach((b) => {
      window.setTimeout(
        () => setToasts((list) => list.filter((t) => t.key !== b.key)),
        DISMISS_MS,
      );
    });
  }, [currentCurry, purchasedUpgrades, ownedDecorations]);

  return (
    <div className="pointer-events-none fixed bottom-24 right-3 z-[45] flex flex-col items-end gap-2 md:bottom-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.key}
            type="button"
            initial={{ opacity: 0, x: 48, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            onClick={() => {
              onNavigate("store");
              setToasts((list) => list.filter((x) => x.key !== t.key));
            }}
            className="pointer-events-auto flex items-center gap-2 rounded-lg border-2 border-ink bg-cream px-3 py-2 shadow-arcade-sm"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink ${t.tone}`}>
              <Icon name={t.icon} fill size={20} className="text-ink" />
            </span>
            <span className="text-left">
              <span className="block text-[10px] font-black uppercase tracking-wide text-primary">
                Upgrade available
              </span>
              <span className="block max-w-[40vw] truncate text-sm font-extrabold text-ink">
                {t.name}
              </span>
            </span>
            <Icon name="storefront" size={18} className="ml-1 shrink-0 text-ink/50" />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
