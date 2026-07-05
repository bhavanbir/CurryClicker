import { motion } from "framer-motion";
import { Sprite } from "./Sprite";
import { project } from "./projection";
import { PIXEL_SCALE, customerAnim } from "./manifest";
import { Icon } from "../components/arcade/Icon";

// A single diner. The director (useCustomerDirector) owns the FSM and timing;
// this component just renders the customer at the position implied by its state
// and tweens between waypoints with Framer Motion.
//
// Lifecycle: enters at the door → walks to a seat → eats (consuming a curry off
// the counter) → walks back to the door → despawns.

/** Floor coord just inside the door where customers enter/exit. */
export const DOOR_FLOOR = { u: 0.5, v: 0.06 };

export type CustomerState = "entering" | "eating" | "leaving";

export interface CustomerView {
  id: number;
  seat: { u: number; v: number };
  state: CustomerState;
  reduced: boolean;
  cravingMatched: boolean;
  expressive: boolean; // ~1 in 10 diners emote above their head
}

/** Walk tween duration, kept in sync with the director's WALK timer. */
const WALK_SEC = 1.5;

const MOOD: Record<CustomerState, { icon: string; bg: string }> = {
  entering: { icon: "restaurant", bg: "bg-curry-yellow" }, // hungry
  eating: { icon: "lunch_dining", bg: "bg-tier-good" }, // tucking in
  leaving: { icon: "sentiment_very_satisfied", bg: "bg-primary" }, // happy
};

// Served during a craving match -> extra-delighted variants (entering is
// unchanged: the customer hasn't tasted anything yet).
const MOOD_MATCHED: Partial<Record<CustomerState, { icon: string; bg: string }>> = {
  eating: { icon: "favorite", bg: "bg-curry-orange" },
  leaving: { icon: "celebration", bg: "bg-curry-yellow" },
};

export function Customer({ c }: { c: CustomerView }) {
  const moving = c.state === "entering" || c.state === "leaving";
  const start = c.state === "entering" ? DOOR_FLOOR : c.seat;
  const target = c.state === "leaving" ? DOOR_FLOOR : c.seat;

  const from = project(start.u, start.v);
  const to = project(target.u, target.v);
  const dur = c.reduced ? 0 : moving ? WALK_SEC : 0;

  // Face the direction of travel; seated diners face the counter (no flip).
  const faceLeft = moving ? to.xPct < from.xPct : c.seat.u > 0.5;

  // Stable palette variant per customer, so the dining room isn't clones.
  const anim = customerAnim(c.id)[moving ? "walk" : "idle"];
  const spriteH = 16 * PIXEL_SCALE * to.scale;
  const delighted = c.cravingMatched && c.state !== "entering";
  const mood = (delighted && MOOD_MATCHED[c.state]) || MOOD[c.state];
  const pulse = delighted && !c.reduced && c.expressive;

  return (
    <motion.div
      className="absolute"
      initial={{ left: `${from.xPct}%`, top: `${from.yPct}%` }}
      animate={{ left: `${to.xPct}%`, top: `${to.yPct}%` }}
      transition={{ duration: dur, ease: "linear" }}
      style={{ zIndex: to.z }}
    >
      {/* mood bubble above the head — only expressive diners emote */}
      {c.expressive && (
        <motion.div
          className={`absolute left-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink ${mood.bg} shadow-arcade-sm`}
          style={{ bottom: spriteH + 4, x: "-50%" }}
          animate={pulse ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={pulse ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
        >
          <Icon name={mood.icon} fill size={12} className="text-ink" />
        </motion.div>
      )}

      {/* craving-match sparkles */}
      {pulse &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute left-1/2 text-curry-yellow"
            style={{ bottom: spriteH + 2, marginLeft: i === 0 ? -16 : 9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [0, -14] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
          >
            <Icon name="star" fill size={10} />
          </motion.span>
        ))}

      <Sprite
        sheet={anim.sheet}
        frames={anim.frames}
        fps={anim.fps}
        scale={to.scale}
        flip={faceLeft}
        pixelScale={PIXEL_SCALE}
      />
    </motion.div>
  );
}
