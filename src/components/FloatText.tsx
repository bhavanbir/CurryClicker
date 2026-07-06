export interface Float {
  id: number;
  x: number;
  y: number;
  label: string;
}

// A single rising "+value" particle spawned at the cook position. Pure CSS
// (.float-rise in index.css), same compositor-only approach as ClickBurst.
export function FloatText({ x, y, label }: Omit<Float, "id">) {
  return (
    <div
      style={{ left: x, top: y }}
      className="float-rise pointer-events-none absolute z-30 select-none font-display text-2xl font-black text-primary text-stroke-ink"
    >
      {label}
    </div>
  );
}
