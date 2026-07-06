import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import { useRecipeScore } from "../hooks/useRecipeScore";
import { getDailyCraving, getWeeklyRumor, rumorRevealedCount } from "../engine/weekEngine";
import { CRAVING_MATCH_BONUS } from "../engine/recipeEngine";
import { INGREDIENTS } from "../engine/ingredients";
import type { CrazyCurryEvent } from "../hooks/useCrazyCurry";
import { FLAVOR_META } from "./FlavorTag";
import { Icon } from "./arcade/Icon";
import { PixelIcon } from "./PixelIcon";

interface Props {
  event: CrazyCurryEvent | null;
  nextEventAt: number | null;
}

// Town Craving + Crazy Curry countdown strip. (Chef's Special moved to the
// ChefSpecialPanel by the shop drawer.) The craving half quiets down to a slim
// green "done" row once matched.
export function TodayStrip({ event, nextEventAt }: Props) {
  const currentDay = useGameStore((s) => s.currentDay);
  const seed = useGameStore((s) => s.seed);
  const rumorClaimed = useGameStore((s) => s.rumorClaimed);
  const score = useRecipeScore();

  const craving = getDailyCraving(currentDay, seed);
  const cravingMeta = FLAVOR_META[craving];
  const matched = score.flavor !== null && score.flavor === craving;
  const rumor = getWeeklyRumor(seed);

  return (
    <div className="arcade-box grid overflow-hidden sm:grid-cols-2">
      <div
        className={`flex min-h-[3rem] items-center px-3 py-2 ${
          matched ? "bg-buy/20" : "bg-cream-100"
        }`}
      >
        {matched ? (
          <Done label="Craving matched" />
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon name="storefront" fill size={14} className="text-primary" />
                <span className="font-display text-[11px] font-black uppercase tracking-wide text-ink">
                  Town Craving
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-md border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-bold text-ink">
                  <Icon name={cravingMeta.icon} className={cravingMeta.text} fill size={14} />
                  {cravingMeta.label}
                </span>
                <span className="rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-black text-primary">
                  ×{CRAVING_MATCH_BONUS}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <CrazyCountdown event={event} nextEventAt={nextEventAt} />

      {/* Weekly Rumor — one guaranteed-legendary combo, one ingredient revealed
          per day. Cook everything on the card (plus extras is fine) to claim. */}
      {rumor && (
        <div
          className={`flex min-h-[3rem] items-center border-t-4 border-ink px-3 py-2 sm:col-span-2 ${
            rumorClaimed ? "bg-buy/20" : "bg-cream-100"
          }`}
        >
          {rumorClaimed ? (
            <Done label="Rumor cooked!" />
          ) : (
            <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Icon name="menu_book" fill size={14} className="text-flavor-unique" />
                <span className="font-display text-[11px] font-black uppercase tracking-wide text-ink">
                  Rumored Recipe
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {rumor.map((id, i) =>
                  i < rumorRevealedCount(rumor, currentDay) ? (
                    <span
                      key={id}
                      className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-white"
                      title={INGREDIENTS[id].name}
                    >
                      <PixelIcon
                        id={id}
                        icon={INGREDIENTS[id].icon}
                        size={32}
                        iconClassName={INGREDIENTS[id].color}
                      />
                    </span>
                  ) : (
                    <span
                      key={id}
                      className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-dashed border-ink/40 text-sm font-black text-ink/40"
                    >
                      ?
                    </span>
                  ),
                )}
              </div>
              <span className="text-[11px] font-semibold text-ink/50">
                A new ingredient leaks each day — cook them all for a payout
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Countdown to the next Crazy Curry rush. Display-only local ticker.
function CrazyCountdown({ event, nextEventAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (nextEventAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [nextEventAt]);

  const secondsLeft =
    nextEventAt !== null ? Math.max(0, Math.ceil((nextEventAt - now) / 1000)) : null;

  return (
    <div
      className={`flex min-h-[3rem] items-center border-t-4 border-ink px-3 py-2 sm:border-l-4 sm:border-t-0 ${
        event ? "bg-curry-yellow/40" : "bg-cream-100"
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Icon name="local_fire_department" fill size={14} className="text-tier-terrible" />
          <span className="font-display text-[11px] font-black uppercase tracking-wide text-ink">
            Crazy Curry
          </span>
        </div>
        {event ? (
          <motion.span
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="rounded border-2 border-ink bg-white px-1.5 py-0.5 text-xs font-black uppercase text-primary"
          >
            Live! ×{event.mult}
          </motion.span>
        ) : secondsLeft !== null ? (
          <span className="text-xs font-bold tabular-nums text-ink/70">
            Next rush in {secondsLeft}s
          </span>
        ) : (
          <span className="text-xs font-bold text-ink/50">
            Start cooking to trigger rushes
          </span>
        )}
      </div>
    </div>
  );
}

function Done({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5"
    >
      <Icon name="check_circle" fill size={16} className="text-ink" />
      <span className="font-display text-xs font-black uppercase tracking-wide text-ink">
        {label}
      </span>
    </motion.div>
  );
}
