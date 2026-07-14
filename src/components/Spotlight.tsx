import { useEffect, useState } from "react";

// Tutorial spotlight: dims the whole screen except a circle around the target
// element (matched by [data-tut="<target>"]) and floats a caption beside it.
// The dim layer is one giant box-shadow and the overlay ignores pointer
// events, so the highlighted control stays clickable underneath.
export function Spotlight({ target, label }: { target: string; label: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const measure = () => {
      // The nav renders twice (top bar / bottom bar) — pick the visible one.
      let next: DOMRect | null = null;
      document
        .querySelectorAll<HTMLElement>(`[data-tut="${target}"]`)
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) next = r;
        });
      setRect((prev) =>
        prev &&
        next &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width
          ? prev
          : next,
      );
    };
    measure();
    // ponytail: 200ms polling tracks mounts/animations; no observer plumbing
    const id = window.setInterval(measure, 200);
    window.addEventListener("resize", measure);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  if (!rect) return null;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const r = Math.max(rect.width, rect.height) / 2 + 14;
  const below = cy < window.innerHeight / 2;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div
        className="absolute rounded-full border-4 border-curry-yellow transition-all duration-300"
        style={{
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          boxShadow: "0 0 0 200vmax rgba(25, 28, 30, 0.6)",
        }}
      />
      <div
        className="absolute w-max max-w-[280px] -translate-x-1/2 animate-bounce"
        style={{
          left: Math.min(Math.max(cx, 150), window.innerWidth - 150),
          top: below ? cy + r + 14 : undefined,
          bottom: below ? undefined : window.innerHeight - (cy - r) + 14,
        }}
      >
        <span className="block rounded-xl border-4 border-ink bg-white px-4 py-2 text-center font-display text-base font-black uppercase text-ink shadow-arcade">
          {label}
        </span>
      </div>
    </div>
  );
}
