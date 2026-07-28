export type Screen =
  | "gameplay"
  | "gacha"
  | "leaderboard"
  | "profile"
  | "settings"
  | "skills";

export interface NavItem {
  screen: Screen;
  label: string;
  icon: string;
}

import { IS_DEMO } from "./target";

const ALL_NAV: NavItem[] = [
  { screen: "gameplay", label: "Cook", icon: "soup_kitchen" },
  { screen: "skills", label: "Curry Power", icon: "account_tree" },
  { screen: "gacha", label: "Inventory", icon: "casino" },
  { screen: "leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { screen: "profile", label: "Profile", icon: "account_circle" },
];

// Primary nav (top bar on desktop, bottom bar on mobile). The Leaderboard is an
// online feature — hidden in the offline demo build.
export const PRIMARY_NAV: NavItem[] = IS_DEMO
  ? ALL_NAV.filter((item) => item.screen !== "leaderboard")
  : ALL_NAV;
