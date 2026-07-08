/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEEK_DURATION_MS?: string;
  readonly VITE_TARGET?: "full" | "demo";
  readonly VITE_STEAM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
