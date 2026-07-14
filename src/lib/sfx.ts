// Tiny zero-dependency sound engine (Web Audio API). No audio files to ship —
// every effect (and the ambient music loop) is synthesised, so it stays
// offline-friendly and adds nothing to the bundle. Settings sync in App.
//
// The AudioContext is created lazily; because the first SFX always follows a
// user gesture (a cook tap), autoplay policies are satisfied. Music waits for
// a one-time pointerdown before starting.

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;

let enabled = true;
let sfxVolume = 1;
let musicVolume = 0.7;
let musicOn = true;

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}

export function setSfxVolume(v: number): void {
  sfxVolume = v;
  if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
}

export function setMusicVolume(v: number): void {
  musicVolume = v;
  if (musicGain && ctx && musicTimer !== null) {
    musicGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxVolume;
    sfxGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = musicVolume;
    musicGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Tone {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone({ freq, dur, type = "square", gain = 0.05, delay = 0 }: Tone): void {
  const c = audio();
  if (!c || !sfxGain) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function chord(notes: Tone[]): void {
  if (!enabled) return;
  notes.forEach(tone);
}

/** A short cook blip — pitch wobbles a touch so rapid cooking doesn't drone.
 *  `intensity` 0..1 (On Fire heat) raises the pitch up to ~6 semitones. */
export function playCook(intensity = 0): void {
  if (!enabled) return;
  tone({
    freq: (380 + Math.random() * 80) * (1 + intensity * 0.5),
    dur: 0.09,
    type: "square",
    gain: 0.045,
  });
}

/** Rising zap when a crit circle is hit — more steps for bigger multipliers. */
export function playCrit(mult: number): void {
  const steps = mult >= 25 ? 4 : mult >= 5 ? 3 : 2;
  chord(
    Array.from({ length: steps }, (_, i) => ({
      freq: 660 * Math.pow(1.25, i),
      dur: 0.09,
      type: "square" as OscillatorType,
      gain: 0.05,
      delay: i * 0.05,
    })),
  );
}

/** Two-note "ka-ching" on a successful purchase. */
export function playPurchase(): void {
  chord([
    { freq: 523, dur: 0.08 },
    { freq: 784, dur: 0.12, delay: 0.06, type: "triangle", gain: 0.05 },
  ]);
}

/** Tier-scaled sparkle when a new affinity tier is discovered. */
export function playDiscovery(tier: "good" | "great" | "legendary"): void {
  const sets: Record<typeof tier, number[]> = {
    good: [523, 659],
    great: [523, 659, 784],
    legendary: [523, 659, 784, 1047, 1319],
  };
  chord(
    sets[tier].map((freq, i) => ({
      freq,
      dur: 0.16,
      type: "triangle" as OscillatorType,
      gain: 0.05,
      delay: i * 0.07,
    })),
  );
}

/** Little fanfare when the week wraps up. */
export function playWeekComplete(): void {
  chord(
    [523, 659, 784, 1047].map((freq, i) => ({
      freq,
      dur: 0.18,
      type: "triangle" as OscillatorType,
      gain: 0.055,
      delay: i * 0.1,
    })),
  );
}

/** Ascending pentatonic sparkle when Franchise Stars are awarded. */
export function playStarAward(): void {
  chord([
    ...[784, 988, 1175, 1568].map((freq, i) => ({
      freq,
      dur: 0.14,
      type: "triangle" as OscillatorType,
      gain: 0.05,
      delay: i * 0.08,
    })),
    { freq: 2093, dur: 0.3, type: "sine", gain: 0.04, delay: 0.36 },
  ]);
}

// --- ambient music -----------------------------------------------------------
// A slow Cmaj7 → Am7 → Fmaj7 → G9 pad with a sparse sine arpeggio on top.
// Scheduled with the standard lookahead pattern (setInterval + AudioContext
// clock) so the loop never drifts.

const CHORD_DUR = 2.4;
const LOOKAHEAD = 0.6;
const PROGRESSION: number[][] = [
  [261.63, 329.63, 392.0, 493.88],
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66, 440.0],
];

let musicTimer: number | null = null;
let musicNextTime = 0;
let musicStep = 0;
let awaitingGesture = false;

function musicNote(
  c: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  attack: number,
): void {
  if (!musicGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.setValueAtTime(peak, t0 + dur * 0.6);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  osc.connect(g).connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function scheduleChord(c: AudioContext, notes: number[], t0: number): void {
  musicNote(c, notes[0] / 2, t0, CHORD_DUR, "sine", 0.022, 0.5);
  for (const freq of notes) {
    musicNote(c, freq, t0, CHORD_DUR, "triangle", 0.014, 0.5);
  }
  const arp = musicStep % 2 === 0 ? [notes[1], notes[3]] : [notes[2]];
  arp.forEach((freq, i) => {
    musicNote(c, freq * 2, t0 + 0.6 + i * 0.9, 0.7, "sine", 0.012, 0.02);
  });
}

function scheduleMusic(): void {
  const c = ctx;
  if (!c || musicTimer === null) return;
  while (musicNextTime < c.currentTime + LOOKAHEAD) {
    scheduleChord(c, PROGRESSION[musicStep % PROGRESSION.length], musicNextTime);
    musicStep += 1;
    musicNextTime += CHORD_DUR;
  }
}

function onFirstGesture(): void {
  awaitingGesture = false;
  const c = audio();
  if (!c) return;
  void c.resume().then(() => startMusic());
}

export function startMusic(): void {
  if (!musicOn || musicTimer !== null) return;
  const c = audio();
  if (!c) return;
  if (c.state !== "running") {
    if (!awaitingGesture) {
      awaitingGesture = true;
      window.addEventListener("pointerdown", onFirstGesture, { once: true });
    }
    return;
  }
  musicGain?.gain.setTargetAtTime(musicVolume, c.currentTime, 0.1);
  musicStep = 0;
  musicNextTime = c.currentTime + 0.1;
  musicTimer = window.setInterval(scheduleMusic, 200);
  scheduleMusic();
}

export function stopMusic(): void {
  if (awaitingGesture) {
    window.removeEventListener("pointerdown", onFirstGesture);
    awaitingGesture = false;
  }
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
}

export function setMusicEnabled(on: boolean): void {
  musicOn = on;
  if (on) startMusic();
  else stopMusic();
}
