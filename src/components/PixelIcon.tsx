import { Icon } from "./arcade/Icon";

// Pixel-art UI icons (32×32 PNGs in src/assets/icons), keyed by game id.
// Falls back to the Material Symbol glyph when no sprite exists for an id.

const FILES = import.meta.glob("../assets/icons/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// Game id → sprite filename where they differ.
const ALIAS: Record<string, string> = {
  expand_1: "cozy_extension",
  expand_2: "extra_seating",
  expand_3: "dining_hall",
  expand_4: "grand_floor",
  expand_5: "curry_emporium",
  delivery_fleet: "delivery_van",
};

export const UI_SPRITES: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) {
  UI_SPRITES[path.replace(/^.*\/([^/]+)\.png$/, "$1")] = url;
}

export function spriteFor(id: string): string | undefined {
  return UI_SPRITES[ALIAS[id] ?? id];
}

export function PixelIcon({
  id,
  icon,
  size,
  className = "",
  iconClassName = "",
}: {
  id: string; // game id (ingredient/skill node)
  icon: string; // Material Symbols fallback ligature
  size: number;
  className?: string;
  iconClassName?: string; // color class for the glyph fallback
}) {
  const sprite = spriteFor(id);
  return sprite ? (
    <img
      src={sprite}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={`select-none [image-rendering:pixelated] ${className}`}
    />
  ) : (
    <Icon name={icon} fill size={Math.round(size * 0.75)} className={`${iconClassName} ${className}`} />
  );
}
