// Scene juice — shake + flash driven by direct classList toggles (no rerender,
// and re-adding after a reflow restarts the animation cleanly).
// ponytail: two functions, no juice manager. Reduced motion is checked per call
// so a mid-session OS change is respected without any subscription.

function reduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** Shake `el` by `magPx` pixels. Big moments only — over-juicing reads as noise. */
export function shakeScene(
  el: HTMLElement | null | undefined,
  magPx: number,
  durMs = 340,
): void {
  if (!el || reduced()) return;
  el.classList.remove("shake");
  void el.offsetWidth; // reflow so re-adding restarts the animation
  el.style.setProperty("--shake-mag", `${magPx}px`);
  el.style.setProperty("--shake-dur", `${durMs}ms`);
  el.classList.add("shake");
}

/** One-shot warm flash over `el` (the overlay rests at opacity 0). */
export function flashScene(el: HTMLElement | null | undefined): void {
  if (!el || reduced()) return;
  el.classList.remove("scene-flash");
  void el.offsetWidth;
  el.classList.add("scene-flash");
}
