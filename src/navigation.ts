export type Screen =
  | "gameplay"
  | "kitchen"
  | "store"
  | "leaderboard"
  | "profile"
  | "settings"
  | "login";

export interface NavItem {
  screen: Screen;
  label: string;
  icon: string;
}

// Primary nav (top bar on desktop, bottom bar on mobile).
export const PRIMARY_NAV: NavItem[] = [
  { screen: "gameplay", label: "Cook", icon: "soup_kitchen" },
  { screen: "kitchen", label: "Kitchen", icon: "skillet" },
  { screen: "store", label: "Store", icon: "storefront" },
  { screen: "leaderboard", label: "Ranks", icon: "leaderboard" },
  { screen: "profile", label: "Chef", icon: "account_circle" },
];
