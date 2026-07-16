import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useGameLoop } from "./hooks/useGameLoop";
import { useWeeklySeed } from "./hooks/useWeeklySeed";
import { useGameStore, useFeatureUnlocked } from "./store/useGameStore";
import type { Screen } from "./navigation";
import { TopBar } from "./components/shell/TopBar";
import { BottomNav } from "./components/shell/BottomNav";
import { GameplayScreen } from "./screens/GameplayScreen";
import { KitchenScreen } from "./screens/KitchenScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { AffinityJournalScreen } from "./screens/AffinityJournalScreen";
import { FranchiseScreen } from "./screens/FranchiseScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { WeekSummaryModal } from "./components/WeekSummaryModal";
import { DayChoiceModal } from "./components/DayChoiceModal";
import { RewardsLayer } from "./components/RewardsLayer";
import { ShopNotifier } from "./components/ShopNotifier";
import { BadgeNotifier } from "./components/BadgeNotifier";
import { ShopDrawer } from "./components/ShopDrawer";
import { Spotlight } from "./components/Spotlight";
import { RecipeTutorial } from "./components/RecipeTutorial";
import { FeatureIntroLayer } from "./components/FeatureIntroLayer";
import { FeedbackModal } from "./components/FeedbackModal";
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
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const dayStarted = useGameStore((s) => s.dayStarted);
  const [screen, setScreen] = useState<Screen>("gameplay");
  const [shopOpen, setShopOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  // The full-page shop and the side drawer are the same catalogue — never
  // show both at once.
  const navigate = (s: Screen) => {
    if (s === "shop") setShopOpen(false);
    // Tab tour ends where it points: opening the Kitchen starts the day-2
    // recipe tutorial.
    if (s === "kitchen" && tutorialStep === "tabs") setTutorialStep("kitchen");
    setScreen(s);
  };

  // Progressive reveal: day 1 is just the restaurant — nav, shop and side
  // systems stay hidden until the first day is cooked through.
  const chromeHidden = tutorialStep === "start" || tutorialStep === "cook";
  // The shop (page, drawer, notifier) joins the guided week on day 3.
  const shopUnlocked = useFeatureUnlocked("shop");

  // Keep the sound engine in sync with the settings.
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);
  useEffect(() => setSfxVolume(sfxVolume), [sfxVolume]);
  useEffect(() => setMusicVolume(musicVolume), [musicVolume]);
  useEffect(() => setMusicEnabled(musicOn), [musicOn]);

  // The demo build has no online features — coerce any gated screen back to
  // gameplay so a stray navigation can never land on a hidden screen.
  const visibleScreen: Screen =
    IS_DEMO && screen === "leaderboard" ? "gameplay" : screen;

  return (
    <div className="min-h-[100dvh] w-full">
      {!chromeHidden && (
        <TopBar
          screen={visibleScreen}
          onNavigate={navigate}
          onFeedback={() => setFeedbackOpen(true)}
        />
      )}

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
              <GameplayScreen onNavigate={navigate} onOpenShop={() => setShopOpen(true)} />
            )}
            {visibleScreen === "kitchen" && <KitchenScreen onNavigate={navigate} />}
            {visibleScreen === "leaderboard" && !IS_DEMO && <LeaderboardScreen />}
            {visibleScreen === "profile" && <ProfileScreen onNavigate={navigate} />}
            {visibleScreen === "settings" && <SettingsScreen onNavigate={navigate} />}
            {visibleScreen === "journal" && <AffinityJournalScreen onNavigate={navigate} />}
            {visibleScreen === "franchise" && <FranchiseScreen onNavigate={navigate} />}
            {visibleScreen === "shop" && <ShopScreen onNavigate={navigate} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!chromeHidden && <BottomNav screen={visibleScreen} onNavigate={navigate} />}

      {phase === "week_summary" && <WeekSummaryModal onNavigate={navigate} />}
      <DayChoiceModal />
      <RewardsLayer />
      {shopUnlocked && (
        <ShopDrawer
          open={shopOpen}
          onOpen={() => setShopOpen(true)}
          onClose={() => setShopOpen(false)}
          onNavigate={navigate}
        />
      )}
      {shopUnlocked && !shopOpen && (
        <ShopNotifier onOpenShop={() => setShopOpen(true)} />
      )}
      <BadgeNotifier onOpenProfile={() => setScreen("profile")} />
      {tutorialStep === "start" && (
        <Spotlight
          target="start-btn"
          label="👆 Press Start to open your restaurant!"
        />
      )}
      {tutorialStep === "tabs" && !dayStarted && (
        <Spotlight
          target="nav-kitchen"
          label="Day 1 done! Everything's unlocked — open the Kitchen to improve your recipe."
        />
      )}
      {tutorialStep === "kitchen" && visibleScreen === "kitchen" && (
        <RecipeTutorial onDone={() => setTutorialStep("week1")} />
      )}
      <FeatureIntroLayer />
      {IS_DEMO && feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
