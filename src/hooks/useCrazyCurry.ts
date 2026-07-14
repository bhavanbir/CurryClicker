import { useEffect, useRef, useState } from "react";
import { playStarAward } from "../lib/sfx";
import { useGameStore } from "../store/useGameStore";
import { DAY_DURATION_SECONDS } from "../config";

// Crazy Curry — random click-rush events. While one is live, every cook made
// above the clicks-per-second floor pays `mult`×; higher floors pay bigger.
// The banner UI lives in GameplayScreen; nothing here is persisted.
// ponytail: tuning constants below, no config system.
const MIN_GAP_MS = 45_000;
const MAX_GAP_MS = 90_000;
const EVENT_MS = 8_000;
const CPS_WINDOW_MS = 2_000; // rolling window for the click-rate estimate
const TIERS = [
  { floor: 3, mult: 1.5 },
  { floor: 5, mult: 2 },
  { floor: 8, mult: 3 },
];

export interface CrazyCurryEvent {
  floor: number; // required clicks per second
  mult: number; // payout multiplier while at/above the floor
  startedAt: number;
  durationMs: number;
}

export function useCrazyCurry(active: boolean) {
  const [event, setEvent] = useState<CrazyCurryEvent | null>(null);
  const [nextEventAt, setNextEventAt] = useState<number | null>(null);
  const [onPace, setOnPace] = useState(false);
  const clicksRef = useRef<number[]>([]);
  const eventRef = useRef(event);
  eventRef.current = event;

  useEffect(() => {
    if (!active) {
      setEvent(null);
      setNextEventAt(null);
      return;
    }
    let timer: number;
    let fired = false; // has an event started since this activation (day)?
    const schedule = () => {
      let gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
      if (!fired) {
        // Guarantee ≥1 event per day: the first gap must fit inside what's
        // left of the day (the default 45–90s gap outlives a 45s day).
        // ponytail: soft guarantee — a recipe built in the day's last ~7s
        // can still miss it; force-fire at day end if players notice.
        const remaining =
          (1 - useGameStore.getState().dayProgress) * DAY_DURATION_SECONDS * 1000;
        gap = Math.max(5_000, Math.min(gap, remaining - EVENT_MS - 2_000));
      }
      setNextEventAt(Date.now() + gap);
      timer = window.setTimeout(() => {
        fired = true;
        const tier = TIERS[Math.floor(Math.random() * TIERS.length)];
        setOnPace(false);
        setNextEventAt(null);
        setEvent({ ...tier, startedAt: Date.now(), durationMs: EVENT_MS });
        playStarAward();
        timer = window.setTimeout(() => {
          setEvent(null);
          schedule();
        }, EVENT_MS);
      }, gap);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [active]);

  /** Record a cook; returns the multiplier this click earned (1 outside events). */
  function registerCook(): number {
    const now = Date.now();
    const clicks = clicksRef.current;
    clicks.push(now);
    while (clicks.length && clicks[0] < now - CPS_WINDOW_MS) clicks.shift();

    const ev = eventRef.current;
    if (!ev) return 1;
    // Rate over time since the event started (min 0.75s) rather than the full
    // window, so the floor is reachable from a standing start.
    const windowStart = Math.max(ev.startedAt, now - CPS_WINDOW_MS);
    const seconds = Math.max(0.75, (now - windowStart) / 1000);
    const cps = clicks.filter((t) => t >= windowStart).length / seconds;
    const ok = cps >= ev.floor;
    setOnPace(ok);
    return ok ? ev.mult : 1;
  }

  return { event, onPace, nextEventAt, registerCook };
}
