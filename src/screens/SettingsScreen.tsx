import { useState, type ReactNode } from "react";
import { useGameStore } from "../store/useGameStore";
import { WEEK_DURATION_MS } from "../config";
import type { Screen } from "../navigation";
import { Icon } from "../components/arcade/Icon";

interface Props {
  onNavigate: (s: Screen) => void;
}

export function SettingsScreen({ onNavigate }: Props) {
  const soundOn = useGameStore((s) => s.soundOn);
  const setSoundOn = useGameStore((s) => s.setSoundOn);
  const hardReset = useGameStore((s) => s.hardReset);
  const [confirmReset, setConfirmReset] = useState(false);

  const weekMinutes = Math.round(WEEK_DURATION_MS / 60000);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="font-display text-3xl font-black uppercase text-ink text-stroke-ink">
        Settings
      </h1>

      <Group title="Account">
        <Row icon="account_circle" label="Signed in as" value="Guest" />
        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="arcade-btn flex w-full items-center justify-center gap-2 bg-primary py-2.5 uppercase text-white"
        >
          <Icon name="login" size={20} />
          Sign In / Create Account
        </button>
      </Group>

      <Group title="Game">
        <ToggleRow
          icon="volume_up"
          label="Sound effects"
          on={soundOn}
          onToggle={() => setSoundOn(!soundOn)}
        />
        <Row icon="schedule" label="Week length (dev)" value={`${weekMinutes} min`} />
        <Row icon="palette" label="Theme" value="Spicetone Arcade" />
      </Group>

      <Group title="Data">
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="arcade-btn flex w-full items-center justify-center gap-2 bg-white py-2.5 uppercase text-tier-terrible"
          >
            <Icon name="delete_forever" size={20} />
            Reset Save
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-tier-terrible">
              This wipes all progress. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="arcade-btn flex-1 bg-white py-2.5 uppercase text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  hardReset();
                  setConfirmReset(false);
                  onNavigate("gameplay");
                }}
                className="arcade-btn flex-1 bg-tier-terrible py-2.5 uppercase text-white"
              >
                Wipe It
              </button>
            </div>
          </div>
        )}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="arcade-box flex flex-col gap-3 p-4">
      <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink/60">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name={icon} size={20} className="text-primary" />
        {label}
      </span>
      <span className="font-display font-extrabold text-ink/70">{value}</span>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  on,
  onToggle,
}: {
  icon: string;
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name={icon} size={20} className="text-primary" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`flex h-7 w-12 items-center rounded-full border-2 border-ink p-0.5 transition-colors ${
          on ? "bg-buy" : "bg-cream-100"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full border-2 border-ink bg-white transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
