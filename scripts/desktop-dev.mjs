// Dev launcher: run Vite + Electron together with ELECTRON_DEV set, cross-platform
// (avoids shell-specific env syntax). Electron retries the dev URL until Vite is up.
import { spawn } from "node:child_process";

const opts = { stdio: "inherit", shell: true };

const vite = spawn("npx", ["vite", "--port", "5173"], opts);
const electron = spawn("npx", ["electron", "electron/main.cjs"], {
  ...opts,
  env: { ...process.env, ELECTRON_DEV: "1" },
});

function shutdown() {
  vite.kill();
  electron.kill();
  process.exit();
}

electron.on("close", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
