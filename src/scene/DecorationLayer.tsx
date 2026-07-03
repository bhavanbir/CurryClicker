import { WALL_SLOTS } from "./walls";
import { DECORATION_MAP } from "../engine/shopData";
import { DECOR_SPRITES } from "./decorSprites";
import { Icon } from "../components/arcade/Icon";
import type { Placement } from "../types";

// Renders the player's placed decorations hung on the back and side walls. Each
// sits on its assigned wall slot. In edit mode a placed item becomes tappable to
// pick it back up.

export function DecorationLayer({
  placements,
  editing,
  onPick,
}: {
  placements: Placement[];
  editing: boolean;
  onPick: (instanceId: string) => void;
}) {
  return (
    <>
      {placements.map((p) => {
        const deco = DECORATION_MAP[p.decorationId];
        const slot = WALL_SLOTS[p.col];
        if (!deco || !slot) return null;
        const sprite = DECOR_SPRITES[p.decorationId];
        // pixel art: native ×2 × depth scale (16×16 ≈ the old 32px glyph tile)
        const size = Math.round(34 * slot.scale);
        const w = sprite ? Math.round(sprite.nativeW * 2 * slot.scale) : size;
        const h = sprite ? Math.round(sprite.nativeH * 2 * slot.scale) : size;

        return (
          <div
            key={p.instanceId}
            className="absolute"
            style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%`, zIndex: Math.round(slot.yPct) + 1 }}
          >
            <button
              type="button"
              disabled={!editing}
              onClick={(e) => {
                e.stopPropagation();
                onPick(p.instanceId);
              }}
              title={editing ? `Remove ${deco.name}` : deco.name}
              className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center ${
                sprite ? "" : `rounded-md border-2 border-ink ${deco.tone} shadow-arcade-sm`
              } ${
                editing ? "rounded-md ring-2 ring-primary ring-offset-1 hover:brightness-95" : ""
              }`}
              style={{
                width: w,
                height: h,
                pointerEvents: editing ? "auto" : "none",
              }}
            >
              {sprite ? (
                <img
                  src={sprite.src}
                  width={w}
                  height={h}
                  alt=""
                  draggable={false}
                  className="select-none [image-rendering:pixelated]"
                />
              ) : (
                <Icon name={deco.icon} fill size={Math.round(size * 0.58)} className="text-ink" />
              )}
              {editing && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-ink bg-tier-terrible text-white">
                  <Icon name="close" size={10} />
                </span>
              )}
            </button>
          </div>
        );
      })}
    </>
  );
}
