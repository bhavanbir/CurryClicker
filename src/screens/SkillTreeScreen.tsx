import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useGameStore } from "../store/useGameStore";
import {
  C,
  CANVAS,
  EDGES,
  META_MAP,
  META_NODES,
  SKILL_MAP,
  SKILL_NODES,
  nodeCost,
  nodeXY,
  type SkillNode as SkillNodeDef,
} from "../engine/skillTree";
import { IS_DEMO } from "../target";
import { formatCurry } from "../lib/format";
import { Icon } from "../components/arcade/Icon";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { PageHeader } from "../components/arcade/PageHeader";
import { StatChip } from "../components/arcade/StatChip";
import { GraphNode, NODE_SIZE, type NodeState } from "../components/skills/SkillNode";
import { playPurchase } from "../lib/sfx";

const ALL_NODES: SkillNodeDef[] = [...SKILL_NODES, ...META_NODES];
const NODE_BY_ID: Record<string, SkillNodeDef> = { ...SKILL_MAP, ...META_MAP };

// Purely decorative: the hub is not a node, so these spokes have no state.
const HUB_SPOKES = ["spice_1", "service_1", "hustle_1"];

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.1;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Pan range for a given zoom: keep the canvas covering the viewport, or centred
// when it is smaller than the viewport.
function limits(scale: number, w: number, h: number) {
  const spanX = w - CANVAS * scale;
  const spanY = h - CANVAS * scale;
  return {
    left: Math.min(0, spanX),
    right: Math.max(0, spanX),
    top: Math.min(0, spanY),
    bottom: Math.max(0, spanY),
  };
}

// Prereqs are OR: a node opens as soon as any one of them is owned, and an
// owned star gate stays a free-standing anchor after the weekly wipe.
function stateOf(
  n: SkillNodeDef,
  owned: Set<string>,
  ownedMeta: Set<string>,
  union: Set<string>,
  curry: number,
  stars: number,
  cost: number,
): NodeState {
  const star = n.branch === "star";
  if ((star ? ownedMeta : owned).has(n.id)) return "purchased";
  if (star && IS_DEMO) return "locked";
  if (n.prereqs.length > 0 && !n.prereqs.some((p) => union.has(p))) return "locked";
  return (star ? stars : curry) >= cost ? "affordable" : "unaffordable";
}

export function SkillTreeScreen() {
  const currentCurry = useGameStore((s) => s.currentCurry);
  const franchiseStars = useGameStore((s) => s.franchiseStars);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const skillNodes = useGameStore((s) => s.skillNodes);
  const metaNodes = useGameStore((s) => s.metaNodes);
  const buySkillNode = useGameStore((s) => s.buySkillNode);
  const buyMetaNode = useGameStore((s) => s.buyMetaNode);

  const owned = new Set(skillNodes);
  const ownedMeta = new Set(metaNodes);
  const union = new Set([...skillNodes, ...metaNodes]);

  const reduced = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1); // zoom handlers need the live value, not last render's
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pinching, setPinching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- viewport measurement -------------------------------------------------
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Hub-centred opening view, once we know how big the viewport is.
  const centred = useRef(false);
  useLayoutEffect(() => {
    if (centred.current || size.w === 0) return;
    centred.current = true;
    const s0 = size.w < 640 ? 0.55 : 0.8;
    const l = limits(s0, size.w, size.h);
    scaleRef.current = s0;
    setScale(s0);
    x.set(clamp(size.w / 2 - C * s0, l.left, l.right));
    y.set(clamp(size.h / 2 - C * s0, l.top, l.bottom));
  }, [size, x, y]);

  // A resize can leave the canvas off its constraints — framer only clamps
  // while dragging, so re-clamp by hand.
  useEffect(() => {
    if (size.w === 0) return;
    const l = limits(scaleRef.current, size.w, size.h);
    x.set(clamp(x.get(), l.left, l.right));
    y.set(clamp(y.get(), l.top, l.bottom));
  }, [size, x, y]);

  // --- zoom -----------------------------------------------------------------
  // Keeps the canvas point under (ax, ay) — viewport coords — pinned, then
  // re-clamps the pan for the new scale.
  const zoomTo = useCallback(
    (next: number, ax: number, ay: number) => {
      const prev = scaleRef.current;
      const s = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (s === prev) return;
      const px = (ax - x.get()) / prev;
      const py = (ay - y.get()) / prev;
      const l = limits(s, size.w, size.h);
      x.set(clamp(ax - px * s, l.left, l.right));
      y.set(clamp(ay - py * s, l.top, l.bottom));
      scaleRef.current = s;
      setScale(s);
    },
    [size, x, y],
  );

  // React's onWheel is passive, so page scroll would win — bind it natively.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const step = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomTo(scaleRef.current * step, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomTo]);

  const zoomButton = (dir: 1 | -1) => zoomTo(scaleRef.current + dir * 0.15, size.w / 2, size.h / 2);

  // --- two-finger pinch -----------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinchStart.current = { dist: spread().dist, scale: scaleRef.current };
      setPinching(true); // suspend drag so framer doesn't fight the pinch
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const start = pinchStart.current;
    if (pointers.current.size !== 2 || !start || start.dist === 0) return;
    const { dist, mx, my } = spread();
    const r = viewportRef.current?.getBoundingClientRect();
    if (!r) return;
    zoomTo((start.scale * dist) / start.dist, mx - r.left, my - r.top);
  };

  // Released on window, not the viewport: a finger lifted outside would
  // otherwise stay in the map and leave drag disabled forever.
  useEffect(() => {
    const clear = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) {
        pinchStart.current = null;
        setPinching(false);
      }
    };
    window.addEventListener("pointerup", clear);
    window.addEventListener("pointercancel", clear);
    return () => {
      window.removeEventListener("pointerup", clear);
      window.removeEventListener("pointercancel", clear);
    };
  }, []);

  // --- detail card ----------------------------------------------------------
  const selected = selectedId ? NODE_BY_ID[selectedId] : null;
  const selCost = selected ? nodeCost(selected, weeksCompleted) : 0;
  const selStar = selected?.branch === "star";
  const selState = selected
    ? stateOf(selected, owned, ownedMeta, union, currentCurry, franchiseStars, selCost)
    : null;

  const buy = () => {
    if (!selected) return;
    const ok = selStar ? buyMetaNode(selected.id) : buySkillNode(selected.id);
    if (ok) playPurchase();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Curry Power"
        subtitle="Drag to pan, scroll or pinch to zoom. Tap a node to spend."
        trailing={
          <div className="flex flex-col items-end gap-1.5 sm:flex-row">
            <StatChip icon="star" label="Curry" value={formatCurry(currentCurry, 1)} />
            <StatChip icon="stars" label="Stars" value={franchiseStars.toLocaleString()} />
          </div>
        }
      />

      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className="arcade-box relative h-[calc(100dvh-230px)] min-h-[380px] touch-none overflow-hidden bg-cream-50"
      >
        <motion.div
          drag={!pinching}
          dragConstraints={limits(scale, size.w, size.h)}
          dragElastic={0.04}
          dragMomentum={!reduced}
          style={{ x, y, scale, width: CANVAS, height: CANVAS, transformOrigin: "0 0" }}
          className="absolute left-0 top-0"
        >
          <svg width={CANVAS} height={CANVAS} className="pointer-events-none absolute inset-0">
            {HUB_SPOKES.map((id) => {
              const p = nodeXY(NODE_BY_ID[id]);
              return (
                <line
                  key={`hub-${id}`}
                  x1={C}
                  y1={C}
                  x2={p.x}
                  y2={p.y}
                  strokeWidth={2}
                  strokeDasharray="6 8"
                  className="stroke-ink/15"
                />
              );
            })}
            {EDGES.map((e) => {
              const a = union.has(e.from);
              const b = union.has(e.to);
              const from = nodeXY(NODE_BY_ID[e.from]);
              const to = nodeXY(NODE_BY_ID[e.to]);
              const both = a && b;
              return (
                <line
                  key={`${e.from}|${e.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  strokeWidth={both ? 3 : 2}
                  strokeDasharray={a || b ? undefined : "6 8"}
                  className={both ? "stroke-ink" : a || b ? "stroke-ink/40" : "stroke-ink/15"}
                />
              );
            })}
          </svg>

          {/* Hub — decoration, never a node. */}
          <div
            className="pointer-events-none absolute flex h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-ink bg-primary/20"
            style={{ left: C, top: C }}
          >
            <Icon name="restaurant" fill size={36} className="text-primary" />
          </div>

          {ALL_NODES.map((n) => {
            const p = nodeXY(n);
            const half = NODE_SIZE[n.kind] / 2;
            const cost = nodeCost(n, weeksCompleted);
            return (
              <div
                key={n.id}
                className="absolute"
                style={{ left: p.x - half, top: p.y - half }}
              >
                <GraphNode
                  node={n}
                  state={stateOf(n, owned, ownedMeta, union, currentCurry, franchiseStars, cost)}
                  selected={selectedId === n.id}
                  hint={
                    IS_DEMO && n.branch === "star"
                      ? `${n.name} — full game only`
                      : undefined
                  }
                  onSelect={() => setSelectedId(n.id)}
                />
              </div>
            );
          })}
        </motion.div>

        {/* Zoom controls */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          {([1, -1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir === 1 ? "Zoom in" : "Zoom out"}
              onClick={() => zoomButton(dir)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-white shadow-arcade-sm"
            >
              <Icon name={dir === 1 ? "add" : "remove"} size={20} className="text-ink" />
            </button>
          ))}
        </div>

        {/* Detail card */}
        {selected && selState && (
          <div className="arcade-box absolute inset-x-2 bottom-2 z-10 flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-black uppercase text-ink">
                {selected.name}
              </p>
              <p className="truncate text-xs font-semibold text-ink/60">
                {selState === "locked" && IS_DEMO && selStar
                  ? "Franchise perks are in the full game"
                  : selected.description}
              </p>
              {selState !== "purchased" && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-black tabular-nums text-ink/70">
                  <Icon
                    name={selStar ? "stars" : "star"}
                    fill
                    size={13}
                    className={selStar ? "text-violet-600" : "text-primary"}
                  />
                  {selStar ? selCost : formatCurry(selCost, 1)}
                </span>
              )}
            </div>

            <ArcadeButton
              variant={selState === "affordable" ? (selStar ? "tertiary" : "buy") : "neutral"}
              size="sm"
              disabled={selState !== "affordable"}
              onClick={buy}
              className="shrink-0 disabled:opacity-50"
            >
              {selState === "purchased"
                ? "Owned"
                : selState === "locked"
                  ? IS_DEMO && selStar
                    ? "Full game"
                    : "Locked"
                  : "Buy"}
            </ArcadeButton>

            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedId(null)}
              className="shrink-0 text-ink/50"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
