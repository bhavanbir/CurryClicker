import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths so the Electron build can load from file://.
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
