import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useGameLoop } from "./hooks/useGameLoop";
import { useWeeklySeed } from "./hooks/useWeeklySeed";
import { useGameStore } from "./store/useGameStore";
import type { Screen } from "./navigation";
import { TopBar } from "./components/shell/TopBar";
import { BottomNav } from "./components/shell/BottomNav";
import { GameplayScreen } from "./screens/GameplayScreen";
import { KitchenScreen } from "./screens/KitchenScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { AffinityJournalScreen } from "./screens/AffinityJournalScreen";
import { FranchiseScreen } from "./screens/FranchiseScreen";
import { WeekSummaryModal } from "./components/WeekSummaryModal";
import { RewardsLayer } from "./components/RewardsLayer";
import { ShopNotifier } from "./components/ShopNotifier";
import { BadgeNotifier } from "./components/BadgeNotifier";
import { ShopDrawer } from "./components/ShopDrawer";
import { ChefSpecialPanel } from "./components/ChefSpecialPanel";
import { Onboarding } from "./components/Onboarding";
import {
  setSfxEnabled,
  setSfxVolume,
  setMusicVolume,
  setMusicEnabled,
} from "./lib/sfx";
import { IS_DEMO } from "./target";

export default function App() {
  useWeeklySeed();
  useGameLoop();

  const phase = useGameStore((s) => s.phase);
  const sfxOn = useGameStore((s) => s.sfxOn);
  const musicOn = useGameStore((s) => s.musicOn);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const hasOnboarded = useGameStore((s) => s.hasOnboarded);
  const [screen, setScreen] = useState<Screen>("gameplay");
  const [shopOpen, setShopOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  // Keep the sound engine in sync with the settings.
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);
  useEffect(() => setSfxVolume(sfxVolume), [sfxVolume]);
  useEffect(() => setMusicVolume(musicVolume), [musicVolume]);
  useEffect(() => setMusicEnabled(musicOn), [musicOn]);

  // The demo build has no online features — coerce any gated screen back to
  // gameplay so a stray navigation can never land on a hidden screen.
  const visibleScreen: Screen =
    IS_DEMO && (screen === "leaderboard" || screen === "login")
      ? "gameplay"
      : screen;

  return (
    <div className="min-h-[100dvh] w-full">
      <TopBar
        screen={visibleScreen}
        onNavigate={setScreen}
        onOpenShop={() => setShopOpen(true)}
      />

      <main
        className={`mx-auto w-full max-w-container px-3 pb-28 pt-[72px] transition-[padding] duration-300 sm:px-4 md:pb-8 ${
          shopOpen ? "md:pr-[416px]" : ""
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={visibleScreen}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduced ? 0 : -6,
              transition: { duration: reduced ? 0 : 0.1, ease: "easeIn" },
            }}
            transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
          >
            {visibleScreen === "gameplay" && (
              <GameplayScreen onNavigate={setScreen} onOpenShop={() => setShopOpen(true)} />
            )}
            {visibleScreen === "kitchen" && <KitchenScreen onNavigate={setScreen} />}
            {visibleScreen === "leaderboard" && !IS_DEMO && <LeaderboardScreen />}
            {visibleScreen === "profile" && <ProfileScreen onNavigate={setScreen} />}
            {visibleScreen === "settings" && <SettingsScreen onNavigate={setScreen} />}
            {visibleScreen === "login" && !IS_DEMO && <LoginScreen onNavigate={setScreen} />}
            {visibleScreen === "journal" && <AffinityJournalScreen onNavigate={setScreen} />}
            {visibleScreen === "franchise" && <FranchiseScreen onNavigate={setScreen} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav
        screen={visibleScreen}
        onNavigate={setScreen}
        onOpenShop={() => setShopOpen(true)}
      />

      {phase === "week_summary" && <WeekSummaryModal onNavigate={setScreen} />}
      <RewardsLayer />
      <ChefSpecialPanel onMixIn={() => setScreen("kitchen")} />
      <ShopDrawer
        open={shopOpen}
        onOpen={() => setShopOpen(true)}
        onClose={() => setShopOpen(false)}
      />
      {!shopOpen && <ShopNotifier onOpenShop={() => setShopOpen(true)} />}
      <BadgeNotifier onOpenProfile={() => setScreen("profile")} />
      {!hasOnboarded && <Onboarding />}
    </div>
  );
}
