# Design Audit — "make it look less vibe coded"

**Report only. No code was changed.** Every finding below was re-verified against the
current tree after the gacha/skill-tree rework — findings that only existed in the deleted
recipe/shop screens have been dropped.

Findings are ordered by **visible polish per unit of effort**: the top of the list buys the
most obvious improvement for the least work. Effort is S (under an hour), M (an
afternoon), L (a day or more). A suggested three-item shortlist is at the bottom.

Two structural notes that shape several findings:

- `TopBar` / `BottomNav` now live at `src/components/shell/`, and the arcade primitives at
  `src/components/arcade/` — paths below reflect that.
- The design system is real and mostly good (`shadow-arcade*`, `--rarity-*`, `.arcade-box`,
  `ArcadeButton`/`ArcadePanel`/`StatChip`/`PageHeader`). The problem is not an absent
  system; it's **leakage around a system that already exists**. That's why most of this is
  S-effort.

---

## F1 — Hard-coded hex that breaks in dark mode `[S]` *(brief item 2)*

**Finding.** `#191c1e` — the ink/shadow color — is written as a literal in four places, in
four different syntaxes. Every `shadow-arcade*` token resolves through
`rgb(var(--shadow))` (`tailwind.config.js:84-87`) and flips with `.dark`; these four do
not. On the dark theme the top bar, bottom nav and the On Fire label carry a light-theme
shadow.

**Evidence.**

| Location | Literal |
|---|---|
| `src/components/shell/TopBar.tsx:21` | `shadow-[0_4px_0_0_#191c1e]` |
| `src/components/shell/BottomNav.tsx:16` | `shadow-[0_-4px_0_0_#191c1e]` |
| `src/screens/GameplayScreen.tsx:524` | `[text-shadow:1px_1px_0_#191c1e]` |
| `src/components/Spotlight.tsx:55` | `boxShadow: "0 0 0 200vmax rgba(25, 28, 30, 0.6)"` — same color, third syntax |

The scene frame is the same problem at larger scale — `src/index.css:169-186` duplicates a
full light/dark palette as literals across two selectors:

```css
border: 6px solid #523014;                /* :171 wood brown */
inset 0 0 0 4px #a9702f,                  /* :173 */
6px 6px 0 0 rgb(var(--shadow));           /* :174 — the one tokenised line */
border-color: #2b2350;                    /* :180 .dark */
inset 0 0 0 4px #ff4fa3,                  /* :182 */
```

No `--frame-*` / `--scene-*` variables exist anywhere. Also `index.css:195` has a bare
`#fff` inside `.rarity-curry-surface` between two `rgb(var(--…))` stops, and
`RarityRevealOverlay.tsx:85` mixes a literal `"#fff"` with the tokenised `rarityColor()`.

**Recommendation.**
1. Add two shadow tokens so the nav bars stop hand-rolling:
   ```js
   // tailwind.config.js → extend.boxShadow
   "arcade-bar":    "0 4px 0 0 rgb(var(--shadow))",
   "arcade-bar-up": "0 -4px 0 0 rgb(var(--shadow))",
   ```
   Then `shadow-arcade-bar` / `shadow-arcade-bar-up` in TopBar/BottomNav.
2. Lift the scene frame palette to CSS vars in `:root` + `.dark`: `--frame-border`,
   `--frame-inset`, `--frame-glow`, `--frame-glow-outer`. The `.scene-frame` rule then has
   one body instead of two.
3. Replace `Spotlight`'s rgba with `rgb(var(--shadow) / 0.6)` and the two `#fff` literals
   with `rgb(var(--surface))` (or an explicit `--rarity-curry-ink` if pure white is
   deliberate).

**Why it's first:** it is the only finding in this document that is a *visible defect*
rather than a consistency wobble, and it's a handful of one-line edits.

---

## F2 — `violet-*` is an undeclared brand color `[S]` *(brief item 8, new)*

**Finding.** "Franchise Stars" has a de-facto brand color — Tailwind's stock
`violet-100/200/600/700` — used across four files with **no token, no CSS var, and no dark
variant**. Every other semantic color in the app (`primary`, `tertiary`, `buy`, `rarity.*`)
is a var that responds to `.dark`. The star UI does not.

**Evidence.** `SkillTreeScreen.tsx:105` (`bg-gradient-to-r from-violet-100`), `:107`,
`:116`, `:117`; `skills/SkillNode.tsx:37,61,70,86,94`;
`ProfileScreen.tsx:70,71,77,78,85`; `WeekSummaryModal.tsx:69,74,76,82,95`. Also
`SkillTreeScreen.tsx:105` is the only gradient header in the entire app.

**Recommendation.** Add `--star` (+ a `.dark` desaturated value) to `index.css` and
`colors.star` to `tailwind.config.js`, exactly as the rarity colors were done in the
rework. Sweep the ~15 sites. Decide separately whether the gradient header stays — if it
does, it should be a reusable `SectionHeader` variant (see F8), not a one-off.

---

## F3 — Ad-hoc tiny text sizes `[S]` *(brief item 1)*

**Finding.** 33 arbitrary pixel text sizes across 16 files, in only four distinct values —
which is the tell: this wants two tokens, not 33 escapes.

**Evidence.** `text-[8px]` ×2, `text-[9px]` ×2, `text-[10px]` ×23, `text-[11px]` ×6.

| File | n | Example lines |
|---|---|---|
| `src/components/gacha/RollCard.tsx` | 5 | 71, 78, 105, 112, 129 |
| `src/components/ScoreDisplay.tsx` | 5 | 42, 58, 82, 105, 112 |
| `src/screens/GameplayScreen.tsx` | 4 | 498, 502, 524, 781 |
| `src/screens/GachaScreen.tsx` | 3 | 42, 56, 268 |
| `src/components/skills/SkillNode.tsx` | 3 | 75, 78, 84 |
| `src/screens/SkillTreeScreen.tsx` | 2 | 67, 110 |
| `src/screens/ProfileScreen.tsx` | 2 | 122, 160 |
| 9 more files | 1 each | `SteamCta:30`, `StatChip:18`, `FeedbackModal:116`, `BadgeNotifier:74`, `DayProgressBar:14`, `RestaurantScene:101`, `TopBar:39`, `BottomNav:39`, `GachaReel:131` |

Worst single instance: `SkillNode.tsx:75/78/84` uses `text-[11px]`, `text-[10px]`,
`text-[10px]` inside one 25-line component.

**Recommendation.** Add two tokens below `xs` and sweep:

```js
// tailwind.config.js → extend.fontSize
"2xs": ["11px", { lineHeight: "1.3" }],
"3xs": ["9px",  { lineHeight: "1.2", letterSpacing: "0.04em" }],
```

Map `11px → text-2xs`, `10px → text-2xs` (or `3xs` where it's an all-caps micro-label),
`9px`/`8px` → `text-3xs`. Collapsing 10px and 11px into one token is the point — the
current split is accidental, not designed. Sweep is mechanical (find/replace + eyeball two
screens).

---

## F4 — The custom `fontSize` scale is defined and never used `[S]` *(brief item 6)*

**Finding.** `tailwind.config.js:71-78` defines six named type styles. **Grep for all six
across `src/` returns zero matches.** The app uses raw `text-xs/sm/lg/xl/2xl/3xl` plus the
33 escapes from F3.

```js
"display-score": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }],
"headline-lg":   ["32px", { lineHeight: "1.2", fontWeight: "800" }],
"headline-md":   ["20px", { lineHeight: "1.4", fontWeight: "800" }],
"body-lg":       ["18px", { lineHeight: "1.6", fontWeight: "500" }],
"label-bold":    ["14px", { lineHeight: "1", fontWeight: "700" }],
"label-sm":      ["12px", { lineHeight: "1", fontWeight: "600" }],
```

This is the single clearest "vibe coded" signal in the repo: a type system was designed and
then not adopted. Same story, smaller, for `shadow-arcade-lg` / `shadow-arcade-xl` — zero
usages, while the 6px offset is hardcoded at `index.css:164` and `:174`.

**Recommendation.** Pick one, don't leave it half-built:
- **Wire it** (preferred, pairs with F3): `ScoreDisplay`'s big number → `text-display-score`,
  `PageHeader` h1 → `text-headline-lg`, panel headings (`GachaScreen:161`,
  `SkillTreeScreen:65,109`) → `text-headline-md`, `StatChip`/pill labels → `text-label-sm`.
  After F3 + F4 the app's type is ~8 named steps and nothing else.
- **Or delete the block** and stop pretending. Deleting is honest; leaving it is the worst
  of the three.

F3 and F4 should be done in one pass — they are the same sweep.

---

## F5 — Two rarity-FX tables, already out of sync `[S]` *(brief item 8, new)*

**Finding.** `rarityFx.ts:17-24` was built to be *the* single rarity→feedback table (its
own comment says so). `RarityRevealOverlay.tsx:18-21` then defines a second one, and the
overlapping `particles` values have already drifted:

| Rarity | `rarityFx.particles` | `REVEAL.particles` |
|---|---|---|
| legendary | 34 (`rarityFx.ts:22`) | 28 (`RarityRevealOverlay.tsx:19`) |
| currylicious | 48 (`rarityFx.ts:23`) | 44 (`RarityRevealOverlay.tsx:20`) |

The overlay's tint also ignores the rarity color entirely — `bg-tertiary/25` /
`bg-primary/25` (`:19-20`) instead of `--rarity-legendary` / `--rarity-curry`. A legendary
pull tints gold-via-`tertiary` rather than via its own rarity token.

Related dead weight in the same file: `rarityFx.ts:12` declares `ring: number` with a
comment admitting "ClickBurst now derives it from power" — six values maintained, zero
consumers.

**Recommendation.** Fold `label`/`duration`/`overlay tint` into `rarityFx` (add
`revealMs`), have `RarityRevealOverlay` read particles from `rarityFx[rarity].particles`,
tint from `rarityColor(rarity)`, and delete the `REVEAL` map and the `ring` field. Net
deletion.

---

## F6 — `formatCurry` decimals are inconsistent `[S]` *(brief item 7)*

**Finding — the domain split is clean, the precision is not.**

The currency-vs-count rule is being followed correctly: `formatCurry`/`formatScore` are
used for every currency value (16 sites) and `toLocaleString()` for every discrete count
(8 sites: stars, clicks, spins). **No cross-contamination — there is no bug of that kind.**

But `formatCurry(value, decimals = 2)` (`src/lib/format.ts:3`) has a silent default, and
call sites split almost exactly in half: panel/stat surfaces pass `1`, inline/gameplay
surfaces take the default `2`. The same live value therefore renders two ways at once:

| Site | Value | Renders |
|---|---|---|
| `src/components/shell/TopBar.tsx:73` | `currentCurry` | `12.3K` |
| `src/screens/GameplayScreen.tsx:760` | *the same* `currentCurry` in the GoalBar | `12.34K` |
| `src/screens/GameplayScreen.tsx:581` | all-time curry | `1.2K` |
| `src/screens/GameplayScreen.tsx:635` | per-click, same panel | `1.23K` |

**Recommendation.** Two parts, both small:
1. Change the default to `decimals = 1` in `src/lib/format.ts`, then let the ~9 explicit
   `, 1)` arguments fall away. One screenshot pass to confirm nothing reads too coarse.
2. Document the rule where it lives, so it survives the next feature — two lines at the top
   of `src/lib/format.ts`:
   ```ts
   // formatCurry / formatScore: curry and any other continuous currency value.
   // toLocaleString(): discrete counts (clicks, spins, stars) — never abbreviate a count.
   ```

Minor: `SkillNode.tsx:96` renders star costs as a bare `{cost}` while
`SkillTreeScreen.tsx:51` uses `toLocaleString()` for the star balance. Only visible above
1,000 stars.

---

## F7 — No `IconButton` primitive `[S]` *(brief item 5a)*

**Finding.** Four near-identical hand-rolled square icon buttons. The only real divergence
is `transition-all` vs `transition-transform` — i.e. drift, not intent.

```
src/components/shell/TopBar.tsx:83   flex h-9 w-9 items-center justify-center rounded-lg border-2
                                     border-ink bg-white text-ink shadow-arcade-sm
                                     transition-all hover:-translate-y-0.5
src/components/shell/TopBar.tsx:92   …same, + active state: bg-primary text-white / bg-white text-ink
src/screens/GameplayScreen.tsx:397   …same, but transition-transform
src/components/shell/BottomNav.tsx:31-35  same h-9 w-9 rounded-lg box, same active colors
```

Odd one out: `GameplayScreen.tsx:627` (edit-equipped) is `h-8 w-8` — the only 32px icon
button among 36px peers.

**Recommendation.** One ~18-line primitive at `src/components/arcade/IconButton.tsx`:

```tsx
export function IconButton({ icon, label, active, size = 36, ...rest }) {
  // h-9 w-9 rounded-lg border-2 border-ink shadow-arcade-sm
  // transition-transform hover:-translate-y-0.5
  // active ? "bg-primary text-white" : "bg-white text-ink"
  // aria-label={label} is required, not optional
}
```

Four call sites collapse to four one-liners, the a11y label stops being optional, and the
`h-8` outlier gets normalised. Highest ratio of "looks designed" to lines written in this
document.

---

## F8 — `LeaderboardScreen` hand-rolls its own header `[S]` *(brief item 5c)*

**Finding.** Four screens use `PageHeader` (`GachaScreen:146`, `ProfileScreen:41`,
`SkillTreeScreen:45`, `SettingsScreen:81`). Leaderboard does not import it at all and
builds a structurally different header:

```jsx
// PageHeader.tsx:12-23 — centered, text-3xl md:text-4xl, text-stroke-ink, leading/trailing slots
<h1 className="font-display text-3xl font-black uppercase text-ink text-stroke-ink md:text-4xl">

// LeaderboardScreen.tsx:45-53 — left-aligned, text-2xl, no stroke, colored band, inline icon
<div className="flex items-center justify-between border-b-4 border-ink bg-tertiary-fixed px-4 py-3">
  <h1 className="flex items-center gap-2 font-display text-2xl font-black uppercase text-ink">
```

The `dateId` chip at `:50` is a hand-rolled `trailing` slot. `GameplayScreen:389-407` is a
third pattern again, including a magic `<div className="w-[88px]" />` at `:406` used purely
to fake center alignment.

Separately, the *in-panel* colored header band is itself duplicated with different values —
`SkillTreeScreen.tsx:62` (`px-3 py-2`, `text-lg`) vs `:105` (`px-4 py-3`, `text-xl`) vs
`LeaderboardScreen.tsx:45` (`px-4 py-3`, `text-2xl`). Same component role, three sizes.

**Recommendation.**
1. Move Leaderboard onto `PageHeader` (`title="Today's Top Chefs"`, `trailing={dateChip}`).
2. Extract the colored band into a ~12-line
   `src/components/arcade/SectionHeader.tsx` — `{ icon, title, note?, tone, trailing? }` —
   and use it for both `SkillTreeScreen` bands. One padding, one type size.
3. Replace `GameplayScreen`'s `w-[88px]` spacer with the same three-slot flex `PageHeader`
   already uses.

---

## F9 — Ad-hoc z-index ladder `[S]` *(brief item 4)*

**Finding.** No `zIndex` extension exists in `tailwind.config.js` at all, so the stack is
22 sites of raw utilities plus five arbitrary escapes: `z-[45]`, `z-[58]`, `z-[60]` (twice,
on two different components), `z-[70]`.

Current ladder, ascending:

| z | Sites |
|---|---|
| `z-10`/`z-20`/`z-30` | in-scene FX: `GameplayScreen:519,522,551`, `ClickBurst:53`, `FloatText:25`, `GachaScreen:235` |
| `z-40` | flash + crit layers (`GameplayScreen:457,466,487`, `GachaScreen:143`), score scrim (`ScoreDisplay:66`), **and both nav bars** (`TopBar:21`, `BottomNav:16`) |
| `z-[45]` | badge toast (`BadgeNotifier:54`) |
| `z-50` | three modals (`DayChoiceModal:18`, `WeekSummaryModal:38`, `StartDayModal:17`) **and the score popover** (`ScoreDisplay:70`) |
| `z-[58]` | `FeedbackModal:45` |
| `z-[60]` | `Spotlight:47` **and** `RarityRevealOverlay:52` — two overlays, no defined winner |
| `z-[70]` | `FeatureIntroLayer:129` |

Two real collisions: a popover ties the modals, and the tutorial spotlight ties the rarity
reveal.

**Recommendation.** Five named rungs, wide gaps, nothing between them:

```js
// tailwind.config.js → extend.zIndex
zIndex: {
  nav: "40",        // TopBar, BottomNav, in-page scrims
  toast: "50",      // BadgeNotifier, ScoreDisplay popover
  modal: "60",      // Start/Week/DayChoice/Feedback
  "modal-top": "70",// RarityRevealOverlay, FeatureIntroLayer
  tutorial: "80",   // Spotlight — must beat everything
},
```

In-scene FX (`z-10/20/30`) stay as-is; they're local to a positioned scene wrapper and
never compete with chrome.

**Explicitly out of scope:** `src/scene/` uses its own numeric 2000-range stack
(`Counter.tsx:68,83,94`, `Customer.tsx:69`, `WindowView.tsx:60`, `RestaurantScene.tsx:36`)
for depth-sorting sprites. That is a **separate coordinate space and should be left
alone.** The one thing worth a comment is `RestaurantScene.tsx:101`'s `z-[2500]` — the
single Tailwind class inside the scene, whose job is to beat those inline numbers. Leave
the value; add a one-line comment saying why it's 2500.

---

## F10 — Border-weight inconsistency `[M]` *(brief item 3)*

**Finding.** 68 border declarations across 24 files with no stated rule, so the same
conceptual object gets different weights in different files.

Concrete collisions:

| Same role | Weight A | Weight B |
|---|---|---|
| ~92px square tile | `GachaScreen:52` / `RollCard:56` — `.arcade-box` (border-4) + `ring-2 ring-inset` | `GachaReel:121` — `rounded-lg border-2` |
| List/choice row | `LeaderboardScreen:69` — `border-2` | `DayChoiceModal:44` — `border-4` |
| In-panel form control | most controls — `border-2` | `FeedbackModal:101,113` inputs — `border-4` |
| Empty vs filled equip slot | `GachaScreen:40` — `border-4 border-dashed`, no padding | `GachaScreen:52` — border-4 solid + `p-1` (box size changes on fill) |

`border-[6px]` has zero Tailwind usages; the only 6px border is raw CSS at `index.css:171`.

**Recommendation.** Write the rule down (a comment block at the top of `index.css` is
enough) and sweep to it:

- **`border-4`** — panels, buttons, cards, modals. Anything that reads as a *surface*.
- **`border-2`** — chips, pills, inputs, icon buttons, list rows. Anything *inside* a
  surface.
- **`border-b-4`** — section header underlines and bar edges only.
- **`border-dashed`** — locked or empty states, always at the same weight as its filled
  counterpart so the box doesn't resize when it fills.
- **6px** — the scene frame only. It's a deliberate one-off; keep it in CSS, don't
  introduce a Tailwind escape for it.

M rather than S because it needs a judgement call per site and a visual pass afterward.

---

## F11 — `arcade-btn` used raw instead of `ArcadeButton` `[M]` *(brief item 5a)*

**Finding.** Seven buttons apply `className="arcade-btn …"` directly, bypassing the
primitive — and two of them invent styling the primitive doesn't have.

| Site | Note |
|---|---|
| `FeedbackModal.tsx:64, 139, 147` | `py-2.5` — a vertical padding not in `ArcadeButton`'s `SIZE` map (`sm/md/lg/xl` are `py-2`/`py-2`/`py-3`/`py-4`, `ArcadeButton.tsx:14-19`) |
| `FeatureIntroLayer.tsx:161` | full-width `lg` equivalent |
| `GameplayScreen.tsx:598` | full-width white button |
| `WeekSummaryModal.tsx:118` | full-width primary |
| `SteamCta.tsx:18` | `bg-ink` — a variant not in the `VARIANT` map (`ArcadeButton.tsx:6-12`) |

**Recommendation.** Add a `fullWidth` prop (or just use `className="w-full justify-center"`
— `WeekSummaryModal:89` already does exactly that with `ArcadeButton`) and an `ink`
variant, then convert all seven. Drop `py-2.5` in favour of `size="md"`. After this,
`arcade-btn` appears exactly once in the codebase, inside `ArcadeButton.tsx:39` — which is
the invariant worth having.

---

## F12 — New divergences already present in the gacha/skills screens `[M]` *(brief item 8)*

These shipped with the rework and are cheap to fix now, before they get copied.

**Padding / sizing has no scale.**
- `GachaScreen:52` `p-1` vs `RollCard:64` `p-2` vs `RollCard:92` `p-3` — three densities of
  the same object, three arbitrary steps.
- `GachaScreen:268` `px-2.5 py-1` — the only `px-2.5` in the repo.
- `SkillTreeScreen:71` `px-3 py-4` vs `:123` `p-4` — the two node grids.
- `RollCard:33` `h-[4px]`, `:68/:96` `h-[6px]`, `GachaReel:135` `h-[3px]`, `:147` `w-[2px]`
  — four hairline sizes, no scale. `RollCard:81` `gap-[3px]` next to `gap-1/2/3` everywhere
  else. `SkillNode:88` `size={11}` is the only odd-numbered icon size in the app.
- Container widths: `GachaScreen:139` `max-w-3xl`, `SkillTreeScreen:44` `max-w-4xl`,
  `LeaderboardScreen:42` `max-w-2xl`, `GameplayScreen:386` `max-w-3xl xl:max-w-4xl`. Four
  screens, four widths — and `maxWidth.container` (`tailwind.config.js:79-81`) is used by
  exactly one file (`TopBar:22`). Pick two: `container` for content screens, wide for
  gameplay.

**Duplicated blocks that want extracting.**
- `GachaScreen:52-53` re-implements `RollCard:56-57`'s `frame` + `ringStyle` pair inline
  rather than importing it. Same two lines, two files.
- `RollCard:68` and `:96` — identical `rarity-curry-surface` sheen span in both branches.
- `GachaReel:96,98` — the mask gradient string written twice verbatim.
- `GachaReel:148-163` — two 5-line inline `style` triangle caps differing only in
  `borderTop`/`borderBottom`.

**Mixed styling mechanisms on one element.** `GachaScreen:268-271`: the filter pill's
selected state sets background via inline `style`, its unselected state via `bg-white`
class. Pick one mechanism per element.

**Dead / duplicated logic.**
- `SkillNode.tsx:18-23` — the `TILE` map has 4 keys but `unaffordable` and `affordable` are
  byte-identical strings, so it encodes 3 states. And `purchased && star`
  (`SkillNode.tsx:37`) is special-cased *outside* the map the map exists to replace.
- `GachaReel:26` `FILLER_WEIGHT = [46, 26, 15, 8, 4, 1]` — a second hardcoded rarity
  distribution that must stay in sync with `RARITY_WEIGHT` in `engine/gacha.ts` but isn't
  derived from it. Derive it (`RARITY_WEIGHT` normalised) or comment that it's cosmetic-only.
- `GachaScreen:111` `power: (fx.particles - 7) / 9` — inverts a formula that lives in
  `ClickBurst`. The comment admits the coupling; better to let `rarityFx` carry `power`
  directly and have `ClickBurst` derive particles from it, not the reverse.
- Magic numbers worth naming: `GachaReel:106` `targetX - 34` (overshoot), `:81`
  `TILE * 0.55` (jitter), `:111` inline bezier, `RarityRevealOverlay:62-63` `* 240`
  (particle radius), `GachaScreen:183/185/225` `h-32` repeated three times as the reel-bay
  height.

---

## If you only do three things

1. **F1 — kill the `#191c1e` literals and tokenise the scene frame `[S]`.** It's the only
   item here that fixes a genuine visual defect (dark mode), and it's a handful of one-line
   edits plus four CSS vars.

2. **F3 + F4 together — add `2xs`/`3xs`, then wire or delete the dead `fontSize` scale
   `[S]`.** One sweep. Thirty-three arbitrary pixel values collapsing into a named scale is
   the single change that most makes the UI read as designed rather than assembled, and the
   six-entry unused type scale is the loudest "vibe coded" artifact in the repo.

3. **F7 — extract `IconButton` `[S]`.** ~18 lines that delete four duplicated className
   strings, normalise the `h-8` outlier, and make `aria-label` mandatory. Best
   polish-per-line in the document, and it establishes the "primitives, not strings"
   precedent that F8 and F11 then follow cheaply.

Everything else can wait; F9 and F10 are worth doing *before* the next screen gets built,
not after.
