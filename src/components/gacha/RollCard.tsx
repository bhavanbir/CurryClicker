import {
  floatBand,
  modMagnitude,
  type ModType,
  type RolledIngredient,
  type RolledMod,
} from "../../engine/gacha";
import { INGREDIENTS } from "../../engine/ingredients";
import { PixelIcon } from "../PixelIcon";
import { rarityColor, rarityFx } from "./rarityFx";

// One rolled ingredient, two densities: the reveal hero and the inventory tile.
// The float bar is the point — it's the CS:GO wear number made visible.

const MOD_LABEL: Record<ModType, string> = {
  click_mult: "Click power",
  flat_click: "Flat click",
  crit_chance: "Crit chance",
  crit_power: "Crit power",
  fire_gain: "Fire gain",
  spin_discount: "Spin discount",
};

function modValue(mod: RolledMod, roll: RolledIngredient): string {
  const mag = modMagnitude(mod, roll.rarity);
  return mod.type === "flat_click"
    ? `+${Math.round(mag)}`
    : `+${(mag * 100).toFixed(1)}%`;
}

function FloatBar({ float, color }: { float: number; color: string }) {
  return (
    <span className="block h-[4px] w-full rounded-full bg-ink/15">
      <span
        className="block h-full rounded-full"
        style={{ width: `${float * 100}%`, backgroundColor: color }}
      />
    </span>
  );
}

interface Props {
  roll: RolledIngredient;
  compact?: boolean;
  equipped?: boolean;
  selected?: boolean; // combine mode: picked for the trade-up
  onClick?: () => void;
}

export function RollCard({ roll, compact, equipped, selected, onClick }: Props) {
  const ing = INGREDIENTS[roll.ingredientId];
  const fx = rarityFx[roll.rarity];
  const color = rarityColor(roll.rarity);
  const curry = roll.rarity === "currylicious";

  // Inset rarity ring, so the frame border stays the shared arcade ink line.
  const frame = "arcade-box relative overflow-hidden ring-2 ring-inset";
  const ringStyle = { "--tw-ring-color": color } as React.CSSProperties;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${frame} flex flex-col items-center gap-1 p-2 text-left transition-transform hover:-translate-y-0.5 ${
          selected ? "ring-4 -translate-y-0.5" : ""
        }`}
        style={ringStyle}
        title={`${ing?.name ?? roll.ingredientId} — ${fx.label}`}
      >
        {curry && <span className="rarity-curry-surface absolute inset-x-0 top-0 h-[6px]" />}
        {selected && (
          <span
            className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white"
            style={{ backgroundColor: color }}
          >
            ✓
          </span>
        )}
        {equipped && (
          <span
            className="absolute right-1 top-1 rounded px-1 text-[8px] font-black uppercase text-white"
            style={{ backgroundColor: color }}
          >
            On
          </span>
        )}
        <PixelIcon id={roll.ingredientId} icon={ing?.icon ?? "restaurant"} size={34} />
        <span className="w-full truncate text-center text-[10px] font-bold leading-tight text-ink">
          {ing?.name ?? roll.ingredientId}
        </span>
        <span className="flex w-full flex-col gap-[3px]">
          {roll.mods.map((m) => (
            <FloatBar key={m.type} float={m.float} color={color} />
          ))}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`${frame} w-full p-3 ${onClick ? "cursor-pointer" : ""}`}
      style={ringStyle}
      onClick={onClick}
    >
      {curry && <span className="rarity-curry-surface absolute inset-x-0 top-0 h-[6px]" />}

      <div className={`flex items-center gap-3 ${curry ? "pt-1" : ""}`}>
        <PixelIcon id={roll.ingredientId} icon={ing?.icon ?? "restaurant"} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-black uppercase leading-tight text-ink">
            {ing?.name ?? roll.ingredientId}
          </p>
          <span
            className="mt-1 inline-block rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
            style={{ backgroundColor: color }}
          >
            {fx.label}
          </span>
        </div>
        {equipped && (
          <span className="rounded border-2 border-ink px-2 py-0.5 text-[10px] font-black uppercase text-ink">
            Equipped
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {roll.mods.map((m) => (
          <div key={m.type}>
            <div className="flex items-baseline justify-between gap-2 text-xs font-bold text-ink">
              <span className="uppercase tracking-wide text-ink/70">
                {MOD_LABEL[m.type]}
              </span>
              <span className="tabular-nums">{modValue(m, roll)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <FloatBar float={m.float} color={color} />
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-ink/50">
                {floatBand(m.float)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
