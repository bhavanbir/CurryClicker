import { useGameStore } from "../store/useGameStore";
import { formatCurry } from "../lib/format";
import { BADGES } from "../engine/badges";
import { TROPHY_TIERS } from "../engine/dailyRivals";
import { franchiseRankFor } from "../engine/skillTree";
import { DAYS_PER_WEEK } from "../config";
import type { Screen } from "../navigation";
import { Icon } from "../components/arcade/Icon";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { IS_DEMO } from "../target";
import { SteamCta } from "../components/SteamCta";

interface Props {
  onNavigate: (s: Screen) => void;
}

// Stats + badges read from real game state. Identity comes from the local
// Steam account — no separate login.
export function ProfileScreen({ onNavigate }: Props) {
  const totalCurry = useGameStore((s) => s.totalCurryAllTime);
  const highScore = useGameStore((s) => s.highScore);
  const clicksThisWeek = useGameStore((s) => s.clicksThisWeek);
  const currentDay = useGameStore((s) => s.currentDay);
  const unlockedBadges = useGameStore((s) => s.unlockedBadges);
  const ingredientsCollected = useGameStore(
    (s) => new Set(s.gachaInventory.map((r) => r.ingredientId)).size,
  );
  const totalSpins = useGameStore((s) => s.totalSpins);
  const franchiseStarsEarned = useGameStore((s) => s.franchiseStarsEarned);
  const bestFranchiseStars = useGameStore((s) => s.bestFranchiseStars);
  const trophies = useGameStore((s) => s.trophies);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-ink bg-gradient-to-tr from-primary to-tertiary shadow-arcade">
          <Icon name="account_circle" fill size={64} className="text-white" />
        </div>
        <PageHeader title="Guest Chef" subtitle={franchiseRankFor(franchiseStarsEarned)} />
      </div>

      {/* In the offline demo, point players to the full game on Steam. */}
      {IS_DEMO && <SteamCta label="Get the full game on Steam" />}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <ArcadePanel className="col-span-2 flex flex-col items-center p-4">
          <span className="text-xs font-black uppercase tracking-wider text-ink/60">
            Total Curry Made
          </span>
          <span className="font-display text-4xl font-black text-primary text-stroke-ink">
            {formatCurry(totalCurry, 1)}
          </span>
        </ArcadePanel>
        <Stat icon="military_tech" value={formatCurry(highScore, 1)} label="High Score" />
        <Stat icon="touch_app" value={clicksThisWeek.toLocaleString()} label="Cooks / Week" />
        <Stat icon="calendar_today" value={`${currentDay}/${DAYS_PER_WEEK}`} label="Current Day" />
        <Stat
          icon="inventory_2"
          value={ingredientsCollected.toString()}
          label="Ingredients Collected"
        />
        <Stat icon="casino" value={totalSpins.toLocaleString()} label="Total Spins" />
        <Stat
          icon="stars"
          value={franchiseStarsEarned.toLocaleString()}
          label="Stars Today"
          iconBox="bg-violet-100"
          iconColor="text-violet-600"
        />
        <Stat
          icon="trophy"
          value={bestFranchiseStars.toLocaleString()}
          label="Best Stars in a Day"
          iconBox="bg-violet-100"
          iconColor="text-violet-600"
        />
        <ArcadeButton
          className="h-full justify-center"
          size="lg"
          onClick={() => onNavigate("skills")}
        >
          <Icon name="account_tree" fill size={22} className="text-violet-600" />
          Skill Tree
          <Icon name="arrow_forward" size={20} />
        </ArcadeButton>
      </section>

      {/* Daily leaderboard trophies — repeatable counts, one per finish. */}
      <section>
        <h2 className="mb-2 font-display text-xl font-black uppercase text-ink">
          Daily Trophies
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {TROPHY_TIERS.map((t) => {
            const count = trophies[t.key] ?? 0;
            const earned = count > 0;
            return (
              <div
                key={t.key}
                title={`${t.label} daily finishes`}
                className={`flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border-4 p-2 ${
                  earned
                    ? "border-ink bg-white shadow-arcade-sm"
                    : "border-dashed border-ink/40 bg-cream-50 opacity-70"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink ${
                    earned ? "bg-gradient-to-br from-curry-yellow to-primary" : "bg-cream-100"
                  }`}
                >
                  <Icon
                    name={t.icon}
                    fill={earned}
                    size={22}
                    className={earned ? "text-white" : "text-ink/50"}
                  />
                </div>
                <span className="text-center text-[10px] font-bold leading-tight text-ink">
                  {t.label}
                  {earned && <> ×{count}</>}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="mb-2 font-display text-xl font-black uppercase text-ink">Badges</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {BADGES.map((b) => {
            const unlocked = unlockedBadges.includes(b.id);
            return (
              <div
                key={b.id}
                title={b.description}
                className={`flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border-4 p-2 ${
                  unlocked
                    ? "border-ink bg-white shadow-arcade-sm"
                    : "border-dashed border-ink/40 bg-cream-50 opacity-70"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink ${
                    unlocked ? "bg-gradient-to-br from-tertiary to-primary" : "bg-cream-100"
                  }`}
                >
                  <Icon
                    name={unlocked ? b.icon : "lock"}
                    fill={unlocked}
                    size={22}
                    className={unlocked ? "text-white" : "text-ink/50"}
                  />
                </div>
                <span className="text-center text-[10px] font-bold leading-tight text-ink">
                  {b.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  iconBox = "bg-tertiary-fixed",
  iconColor = "text-primary",
}: {
  icon: string;
  value: string;
  label: string;
  iconBox?: string;
  iconColor?: string;
}) {
  return (
    <ArcadePanel shadow="md" className="flex flex-col items-start gap-1 p-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink ${iconBox}`}>
        <Icon name={icon} fill size={18} className={iconColor} />
      </div>
      <span className="font-display text-xl font-black tabular-nums text-ink">{value}</span>
      <span className="text-xs font-bold text-ink/55">{label}</span>
    </ArcadePanel>
  );
}
