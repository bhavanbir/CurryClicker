import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { formatCurry } from "../lib/format";
import type { Screen } from "../navigation";
import { Icon } from "./arcade/Icon";
import { ShopPanel } from "./ShopPanel";

// Right-side slide-out shop for quick access while cooking: non-modal on
// desktop (no scrim — keep click-cooking while browsing), modal full-width
// sheet with scrim on mobile. A fixed edge tab opens it when closed. The
// top-menu "Shop" button opens the full-page ShopScreen instead; the actual
// catalogue lives in ShopPanel, shared by both.

export function ShopDrawer({
  open,
  onOpen,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Edge handle — desktop only; BottomNav's Shop button covers mobile */}
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open shop"
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
              aria-label="Shop"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="shop-surface fixed inset-y-0 right-0 z-[47] flex w-full flex-col border-l-4 border-ink shadow-[-8px_0_0_0_rgb(var(--ink))] md:w-[400px]"
            >
              {/* Header — solid band + striped awning so the shop reads as a storefront */}
              <div className="flex items-center gap-2 bg-primary px-4 py-3">
                <Icon name="storefront" fill size={26} className="text-white" />
                <h2 className="font-display text-2xl font-black uppercase text-white text-stroke-ink">
                  Shop
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
                  aria-label="Close shop"
                  className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-white text-ink shadow-arcade-sm transition-transform hover:-translate-y-0.5"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              {/* Awning stripe */}
              <div className="shop-awning h-3 shrink-0 border-b-4 border-t-2 border-ink" />

              <ShopPanel
                onNavigate={(s) => {
                  onClose();
                  onNavigate(s);
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
