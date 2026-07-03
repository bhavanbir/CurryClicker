import { useGameStore } from "../store/useGameStore";
import { formatCurry } from "../lib/format";
import { SAMPLE_RANKS, type RankRow } from "../data/sampleData";
import { Icon } from "../components/arcade/Icon";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";

// SCAFFOLD: standings are static sample data standing in for the Supabase
// leaderboard query + Realtime subscription (see agent build spec, backend
// work-units). The player's live weekCurry is spliced in as "You".
export function LeaderboardScreen() {
  const weekCurry = useGameStore((s) => s.weekCurry);

  const you: RankRow = {
    rank: 42,
    name: "You",
    title: "Rising Star",
    score: formatCurry(weekCurry, 1),
    you: true,
  };
  const rows = [...SAMPLE_RANKS, you];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ArcadePanel className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-ink bg-tertiary-fixed px-4 py-3">
          <h1 className="flex items-center gap-2 font-display text-2xl font-black uppercase text-ink">
            <Icon name="emoji_events" fill size={28} className="text-primary" />
            Top Chefs
          </h1>
          <span className="rounded-full border-2 border-ink bg-primary px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-arcade-sm">
            Season 4
          </span>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2 p-3">
          {rows.map((r) => (
            <div
              key={r.rank}
              className={`flex items-center gap-3 rounded-lg border-2 border-ink p-3 shadow-arcade-sm ${
                r.you ? "bg-primary/15" : "bg-white"
              }`}
            >
              <div className="w-8 text-center font-display text-2xl font-black text-ink">
                {r.rank}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-cream-100">
                <Icon name="account_circle" fill size={26} className="text-ink/70" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-extrabold text-ink">
                  {r.name}
                </div>
                {r.title && (
                  <div className="truncate text-xs font-semibold text-ink/55">
                    {r.title}
                  </div>
                )}
              </div>
              <div className="text-right font-display font-black tabular-nums text-ink">
                {r.score}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-4 border-ink p-3">
          <ArcadeButton variant="primary" size="lg" disabled className="w-full">
            <Icon name="refresh" size={22} />
            Refresh Standings
          </ArcadeButton>
        </div>
      </ArcadePanel>
    </div>
  );
}
