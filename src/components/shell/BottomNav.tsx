import { PRIMARY_NAV, type Screen } from "../../navigation";
import { useFeatureUnlocked } from "../../store/useGameStore";
import { Icon } from "../arcade/Icon";

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

// Mobile-only fixed bottom navigation.
export function BottomNav({ screen, onNavigate }: Props) {
  // Guided week: the Skills tab appears when the skill tree unlocks (day 3).
  const skillsUnlocked = useFeatureUnlocked("skills");
  const nav = PRIMARY_NAV.filter((i) => skillsUnlocked || i.screen !== "skills");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-ink bg-cream shadow-[0_-4px_0_0_#191c1e] md:hidden">
      <div className="flex items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {nav.map((item) => {
          const active = item.screen === screen;
          return (
            <button
              key={item.screen}
              type="button"
              data-tut={item.screen === "gacha" ? "nav-gacha" : undefined}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 transition-all ${
                active ? "text-primary" : "text-ink/55"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  active
                    ? "border-2 border-ink bg-primary text-white shadow-arcade-sm"
                    : ""
                }`}
              >
                <Icon name={item.icon} fill={active} size={22} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
