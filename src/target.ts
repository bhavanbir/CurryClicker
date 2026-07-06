// Build target selection.
//
// One codebase, multiple distributions. The target is chosen at BUILD time via
// the VITE_TARGET env var (see .env.example) — there is no second branch.
//
//   VITE_TARGET=full   (default) — the complete game (online + Steam features)
//   VITE_TARGET=demo            — offline "try the mechanics" web demo:
//                                  online-only screens (Leaderboard, Login) and
//                                  the Cosmetics/IAP store section are hidden,
//                                  and a "get it on Steam" CTA is shown instead.
//
// Everything else (the whole single-player loop) is identical across targets.

type BuildTarget = "full" | "demo";

export const TARGET: BuildTarget =
  import.meta.env.VITE_TARGET === "demo" ? "demo" : "full";

export const IS_DEMO = TARGET === "demo";

// Where the demo's CTAs point. Override per build via VITE_STEAM_URL once the
// store page exists; falls back to the Steam homepage as a safe placeholder.
export const STEAM_URL: string =
  import.meta.env.VITE_STEAM_URL ?? "https://store.steampowered.com/";

// --- Demo gates (all consumers check IS_DEMO; inert in the full build) ---

// Demo pantry: 18 of the base 30. All 5 base rares plus 7 uncommons are
// Steam-locked. Every flavor stays craving-matchable: spicy/mild/savory keep
// 3+ unlocked across 3+ categories, sweet keeps cardamom + cinnamon, and
// unique keeps fenugreek (flavor ties also resolve to unique).
export const DEMO_LOCKED_INGREDIENTS: string[] = [
  "star_anise",
  "saffron",
  "lemongrass",
  "tamarind",
  "garam_masala",
  "cloves",
  "nutmeg",
  "curry_leaf",
  "mustard_seed",
  "paprika",
  "coconut",
  "mint",
];

export const DEMO_LOCKED_INGREDIENT_SET = new Set(DEMO_LOCKED_INGREDIENTS);

// The two cheapest decorations stay purchasable in the demo.
export const DEMO_DECORATIONS: string[] = ["potted_tulsi", "neko"];

// The 5th recipe slot is full-game only.
export const DEMO_MAX_SLOTS = 4;
