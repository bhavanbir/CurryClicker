import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { CustomerView } from "../scene/Customer";
import { seatsForLevel } from "../scene/layout";

// Spawn director + finite-state machine for the dining room. While the shop is
// open and there's curry on the counter, customers arrive, take a free seat,
// eat one dish (freeing a counter slot via `consumeDish`), then leave.
//
// Timing lives here (setTimeout chains); the Customer component only reflects
// the state we hand it. A dish is reserved at spawn so two diners never claim
// the same one and the counter visibly drains as the room fills.
//
// Restaurant Expansion (expansionLevel 0–5) widens the seat pool, raises the
// concurrent-diner cap, and quickens the spawn cadence so a bigger shop bustles.

interface Opts {
  open: boolean;
  dishesAvailable: number;
  consumeDish: () => void;
  /** Fired when a diner finishes eating (not when kicked out at close). */
  onFed?: () => void;
  expansionLevel: number;
  cravingMatched: boolean;
}

export function useCustomerDirector({
  open,
  dishesAvailable,
  consumeDish,
  onFed,
  expansionLevel,
  cravingMatched,
}: Opts): CustomerView[] {
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const reduced = useReducedMotion() ?? false;

  // Live mirrors so the interval callback always sees current values without
  // re-subscribing.
  const customersRef = useRef(customers);
  customersRef.current = customers;
  const dishesRef = useRef(dishesAvailable);
  dishesRef.current = dishesAvailable;
  const openRef = useRef(open);
  openRef.current = open;
  const consumeRef = useRef(consumeDish);
  consumeRef.current = consumeDish;
  const onFedRef = useRef(onFed);
  onFedRef.current = onFed;
  const matchedRef = useRef(cravingMatched);
  matchedRef.current = cravingMatched;

  const timers = useRef<number[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const SEATS = seatsForLevel(expansionLevel);
    const MAX_CUSTOMERS = Math.min(6 + expansionLevel * 2, SEATS.length);
    const WALK = reduced ? 60 : 1500; // keep in sync with Customer WALK_SEC
    const EAT = reduced ? 1500 : 3500;
    // Bigger shops fill faster (floor at 700ms so it never gets frantic).
    const SPAWN_EVERY = Math.max(700, (reduced ? 2600 : 1700) - expansionLevel * 180);

    function spawn() {
      if (!openRef.current || dishesRef.current <= 0) return;
      const current = customersRef.current;
      if (current.length >= MAX_CUSTOMERS) return;

      const taken = new Set(current.map((c) => `${c.seat.u},${c.seat.v}`));
      const free = SEATS.filter((s) => !taken.has(`${s.u},${s.v}`));
      if (free.length === 0) return;

      const seat = free[Math.floor(Math.random() * free.length)];

      // Reserve the dish now (drains the counter, prevents double-claims).
      consumeRef.current();
      dishesRef.current = Math.max(0, dishesRef.current - 1);

      const id = idRef.current++;
      // Snapshot at spawn: this diner reacts to the dish as served, even if the
      // player re-slots the recipe mid-visit.
      const cravingMatched = matchedRef.current;
      // Cosmetic roll: ~1 in 10 diners are expressive and emote above their head.
      const expressive = Math.random() < 0.1;
      setCustomers((list) => [
        ...list,
        { id, seat, state: "entering", reduced, cravingMatched, expressive },
      ]);

      const setState = (state: CustomerView["state"]) =>
        setCustomers((list) =>
          list.map((c) => (c.id === id ? { ...c, state } : c)),
        );

      timers.current.push(
        window.setTimeout(() => setState("eating"), WALK),
        window.setTimeout(() => {
          setState("leaving");
          onFedRef.current?.(); // finished eating — pay up
        }, WALK + EAT),
        window.setTimeout(
          () => setCustomers((list) => list.filter((c) => c.id !== id)),
          WALK + EAT + WALK,
        ),
      );
    }

    const interval = window.setInterval(spawn, SPAWN_EVERY);
    return () => {
      window.clearInterval(interval);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [reduced, expansionLevel]);

  // Closing time: the moment the shop closes (day end, pause, recipe cleared),
  // everyone still inside walks out — cancel their eat/leave chains and reuse
  // the existing "leaving" tween, then despawn once they reach the door.
  useEffect(() => {
    if (open) return;
    const WALK = reduced ? 60 : 1500; // keep in sync with Customer WALK_SEC
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setCustomers((list) =>
      list.length === 0 ? list : list.map((c) => ({ ...c, state: "leaving" })),
    );
    const t = window.setTimeout(() => setCustomers([]), WALK);
    return () => window.clearTimeout(t);
  }, [open, reduced]);

  return customers;
}
