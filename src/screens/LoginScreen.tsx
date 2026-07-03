import { useState, type FormEvent } from "react";
import type { Screen } from "../navigation";
import { Icon } from "../components/arcade/Icon";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";

interface Props {
  onNavigate: (s: Screen) => void;
}

// SCAFFOLD: matches the security doc's sign-up/login UX (email + password +
// CAPTCHA), but auth is NOT wired. Submitting shows a notice. The real flow
// (Supabase Auth + Cloudflare Turnstile) is specified in the agent build spec.
export function LoginScreen({ onNavigate }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(
      "Auth isn't wired in this build. See the integration plan: Supabase Auth + Cloudflare Turnstile.",
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <button
        type="button"
        onClick={() => onNavigate("profile")}
        className="flex items-center gap-1 self-start text-sm font-bold text-ink/60"
      >
        <Icon name="arrow_back" size={20} /> Back
      </button>

      <ArcadePanel className="p-6">
        <h1 className="text-center font-display text-2xl font-black uppercase text-ink">
          {mode === "login" ? "Welcome Back, Chef" : "Create Your Kitchen"}
        </h1>

        {/* Mode toggle */}
        <div className="mt-4 flex gap-2">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg border-2 border-ink py-2 text-sm font-black uppercase transition-all ${
                mode === m ? "bg-primary text-white shadow-arcade-sm" : "bg-white text-ink/60"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          {mode === "signup" && (
            <Field
              icon="badge"
              type="text"
              placeholder="Chef name"
              value={displayName}
              onChange={setDisplayName}
            />
          )}
          <Field
            icon="mail"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={setEmail}
          />
          <Field
            icon="lock"
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
          />

          {/* CAPTCHA placeholder */}
          <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-ink/40 bg-cream-50 px-3 py-3 text-xs font-semibold text-ink/55">
            <Icon name="verified_user" size={20} className="text-primary" />
            Cloudflare Turnstile mounts here
          </div>

          {notice && (
            <p
              role="alert"
              className="rounded-lg border-2 border-ink bg-tertiary-fixed px-3 py-2 text-xs font-bold text-ink"
            >
              {notice}
            </p>
          )}

          <ArcadeButton type="submit" variant="primary" size="lg" className="mt-1">
            {mode === "login" ? "Sign In" : "Create Account"}
          </ArcadeButton>
        </form>
      </ArcadePanel>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2.5 focus-within:shadow-arcade-sm">
      <Icon name={icon} size={20} className="text-ink/50" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink/40"
      />
    </label>
  );
}
