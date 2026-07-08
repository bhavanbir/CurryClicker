import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { formatCurry } from "../lib/format";
import { getSteamPlayerName } from "../lib/desktop";
import { getDailyRivals, placementFor, RIVAL_COUNT } from "../engine/dailyRivals";
import { Icon } from "../components/arcade/Icon";
import { ArcadePanel } from "../components/arcade/ArcadePanel";

// Daily leaderboard: your Steam persona vs the day's 100 NPC rival chefs,
// reset at local midnight. Yesterday's finish becomes a profile trophy.
// ponytail: NPC rivals until real Steam leaderboards — see electron/steam.cjs.
export function LeaderboardScreen() {
  const dailyCurry = useGameStore((s) => s.dailyCurry);
  const dateId = useGameStore((s) => s.dateId);
  const seed = useGameStore((s) => s.seed);
  const highScore = useGameStore((s) => s.highScore);
  const [steamName, setSteamName] = useState<string | null>(null);

  useEffect(() => {
    void getSteamPlayerName().then(setSteamName);
  }, []);

  const rivals = getDailyRivals(seed, highScore);
  const rank = placementFor(dailyCurry, rivals);

  // Show the podium plus the rivals directly around the player.
  const yourRow = {
    rank,
    name: steamName ?? "You",
    score: dailyCurry,
    you: true,
  };
  const board = [
    ...rivals.map((r, i) => ({ rank: i + (i + 1 >= rank ? 2 : 1), name: r.name, score: r.score, you: false })),
    yourRow,
  ].sort((a, b) => a.rank - b.rank);
  const nearYou = board.filter(
    (r) => r.rank <= 3 || Math.abs(r.rank - rank) <= 2,
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ArcadePanel className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-ink bg-tertiary-fixed px-4 py-3">
          <h1 className="flex items-center gap-2 font-display text-2xl font-black uppercase text-ink">
            <Icon name="emoji_events" fill size={28} className="text-primary" />
            Today's Top Chefs
          </h1>
          <span className="rounded-full border-2 border-ink bg-primary px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-arcade-sm">
            {dateId}
          </span>
        </div>

        {/* Your standing */}
        <div className="flex items-center justify-between border-b-2 border-ink/20 bg-cream-100 px-4 py-2 text-sm font-bold text-ink/70">
          <span>
            Your rank: <span className="text-primary">#{rank}</span> of{" "}
            {RIVAL_COUNT + 1}
          </span>
          <span>Resets at midnight — finish high to earn a trophy!</span>
        </div>

        {/* Rows: podium + the pack around you */}
        <div className="flex flex-col gap-2 p-3">
          {nearYou.map((r) => (
            <div
              key={`${r.rank}-${r.name}`}
              className={`flex items-center gap-3 rounded-lg border-2 border-ink p-3 shadow-arcade-sm ${
                r.you ? "bg-primary/15" : "bg-white"
              }`}
            >
              <div className="w-10 text-center font-display text-2xl font-black text-ink">
                {r.rank}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-cream-100">
                <Icon
                  name={r.you ? "person" : "account_circle"}
                  fill
                  size={26}
                  className={r.you ? "text-primary" : "text-ink/70"}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-extrabold text-ink">
                  {r.name}
                </div>
                {r.you && (
                  <div className="truncate text-xs font-semibold text-ink/55">
                    That's you — curry cooked today
                  </div>
                )}
              </div>
              <div className="text-right font-display font-black tabular-nums text-ink">
                {formatCurry(r.score, 1)}
              </div>
            </div>
          ))}
        </div>
      </ArcadePanel>
    </div>
  );
}
