// Renderer accessor for the Electron preload bridge. Undefined on the web build,
// so every call is optional-chained and no-ops off-desktop.

export interface DesktopBridge {
  readSave(): Promise<string | null>;
  writeSave(data: string): Promise<void>;
  unlockAchievement(id: string): Promise<boolean>;
  submitWeekScore(value: number): Promise<boolean>;
  isSteamAvailable(): Promise<boolean>;
}

declare global {
  interface Window {
    curryDesktop?: DesktopBridge;
  }
}

export function desktop(): DesktopBridge | undefined {
  return typeof window !== "undefined" ? window.curryDesktop : undefined;
}

// Badge id (engine/badges.ts) -> Steam achievement API name. These SCREAMING_SNAKE
// names must match the achievement ids configured in the Steamworks dashboard.
export const ACHIEVEMENT_IDS: Record<string, string> = {
  spicy_boy: "SPICY_BOY",
  curry_king: "CURRY_KING",
  speedster: "SPEEDSTER",
  week_warrior: "WEEK_WARRIOR",
  recipe_master: "RECIPE_MASTER",
  synergy: "SYNERGY_SEEKER",
  combo_king: "COMBO_KING",
  special_collector: "SPECIAL_COLLECTOR",
  streak_master: "STREAK_MASTER",
  curator: "CURATOR",
};

export function unlockAchievement(badgeId: string): void {
  const name = ACHIEVEMENT_IDS[badgeId];
  if (name) void desktop()?.unlockAchievement(name);
}

export function submitWeekScore(value: number): void {
  void desktop()?.submitWeekScore(value);
}
