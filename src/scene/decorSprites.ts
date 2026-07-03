// Pixel-art wall décor (src/assets/sprites/scene), keyed by decoration id.
// Native sizes come from the art pack's manifest; DecorationLayer scales them
// ×2 × slot.scale so a 16×16 sprite matches the old ~32px glyph tile.

const FILES = import.meta.glob("../assets/sprites/scene/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function url(name: string): string {
  const hit = Object.entries(FILES).find(([p]) => p.endsWith(`/${name}.png`));
  return hit ? hit[1] : "";
}

export interface DecorSprite {
  src: string;
  nativeW: number;
  nativeH: number;
}

// decoration id → sprite (pack filenames differ for a few ids)
const DEFS: [id: string, file: string, w: number, h: number][] = [
  ["neko", "neko", 16, 16],
  ["spatula", "golden_spatula", 16, 32],
  ["spice_rack", "spice_rack", 32, 24],
  ["arcade", "arcade", 16, 32],
  ["tandoor", "tandoor", 32, 24],
  ["shrine", "shrine", 32, 24],
  ["neon_sign", "neon_sign", 32, 16],
  ["auto_ladle", "auto_ladle", 32, 24],
  ["potted_tulsi", "tulsi", 16, 16],
  ["wind_chimes", "wind_chimes", 16, 32],
  ["copper_pots", "copper_pots", 32, 16],
  ["rangoli", "rangoli", 32, 24],
  ["masala_dabba", "masala_dabba", 16, 16],
  ["koi_tank", "koi_tank", 32, 24],
  ["jukebox", "jukebox", 16, 32],
  ["pepper_mill", "pepper_mill", 16, 32],
  ["chandelier", "chandelier", 32, 32],
  ["fountain", "fountain", 48, 48],
  ["elephant_statue", "elephant", 32, 48],
  ["rooftop_garden", "herb_garden", 48, 24],
];

export const DECOR_SPRITES: Record<string, DecorSprite> = Object.fromEntries(
  DEFS.filter(([, file]) => url(file))
    .map(([id, file, nativeW, nativeH]) => [id, { src: url(file), nativeW, nativeH }]),
);
