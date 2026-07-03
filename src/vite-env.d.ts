/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEEK_DURATION_MS?: string;
  readonly VITE_TARGET?: "full" | "demo";
  readonly VITE_STEAM_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
