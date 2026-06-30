import { floorClipPath, FLOOR_TOP_PCT, BACK_LEFT_PCT, BACK_RIGHT_PCT } from "./projection";

// Static room surfaces: the back wall and the perspective floor. Sprites
// (door, windows, tables, chef) are layered on top by RestaurantScene. The
// `skin` prop is a hook for future restaurant skins; only "default" exists now.

export type SceneSkin = "default";

const SKINS: Record<SceneSkin, { wallFrom: string; wallTo: string; floor: string; floorEdge: string }> = {
  default: {
    wallFrom: "#fff3da",
    wallTo: "#f6e4bf",
    floor: "#e7b986",
    floorEdge: "#caa06b",
  },
};

export function SceneBackdrop({ skin = "default" }: { skin?: SceneSkin }) {
  const s = SKINS[skin];
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
