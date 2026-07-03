// Node module-loader hook used by scripts/balanceSim.ts.
//
// src/config.ts reads `import.meta.env.VITE_WEEK_DURATION_MS` — a Vite-ism
// that is undefined under plain node/tsx and throws at import time. This hook
// wraps tsx's transpile step and rewrites `import.meta.env` to a plain object
// (optionally populated via globalThis.__VITE_ENV) so the engine's config
// defaults apply. Registered via module.register() from the sim script; it
// never touches files on disk.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.source != null) {
    const src =
      typeof result.source === "string"
        ? result.source
        : Buffer.from(result.source).toString("utf8");
    if (src.includes("import.meta.env")) {
      return {
        ...result,
        source: src.replaceAll(
          "import.meta.env",
          "(globalThis.__VITE_ENV ?? {})",
        ),
      };
    }
  }
  return result;
}
