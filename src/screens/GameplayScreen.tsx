import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, useFeatureUnlocked } from "../store/useGameStore";
import { useEffects } from "../hooks/useEffects";
import { handleClick, computeClickValue } from "../engine/clickEngine";
import { RARITY_OF, type GachaRarity } from "../engine/gacha";
import { DAY_CHOICE_MAP } from "../engine/dayChoices";
import { DAYS_PER_WEEK } from "../config";
import { INGREDIENTS } from "../engine/ingredients";
import { formatCurry } from "../lib/format";
import { shakeScene, flashScene } from "../lib/juice";
import { playCook, playCrit, playDiscovery } from "../lib/sfx";
import type { Screen } from "../navigation";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { DayProgressBar } from "../components/DayProgressBar";
import { RestaurantScene } from "../scene/RestaurantScene";
import { BossScene } from "../scene/BossScene";
import { FloatText, type Float } from "../components/FloatText";
import { ClickBurst } from "../components/ClickBurst";
import { PixelIcon } from "../components/PixelIcon";
import { StartDayModal } from "../components/StartDayModal";
import { StatChip } from "../components/arcade/StatChip";
import { Icon } from "../components/arcade/Icon";
import { ArcadeButton } from "../components/arcade/ArcadeButton";
import { ArcadePanel } from "../components/arcade/ArcadePanel";
import { IS_DEMO } from "../target";
import { SteamCta } from "../components/SteamCta";
import { FeedbackModal } from "../components/FeedbackModal";
import { useCrazyCurry } from "../hooks/useCrazyCurry";
import { useOnFire } from "../hooks/useOnFire";

interface Props {
  onNavigate: (s: Screen) => void;
}

let floatId = 0;

// Anti-cheat: every cook must trace back to a real (isTrusted) input moments
// ago. Synthetic events (dispatchEvent, console scripts, injection) never
// refresh this timestamp, so they earn nothing.
let lastTrustedInput = 0;
if (typeof window !== "undefined") {
  for (const type of ["pointerdown", "pointerup", "keydown"] as const) {
    window.addEventListener(
      type,
      (e) => {
        if (e.isTrusted) lastTrustedInput = performance.now();
      },
      true,
    );
  }
}

// Anti-cheat: rolling 1s click cap. Humans peak ~15-20 CPS with mouse+space;
// Crazy Curry's top reward floor is 8 CPS, so 25 leaves generous headroom.
// Over-cap cooks are silently dropped — no feedback for autoclickers.
const CPS_CAP = 25;
const cookTimes: number[] = [];

// Critical circle tiers — anti-autoclicker bait. Low mults are common, big and
// slow; high mults are rare, tiny and fast. Weights sum to 100.
const CRIT_TIERS = [
  { mult: 1.1, weight: 40, size: 96, ms: 10000, className: "bg-white text-ink" },
  { mult: 1.5, weight: 25, size: 84, ms: 7000, className: "bg-cream-100 text-ink" },
  { mult: 2, weight: 15, size: 72, ms: 5000, className: "bg-curry-yellow text-ink" },
  { mult: 5, weight: 10, size: 60, ms: 2500, className: "bg-curry-orange text-white" },
  { mult: 10, weight: 6, size: 48, ms: 1200, className: "bg-tier-terrible text-white" },
  { mult: 25, weight: 3, size: 38, ms: 600, className: "bg-flavor-unique text-white" },
  { mult: 100, weight: 1, size: 28, ms: 300, className: "bg-ink text-curry-yellow" },
] as const;

// Boss day runs the same reaction game on a shorter, meaner table: no ×1.1
// consolation tier, everything is a real hit. Weights sum to 100.
const SUPER_TIERS = [
  { mult: 3, weight: 55, size: 88, ms: 4000, className: "bg-curry-yellow text-ink" },
  { mult: 10, weight: 30, size: 64, ms: 2000, className: "bg-curry-orange text-white" },
  { mult: 30, weight: 12, size: 48, ms: 1000, className: "bg-tier-terrible text-white" },
  { mult: 100, weight: 3, size: 32, ms: 500, className: "bg-ink text-curry-yellow" },
] as const;

type CritTier = (typeof CRIT_TIERS)[number] | (typeof SUPER_TIERS)[number];
type TierTable = readonly CritTier[];

function rollCritTier(tiers: TierTable, biasLow = false): CritTier {
  const roll = () => {
    let r = Math.random() * 100;
    for (const t of tiers) {
      r -= t.weight;
      if (r < 0) return t;
    }
    return tiers[0];
  };
  const first = roll();
  if (!biasLow) return first;
  // Bubble Bonanza's cost: roll twice, keep the lower multiplier.
  const second = roll();
  return first.mult <= second.mult ? first : second;
}

const CHAIN_CAP = 3; // max jackpot-chain depth after the first crit click

// Explosion/shake power for a crit: log-scaled so ×1.1 barely twitches (~0.05)
// and ×100 maxes out (2.4) — the payout is legible from the juice alone.
function critPower(mult: number): number {
  return (Math.log10(mult) / Math.log10(100)) * 2.4;
}

// Literal class names so Tailwind's scanner emits them (no dynamic strings).
const RARITY_RING: Record<GachaRarity, string> = {
  common: "border-rarity-common",
  uncommon: "border-rarity-uncommon",
  rare: "border-rarity-rare",
  epic: "border-rarity-epic",
  legendary: "border-rarity-legendary",
  currylicious: "border-rarity-curry",
};

// Spam-click rewards: escalating shout-outs at daily click milestones keep a
// mash streak feeling like it's constantly unlocking something new.
const CLICK_MILESTONES: {
  at: number;
  label: string;
  sfx: "good" | "great" | "legendary";
  power: 1 | 2;
}[] = [
  { at: 15, label: "COMBO ×15!", sfx: "good", power: 1 },
  { at: 40, label: "HEATING UP! ×40", sfx: "good", power: 1 },
  { at: 100, label: "CURRY FRENZY! ×100", sfx: "great", power: 2 },
  { at: 250, label: "UNSTOPPABLE! ×250", sfx: "great", power: 2 },
  { at: 500, label: "LADLE LEGEND! ×500", sfx: "legendary", power: 2 },
  { at: 1000, label: "SPICE GOD! ×1000", sfx: "legendary", power: 2 },
];

export function GameplayScreen({ onNavigate }: Props) {
  const currentDay = useGameStore((s) => s.currentDay);
  const damageBoss = useGameStore((s) => s.damageBoss);
  const addCurry = useGameStore((s) => s.addCurry);
  const registerClick = useGameStore((s) => s.registerClick);
  const dayStarted = useGameStore((s) => s.dayStarted);
  const dayPaused = useGameStore((s) => s.dayPaused);
  const startDay = useGameStore((s) => s.startDay);
  const togglePause = useGameStore((s) => s.togglePause);
  const weeksCompleted = useGameStore((s) => s.weeksCompleted);
  const totalCurryAllTime = useGameStore((s) => s.totalCurryAllTime);
  const bestRarityEver = useGameStore((s) => s.bestRarityEver);
  const franchiseStarsEarned = useGameStore((s) => s.franchiseStarsEarned);
  const activeDayModifierId = useGameStore((s) => s.activeDayModifierId);
  const todayClicks = useGameStore((s) => s.todayClicks);
  const gachaInventory = useGameStore((s) => s.gachaInventory);
  const equippedUids = useGameStore((s) => s.equippedUids);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  // Guided first run: day 1 shows only the core loop; side systems then
  // unlock one in-game day at a time (FEATURE_UNLOCK_DAY).
  const tutorialStart = tutorialStep === "start";
  const dayMod = activeDayModifierId ? DAY_CHOICE_MAP[activeDayModifierId] : undefined;

  // The last day of the week is the boss fight: different scene, different
  // crit table, same cook() — all damage still flows through the guarded path.
  const bossDay = currentDay === DAYS_PER_WEEK;
  const tiers: TierTable = bossDay ? SUPER_TIERS : CRIT_TIERS;

  const demoEnded = IS_DEMO && weeksCompleted >= 1;

  const effects = useEffects();
  const [floats, setFloats] = useState<Float[]>([]);
  const [crit, setCrit] = useState<{
    id: number;
    x: number;
    y: number;
    tier: CritTier;
    chain: number; // 0 = normal spawn; >0 = jackpot chain step
    phase: "telegraph" | "live";
    liveAt: number; // reaction-floor anchor: live time (or telegraph start when chained)
  } | null>(null);
  const critHoverRef = useRef(false); // mouse currently over the crit circle
  const onFire = useOnFire(effects.fireGainMult);
  const [cookSignal, setCookSignal] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [startDayOpen, setStartDayOpen] = useState(false);
  const sceneWrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const shake = (magPx: number) => shakeScene(sceneWrapRef.current, magPx);
  const flash = () => flashScene(flashRef.current);

  const equipped = equippedUids
    .map((uid) => gachaInventory.find((r) => r.uid === uid))
    .filter((r): r is NonNullable<typeof r> => !!r);

  // Preview value: one cook with no crit/crazy/fire riding on it.
  const perCook = Math.floor(computeClickValue(effects) * (dayMod?.clickMult ?? 1));
  /** What a crit circle of `mult` actually pays, crit-power effects included. */
  const critPayout = (mult: number) =>
    Math.floor(perCook * (1 + (mult - 1) * effects.critPowerMult));

  const crazy = useCrazyCurry(dayStarted && !dayPaused && !demoEnded);

  function cook(x: number, y: number, critMult = 1) {
    if (!dayStarted || dayPaused) return; // shop closed or paused
    // Anti-cheat gate: focused window, real recent input, human-plausible rate.
    const nowMs = performance.now();
    if (!document.hasFocus() || nowMs - lastTrustedInput > 100) return;
    while (cookTimes.length > 0 && nowMs - cookTimes[0] > 1000) cookTimes.shift();
    if (cookTimes.length >= CPS_CAP) return;
    cookTimes.push(nowMs);
    const result = handleClick(effects);
    if (result.value <= 0) return;

    const crazyMult = crazy.registerCook();
    const fireMult = onFire.registerCook();
    // Crit power effects amplify the circle's own multiplier, never the base.
    const critApplied = 1 + (critMult - 1) * effects.critPowerMult;
    const value = Math.floor(
      result.value * crazyMult * critApplied * fireMult * (dayMod?.clickMult ?? 1),
    );
    if (value <= 0) return;

    addCurry(value);
    registerClick();
    // Curry is damage, one for one — crits, On Fire and Crazy Curry all land
    // on the boss for free. The killing blow ends the week inside this call.
    if (bossDay) {
      damageBoss(value);
      if (useGameStore.getState().phase === "week_summary") {
        flash();
        shake(14);
      }
    }
    playCook(onFire.heat / 100);

    const milestone = CLICK_MILESTONES.find((m) => m.at === todayClicks + 1);
    if (milestone) {
      playDiscovery(milestone.sfx);
      if (milestone.power === 2) shake(5);
      const mid = floatId++;
      setFloats((f) =>
        [...f, { id: mid, x, y: y - 56, label: milestone.label, power: milestone.power }].slice(-12),
      );
      window.setTimeout(
        () => setFloats((f) => f.filter((fl) => fl.id !== mid)),
        1100,
      );
    }
    setCookSignal((n) => n + 1);

    // 25% chance to spawn a critical circle (if none is up) — click it before
    // it expires for the tier's multiplier. Crit clicks skip this roll; their
    // follow-up comes from the jackpot chain in clickCrit instead.
    const critChance = Math.min(
      0.4 * (dayMod?.critChanceMult ?? 1) * effects.critChanceMult,
      0.9,
    );
    if (critMult === 1 && !crit && Math.random() < critChance) {
      spawnCrit(rollCritTier(tiers, dayMod?.critBiasLow), 0);
    }

    const id = floatId++;
    let label = "+" + formatCurry(value);
    if (critMult >= 25) label += " JACKPOT!";
    else if (critMult > 1) label += "!";
    // Feedback scales with the payout: crits ride a log curve, a crazy-event
    // cook gets one notch, routine cooks stay quiet. Crit bursts are floored at
    // 1.5 so even a ×1.1 circle detonates a real curry explosion (shock ring +
    // curry palette); the shake alone carries the low-tier/high-tier contrast.
    const power =
      critMult > 1
        ? Math.max(1.5, critPower(critMult))
        : crazyMult > 1
          ? 1
          : 0;
    if (critMult > 1) {
      // Shake rides the raw curve (not the burst floor) so tiers stay distinct.
      shake(2 + critPower(critMult) * 5.5);
      if (critMult >= 25) flash();
    }
    setFloats((f) => [...f, { id, x, y, label, power }].slice(-12)); // cap under mash
    window.setTimeout(
      () => setFloats((f) => f.filter((fl) => fl.id !== id)),
      // Explosion confetti flies up to ~1.7s (duration + sparkle delay).
      power >= 1.5 ? 1800 : 800,
    );
  }

  function cookFromButton() {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    // jitter so mashing the button doesn't stack identical bursts
    if (rect) cook(rect.width / 2 + (Math.random() * 48 - 24), rect.height * 0.45);
    else cook(0, 0);
  }

  // Spacebar cooks at the cursor when it's over the scene; falls back to the
  // button's center-burst otherwise (cursor off-scene or untracked).
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  function cookFromSpace() {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    const p = pointerRef.current;
    if (
      rect &&
      p &&
      p.x >= rect.left &&
      p.x <= rect.right &&
      p.y >= rect.top &&
      p.y <= rect.bottom
    ) {
      cook(p.x - rect.left, p.y - rect.top);
    } else {
      cookFromButton();
    }
  }

  // On Fire ignition (stage 2) gets a small shake.
  const prevFireStageRef = useRef(onFire.stage);
  useEffect(() => {
    if (onFire.stage === 2 && prevFireStageRef.current < 2) shake(5);
    prevFireStageRef.current = onFire.stage;
  }, [onFire.stage]);

  // Crazy Curry event start gets a small shake.
  useEffect(() => {
    if (crazy.event) shake(5);
  }, [crazy.event?.startedAt]);

  // Day end sweeps any live crit circle off the screen; the pending expiry
  // timeouts are id-guarded so they no-op against the cleared state.
  useEffect(() => {
    if (!dayStarted) setCrit(null);
  }, [dayStarted]);

  function spawnCrit(tier: CritTier, chain: number) {
    const rect = sceneWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Boss day: circles spawn on the boss's body, so chasing one is aiming at
    // the boss. Its bounds are offset back into scene coordinates, leaving the
    // render/hover/spacebar paths below identical.
    const body = bossDay
      ? sceneWrapRef.current
          ?.querySelector("[data-boss-body]")
          ?.getBoundingClientRect()
      : undefined;
    const left = body ? body.left - rect.left : 0;
    const top = body ? body.top - rect.top : 0;
    const width = body?.width ?? rect.width;
    const height = body?.height ?? rect.height;
    const margin = tier.size / 2 + 8;
    const critId = floatId++;
    critHoverRef.current = false;
    const x = left + margin + Math.random() * Math.max(1, width - margin * 2);
    const y = top + margin + Math.random() * Math.max(1, height - margin * 2);
    if (chain === 0) {
      setCrit({ id: critId, x, y, tier, chain, phase: "live", liveAt: performance.now() });
      window.setTimeout(
        () => setCrit((c) => (c?.id === critId ? null : c)),
        tier.ms,
      );
    } else {
      // Chained circles telegraph first: a 400ms "incoming" cue, then live.
      // liveAt counts from the telegraph: the position is announced, so the
      // reaction floor is already satisfied by the time it turns clickable.
      setCrit({ id: critId, x, y, tier, chain, phase: "telegraph", liveAt: performance.now() });
      window.setTimeout(() => {
        setCrit((c) => (c?.id === critId ? { ...c, phase: "live" } : c));
        window.setTimeout(
          () => setCrit((c) => (c?.id === critId ? null : c)),
          tier.ms,
        );
      }, 400);
    }
  }

  function clickCrit(c: NonNullable<typeof crit>) {
    if (c.phase !== "live") return;
    // Anti-cheat: sub-human reaction (circles spawn at random positions, so a
    // real hit needs ~200ms reaction + mouse travel). Aim-bots get nothing.
    if (performance.now() - c.liveAt < 130) return;
    // cook() below is day-guarded, but the chained spawnCrit is not — block
    // the whole thing once the day is over or paused.
    if (!dayStarted || dayPaused) return;
    setCrit(null);
    critHoverRef.current = false;
    cook(c.x, c.y, c.tier.mult); // shake/flash scale with the tier inside cook()
    playCrit(c.tier.mult);
    // Jackpot chain: chance to spawn a rarer, one-tier-higher follow-up.
    // Odds shrink per step (35% → 25% → 15%), capped at CHAIN_CAP deep.
    const idx = tiers.indexOf(c.tier);
    if (c.chain < CHAIN_CAP && Math.random() < 0.35 - 0.1 * c.chain) {
      spawnCrit(tiers[Math.min(idx + 1, tiers.length - 1)], c.chain + 1);
    }
  }

  // Spacebar hits the crit circle when the mouse is hovering it.
  const critSpaceRef = useRef<() => boolean>(() => false);
  critSpaceRef.current = () => {
    if (crit && critHoverRef.current) {
      clickCrit(crit);
      return true;
    }
    return false;
  };

  // Spacebar cooks — same guarded path as the Cook! button. Skips form fields
  // and focused buttons so native keyboard behavior still works there.
  const cookFromSpaceRef = useRef(cookFromSpace);
  cookFromSpaceRef.current = cookFromSpace;
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.tagName === "BUTTON" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault(); // no page scroll
      if (critSpaceRef.current()) return; // hovering the crit circle? hit it
      cookFromSpaceRef.current();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 xl:max-w-4xl 2xl:max-w-5xl">
      {/* Header */}
      {!tutorialStart && (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatChip icon="calendar_today" label="Day" value={`${currentDay}/${DAYS_PER_WEEK}`} />
          {dayStarted && (
            <button
              type="button"
              onClick={togglePause}
              aria-label={dayPaused ? "Resume day" : "Pause day"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink shadow-arcade-sm transition-transform hover:-translate-y-0.5 ${
                dayPaused ? "bg-primary text-white" : "bg-white text-ink"
              }`}
            >
              <Icon name={dayPaused ? "play_arrow" : "pause"} fill size={20} />
            </button>
          )}
        </div>
        <ScoreDisplay />
        <div className="w-[88px]" />
      </div>
      )}

      {!tutorialStart && <DayProgressBar />}

      {/* Restaurant scene + floats */}
      <div ref={sceneWrapRef} className="relative">
        {bossDay ? (
          <BossScene
            cookSignal={cookSignal}
            onCook={cook}
            busy={dayStarted && !dayPaused}
          />
        ) : (
        <RestaurantScene
          cookSignal={cookSignal}
          onCook={cook}
          busy={dayStarted && !dayPaused}
          onFire={onFire.stage === 2}
          onDinerFed={() => {
            // Diners tip base click value (no crit/crazy/fire mults), scaled
            // by expansion tier — bigger rooms are a real income line.
            const tip = Math.max(
              1,
              Math.floor(perCook * 0.2 * (1 + effects.expansionLevel)),
            );
            addCurry(tip);
            const rect = sceneWrapRef.current?.getBoundingClientRect();
            if (!rect) return;
            const id = floatId++;
            const x = rect.width / 2 + (Math.random() * 120 - 60);
            setFloats((f) =>
              [...f, { id, x, y: rect.height * 0.35, label: `Tip! +${formatCurry(tip)}` }].slice(-12),
            );
            window.setTimeout(
              () => setFloats((f) => f.filter((fl) => fl.id !== id)),
              800,
            );
          }}
        />
        )}
        <AnimatePresence>
          {floats.map((f) => (
            <div key={f.id}>
              <ClickBurst x={f.x} y={f.y} power={f.power} tint={f.id} />
              <FloatText
                x={f.x}
                y={f.y}
                label={f.label}
                power={Math.min(2, Math.round(f.power ?? 0))}
              />
            </div>
          ))}
        </AnimatePresence>

        {/* Jackpot flash overlay — driven by flashScene(), rests at opacity 0 */}
        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 z-40 rounded-xl opacity-0"
        />

        {/* Critical circle — click (or hover + spacebar) before it expires.
            Telegraph phase = non-interactive "incoming" cue for chained circles. */}
        <AnimatePresence>
          {crit && crit.phase === "telegraph" && (
            <div
              key={`t${crit.id}`}
              className="crit-telegraph pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-ink"
              style={{
                left: crit.x,
                top: crit.y,
                width: crit.tier.size,
                height: crit.tier.size,
              }}
            />
          )}
          {crit && crit.phase === "live" && (
            <motion.button
              key={crit.id}
              type="button"
              aria-label={`Critical hit worth ${formatCurry(critPayout(crit.tier.mult))} curry`}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.35, 1] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, times: [0, 0.6, 1] }}
              onPointerDown={() => clickCrit(crit)}
              onPointerEnter={() => (critHoverRef.current = true)}
              onPointerLeave={() => (critHoverRef.current = false)}
              className={`absolute z-40 flex items-center justify-center rounded-full border-4 border-ink font-display font-black crit-glow ${crit.tier.className}`}
              // Centering rides framer's own transform, not Tailwind's: the
              // scale animation writes an inline `transform` that would drop a
              // `-translate-x-1/2` class outright, anchoring the circle at its
              // top-left (and out past the boss's edges on boss day).
              style={{
                left: crit.x,
                top: crit.y,
                x: "-50%",
                y: "-50%",
                width: crit.tier.size,
                height: crit.tier.size,
              }}
            >
              {/* The circle keeps its size (difficulty is unchanged); the reward
                  is stated in real curry on the pill above it. */}
              <span
                className="leading-none"
                style={{ fontSize: Math.max(10, Math.round(crit.tier.size * 0.28)) }}
              >
                ×{crit.tier.mult}
              </span>
              {crit.chain > 0 && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded border border-ink bg-curry-yellow px-1 text-[8px] font-black uppercase text-ink">
                  Chain
                </span>
              )}
              {/* timer: inner ring shrinks to nothing over the tier lifetime */}
              <motion.span
                className="pointer-events-none absolute inset-1 rounded-full border-4 border-ink/25"
                initial={{ scale: 1 }}
                animate={{ scale: 0 }}
                transition={{ duration: crit.tier.ms / 1000, ease: "linear" }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* On Fire — stage-2 glow + heat bar pinned to the scene bottom */}
        {onFire.stage === 2 && (
          <div className="on-fire-glow pointer-events-none absolute inset-0 z-10" />
        )}
        {onFire.heat > 0 && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 w-1/2 -translate-x-1/2">
            {onFire.stage === 2 && (
              <div className="mb-0.5 flex items-center justify-center gap-1 font-display text-[10px] font-black uppercase tracking-widest text-white [text-shadow:1px_1px_0_#191c1e]">
                <Icon name="local_fire_department" fill size={14} />
                On Fire +{formatCurry(Math.floor(perCook * (onFire.mult - 1)))}
              </div>
            )}
            <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-white/70">
              <div
                className={`h-full transition-[width] duration-150 ${
                  onFire.stage === 2
                    ? "bg-tier-terrible"
                    : onFire.stage === 1
                      ? "bg-curry-orange"
                      : "bg-curry-yellow"
                }`}
                style={{ width: `${onFire.heat}%` }}
              />
            </div>
          </div>
        )}

        {/* First-cook hint — sits over the scene until the first tap lands */}
        <AnimatePresence>
          {dayStarted && !dayPaused && todayClicks === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            >
              <span className="flex animate-bounce items-center gap-2 rounded-xl border-4 border-ink bg-white px-4 py-2 font-display text-lg font-black uppercase text-ink shadow-arcade">
                <Icon name="touch_app" fill size={24} />
                Tap here to cook!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Equipped ingredients + primary action */}
      {demoEnded ? (
        <ArcadePanel className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <Icon name="emoji_events" fill size={30} className="text-tertiary" />
            <h2 className="font-display text-xl font-black uppercase text-ink">
              That's the demo!
            </h2>
          </div>
          <p className="text-sm font-semibold text-ink/70">
            The full game keeps the gacha running: 60 ingredients across six
            rarities, the whole skill tree, skins, and a fresh week to chase
            every real day.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <DemoStat
              icon="star"
              label="Curry all-time"
              value={formatCurry(totalCurryAllTime, 1)}
            />
            <DemoStat
              icon="casino"
              label="Best pull"
              value={bestRarityEver === "none" ? "—" : bestRarityEver}
            />
            <DemoStat
              icon="stars"
              label="Stars earned"
              value={franchiseStarsEarned.toLocaleString()}
            />
          </div>
          <SteamCta label="Get the full game on Steam" />
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="arcade-btn flex items-center justify-center gap-2 bg-white py-3 uppercase text-ink"
          >
            <Icon name="mail" size={22} />
            Contact us
          </button>
        </ArcadePanel>
      ) : (
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {equipped.map((r) => (
              <span
                key={r.uid}
                title={INGREDIENTS[r.ingredientId].name}
                className={`flex h-9 w-9 items-center justify-center rounded-md border-2 bg-white ${
                  RARITY_RING[RARITY_OF[r.ingredientId]]
                }`}
              >
                <PixelIcon
                  id={r.ingredientId}
                  icon={INGREDIENTS[r.ingredientId].icon}
                  size={32}
                  iconClassName={INGREDIENTS[r.ingredientId].color}
                />
              </span>
            ))}
          </div>
        </div>

        {/* Active end-of-day deal, so the trade-off stays visible all day. */}
        {dayMod && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-ink bg-tertiary-fixed px-3 py-2 text-sm font-bold text-ink/80 shadow-arcade-sm">
            <Icon name={dayMod.icon} fill size={18} className="text-primary" />
            <span className="uppercase">{dayMod.name}</span>
            <span className="font-semibold text-ink/60">
              {dayMod.bonus} · {dayMod.cost}
            </span>
          </div>
        )}

        {/* Primary action: open the day → cook. The day clock only starts when
            the player presses Start Day. */}
        <ArcadeButton
          size="xl"
          data-tut="start-btn"
          variant={!dayStarted || dayPaused ? "buy" : "primary"}
          className={!dayStarted && !dayPaused ? "animate-pulse" : undefined}
          onClick={
            // First run: the day starts on the spot — no confirmation modal.
            tutorialStart
              ? startDay
              : !dayStarted
                ? () => setStartDayOpen(true)
                : dayPaused
                  ? togglePause
                  : cookFromButton
          }
        >
          {tutorialStart ? (
            <>
              <Icon name="play_arrow" fill size={28} />
              Start Day 1
            </>
          ) : !dayStarted ? (
            <>
              <Icon name="play_arrow" fill size={28} />
              Start Day {currentDay}
            </>
          ) : dayPaused ? (
            <>
              <Icon name="play_arrow" fill size={28} />
              Resume Day
            </>
          ) : (
            <>
              <Icon name="local_fire_department" fill size={28} />
              {onFire.stage === 2 ? "ON FIRE!" : "Cook!"}
            </>
          )}
        </ArcadeButton>
      </div>
      )}

      {startDayOpen && (
        <StartDayModal
          onStart={() => {
            setStartDayOpen(false);
            startDay();
          }}
          onClose={() => setStartDayOpen(false)}
        />
      )}

      {IS_DEMO && feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}

function DemoStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border-2 border-ink bg-cream-100 px-2 py-2 text-center">
      <Icon name={icon} fill size={18} className="text-primary" />
      <span className="font-display text-sm font-black capitalize text-ink">
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-wide text-ink/50">
        {label}
      </span>
    </div>
  );
}
