import { useEffect, useRef, useState } from "react";

// Generic pixel-art sprite-sheet animator.
//
// Renders one frame of a sprite sheet, ground-anchored to its parent's
// bottom-center, and cycles through `frames` at `fps`. Format-agnostic: the
// placeholder SVG sheets and real Kenney PNGs both work as long as the manifest
// describes their frame grid. Sub-pixel art is kept crisp with
// `image-rendering: pixelated`, and `flip` mirrors a sprite to face the other way.

export interface SpriteSheet {
  /** image URL (PNG or SVG) */
  src: string;
  /** source frame width in px */
  frameW: number;
  /** source frame height in px */
  frameH: number;
  /** frames per row in the sheet */
  columns: number;
  /** rows in the sheet */
  rows: number;
}

interface Props {
  sheet: SpriteSheet;
  /** frame indices (row-major) to cycle through; single index = static */
  frames: number[];
  /** animation speed; 0 or single frame = no animation */
  fps?: number;
  /** mirror horizontally (face left) */
  flip?: boolean;
  /** extra size multiplier from perspective projection */
  scale?: number;
  /** screen px per source px */
  pixelScale?: number;
  className?: string;
  title?: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function Sprite({
  sheet,
  frames,
  fps = 0,
  flip = false,
  scale = 1,
  pixelScale = 3,
  className = "",
  title,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const frameRef = useRef(0);

  const animated = frames.length > 1 && fps > 0 && !reduced;

  useEffect(() => {
    if (!animated) {
      setI(0);
      return;
    }
    const id = window.setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames.length;
      setI(frameRef.current);
    }, 1000 / fps);
    return () => window.clearInterval(id);
  }, [animated, fps, frames.length]);

  const frame = frames[Math.min(i, frames.length - 1)] ?? 0;
  const col = frame % sheet.columns;
  const row = Math.floor(frame / sheet.columns);

  const fw = sheet.frameW * pixelScale;
  const fh = sheet.frameH * pixelScale;

  return (
    <div
      title={title}
      className={`pointer-events-none absolute bottom-0 left-1/2 ${className}`}
      style={{
        width: fw,
        height: fh,
        transform: `translateX(-50%) scale(${flip ? -scale : scale}, ${scale})`,
        transformOrigin: "center bottom",
        backgroundImage: `url(${sheet.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheet.columns * fw}px ${sheet.rows * fh}px`,
        backgroundPosition: `${-col * fw}px ${-row * fh}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
