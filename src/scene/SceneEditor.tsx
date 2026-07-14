import { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { DECORATIONS, DECOR_SETS, DECORATION_MAP, decorSetComplete } from "../engine/shopData";
import { SKIN_ORDER, SKINS } from "./skins";
import { Icon } from "../components/arcade/Icon";
import { PixelIcon } from "../components/PixelIcon";

// In-scene "Decorate" mode: pick an owned decoration from the tray, then tap
// anywhere in the room to drop it there (free placement). Completing a themed
// set pays a permanent cook-value bonus — progress shows in the Sets row.
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

  return (
    <>
      {/* Free-placement layer — tap anywhere in the scene to drop the pick. */}
      {selected && (
        <div
          className="absolute inset-0 cursor-copy"
          style={{ zIndex: 3000 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * 100;
            const yPct = ((e.clientY - rect.top) / rect.height) * 100;
            const ok = placeDecoration(selected, xPct, yPct);
            if (ok && remainingOf(selected) - 1 <= 0) setSelected(null);
          }}
        />
      )}

      {/* Bottom control panel. */}
      <div
        className="absolute inset-x-0 bottom-0 border-t-4 border-ink bg-cream/95 p-2.5 backdrop-blur-sm"
        style={{ zIndex: 4000 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-sm font-black uppercase text-ink">
            {selected ? "Tap anywhere to place" : "Decorate your shop"}
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

        {/* Set bonuses — own every piece of a theme for a permanent boost */}
        <div className="mt-2 flex items-center gap-2 border-t-2 border-ink/15 pt-2">
          <span className="text-[10px] font-black uppercase tracking-wide text-ink/55">Sets</span>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {DECOR_SETS.map((s) => {
              const done = decorSetComplete(s, owned);
              const have = s.pieces.filter((id) => (owned[id] ?? 0) > 0).length;
              return (
                <span
                  key={s.id}
                  title={`${s.name}: ${s.pieces
                    .map((id) => DECORATION_MAP[id]?.name ?? id)
                    .join(" + ")} → ×${s.clickMult} cook value`}
                  className={`flex h-7 shrink-0 items-center gap-1 rounded-md border-2 border-ink px-1.5 text-[9px] font-black uppercase ${
                    done ? "bg-buy text-ink" : "bg-white/70 text-ink/60"
                  }`}
                >
                  {done && <Icon name="star" fill size={12} className="text-primary" />}
                  {s.name} {done ? `×${s.clickMult}` : `${have}/${s.pieces.length}`}
                </span>
              );
            })}
          </div>
        </div>

        {/* Skin picker */}
        <div className="mt-2 flex items-center gap-2 border-t-2 border-ink/15 pt-2">
          <span className="text-[10px] font-black uppercase tracking-wide text-ink/55">Skin</span>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {SKIN_ORDER.map((id) => {
              const pal = SKINS[id];
              const active = activeSkin === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSkin(id)}
                  title={pal.label}
                  className={`flex h-7 items-center gap-1 rounded-md border-2 border-ink px-1.5 ${
                    active ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ background: `linear-gradient(${pal.wallFrom}, ${pal.floor})` }}
                >
                  <span className="rounded bg-white/70 px-1 text-[9px] font-black text-ink">
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
