export type Screen =
  | "gameplay"
  | "kitchen"
  | "leaderboard"
  | "profile"
  | "settings"
  | "login"
  | "journal"
  | "franchise";

export interface NavItem {
  screen: Screen;
  label: string;
  icon: string;
}

import { IS_DEMO } from "./target";

const ALL_NAV: NavItem[] = [
  { screen: "gameplay", label: "Cook", icon: "soup_kitchen" },
  { screen: "kitchen", label: "Kitchen", icon: "skillet" },
  { screen: "leaderboard", label: "Ranks", icon: "leaderboard" },
  { screen: "profile", label: "Chef", icon: "account_circle" },
];

// Primary nav (top bar on desktop, bottom bar on mobile). The Leaderboard is an
// online feature — hidden in the offline demo build.
export const PRIMARY_NAV: NavItem[] = IS_DEMO
  ? ALL_NAV.filter((item) => item.screen !== "leaderboard")
  : ALL_NAV;
