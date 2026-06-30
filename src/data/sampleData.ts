// Placeholder content for the scaffolded screens. Shop economy now lives in
// engine/shopData.ts and badges in engine/badges.ts; what remains here is the
// IAP cosmetics preview (Epic E) and the sample leaderboard (Epic D).

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tone: string; // tailwind bg for the icon tile
  cost: string; // "$4.99"
  kind: "curry" | "cash";
}

export const COSMETICS: ShopItem[] = [
  { id: "neon", name: "Neon Night", desc: "Restaurant skin", icon: "nightlight", tone: "bg-purple-200", cost: "$4.99", kind: "cash" },
  { id: "cyberpunk", name: "Cyberpunk Kitchen", desc: "Restaurant skin", icon: "memory", tone: "bg-blue-200", cost: "$6.99", kind: "cash" },
  { id: "zen", name: "Zen Garden Kitchen", desc: "Restaurant skin", icon: "spa", tone: "bg-green-200", cost: "$4.99", kind: "cash" },
  { id: "midnight", name: "Midnight Masala", desc: "Dark UI theme", icon: "dark_mode", tone: "bg-slate-300", cost: "$3.99", kind: "cash" },
];

export interface RankRow {
  rank: number;
  name: string;
  title?: string;
  score: string;
  you?: boolean;
}

// Static sample standings — stands in for the Supabase leaderboard query.
export const SAMPLE_RANKS: RankRow[] = [
  { rank: 1, name: "SpicyBoi99", title: "Master of Masala", score: "14.2B" },
  { rank: 2, name: "GaramGorilla", score: "12.8B" },
  { rank: 3, name: "TikkaTaco", score: "10.1B" },
  { rank: 4, name: "NaanStop", score: "8.9B" },
  { rank: 5, name: "PaneerPanic", score: "6.4B" },
];
