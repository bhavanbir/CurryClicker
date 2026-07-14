import { useGameStore } from "../store/useGameStore";
import type { SceneSkin } from "../types";
import backdropDefault from "../assets/sprites/scene/backdrop_default.png";
import backdropNeon from "../assets/sprites/scene/backdrop_neon.png";
import backdropZen from "../assets/sprites/scene/backdrop_zen.png";
import backdropMumbai from "../assets/sprites/scene/backdrop_mumbai.png";

// Static room surfaces: one baked 320×192 room PNG per skin (wall + floor +
// counter face), stretched to fill the scene. Sprites (door, windows, tables)
// and the décor layer are layered on top by RestaurantScene. A subtle ambient
// overlay still tracks dayProgress — warm-bright morning → neutral midday →
// amber dusk — code-drawn over the bake so it composes with every skin.

export const BACKDROPS: Record<SceneSkin, string> = {
  default: backdropDefault,
  neon: backdropNeon,
  zen: backdropZen,
  mumbai: backdropMumbai,
};

export function SceneBackdrop({ skin = "default" }: { skin?: SceneSkin }) {
  // ponytail: quantized selector so the backdrop re-renders ~32x/day, not every tick
  const dayProgress = useGameStore((st) => Math.round(st.dayProgress * 32) / 32);
  const morning = Math.max(0, 1 - dayProgress * 2); // fades out by midday
  const evening = Math.max(0, dayProgress * 2 - 1); // fades in after midday
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Baked room shell — wall, floor, counter face, baseboard all in the PNG */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${BACKDROPS[skin]})`,
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
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
    </div>
  );
}
