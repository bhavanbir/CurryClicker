/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Spicetone Arcade — light/warm palette from the Stitch mockups.
        // Neutrals AND the loud accents are CSS variables (RGB channels) so
        // `.dark` on <html> can swap the theme and desaturate the accents;
        // quiet accents (great/legendary/rarity/most flavors) stay fixed.
        cream: {
          DEFAULT: "rgb(var(--cream) / <alpha-value>)",
          50: "rgb(var(--cream-50) / <alpha-value>)",
          100: "rgb(var(--cream-100) / <alpha-value>)",
          200: "rgb(var(--cream-200) / <alpha-value>)",
        },
        ink: "rgb(var(--ink) / <alpha-value>)", // near-black for borders + text (light in dark mode)
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          dark: "#e66e00",
          container: "#ff8c00",
          fixed: "#ffdcc3",
        },
        curry: {
          orange: "rgb(var(--curry-orange) / <alpha-value>)",
          yellow: "rgb(var(--curry-yellow) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "rgb(var(--tertiary) / <alpha-value>)",
          fixed: "rgb(var(--tertiary-fixed) / <alpha-value>)",
          container: "#da9f28",
        },
        buy: "rgb(var(--buy) / <alpha-value>)", // green "$ buy" buttons
        tier: {
          terrible: "rgb(var(--tier-terrible) / <alpha-value>)",
          neutral: "#57534e",
          good: "rgb(var(--tier-good) / <alpha-value>)",
          great: "#d97706",
          legendary: "#b45309",
        },
        flavor: {
          spicy: "rgb(var(--flavor-spicy) / <alpha-value>)",
          mild: "#0ea5e9",
          sweet: "#ec4899",
          savory: "#d97706",
          unique: "#a855f7",
        },
        rarity: {
          common: "#d6d3d1",
          uncommon: "#38bdf8",
          rare: "#d946ef",
        },
      },
      // Backgrounds resolve separately from text/borders: bg-white is the panel
      // surface (dark in dark mode) while text-white button labels stay white;
      // bg-ink scrims/chips stay dark while text-ink/border-ink flip light.
      backgroundColor: {
        white: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink-bg) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Montserrat", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        arcade: ['"Press Start 2P"', "monospace"],
      },
      fontSize: {
        "display-score": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "800" }],
        "headline-md": ["20px", { lineHeight: "1.4", fontWeight: "800" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "500" }],
        "label-bold": ["14px", { lineHeight: "1", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "1", fontWeight: "600" }],
      },
      maxWidth: {
        container: "1200px",
      },
      boxShadow: {
        // --shadow stays dark in both themes (--ink flips light in dark mode)
        "arcade-sm": "2px 2px 0 0 rgb(var(--shadow))",
        arcade: "4px 4px 0 0 rgb(var(--shadow))",
        "arcade-lg": "6px 6px 0 0 rgb(var(--shadow))",
        "arcade-xl": "8px 8px 0 0 rgb(var(--shadow))",
      },
      keyframes: {
        "steam-rise": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.7" },
          "100%": { transform: "translateY(-24px) scale(1.4)", opacity: "0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "steam-rise": "steam-rise 1.2s ease-out forwards",
        "pop-in": "pop-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
