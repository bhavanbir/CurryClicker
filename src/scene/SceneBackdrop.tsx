import { floorClipPath, FLOOR_TOP_PCT, BACK_LEFT_PCT, BACK_RIGHT_PCT } from "./projection";
import { SKINS } from "./skins";
import { useGameStore } from "../store/useGameStore";
import type { SceneSkin } from "../types";

// Static room surfaces: the back wall and the perspective floor. Sprites
// (door, windows, tables) and the décor layer are layered on top by
// RestaurantScene. The active skin (Phase 4) recolours wall + floor, and a
// subtle ambient overlay tracks dayProgress: warm-bright morning → neutral
// midday → amber dusk. Low-opacity so it composes with every skin.

export function SceneBackdrop({ skin = "default" }: { skin?: SceneSkin }) {
  const s = SKINS[skin];
  // ponytail: quantized selector so the backdrop re-renders ~32x/day, not every tick
  const dayProgress = useGameStore((st) => Math.round(st.dayProgress * 32) / 32);
  const morning = Math.max(0, 1 - dayProgress * 2); // fades out by midday
  const evening = Math.max(0, dayProgress * 2 - 1); // fades in after midday
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Back wall */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${s.wallFrom}, ${s.wallTo})` }}
      />

      {/* Perspective floor */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: floorClipPath(),
          background: `linear-gradient(${s.floorEdge}, ${s.floor})`,
        }}
      />

      {/* Day/night ambient tint */}
      {morning > 0 && (
        <div
          className="absolute inset-0"
          style={{
            opacity: morning,
            background:
              "linear-gradient(to bottom, rgba(255,213,138,0.30), rgba(255,213,138,0.05))",
          }}
        />
      )}
      {evening > 0 && (
        <div
          className="absolute inset-0"
          style={{
            opacity: evening,
            background:
              "linear-gradient(to bottom, rgba(94,52,110,0.20), rgba(224,122,46,0.24))",
          }}
        />
      )}

      {/* Baseboard where the back wall meets the floor */}
      <div
        className="absolute h-[3px] bg-ink/30"
        style={{
          top: `${FLOOR_TOP_PCT}%`,
          left: `${BACK_LEFT_PCT}%`,
          width: `${BACK_RIGHT_PCT - BACK_LEFT_PCT}%`,
        }}
      />
    </div>
  );
}
