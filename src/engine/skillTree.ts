// Skill tree — the whole progression economy in one table. Two layers:
// the three curry branches wipe on weekly prestige, the star meta branch is
// permanent until the real-day full reset.
// Layout is a radial graph: three arms radiating from a decorative hub, with
// star gates spliced in between rings and short bridges linking neighbouring
// arms. Nodes carry polar coords (r, a) — see `nodeXY`.
// Prereqs are OR: a node opens as soon as ANY one of them is owned.
// Names/descriptions are placeholder copy (rewritten later from the copy doc).

export type SkillBranch = "spice" | "service" | "hustle" | "star";

export type NodeKind = "small" | "notable" | "gate";

export type SkillEffect =
  | { type: "click_mult"; value: number }
  | { type: "flat_click"; value: number }
  | { type: "crit_chance"; value: number }
  | { type: "crit_power"; value: number }
  | { type: "fire_gain"; value: number }
  | { type: "spin_discount"; value: number }
  | { type: "luck"; value: number }
  | { type: "expansion"; level: number }
  | { type: "global_mult"; value: number }
  | { type: "head_start"; curry: number };

export interface SkillNode {
  id: string;
  branch: SkillBranch; // "star" = gate: star currency, permanent persistence
  kind: NodeKind;
  cost: number; // curry for the three branches, stars for the meta branch
  r: number; // distance from the hub, in canvas px
  a: number; // angle in degrees (0 = right, 90 = down — screen coords)
  name: string;
  icon: string; // Material Symbols ligature (PixelIcon sprite wins if one exists)
  description: string;
  prereqs: string[]; // OR — owning any one of these unlocks the node
  effect: SkillEffect;
}

// --- Canvas geometry -----------------------------------------------------
// One fixed square the UI pans/zooms around. The hub at the centre is a
// decoration, not a node.

export const CANVAS = 1800;
export const C = CANVAS / 2;

export function nodeXY(n: SkillNode): { x: number; y: number } {
  const rad = (n.a * Math.PI) / 180;
  return { x: C + n.r * Math.cos(rad), y: C + n.r * Math.sin(rad) };
}

// --- Curry branches (reset every prestige) -------------------------------

export const SKILL_NODES: SkillNode[] = [
  // Spice — raw click power. Arm points up (270°).
  { id: "spice_1", branch: "spice", kind: "small", cost: 8_000, r: 100, a: 270, name: "Sharper Knives", icon: "cut", description: "+15% curry per cook", prereqs: [], effect: { type: "click_mult", value: 0.15 } },
  { id: "spice_i1", branch: "spice", kind: "small", cost: 20_000, r: 175, a: 250, name: "Fast Hands", icon: "speed", description: "+8% curry per cook", prereqs: ["spice_1"], effect: { type: "click_mult", value: 0.08 } },
  { id: "spice_2", branch: "spice", kind: "small", cost: 25_000, r: 175, a: 270, name: "Bigger Pot", icon: "soup_kitchen", description: "+5 curry on every cook", prereqs: ["spice_1"], effect: { type: "flat_click", value: 5 } },
  { id: "spice_i2", branch: "spice", kind: "small", cost: 20_000, r: 175, a: 290, name: "Toasted Cumin", icon: "grain", description: "+8% curry per cook", prereqs: ["spice_1"], effect: { type: "click_mult", value: 0.08 } },
  { id: "spice_3", branch: "spice", kind: "notable", cost: 90_000, r: 250, a: 270, name: "Roasting Drum", icon: "local_fire_department", description: "+25% curry per cook", prereqs: ["spice_i1", "spice_2", "spice_i2"], effect: { type: "click_mult", value: 0.25 } },
  // (gate: reputation_1 at r 330)
  { id: "spice_4", branch: "spice", kind: "small", cost: 320_000, r: 410, a: 261, name: "Masala Grinder", icon: "blender", description: "+40 curry on every cook", prereqs: ["reputation_1"], effect: { type: "flat_click", value: 40 } },
  { id: "spice_m3", branch: "spice", kind: "small", cost: 300_000, r: 410, a: 279, name: "Chilli Oil", icon: "water_drop", description: "+10% curry per cook", prereqs: ["reputation_1"], effect: { type: "click_mult", value: 0.1 } },
  { id: "spice_m1", branch: "spice", kind: "small", cost: 340_000, r: 410, a: 243, name: "Wrist Flick", icon: "back_hand", description: "+10% curry per cook", prereqs: ["spice_4"], effect: { type: "click_mult", value: 0.1 } },
  { id: "spice_m4", branch: "spice", kind: "small", cost: 340_000, r: 410, a: 297, name: "Double Ladle", icon: "restaurant_menu", description: "+60 curry on every cook", prereqs: ["spice_m3"], effect: { type: "flat_click", value: 60 } },
  { id: "spice_5", branch: "spice", kind: "notable", cost: 1_100_000, r: 480, a: 270, name: "Tandoor Blast", icon: "whatshot", description: "+40% curry per cook", prereqs: ["spice_4", "spice_m3"], effect: { type: "click_mult", value: 0.4 } },
  // (gate: reputation_2 at r 560)
  { id: "spice_6", branch: "spice", kind: "small", cost: 3_500_000, r: 630, a: 262, name: "Industrial Wok", icon: "factory", description: "+300 curry on every cook", prereqs: ["reputation_2"], effect: { type: "flat_click", value: 300 } },
  { id: "spice_o2", branch: "spice", kind: "small", cost: 2_200_000, r: 630, a: 278, name: "Scorched Base", icon: "outdoor_grill", description: "+12% curry per cook", prereqs: ["reputation_2"], effect: { type: "click_mult", value: 0.12 } },
  { id: "spice_o1", branch: "spice", kind: "small", cost: 2_200_000, r: 630, a: 246, name: "Blur Chop", icon: "fast_forward", description: "+12% curry per cook", prereqs: ["spice_6"], effect: { type: "click_mult", value: 0.12 } },
  { id: "spice_o3", branch: "spice", kind: "small", cost: 2_800_000, r: 630, a: 294, name: "Cauldron Scale", icon: "scale", description: "+500 curry on every cook", prereqs: ["spice_o2"], effect: { type: "flat_click", value: 500 } },
  { id: "spice_7", branch: "spice", kind: "notable", cost: 12_000_000, r: 700, a: 270, name: "Ghost Pepper Reserve", icon: "bolt", description: "+60% curry per cook", prereqs: ["spice_6", "spice_o2"], effect: { type: "click_mult", value: 0.6 } },
  // (crown gate: reputation_3 at r 770)

  // Service — crits and dining room size. Arm points down-right (30°).
  // expand_1/3/5 keep their old ids so the PixelIcon ALIAS sprites resolve.
  { id: "service_1", branch: "service", kind: "small", cost: 10_000, r: 100, a: 30, name: "Attentive Waiters", icon: "adjust", description: "+15% crit circle chance", prereqs: [], effect: { type: "crit_chance", value: 0.15 } },
  { id: "service_i1", branch: "service", kind: "small", cost: 22_000, r: 175, a: 10, name: "Eye Contact", icon: "visibility", description: "+8% crit circle chance", prereqs: ["service_1"], effect: { type: "crit_chance", value: 0.08 } },
  { id: "expand_1", branch: "service", kind: "small", cost: 30_000, r: 175, a: 30, name: "Cozy Extension", icon: "storefront", description: "Grow the dining room", prereqs: ["service_1"], effect: { type: "expansion", level: 1 } },
  { id: "service_i2", branch: "service", kind: "small", cost: 22_000, r: 175, a: 50, name: "Warm Welcome", icon: "waving_hand", description: "+8% crit payout", prereqs: ["service_1"], effect: { type: "crit_power", value: 0.08 } },
  { id: "service_3", branch: "service", kind: "notable", cost: 100_000, r: 250, a: 30, name: "Table Service", icon: "room_service", description: "+25% crit payout", prereqs: ["service_i1", "expand_1", "service_i2"], effect: { type: "crit_power", value: 0.25 } },
  // (gate: head_start_1 at r 330)
  { id: "expand_3", branch: "service", kind: "small", cost: 350_000, r: 410, a: 21, name: "Dining Hall", icon: "domain", description: "A much busier dining room", prereqs: ["head_start_1"], effect: { type: "expansion", level: 3 } },
  { id: "service_m2", branch: "service", kind: "small", cost: 330_000, r: 410, a: 39, name: "Silver Trays", icon: "dinner_dining", description: "+10% crit payout", prereqs: ["head_start_1"], effect: { type: "crit_power", value: 0.1 } },
  { id: "service_m1", branch: "service", kind: "small", cost: 330_000, r: 410, a: 3, name: "Perfect Timing", icon: "schedule", description: "+10% crit circle chance", prereqs: ["expand_3"], effect: { type: "crit_chance", value: 0.1 } },
  { id: "service_m3", branch: "service", kind: "small", cost: 360_000, r: 410, a: 57, name: "Table Reads", icon: "menu_book", description: "+10% crit circle chance", prereqs: ["service_m2"], effect: { type: "crit_chance", value: 0.1 } },
  { id: "service_5", branch: "service", kind: "notable", cost: 1_200_000, r: 480, a: 30, name: "Front of House", icon: "groups", description: "+25% crit circle chance", prereqs: ["expand_3", "service_m2"], effect: { type: "crit_chance", value: 0.25 } },
  // (gate: showstopper at r 560)
  { id: "service_6", branch: "service", kind: "small", cost: 4_000_000, r: 630, a: 22, name: "Showpiece Plating", icon: "restaurant", description: "+60% crit payout", prereqs: ["showstopper"], effect: { type: "crit_power", value: 0.6 } },
  { id: "service_o2", branch: "service", kind: "small", cost: 2_400_000, r: 630, a: 38, name: "Flambé Finish", icon: "local_fire_department", description: "+15% crit payout", prereqs: ["showstopper"], effect: { type: "crit_power", value: 0.15 } },
  { id: "service_o1", branch: "service", kind: "small", cost: 2_400_000, r: 630, a: 6, name: "Sixth Sense", icon: "psychology", description: "+12% crit circle chance", prereqs: ["service_6"], effect: { type: "crit_chance", value: 0.12 } },
  { id: "service_o3", branch: "service", kind: "small", cost: 3_000_000, r: 630, a: 54, name: "Fully Booked", icon: "event_available", description: "+15% crit circle chance", prereqs: ["service_o2"], effect: { type: "crit_chance", value: 0.15 } },
  { id: "expand_5", branch: "service", kind: "notable", cost: 14_000_000, r: 700, a: 30, name: "Curry Emporium", icon: "location_city", description: "Maximum bustle — a packed house", prereqs: ["service_6", "service_o2"], effect: { type: "expansion", level: 5 } },

  // Hustle — the gacha and on-fire economy. Arm points down-left (150°).
  { id: "hustle_1", branch: "hustle", kind: "small", cost: 12_000, r: 100, a: 150, name: "Market Haggling", icon: "sell", description: "Spins cost 10% less", prereqs: [], effect: { type: "spin_discount", value: 0.1 } },
  { id: "hustle_i1", branch: "hustle", kind: "small", cost: 24_000, r: 175, a: 130, name: "Dry Kindling", icon: "fireplace", description: "+10% On Fire earnings", prereqs: ["hustle_1"], effect: { type: "fire_gain", value: 0.1 } },
  { id: "hustle_2", branch: "hustle", kind: "small", cost: 35_000, r: 175, a: 150, name: "Stoked Coals", icon: "local_fire_department", description: "+25% On Fire earnings", prereqs: ["hustle_1"], effect: { type: "fire_gain", value: 0.25 } },
  { id: "hustle_i2", branch: "hustle", kind: "small", cost: 24_000, r: 175, a: 170, name: "Lucky Apron", icon: "checkroom", description: "+0.05 luck on every spin", prereqs: ["hustle_1"], effect: { type: "luck", value: 0.05 } },
  { id: "hustle_3", branch: "hustle", kind: "notable", cost: 110_000, r: 250, a: 150, name: "Supplier Contacts", icon: "casino", description: "+0.15 luck on every spin", prereqs: ["hustle_i1", "hustle_2", "hustle_i2"], effect: { type: "luck", value: 0.15 } },
  // (gate: fortune at r 330)
  { id: "hustle_4", branch: "hustle", kind: "small", cost: 380_000, r: 410, a: 141, name: "Bulk Buying", icon: "percent", description: "Spins cost another 20% less", prereqs: ["fortune"], effect: { type: "spin_discount", value: 0.2 } },
  { id: "hustle_m2", branch: "hustle", kind: "small", cost: 350_000, r: 410, a: 159, name: "Loaded Dice", icon: "shuffle", description: "+0.10 luck on every spin", prereqs: ["fortune"], effect: { type: "luck", value: 0.1 } },
  { id: "hustle_m1", branch: "hustle", kind: "small", cost: 350_000, r: 410, a: 123, name: "Bellows", icon: "air", description: "+15% On Fire earnings", prereqs: ["hustle_4"], effect: { type: "fire_gain", value: 0.15 } },
  { id: "hustle_m3", branch: "hustle", kind: "small", cost: 380_000, r: 410, a: 177, name: "Loyalty Card", icon: "loyalty", description: "Spins cost another 5% less", prereqs: ["hustle_m2"], effect: { type: "spin_discount", value: 0.05 } },
  { id: "hustle_5", branch: "hustle", kind: "notable", cost: 1_300_000, r: 480, a: 150, name: "Roaring Kitchen", icon: "whatshot", description: "+50% On Fire earnings", prereqs: ["hustle_4", "hustle_m2"], effect: { type: "fire_gain", value: 0.5 } },
  // (gate: head_start_2 at r 560)
  { id: "hustle_6", branch: "hustle", kind: "small", cost: 4_500_000, r: 630, a: 142, name: "Import Licence", icon: "auto_awesome", description: "+0.35 luck on every spin", prereqs: ["head_start_2"], effect: { type: "luck", value: 0.35 } },
  { id: "hustle_o2", branch: "hustle", kind: "small", cost: 2_600_000, r: 630, a: 158, name: "Charm Offensive", icon: "handshake", description: "+0.15 luck on every spin", prereqs: ["head_start_2"], effect: { type: "luck", value: 0.15 } },
  { id: "hustle_o1", branch: "hustle", kind: "small", cost: 2_600_000, r: 630, a: 126, name: "Furnace Roar", icon: "flare", description: "+20% On Fire earnings", prereqs: ["hustle_6"], effect: { type: "fire_gain", value: 0.2 } },
  { id: "hustle_o3", branch: "hustle", kind: "small", cost: 3_200_000, r: 630, a: 174, name: "Wholesale Deal", icon: "shopping_cart", description: "Spins cost another 10% less", prereqs: ["hustle_o2"], effect: { type: "spin_discount", value: 0.1 } },
  { id: "hustle_7", branch: "hustle", kind: "notable", cost: 15_000_000, r: 700, a: 150, name: "Empire Logistics", icon: "payments", description: "+1,200 curry on every cook", prereqs: ["hustle_6", "hustle_o2"], effect: { type: "flat_click", value: 1_200 } },

  // Bridges — short hybrid links between neighbouring arms. Each pair points
  // at the other so the route opens from whichever side you arrive on.
  { id: "bridge_ss_1", branch: "spice", kind: "small", cost: 450_000, r: 430, a: 318, name: "Seasoned Service", icon: "merge", description: "+10% curry per cook", prereqs: ["spice_m4", "bridge_ss_2"], effect: { type: "click_mult", value: 0.1 } },
  { id: "bridge_ss_2", branch: "service", kind: "small", cost: 450_000, r: 430, a: 342, name: "Spiced Showmanship", icon: "merge", description: "+10% crit circle chance", prereqs: ["service_m1", "bridge_ss_1"], effect: { type: "crit_chance", value: 0.1 } },
  { id: "bridge_ss_n", branch: "service", kind: "notable", cost: 1_500_000, r: 470, a: 330, name: "Tableside Flambé", icon: "celebration", description: "+30% crit payout", prereqs: ["bridge_ss_1", "bridge_ss_2"], effect: { type: "crit_power", value: 0.3 } },
  { id: "bridge_sh_1", branch: "service", kind: "small", cost: 450_000, r: 430, a: 78, name: "Crowd Work", icon: "diversity_3", description: "+10% crit circle chance", prereqs: ["service_m3", "bridge_sh_2"], effect: { type: "crit_chance", value: 0.1 } },
  { id: "bridge_sh_2", branch: "hustle", kind: "small", cost: 450_000, r: 430, a: 102, name: "Regulars' Table", icon: "diversity_1", description: "+0.10 luck on every spin", prereqs: ["hustle_m1", "bridge_sh_1"], effect: { type: "luck", value: 0.1 } },
  { id: "bridge_sh_n", branch: "hustle", kind: "notable", cost: 1_600_000, r: 470, a: 90, name: "Packed and Blazing", icon: "local_fire_department", description: "+35% On Fire earnings", prereqs: ["bridge_sh_1", "bridge_sh_2"], effect: { type: "fire_gain", value: 0.35 } },
  { id: "bridge_hs_1", branch: "hustle", kind: "small", cost: 450_000, r: 430, a: 198, name: "Coal Contract", icon: "inventory", description: "+12% On Fire earnings", prereqs: ["hustle_m3", "bridge_hs_2"], effect: { type: "fire_gain", value: 0.12 } },
  { id: "bridge_hs_2", branch: "spice", kind: "small", cost: 450_000, r: 430, a: 222, name: "Cheap Chillies", icon: "savings", description: "+10% curry per cook", prereqs: ["spice_m1", "bridge_hs_1"], effect: { type: "click_mult", value: 0.1 } },
  { id: "bridge_hs_n", branch: "spice", kind: "notable", cost: 1_500_000, r: 470, a: 210, name: "Bulk Masala", icon: "warehouse", description: "+400 curry on every cook", prereqs: ["bridge_hs_1", "bridge_hs_2"], effect: { type: "flat_click", value: 400 } },
];

// --- Star gates (permanent) ----------------------------------------------
// Bought with Franchise Stars and never wiped by prestige, so an owned gate
// stays a free-standing anchor: next week you can pick straight up from it.

export const META_NODES: SkillNode[] = [
  { id: "reputation_1", branch: "star", kind: "gate", cost: 2, r: 330, a: 270, name: "Reputation I", icon: "trending_up", description: "Permanent ×1.25 to all curry earned", prereqs: ["spice_3"], effect: { type: "global_mult", value: 1.25 } },
  { id: "reputation_2", branch: "star", kind: "gate", cost: 5, r: 560, a: 270, name: "Reputation II", icon: "trending_up", description: "Permanent ×1.5 to all curry earned", prereqs: ["spice_5"], effect: { type: "global_mult", value: 1.5 } },
  { id: "reputation_3", branch: "star", kind: "gate", cost: 9, r: 770, a: 270, name: "Reputation III", icon: "rocket_launch", description: "Permanent ×2 to all curry earned", prereqs: ["spice_7"], effect: { type: "global_mult", value: 2 } },
  { id: "head_start_1", branch: "star", kind: "gate", cost: 2, r: 330, a: 30, name: "Head Start I", icon: "bolt", description: "Start each week with 500 curry", prereqs: ["service_3"], effect: { type: "head_start", curry: 500 } },
  { id: "showstopper", branch: "star", kind: "gate", cost: 5, r: 560, a: 30, name: "Showstopper", icon: "celebration", description: "+30% crit payout, forever", prereqs: ["service_5"], effect: { type: "crit_power", value: 0.3 } },
  { id: "fortune", branch: "star", kind: "gate", cost: 3, r: 330, a: 150, name: "Fortune's Favour", icon: "casino", description: "+0.2 luck on every spin, forever", prereqs: ["hustle_3"], effect: { type: "luck", value: 0.2 } },
  { id: "head_start_2", branch: "star", kind: "gate", cost: 5, r: 560, a: 150, name: "Head Start II", icon: "bolt", description: "Start each week with 10,000 curry", prereqs: ["hustle_5"], effect: { type: "head_start", curry: 10_000 } },
];

export const SKILL_MAP: Record<string, SkillNode> = Object.fromEntries(
  SKILL_NODES.map((n) => [n.id, n]),
);

export const META_MAP: Record<string, SkillNode> = Object.fromEntries(
  META_NODES.map((n) => [n.id, n]),
);

// --- Edges ---------------------------------------------------------------
// Drawn from the prereq links, deduped: the mutual bridge pairs would
// otherwise emit the same line twice.

export const EDGES: { from: string; to: string }[] = (() => {
  const seen = new Set<string>();
  const edges: { from: string; to: string }[] = [];
  for (const n of [...SKILL_NODES, ...META_NODES]) {
    for (const p of n.prereqs) {
      const key = [n.id, p].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: p, to: n.id });
    }
  }
  return edges;
})();

// --- Prestige scaling ----------------------------------------------------
// Each completed week wipes the curry branches and re-prices them, but bare
// hands cook harder — the base multiplier has to keep pace with the cost curve.

export const PRESTIGE_CLICK_GROWTH = 0.25; // +25% base click per completed week
export const PRESTIGE_CLICK_CAP = 4; // base click tops out at ×4 (prestige 12)
export const SKILL_COST_GROWTH = 1.5; // curry node costs ×1.5^prestige

export function prestigeBaseClick(prestige: number): number {
  return Math.min(1 + PRESTIGE_CLICK_GROWTH * prestige, PRESTIGE_CLICK_CAP);
}

// Star nodes are bought with a currency that never inflates, so they stay flat.
export function nodeCost(n: SkillNode, prestige = 0): number {
  if (n.branch === "star") return n.cost;
  return Math.round(n.cost * Math.pow(SKILL_COST_GROWTH, prestige));
}

// Curry granted at week start from the owned Head Start tier (highest wins).
export function headStartCurry(metaNodes: string[]): number {
  let curry = 0;
  for (const id of metaNodes) {
    const eff = META_MAP[id]?.effect;
    if (eff?.type === "head_start") curry = Math.max(curry, eff.curry);
  }
  return curry;
}

// --- Franchise rank (lifetime stars) -------------------------------------

export const RANK_THRESHOLDS: [number, string][] = [
  [0, "Street Stall"],
  [5, "Corner Kitchen"],
  [15, "Local Favorite"],
  [30, "City Star"],
  [50, "Curry Empire"],
];

export function franchiseRankFor(starsEarned: number): string {
  let title = RANK_THRESHOLDS[0][1];
  for (const [threshold, name] of RANK_THRESHOLDS) {
    if (starsEarned >= threshold) title = name;
  }
  return title;
}
