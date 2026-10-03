# Research: Categories Masonry Gallery

**Feature**: 010 | **Date**: 2026-09-26 | **Plan**: [plan.md](./plan.md)

Nine decisions. Each states what was chosen, why, and what was rejected — the rejections matter more than the
choices here, because every one of them is a shape an agent will reach for if the reason is not written down.

---

## D1 — CSS Grid row-spans own the layout; JavaScript never touches a position

**Decision**: `display: grid` with `grid-auto-rows: 8px` and per-tier `grid-row: span N`. Tiles are laid out by
the stylesheet. The single JS in the feature creates a tween on elements the browser has already placed.

**Rationale**: Grid's **sparse row-major auto-placement algorithm** does the masonry for free. Given items whose
spans differ, the cursor advances row by row and each item lands in the first cell block that is genuinely empty
in that column — which means each column packs contiguously from the top and can never leave a hole in its
middle. Uneven bottoms appear only where they should: at the end of each column. Hand-traced for the 360 pattern
(L,M,S repeated over 2 columns, spans 14/11/8): column 1 ends at row 47 and column 2 at row 52, so the bottoms
stagger by 100 px with no gap anywhere. That is the arrangement the owner asked for, produced by rules the
browser enforces.

It also answers FR-022 for free: track heights are `8 × span + gap × (span − 1)` — a number known from the
stylesheet, with nothing measured from content or from the images. The chapter's height is right at first paint,
so the arrival cannot shift the page.

**Verified in the browser, not assumed**: RTL placement (first column on the right) and the sparse packing are
both in quickstart §2, because D1 is the one decision here that a screenshot can invalidate.

**Alternatives considered**

- **CSS multi-column (`column-count`)** — the reflex answer, and the one that fails hardest. It balances columns
  by *breaking content across them*, so DOM order becomes column-major: the keyboard reaches گوشی موبایل, then
  ساعت هوشمند, then سیم‌کارت — three departments deep into one column — before it reaches the second department.
  FR-020's reading order is broken, and in RTL the fill direction of `columns` is a separate question again. It
  also cannot express an authored height without `break-inside: avoid`, and it reorders when a department leaves.
- **Absolute positioning computed in JS** (what the supplied reference does) — rejected by FR-008 outright: the
  section is an empty fixed-height box until scripts run, and a shopper on a slow phone sees nothing where nine
  departments should be. Rejected a second time by FR-022: a JS-measured layout shifts the page when it lands.
- **`grid-template-rows: masonry`** (CSS Grid Level 3) — the semantically perfect answer and not shippable. It is
  not in Safari or Chrome stable; a feature built on it needs a fallback layout, which means building two
  arrangements to save thirty lines in one.
- **Flexbox with `flex-wrap`** — a wrapped flex row aligns to the tallest item in each line, which is the exact
  "matrix of equal rows" FR-002 forbids.
- **`aspect-ratio` per tile with default auto-sizing rows** — no spans, so tiles in a row stretch to the tallest
  one and the stagger disappears. Aspect ratio survives here only as a *per-tier* authoring aid, expressed
  through the span numbers rather than through the box.

---

## D2 — The rhythm is a Latin square keyed by department, not a hierarchy keyed by data

**Decision**: three tiers (S/M/L), defined at each breakpoint as a multiple of that width's *natural* 3:4 tile
height and snapped to whole rows. The tier each department holds is a **Latin square** — every department holds
each tier exactly once across the three widths — authored as a literal table keyed by `kind`.

| Breakpoint | cols | gap | content | tile width | natural 3:4 | S | M | L |
|---|---|---|---|---|---|---|---|---|
| base (<768) | 2 | 12 px | 320 px | 154 px | 205 px | n=8 → **148** | n=11 → **208** | n=14 → **268** |
| md (≥768) | 3 | 16 px | 707 px | 225 px | 300 px | n=10 → **224** | n=14 → **320** | n=17 → **392** |
| xl (≥1280) | 4 | 20 px | 1184 px | 281 px | 375 px | n=11 → **288** | n=15 → **400** | n=19 → **512** |

Height of a spanning tile: `H(n) = 8n + gap × (n − 1)`.

**Content widths are measured, not read from the config** — and this is a correction, not a refinement.
`tailwind.config.ts:36-39` declares `container.padding: "1.5rem"`, and `app/globals.css:224-226` overrides it
with a fluid `padding-inline`: measured 20 px at 360, ~31 px at 768, 48 px at 1280. So 360 has **320 px** of
content and **154 px** columns, not the 312/150 the config implies. The same arithmetic produced 009's
impossible "smallest tile ≥164 px at 360" and then its "corrected" 148 px — both derived from a padding value
the CSS does not apply, so 009's correction moved the number in the right direction and still landed wrong.
`CONTENT_WIDTH` in `lib/category-masonry.ts` now carries the measured values, and `sizes` is expressed in vw
because a fixed px hint is wrong at every width except the one it was measured at.

The multiples are 0.73–0.74× / 1.02–1.05× / 1.28–1.34× natural, rounded to whole rows. M sits just above natural
so the middle tier shows a 3:4 panel essentially uncropped; L crops mildly top-and-bottom; S crops to roughly
square. Each tier appears exactly three times per breakpoint, so no tier is privileged — but the crop lands
where it costs least: all nine panels were generated with the subject centred and a deliberately empty dark
bottom third reserved for the label, which is precisely the region S loses and the region the scrim plate covers
anyway. L is the outlier worth watching in verification: 512 px at 281 wide is narrower than 3:4, so `cover`
crops horizontally instead — the image paints 384 px wide into a 281 px box, losing ~13 % from each inline edge
and nothing vertically.

**Rationale**: FR-013 says heights are rhythm and not rank, and FR-013a says no tile may rely on being the
largest. A Latin square satisfies both *structurally*: each department holds each tier exactly once across the
three widths, so no department is permanently the big one and none is permanently the stub. It is also the
record FR-013 demands — a 9×3 table in `data-model.md` that a test re-derives, so changing a height is changing a
stated pattern.

**The rotation that satisfied every rule still failed, and the fix is a search.** The table planning drafted was
the elegant cyclic one — `[L, M, S]` from the first department at 360, shifted one place at 768 and two at 1280.
It is a Latin square ✓, three of each tier per breakpoint ✓, heights exactly as authored ✓. Built, it left one
column **420 px short at 1280** (tallest ÷ shortest **1.59**), because nine tiles do not divide into four columns
and CSS's sparse auto-placement is greedy: the *order* of tiers decides where the extra item lands, and no rule
written down above constrains it. That is the ragged-bottom edge case in `spec.md`, and it is visible in the
first `masonry@1280.png` as a third of an empty paper column.

So the pattern is now **chosen against a simulation of the browser's own placement algorithm** — nine lines
reproducing the cursor rule from D1 — searching the Latin-square assignments for the one that packs most evenly,
with two composition constraints held fixed (the one-product department must not be the largest tile on a phone,
and the reading entry point must not be the stub). Result: **1.108 / 1.000 / 1.031** at 360 / 768 / 1280, and the
live page matched the simulation to the pixel at all three widths. The simulator runs as a unit guard
(`packs evenly at every width`), so a future edit to the table that reintroduces the ragged bottom fails the
suite rather than the eye.

An elegant rule that has to be checked by looking is worth less than a searched one that a test enforces.

Keying by `kind` rather than deriving from index is the load-bearing half of this decision.
`categoryDepartments()` deliberately drops a panel when a slug stops resolving or a category empties
(`lib/category-departments.ts:144-160`). A tier computed as `position % 3` would then re-shuffle every remaining
tile's height — one department leaving would silently rewrite the composition. Keyed by kind, a departure
changes one tile.

**Alternatives considered**

- **Heights from catalogue weight** (009's D3, 134:1 spread) — the owner explicitly refused it on 2026-09-26, and
  it is the wrong instrument here anyway: `data-model.md` records that five departments have their route and kind
  counts disagree, so "weight" is not a clean number.
- **Heights from the pictures** — impossible. All nine panels are 3:4 (896×1200 or 1086×1448), so there is no
  natural variation to preserve. This is stated in the spec's Assumptions and is the reason FR-013 exists.
- **A per-department hand-picked one-off height per width** — freeform, so it cannot be asserted, and FR-013's
  whole purpose is that the next change is made against a pattern.
- **Deriving the tier from index at render time** — one line shorter, and it fails the emptied-category edge case
  above. Rejected for that reason alone.

---

## D3 — The trigger is IntersectionObserver; ScrollTrigger is available and not used

**Decision**: one `IntersectionObserver` on the section (`threshold: 0.12`, `rootMargin: "0px 0px -12% 0px"`),
disconnected on the first intersection, plus a module-scoped `hasPlayed` flag.

**Rationale**: FR-009 wants a one-shot entrance. That is IntersectionObserver's literal job. `gsap` is already a
dependency for the tween itself; a scroll *plugin* buys nothing a one-shot observer does not already do, and it is
not free here: `ScrollTrigger.js` is confirmed present in the installed `gsap@3.15.0`, but it has **zero uses in
this repository** (the only `gsap` import is `components/layout/PillNav.tsx:7`), and this page's document scroll is
owned by Lenis (`components/atmosphere/ScrollSmooth.tsx`), which ScrollTrigger must be explicitly bridged to or it
mis-times every trigger. Wiring a first plugin plus a scroll sync to play a one-time entrance is more moving parts
than the requirement justifies, and it is the kind of machinery that fails quietly on a phone.

There is also a precedent argument the constitution cares about (internal consistency): `HeadingArrival.tsx:76`
and `Reveal.tsx` already do exactly this — observer, once, fail-open — and `CategoryCarousel.tsx:159` already uses
an observer for the same section. Three existing implementations of the correct pattern.

**Alternatives considered**

- **`ScrollTrigger` with `once: true`** — rejected on the Lenis bridge and the first-use risk above. If a later
  feature needs scrubbed, position-linked motion in this section, that is the moment to introduce it, with the
  sync done once for the page.
- **Trigger on load (`useEffect` immediately)** — what the reference effectively does, and the owner's Q1=C
  answer rejected it: the chapter sits below the fold, so a shopper who scrolls fast would arrive at an entrance
  that already finished off-screen and see nothing.
- **`content-visibility: auto` with a `contain-intrinsic-size`** — a fine layout optimisation, wrong as a trigger:
  it does not tell us when the shopper saw it, and it interacts badly with a known authored height.
- **`requestAnimationFrame` + manual `getBoundingClientRect` on scroll** — reimplementing the observer badly, and
  binding to scroll on this page is what 005's contract G1 exists to forbid.

---

## D4 — Blur is bounded to three tiles at a time by arithmetic, and never touches text

**Decision**: two property groups, deliberately separated.

- **Rise** — `opacity: 0 → 1` and `y: +18px → 0` on the tile, all nine with `stagger: 0.12`, `duration: 0.44`,
  `ease: "power3.out"`. Compositor-only, so nine at once costs nothing.
- **Resolve** — `filter: blur(6px) → blur(0)` on the **image layer only**, `duration: 0.32`, same 0.12 stagger,
  **`immediateRender: false`**.

Maximum tiles carrying a blur concurrently = `ceil(blurDuration / stagger)` = `ceil(0.32 / 0.12)` = **3**.
Exported as `MAX_CONCURRENT_BLUR` from the pure module and asserted in a test.

**Rationale**: the reference animates `blur(10px)` on every item simultaneously. This project's owner has told us
twice that this machine cannot judge smoothness, so no fps claim is available from here in either direction —
which means the bound has to be *structural and provable*, not a number someone felt was reasonable. Concurrency
is then pure arithmetic on two constants, and the constants are the API: a later change to either one moves the
bound, and the test says so.

The blur stays off the label because a blurred Persian word during arrival is a word the shopper cannot read
during arrival, and legibility of the name is FR-005, which outranks the effect.

**The bound was false as first implemented, and only measuring caught it.** `ceil(0.32 / 0.12) = 3` describes how
many tweens *overlap*; it says nothing about how many elements *carry a filter*, because `gsap.from()` writes its
start value to every target the instant the tween is created. Sampling `getComputedStyle(art).filter` across a
live arrival counted **nine image layers holding `blur(6px)` from the first frame** — the exact property this
decision exists to refuse, arriving through a stagger that looked like it prevented it. `immediateRender: false`
defers each write to the tile's own turn; re-measured at **three**. There is no visible snap from sharp to soft,
because the rise tween holds that tile at opacity 0 at the moment the blur lands — the two tweens share a
stagger.

The probe bounds `carrying`, not the count of elements whose value *changed* between samples: at 50 ms
granularity 4–5 tiles show a change in one window even when only 3 are ever active, because a tween can finish
and another begin inside a single interval. `carrying` is the quantity the compositor actually pays for.

**Alternatives considered**

- **A `@media (min-width)`/pointer-based cut-off** ("only blur on desktop") — rejected: it guesses capability from
  viewport width, and 360 px is the primary target, so it would delete half of the arrival the owner asked for.
- **Replacing blur with a scale+opacity-only entrance** — the cheapest option, and it fails US2: without the
  soft-to-sharp resolution the tiles "pop in", which is exactly what the reference's blur language exists to
  avoid.
- **A single blurred overlay that sweeps the section** — one blur instead of nine, but it needs the tiles to be
  composited under a mask, which means either `backdrop-filter` (unsupported for this use) or duplicating the
  images. More machinery than three-at-a-time.
- **Scrubbing the blur to scroll position** — turns a one-time entrance into a continuous per-frame animation
  across the whole chapter, which is a strictly larger cost than the thing being bounded, and breaks FR-009.

---

## D5 — The arrival's direction is the block axis, so RTL never enters the motion maths

**Decision**: tiles rise (`y`). Nothing slides along the inline axis.

**Rationale**: the reference moves items in from a direction, and the honest equivalent for a right-to-left page
would be an inline offset — which requires the tween to know the document's writing direction and to negate
accordingly. This project has already been bitten by exactly that class of bug: features 005 and 006 needed
contracts K1–K3 to keep RTL arrow-key sign mapping from putting the keyboard out of sync with the screen. A rise
carries the same editorial reading (a deck being dealt, a page assembling) with no axis to get wrong and no sign
to maintain.

**Alternatives considered**

- **Slide from inline-start (right)** — reads fine in RTL and is a lie in LTR, and the sign has to be derived at
  runtime from `getComputedStyle(document.documentElement).direction`. One more branch that can be wrong, for an
  effect indistinguishable at 18 px of travel.
- **Slide from inline-end** — worse: it reads backwards in the primary language.
- **Alternating direction per column** — the "casual" flavour in the reference. It makes the entrance the reason
  the layout looks unstable, and the owner's complaint history here is about composition, not playfulness.

---

## D6 — 009's `.cat-mosaic` CSS is deleted, not repurposed; its name is retired too

**Decision**: remove the whole ~165-line `.cat-mosaic` / `.cat-tile` block from `app/(main)/home.css` and the
`tests/unit/category-mosaic.test.ts` that guards it. Re-author the four rules that were never about layout
(scrim plate, focus ring, forced-colors border, reduced-motion neutraliser) inside the new `.cat-masonry` /
`.cat-card` block.

**Rationale**: the block is **orphaned** — `grep` finds no reference to `cat-mosaic` or `cat-tile` in any `.tsx`,
so nothing renders it and deleting it can break no page (this was verified today, and is why a shopper still sees
the carousel). What survives is not the CSS but the *audited facts* inside it: the `#050101` four-stop scrim
recipe, the 16.8:1 minimum label contrast measured against sampled panel bands, the `aria-describedby`-free
markup contract, the 148 px tile floor from research D1. Those carry into `data-model.md` and the contract.

Repurposing would mean editing every selector anyway — `aspect-ratio`-driven cells become row spans, and the
`--hero` / `--medium` modifiers have no meaning in a feature that forbids size-as-rank — while keeping alive a
mental model whose central idea (one hero panel) the owner rejected. And the class names stay: `cat-tile--hero`
in a file whose spec says no tile may be the hero is a contradiction waiting for the next agent to resolve by
reading the CSS instead of the spec.

**Alternatives considered**

- **Keep the block and add a new one alongside** — rejected by 009's own FR-014 logic: two category layouts in the
  stylesheet means the next change picks one by accident.
- **Rename the selectors and keep the rules** — the rules that transfer are four; renaming is more work than
  re-authoring them, and it preserves the `hero`/`medium` vocabulary by inertia.
- **Leave the orphan in place, untouched** — cheapest, and refused. Dead CSS in a file another agent edits every
  day is how 008's brand tokens drifted.

---

## D7 — The reference is a design source; every behaviour it carries is re-decided here

**Decision**: adopt the visual and motion language (uneven tiles, soft-to-sharp staggered entrance, hover scale);
refuse all six damaging behaviours listed in plan.md, each by mechanism rather than by comment.

**Rationale**: the supplied component is good at what it was built for — a dark, pointer-first gallery of
artificial images. Three of its six problems are invisible in that context and fatal in this one: hover-revealed
titles on a touch-major Persian storefront, `window.open` on a site whose back button is the shopper's escape
hatch, and JS-computed absolute layout on a page whose first contentful paint already carries nine departments.

Concretely, each refusal is a shape in the code, not a note:

| Refusal | The mechanism that makes it impossible |
|---|---|
| Hover-only label | The label is a `<span>` in server markup with no opacity rule keyed to `:hover`. Contract Q4 asserts the tile's name is in the SSR HTML. |
| `window.open` | `<Link href={department.href}>`, and `window.open` appears nowhere; guard test greps the new files for it. |
| JS-computed layout | D1. Guard test asserts the stylesheet, not the script, owns the spans. |
| Letter-spacing / uppercase on Persian | No `tracking-*`, no `text-transform` in the label rules; guard test asserts their absence by name. |
| Nine simultaneous blurs | D4's `MAX_CONCURRENT_BLUR ≤ 3` assertion. |
| Undefined colour tokens | Only `--paper*` tokens and the existing scrim recipe; guard test rejects any new hex outside those names. |

**Alternatives considered**

- **Install the reference as a component and configure it** — it brings `framer-motion`/older-React assumptions,
  the absolute-position engine FR-008 refuses, and 400 lines of behaviour six of which must be deleted anyway.
- **Port it nearly verbatim and patch the six** — six patches inside someone else's architecture, each of which
  the next update re-breaks. The rewritten form is *smaller* than the port: the grid is ~60 lines of CSS and the
  arrival ~45 of TSX, because all the removed behaviours were the bulk of the original.
- **Adopt the look and skip the motion** — the owner asked for the arrival by name in the reference's description;
  dropping it answers a different question.

---

## D8 — Hover is a CSS transition; press is a CSS `:active`; no JS in either path

**Decision**: `transform: scale(1.03)` on the image inside the tile at `:hover` (guarded by
`@media (hover: hover) and (pointer: fine)`) and the same rule at `:active`, plus a label brightness step.
Transitions only, 260 ms.

**Rationale**: US3 is the smallest story and the one most likely to be over-built. A CSS transition needs no
observer, no cleanup, no hydration, and it is *already* correct for both audiences: a phone fires `:active` on
touch, so the touch requirement of FR-012 is met by the same declaration that meets the pointer requirement — not
by a `touchstart` listener standing in for a hover that never comes. The `hover: hover` guard exists because
without it a phone keeps the hovered state stuck on after a tap.

The scale is on the image, not the tile: a 3 % scale on a grid item that is being row-spanned can change its
painted bounds against neighbours, while the image sits inside `overflow: hidden` and scales freely.

**Alternatives considered**

- **GSAP tween per hover** — a JS listener, a cleanup path and a race with the arrival tween, to do what one line
  of CSS does.
- **A `transition: all` catch-all** — would also transition `filter` and fight the arrival's blur on
  `clearProps`. Explicit properties only.
- **A lift/shadow on hover** — the tiles sit on a light paper ground whose whole point is the absence of card
  chrome; a drop shadow there reads as a marketplace card.

---

## D9 — Panels keep `next/image` with `fill`; intrinsic sizes are dropped, and the encoding problem stays named

**Decision**: `<Image fill sizes="…" unoptimized alt="" />` inside a positioned tile, with `sizes` per breakpoint
(`(min-width:1280px) 293px, (min-width:768px) 229px, 150px`).

**Rationale**: with D1, the tile's box is definite from the stylesheet, so `fill` cannot cause a shift — which is
what makes it safe here and what made it unsafe in a JS-measured layout. `unoptimized` matches the current path
(`CategoryCarousel.tsx:278`) and avoids routing nine local files through the optimizer for a homepage. `alt=""`
stays because the department name is adjacent live text (009's D5 argument, carried unchanged): nine announcements
of "تصویر یک شارژر" are noise, and the moment a panel gains content the rule flips and it loses `alt=""`.

**The honest limitation**: `phone.png` is 1.5 MB and `audio.png` 1.2 MB — 2.7 MB of the chapter's ~5 MB of
imagery in two files, and the chapter is mid-page, so the largest of them is a plausible LCP candidate on a slow
connection. This plan does **not** fix that: re-encoding is a separate decision, and US2's "a slow connection"
scenario is handled structurally (tiles already in place, pictures arriving into them, FR-011's end state
guaranteed). It is recorded here and in quickstart §6 as the follow-up with a name attached.

**Alternatives considered**

- **`width`/`height` with intrinsic ratios** — the 009 approach, and now wrong: the tiles are not 3:4 anymore, so
  intrinsic dimensions would size the box to the wrong height and reintroduce the shift.
- **Raw `<img>`** — one dependency fewer on the render path, but it opts out of `sizes` and drops the project's
  existing convention for no gain.
- **Convert the PNGs as part of this feature** — tempting and out of scope: an encoder decision with its own
  visual tradeoff should be judged on its own diff, not inside a layout change the owner is already reviewing.
