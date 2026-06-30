import { useState } from "react";
import { useGameLoop } from "./hooks/useGameLoop";
import { useWeeklySeed } from "./hooks/useWeeklySeed";
import { useGameStore } from "./store/useGameStore";
import type { Screen } from "./navigation";
import { TopBar } from "./components/shell/TopBar";
import { BottomNav } from "./components/shell/BottomNav";
import { GameplayScreen } from "./screens/GameplayScreen";
import { KitchenScreen } from "./screens/KitchenScreen";
import { StoreScreen } from "./screens/StoreScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { WeekSummaryModal } from "./components/WeekSummaryModal";
import { RewardsLayer } from "./components/RewardsLayer";

export default function App() {
  useWeeklySeed();
  useGameLoop();

  const phase = useGameStore((s) => s.phase);
  const [screen, setScreen] = useState<Screen>("gameplay");

  return (
    <div className="min-h-[100dvh] w-full">
      <TopBar screen={screen} onNavigate={setScreen} />

      <main className="mx-auto w-full max-w-container px-3 pb-28 pt-[72px] sm:px-4 md:pb-8">
        {screen === "gameplay" && <GameplayScreen onNavigate={setScreen} />}
        {screen === "kitchen" && <KitchenScreen onNavigate={setScreen} />}
        {screen === "store" && <StoreScreen />}
        {screen === "leaderboard" && <LeaderboardScreen />}
        {screen === "profile" && <ProfileScreen onNavigate={setScreen} />}
        {screen === "settings" && <SettingsScreen onNavigate={setScreen} />}
        {screen === "login" && <LoginScreen onNavigate={setScreen} />}
      </main>

      <BottomNav screen={screen} onNavigate={setScreen} />

      {phase === "week_summary" && <WeekSummaryModal />}
      <RewardsLayer />
    </div>
  );
}
