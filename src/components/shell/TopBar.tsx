import { useGameStore } from "../../store/useGameStore";
import { formatCurry } from "../../lib/format";
import { PRIMARY_NAV, type Screen } from "../../navigation";
import { Icon } from "../arcade/Icon";
import { IS_DEMO } from "../../target";
import logoUrl from "../../assets/logo.png";

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onOpenShop: () => void;
}

export function TopBar({ screen, onNavigate, onOpenShop }: Props) {
  const currentCurry = useGameStore((s) => s.currentCurry);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b-4 border-ink bg-cream shadow-[0_4px_0_0_#191c1e]">
      <div className="mx-auto flex max-w-container items-center justify-between gap-3 px-4 py-2.5">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate("gameplay")}
          className="flex items-center gap-2"
        >
          <img
            src={logoUrl}
            alt=""
            draggable={false}
            className="h-8 w-8 select-none rounded-lg border-2 border-ink shadow-arcade-sm [image-rendering:pixelated]"
          />
          <span className="hidden font-display text-lg font-black uppercase tracking-tight text-ink sm:inline">
            Curry Clicker
          </span>
          {IS_DEMO && (
            <span className="rounded-full border-2 border-ink bg-tertiary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-ink">
              Demo
            </span>
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {PRIMARY_NAV.map((item) => {
            const active = item.screen === screen;
            return (
              <button
                key={item.screen}
                type="button"
                onClick={() => onNavigate(item.screen)}
                className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-all ${
                  active
                    ? "border-ink bg-primary text-white shadow-arcade-sm"
                    : "border-transparent text-ink/70 hover:text-ink"
                }`}
              >
                <Icon name={item.icon} fill={active} size={20} />
                {item.label}
              </button>
            );
          })}
          {/* Store opens the shop drawer, not a route */}
          <button
            type="button"
            onClick={onOpenShop}
            className="flex items-center gap-1.5 rounded-lg border-2 border-transparent px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-ink/70 transition-all hover:text-ink"
          >
            <Icon name="storefront" size={20} />
            Store
          </button>
        </nav>

        {/* Right: curry balance + settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-tertiary-fixed px-3 py-1.5 shadow-arcade-sm">
            <Icon name="star" className="text-primary" fill size={18} />
            <span className="font-display text-sm font-black tabular-nums text-ink">
              {formatCurry(currentCurry, 1)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            aria-label="Settings"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink shadow-arcade-sm transition-all hover:-translate-y-0.5 ${
              screen === "settings" ? "bg-primary text-white" : "bg-white text-ink"
            }`}
          >
            <Icon name="settings" fill={screen === "settings"} size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
