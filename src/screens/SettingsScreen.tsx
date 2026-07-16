import { useRef, useState, type ReactNode } from "react";
import { useGameStore, SAVE_KEY, SAVE_VERSION } from "../store/useGameStore";
import { WEEK_DURATION_MS } from "../config";
import type { Screen } from "../navigation";
import { Icon } from "../components/arcade/Icon";
import { PageHeader } from "../components/arcade/PageHeader";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { IS_DEMO } from "../target";
import { SteamCta } from "../components/SteamCta";

interface Props {
  onNavigate: (s: Screen) => void;
}

export function SettingsScreen({ onNavigate }: Props) {
  const sfxOn = useGameStore((s) => s.sfxOn);
  const musicOn = useGameStore((s) => s.musicOn);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const setAudio = useGameStore((s) => s.setAudio);
  const darkMode = useGameStore((s) => s.darkMode);
  const toggleDark = useGameStore((s) => s.toggleDark);
  const replayOnboarding = useGameStore((s) => s.replayOnboarding);
  const hardReset = useGameStore((s) => s.hardReset);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "curry-clicker-save.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importSave(file: File) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.state !== "object" ||
        parsed.state === null ||
        typeof parsed.version !== "number" ||
        parsed.version > SAVE_VERSION
      ) {
        throw new Error("bad save");
      }
      localStorage.setItem(SAVE_KEY, raw);
      window.location.reload();
    } catch {
      setImportError("That file isn't a valid Curry Clicker save.");
    }
  }

  const weekMinutes = Math.round(WEEK_DURATION_MS / 60000);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageHeader title="Settings" />

      {IS_DEMO && (
        <Group title="Demo">
          <p className="text-sm font-semibold text-ink/70">
            You're playing the free offline demo — progress saves to this browser.
            Steam achievements and rankings live in the full game.
          </p>
          <SteamCta label="Get the full game on Steam" />
        </Group>
      )}

      <Group title="Sound">
        <ToggleRow
          icon="volume_up"
          label="Sound effects"
          on={sfxOn}
          onToggle={() => setAudio({ sfxOn: !sfxOn })}
        />
        <VolumeRow
          value={sfxVolume}
          disabled={!sfxOn}
          onChange={(v) => setAudio({ sfxVolume: v })}
        />
        <ToggleRow
          icon="music_note"
          label="Music"
          on={musicOn}
          onToggle={() => setAudio({ musicOn: !musicOn })}
        />
        <VolumeRow
          value={musicVolume}
          disabled={!musicOn}
          onChange={(v) => setAudio({ musicVolume: v })}
        />
      </Group>

      <Group title="Game">
        <Row icon="schedule" label="Week length" value={`${weekMinutes} min`} />
        <ToggleRow
          icon="dark_mode"
          label="Dark mode"
          on={darkMode}
          onToggle={toggleDark}
        />
        <ArcadeButton
          size="lg"
          className="w-full"
          onClick={() => {
            replayOnboarding();
            onNavigate("gameplay");
          }}
        >
          <Icon name="replay" size={20} />
          Replay Tutorial
        </ArcadeButton>
      </Group>

      <Group title="Data">
        {IS_DEMO ? (
          <>
            <p className="text-sm font-semibold text-ink/70">
              Bring your restaurant to the full game — export your save here,
              then import it on Steam. Nothing is lost.
            </p>
            <ArcadeButton size="lg" className="w-full" onClick={exportSave}>
              <Icon name="download" size={20} />
              Export Save
            </ArcadeButton>
          </>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importSave(file);
                e.target.value = "";
              }}
            />
            <ArcadeButton
              size="lg"
              className="w-full"
              onClick={() => {
                setImportError(null);
                fileRef.current?.click();
              }}
            >
              <Icon name="upload" size={20} />
              Import Save
            </ArcadeButton>
            {importError && (
              <p className="text-sm font-bold text-tier-terrible">{importError}</p>
            )}
          </>
        )}
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
              <ArcadeButton
                size="lg"
                className="flex-1"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </ArcadeButton>
              <ArcadeButton
                variant="danger"
                size="lg"
                className="flex-1"
                onClick={() => {
                  hardReset();
                  setConfirmReset(false);
                  onNavigate("gameplay");
                }}
              >
                Wipe It
              </ArcadeButton>
            </div>
          </div>
        )}
      </Group>

      <Group title="Legal">
        <LinkRow
          icon="policy"
          label="Privacy Policy"
          href="https://github.com/bhavanbir/CurryClicker/blob/main/PRIVACY.md"
        />
        <LinkRow
          icon="gavel"
          label="Terms of Service"
          href="https://github.com/bhavanbir/CurryClicker/blob/main/TERMS.md"
        />
        <LinkRow
          icon="license"
          label="Third-Party Licenses"
          href="https://github.com/bhavanbir/CurryClicker/blob/main/public/THIRD-PARTY-LICENSES.txt"
        />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ArcadePanel as="section" className="flex flex-col gap-3 p-4">
      <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink/60">
        {title}
      </h2>
      {children}
    </ArcadePanel>
  );
}

// External links: in the browser these open a new tab; in the desktop build
// window.open is intercepted and routed to the system browser (electron/main.cjs).
function LinkRow({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg py-0.5 transition-colors hover:bg-cream-100"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name={icon} size={20} className="text-primary" />
        {label}
      </span>
      <Icon name="open_in_new" size={18} className="text-ink/50" />
    </a>
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

function VolumeRow({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.05}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Volume"
      className={`h-3 w-full cursor-pointer appearance-auto rounded-full accent-primary ${
        disabled ? "opacity-40" : ""
      }`}
    />
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
