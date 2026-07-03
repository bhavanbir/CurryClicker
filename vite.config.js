import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig({
    // Relative asset URLs: required for Electron's file:// loading, also
    // makes the demo build portable to itch.io-style subpath hosting.
    base: "./",
    plugins: [react()],
    server: {
        port: 5173,
        open: true,
    },
});
