import { STEAM_URL } from "../target";
import { Icon } from "./arcade/Icon";

// Demo-build call-to-action: nudges players from the free offline web demo to
// the full game on Steam. Rendered only when IS_DEMO (callers gate it).
export function SteamCta({
  label = "Wishlist on Steam",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={STEAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`arcade-btn flex items-center justify-center gap-2 bg-ink py-3 uppercase text-white ${className}`}
    >
      <Icon name="videogame_asset" size={22} />
      {label}
    </a>
  );
}

export function SteamLockChip({ className = "" }: { className?: string }) {
  return (
    <span
      title="Available in the full game on Steam"
      className={`flex items-center gap-0.5 rounded border-2 border-dashed border-ink/40 bg-cream-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-ink/55 ${className}`}
    >
      <Icon name="lock" fill size={11} />
      Steam
    </span>
  );
}
