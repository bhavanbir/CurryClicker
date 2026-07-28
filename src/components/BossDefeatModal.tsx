import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { formatCurry } from "../lib/format";
import { INGREDIENTS } from "../engine/ingredients";
import { RARITY_OF } from "../engine/gacha";
import { rarityColor, rarityFx } from "./gacha/rarityFx";
import { PixelIcon } from "./PixelIcon";
import { Icon } from "./arcade/Icon";

// The week's obituary. Purely informational — resolveBossLoss already committed
// the wipe and rolled the week back to day 1; this just explains what happened
// and hands back the one roll that made it out.
export function BossDefeatModal() {
  const defeat = useGameStore((s) => s.bossDefeat);
  const dismiss = useGameStore((s) => s.dismissBossDefeat);
  if (!defeat) return null;

  const dealt = Math.max(0, defeat.maxHp - defeat.hpLeft);
  const kept = defeat.kept;
  const rarity = kept ? RARITY_OF[kept.ingredientId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-md p-6"
      >
        <div className="flex items-center gap-2">
          <Icon
            name="local_fire_department"
            className="text-tier-terrible"
            fill
            size={32}
          />
          <h2 className="font-display text-2xl font-black uppercase text-ink">
            The Boss Won
          </h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-ink/50">
          Closing bell, and it's still hungry.
        </p>

        <div className="mt-5 rounded-lg border-4 border-ink bg-tier-terrible p-4 text-center shadow-arcade">
          <div className="text-xs font-bold uppercase tracking-wide text-white/70">
            Damage dealt
          </div>
          <div className="font-display text-4xl font-black text-white text-stroke-ink">
            {formatCurry(dealt, 1)}
          </div>
          <div className="mt-1 text-xs font-bold text-white/70">
            of {formatCurry(defeat.maxHp, 1)} HP · {formatCurry(defeat.score, 1)}{" "}
            curry this week
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {["This week's score", "Your skill tree", "All but one ingredient"].map(
            (loss) => (
              <div
                key={loss}
                className="flex items-center gap-2 rounded px-3 py-1.5 text-sm odd:bg-cream-100"
              >
                <Icon
                  name="close"
                  size={16}
                  className="shrink-0 text-tier-terrible"
                />
                <span className="font-semibold text-ink/70">{loss}</span>
                <span className="ml-auto font-display font-extrabold uppercase text-ink/40">
                  Gone
                </span>
              </div>
            ),
          )}
        </div>

        {kept && rarity && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border-4 border-ink bg-cream-100 p-3 shadow-arcade">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-4 bg-white"
              style={{ borderColor: rarityColor(rarity) }}
            >
              <PixelIcon
                id={kept.ingredientId}
                icon={INGREDIENTS[kept.ingredientId].icon}
                size={36}
                iconClassName={INGREDIENTS[kept.ingredientId].color}
              />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-ink/50">
                The one that survived
              </div>
              <div className="font-display text-lg font-black uppercase text-ink">
                {INGREDIENTS[kept.ingredientId].name}
              </div>
              <div
                className="text-xs font-black uppercase"
                style={{ color: rarityColor(rarity) }}
              >
                {rarityFx[rarity].label}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="arcade-btn mt-6 flex w-full items-center justify-center gap-2 bg-primary py-3 text-lg uppercase text-white"
        >
          Back to Day 1
          <Icon name="arrow_forward" size={22} />
        </button>
      </motion.div>
    </div>
  );
}
