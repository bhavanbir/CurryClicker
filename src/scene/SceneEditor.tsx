import { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { DECORATIONS } from "../engine/shopData";
import { WALL_SLOTS } from "./walls";
import { SKIN_ORDER, SKINS } from "./skins";
import { Icon } from "../components/arcade/Icon";
import { PixelIcon } from "../components/PixelIcon";
import { IS_DEMO } from "../target";

// In-scene "Decorate" mode: pick an owned decoration from the tray, then tap a
// floor cell to drop it (snapped to the grid). Also swaps the restaurant skin.
// Placed items are removed by tapping them (handled by DecorationLayer).

export function SceneEditor({ onClose }: { onClose: () => void }) {
  const owned = useGameStore((s) => s.ownedDecorations);
  const placements = useGameStore((s) => s.decorationPlacements);
  const activeSkin = useGameStore((s) => s.activeSkin);
  const placeDecoration = useGameStore((s) => s.placeDecoration);
  const setActiveSkin = useGameStore((s) => s.setActiveSkin);

  const [selected, setSelected] = useState<string | null>(null);

  const remainingOf = (id: string) =>
    (owned[id] ?? 0) - placements.filter((p) => p.decorationId === id).length;

  const ownedDecos = DECORATIONS.filter((d) => (owned[d.id] ?? 0) > 0);
  const occupied = new Set(placements.map((p) => p.col));

  function placeAt(slotIndex: number) {
    if (!selected) return;
    const ok = placeDecoration(selected, slotIndex, 0);
    if (ok && remainingOf(selected) - 1 <= 0) setSelected(null);
  }

  return (
    <>
      {/* Free wall slots — only while a decoration is selected. */}
      {selected &&
        WALL_SLOTS.map((slot, i) =>
          occupied.has(i) ? null : (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                placeAt(i);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-ink/50 bg-white/40 hover:border-primary hover:bg-primary/40"
              style={{
                left: `${slot.xPct}%`,
                top: `${slot.yPct}%`,
                width: Math.round(22 * slot.scale + 8),
                height: Math.round(22 * slot.scale + 8),
                zIndex: 3000,
              }}
              aria-label={`Place on wall spot ${i + 1}`}
            />
          ),
        )}

      {/* Bottom control panel. */}
      <div
        className="absolute inset-x-0 bottom-0 border-t-4 border-ink bg-cream/95 p-2.5 backdrop-blur-sm"
        style={{ zIndex: 4000 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-sm font-black uppercase text-ink">
            {selected ? "Tap a wall spot to place" : "Decorate your shop"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="arcade-btn flex items-center gap-1 bg-primary px-2.5 py-1 text-xs uppercase text-white"
          >
            <Icon name="check" size={16} /> Done
          </button>
        </div>

        {/* Owned decorations tray */}
        {ownedDecos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {ownedDecos.map((d) => {
              const left = remainingOf(d.id);
              const isSel = selected === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={left <= 0 && !isSel}
                  onClick={() => setSelected(isSel ? null : d.id)}
                  title={d.name}
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink ${d.tone} ${
                    isSel ? "ring-4 ring-primary" : ""
                  } disabled:opacity-40`}
                >
                  <PixelIcon id={d.id} icon={d.icon} size={32} iconClassName="text-ink" />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-white px-0.5 text-[9px] font-black text-ink">
                    {left}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-1 text-xs font-semibold text-ink/60">
            Buy decorations in the Store, then place them here.
          </p>
        )}

        {/* Skin picker */}
        <div className="mt-2 flex items-center gap-2 border-t-2 border-ink/15 pt-2">
          <span className="text-[10px] font-black uppercase tracking-wide text-ink/55">Skin</span>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {SKIN_ORDER.map((id) => {
              const pal = SKINS[id];
              const active = activeSkin === id;
              const steamLocked = IS_DEMO && id !== "default";
              return (
                <button
                  key={id}
                  type="button"
                  disabled={steamLocked}
                  onClick={() => setActiveSkin(id)}
                  title={
                    steamLocked
                      ? `${pal.label} — available in the full game on Steam`
                      : pal.label
                  }
                  className={`flex h-7 items-center gap-1 rounded-md border-2 px-1.5 ${
                    steamLocked
                      ? "cursor-not-allowed border-dashed border-ink/40 opacity-60 grayscale"
                      : "border-ink"
                  } ${active ? "ring-2 ring-primary" : ""}`}
                  style={{ background: `linear-gradient(${pal.wallFrom}, ${pal.floor})` }}
                >
                  <span className="flex items-center gap-0.5 rounded bg-white/70 px-1 text-[9px] font-black text-ink">
                    {steamLocked && <Icon name="lock" fill size={10} />}
                    {pal.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
