import { useEffect, useRef, useState } from "react";

// On Fire — always-on click-momentum meter. Every cook adds heat; heat decays
// slowly while you keep cooking (grace) and fast once you stop. Crossing the
// stage thresholds pays a modest always-on multiplier. Nothing is persisted.
// ponytail: tuning constants below, no config system.
const HEAT_PER_COOK = 8; // meter runs 0..100
const GRACE_MS = 1500; // slow-decay window, refreshed by every cook
const DECAY_SLOW = 10; // heat/sec inside grace (~1.25 cps holds level)
const DECAY_FAST = 45; // heat/sec after grace (full drains in ~2.2s)
const STAGE1 = 50; // ×1.25 "Heating up"
const STAGE2 = 85; // ×1.5 "ON FIRE"
const TICK_MS = 100;

function stageFor(heat: number): 0 | 1 | 2 {
  return heat >= STAGE2 ? 2 : heat >= STAGE1 ? 1 : 0;
}

function multFor(stage: 0 | 1 | 2): number {
  return stage === 2 ? 1.5 : stage === 1 ? 1.25 : 1;
}

export function useOnFire() {
  const [heat, setHeat] = useState(0);
  const heatRef = useRef(0);
  const lastCookAtRef = useRef(0);
  const lastTickAtRef = useRef(0);

  // Apply decay for the time elapsed since the last update.
  function decayTo(now: number): void {
    const dt = (now - lastTickAtRef.current) / 1000;
    lastTickAtRef.current = now;
    if (heatRef.current <= 0 || dt <= 0) return;
    const inGrace = now - lastCookAtRef.current < GRACE_MS;
    const rate = inGrace ? DECAY_SLOW : DECAY_FAST;
    heatRef.current = Math.max(0, heatRef.current - rate * dt);
  }

  useEffect(() => {
    lastTickAtRef.current = Date.now();
    const id = window.setInterval(() => {
      if (heatRef.current <= 0) {
        lastTickAtRef.current = Date.now();
        return; // idle screens stay quiet
      }
      decayTo(Date.now());
      setHeat(heatRef.current);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  /** Record a cook; returns the On Fire multiplier this click earned. */
  function registerCook(): number {
    const now = Date.now();
    decayTo(now);
    heatRef.current = Math.min(100, heatRef.current + HEAT_PER_COOK);
    lastCookAtRef.current = now;
    setHeat(heatRef.current);
    return multFor(stageFor(heatRef.current));
  }

  const stage = stageFor(heat);
  return { heat, stage, mult: multFor(stage), registerCook };
}
