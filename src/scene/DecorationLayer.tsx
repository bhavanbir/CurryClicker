import { DECORATION_MAP } from "../engine/shopData";
import { DECOR_SPRITES } from "./decorSprites";
import { Icon } from "../components/arcade/Icon";
import type { Placement } from "../types";

// Renders the player's placed decorations anywhere in the room. Each sits at
// its free x/y position; lower placements draw larger and in front (depth).
// In edit mode a placed item becomes tappable to pick it back up.

// Depth scale from the vertical position: near the back wall ~0.77, at the
// front of the floor ~1.0 — matches the old wall-slot range.
export function depthScale(yPct: number): number {
  return 0.7 + (yPct / 100) * 0.45;
}

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
        if (!deco) return null;
        const scale = depthScale(p.yPct);
        const sprite = DECOR_SPRITES[p.decorationId];
        // pixel art: native ×2 × depth scale (16×16 ≈ the old 32px glyph tile)
        const size = Math.round(34 * scale);
        const w = sprite ? Math.round(sprite.nativeW * 2 * scale) : size;
        const h = sprite ? Math.round(sprite.nativeH * 2 * scale) : size;

        return (
          <div
            key={p.instanceId}
            className="absolute"
            style={{ left: `${p.xPct}%`, top: `${p.yPct}%`, zIndex: Math.round(p.yPct) + 1 }}
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
