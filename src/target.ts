// Build target selection.
//
// One codebase, multiple distributions. The target is chosen at BUILD time via
// the VITE_TARGET env var (see .env.example) — there is no second branch.
//
//   VITE_TARGET=full   (default) — the complete game (online + Steam features)
//   VITE_TARGET=demo            — offline "try the mechanics" web demo:
//                                  the Leaderboard screen and
//                                  the Cosmetics/IAP store section are hidden,
//                                  and a "get it on Steam" CTA is shown instead.
//
// Everything else (the whole single-player loop) is identical across targets.

// Type-only import — erased at build time, so no runtime cycle with gacha.ts
// importing IS_DEMO back.
import type { GachaRarity } from "./engine/gacha";

type BuildTarget = "full" | "demo";

export const TARGET: BuildTarget =
  import.meta.env.VITE_TARGET === "demo" ? "demo" : "full";

export const IS_DEMO = TARGET === "demo";

// Where the demo's CTAs point. Override per build via VITE_STEAM_URL once the
// store page exists; falls back to the Steam homepage as a safe placeholder.
export const STEAM_URL: string =
  import.meta.env.VITE_STEAM_URL ?? "https://store.steampowered.com/";

// --- Demo gates (all consumers check IS_DEMO; inert in the full build) ---

// Legendary and Currylicious pulls are full-game only: the demo's gacha caps
// here (rollRarity downgrades anything above it).
export const DEMO_MAX_RARITY: GachaRarity = "epic";
