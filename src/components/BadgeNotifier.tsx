import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { BADGES } from "../engine/badges";
import { playDiscovery } from "../lib/sfx";
import { Icon } from "./arcade/Icon";

// Bottom-right toast when a badge unlocks live (badges were previously silent
// in-app; the Steam achievement popup still fires separately from the store).
// Primed on mount so a returning player's existing badges never flood.
// Structural copy of ShopNotifier; stacked above it (bottom-44 vs bottom-24).

interface Toast {
  id: string;
  name: string;
  icon: string;
}

const VISIBLE = 3;
const DISMISS_MS = 5000;

export function BadgeNotifier({ onOpenProfile }: { onOpenProfile: () => void }) {
  const unlockedBadges = useGameStore((s) => s.unlockedBadges);

  const notified = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!primed.current) {
      unlockedBadges.forEach((id) => notified.current.add(id));
      primed.current = true;
      return;
    }
    const fresh = unlockedBadges.filter((id) => !notified.current.has(id));
    if (fresh.length === 0) return;

    fresh.forEach((id) => notified.current.add(id));
    playDiscovery("legendary");
    const next = fresh.flatMap((id) => {
      const def = BADGES.find((b) => b.id === id);
      return def ? [{ id, name: def.name, icon: def.icon }] : [];
    });
    setToasts((list) => [...list, ...next].slice(-VISIBLE));
    next.forEach((t) => {
      window.setTimeout(
        () => setToasts((list) => list.filter((x) => x.id !== t.id)),
        DISMISS_MS,
      );
    });
  }, [unlockedBadges]);

  return (
    <div className="pointer-events-none fixed bottom-44 right-3 z-[45] flex flex-col items-end gap-2 md:bottom-24">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            initial={{ opacity: 0, x: 48, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            onClick={() => {
              onOpenProfile();
              setToasts((list) => list.filter((x) => x.id !== t.id));
            }}
            className="pointer-events-auto flex items-center gap-2 rounded-lg border-2 border-ink bg-cream px-3 py-2 shadow-arcade-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-curry-yellow">
              <Icon name={t.icon} fill size={20} className="text-ink" />
            </span>
            <span className="text-left">
              <span className="block text-[10px] font-black uppercase tracking-wide text-primary">
                Badge earned!
              </span>
              <span className="block max-w-[40vw] truncate text-sm font-extrabold text-ink">
                {t.name}
              </span>
            </span>
            <Icon name="person" size={18} className="ml-1 shrink-0 text-ink/50" />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
