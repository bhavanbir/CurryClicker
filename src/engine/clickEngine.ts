import { formatCurry } from "../lib/format";
import { NO_EFFECTS, type ActiveEffects } from "./effects";

export interface ClickResult {
  value: number;
  floatLabel: string; // pre-formatted "+1.2K" for the FloatText component
}

// Curry earned per cook, before crit/on-fire/day modifiers. Never below 1 —
// a bare-handed chef with nothing equipped still earns something.
export const BASE_CLICK = 10;

export function computeClickValue(e: ActiveEffects = NO_EFFECTS): number {
  return Math.max(
    1,
    Math.floor((BASE_CLICK + e.flatClick) * e.clickMult * e.globalMult),
  );
}

export function handleClick(e: ActiveEffects = NO_EFFECTS): ClickResult {
  const value = computeClickValue(e);
  return { value, floatLabel: "+" + formatCurry(value) };
}
