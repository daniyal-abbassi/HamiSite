# The band's geometry does not fit its own budget — found before the irreversible step

**Date**: 2026-09-25 22:2x (+0330) · **Author**: driver, from a fresh-context adversarial review it commissioned
before `T012`, plus checks I ran myself · **Status**: **`T012` is blocked.** The page swap has not been executed
and must not be until the owner rules on §5 below.

Why this file exists: `tasks.md` put the irreversible deletion (`T012`, FR-016 has no rollback) in the *same
commit* as the design decision (`T011`) and scheduled the measurement that decides whether that design fits
(`T027`) **afterwards**. I wrote that ordering and it was wrong. The measurement is being run first.

## What I had claimed, and what is actually true

My `T011` plan was: change the sticky shell from `min-height: 100svh` to `height: 100svh` so the pin cannot be
defeated by an over-tall shell, and move the locked composition out of the pinned box into an in-flow block
below it. Two of its premises were wrong:

1. **"A sticky element taller than the viewport never pins."** False as stated. A sticky element taller than
   the *viewport* does pin — its top sits at `top: 0` and the rest hangs below the fold. What kills the pin is
   the shell being taller than the **track**: pinned travel is `trackHeight − shellHeight`, so with a track of
   `svh + 1600px` and a shell grown to ~2,600px of content, travel is ≤ 0. `T013`'s wording would have sent
   the next agent to shrink the viewport fit instead of the real inequality `track > shell + desiredRun`.
   The pinned-travel formula itself is correct, which is why `svh + 1600 − svh = 1600` is *not*
   double-counting — but see §"the budget" for what it does cost.
2. **"blueprint §1a's inventory is partly phantom."** False, and I published it (board 22:10, commit `7ff31b7`).
   `storeExperienceSlots` does exist at `lib/content/home.ts:213` and `StoreExperience.tsx:7` does import it
   (and never renders it — that part of the blueprint was right). The `AUTHENTIC SHOWCASE` / `HANDS-ON` /
   `HAMI / ONLINE + OFFLINE` blocks the blueprint cites at `:53`, `:70`, `:89` are in the file, which is 116
   lines. My "phantom" note came from reading the *working-tree* version earlier in the day — partner's
   uncommitted 62-line `T089` pass — and not re-checking after the rollback restored HEAD's version.

## The blockers, with the evidence I verified myself

### A. The phone bar cannot win the bottom of the screen. Money-first requirement, structurally unsatisfiable.

Read from source, not inferred:

- `app/globals.css:174-177` — `.wrap { position: relative; z-index: 2 }`. The band's section is
  `<section id="store-experience" className="wrap assembly-band">`, so **everything inside it is painted inside
  a stacking context capped at z-index 2**.
- `components/layout/MobileDock.tsx:90` — `fixed inset-x-3 bottom-3 z-40 … md:hidden`, a ~64-80px pill.
- `components/layout/Header.tsx:80` — `fixed inset-x-0 top-0 z-50`.
- `components/home/assembly-band.css:24-27` — the immovable bar is `position: absolute; inset-block-end: 1rem`
  against the shell, i.e. **exactly inside the dock's strip**, at `z-index: 3` — a value that is *inert* against
  `z-40` because of the `.wrap` ceiling.
- `app/globals.css:167-171` — `main > section { scroll-margin-top: 6rem }`, the project's own reservation for
  the fixed header. `top: 0` on the shell puts the stage's first ~96px under the wordmark regardless.

Consequence: `T040`'s `document.elementFromPoint(bar centre)` sweep returns the dock's nav, and `T042`'s
instruction to "create a stacking context that guarantees the two actions are topmost" **cannot be satisfied
from inside `.wrap` as structured**. FR-018/SC-006 — the requirement with veto power, on the channel most
purchases actually arrive by — fails by geometry, not by coding. The usable stage is therefore not `100svh` but
roughly `svh − 96 (header) − 80 (dock) − 32 (padding)` ≈ 590px at a 360×800 viewport.

### B. The budget is roughly double the criterion, and the settled block I proposed is pure addition

`SC-001` demands the band's footprint at 360 be ≤ 2,400px against the 2,961px it replaces, and `FR-016`'s whole
argument is that the shortening is the point. For a sticky shell inside a track, the document footprint is
`track + any in-flow sibling`, so my in-flow "settled composition" block *adds* to the pin rather than replacing
it. Working from blueprint §1's content inventory: if the static composition at 360 measures ~2,400-2,700px (the
same content that measured 2,961px in three sections, minus three paddings and the retired self-link), then an
honest pinned band is `~2,600 + 1,600 ≈ 4,200px` — **longer than what it replaces**, and my `svh + pinRun ≤
2,250` headroom is off by a factor of two, not by a rounding.

Worse for the phone-first rule: `@supports (animation-timeline: view())` (`assembly-band.css:75-94`) is the only
thing that sizes the track, so on Safari ≤18.x and Samsung ≤22 — the engines `T009`/`T013` are about to confirm
this project's own chromium does or does not befriend — the band's footprint *is* the full static composition,
≈2,400-2,700px, with no motion at all. **The owner's §8 Q1 ruling accepted "motionless but correct", not
"longer".**

### C. Transforms cannot compress a stack, so beat 0 as designed does not exist

`blueprint.md:110` asks beat 0 for "final reading order compressed, gaps ≈ 0, each card's text still fully
legible (no overlap of text)". The offsets table (`assembly-band.css:50-64`) spans about ±5.5rem ≈ 176px against
a ~2,600px flow, and `@keyframes band-fly` animates only `translate` and `rotate`. A translate moves a box; it
does not shrink the box or the flow it occupies. So "compressed around the shell's centre" is "pile 2,600px of
cards into 176px of offset" — every card lands on every other card, violating `US2-AC1` ("all of the band's text
present and legible" at every point). `svh` being the *smallest* viewport (so the shell under-fills by the
toolbar height, contradicting `blueprint.md:104`'s parenthetical "never under-fills") makes the stage smaller
still.

The two-state split does not rescue this, because the two boxes are not connected by any transform: a part's
journey from a viewport-anchored box to a document-anchored box is a delta that changes by up to the whole 1,600px
pin run, which no static `translate` value expresses. Either the composition is duplicated (which kills
`data-band-part` uniqueness, doubles the word counts that `T007`'s harness compares, breaks `T046`'s
"present exactly once" in print, and re-creates the duplicate-id hazard `T012`'s same-commit rule exists to
prevent — `store-experience-title`, `trust-title`, `final-conversion-title` are all ids and
`aria-labelledby` would resolve to whichever copy comes first) or it is re-parented by script (which breaks
`SC-004`, `FR-006`'s "state is a pure function of scrollY", and `FR-011`'s focus continuity, and is exactly what
`blueprint.md:142` rules out).

### D. Three defects that exist today, independent of any of the above

I read all three in the file; they are not predictions:

1. `assembly-band.css:120-133` — both fallback blocks reset `min-height: 0` and never touch `height`. If `T011`
   lands as `height: 100svh`, reduced-motion and print collapse the track to `auto` while the shell stays a
   100svh box with ~2,600px of unclipped, centre-justified children: the composition straddles its own box and
   paints over the section before the band and over the footer. `SC-003`/`T025` and `T046` would be measuring
   that.
2. Same blocks set `.assembly-band__shell { position: static }` and never touch `.assembly-band__immovable`.
   A static shell is not a containing block, so the bar resolves against the initial containing block and floats
   at the bottom of the *viewport* over unrelated content, while `padding-block-end: 4.5rem` leaves a 72px hole
   where it used to be. **This is live on any engine that takes the reduced-motion path**, and `T041` only half
   sees it.
3. `@media print` sets only `transition: none` on `.heading-arrival__word` (`:132`) — the hidden state lives in
   `.heading-arrival--armed .heading-arrival__word { opacity: 0; filter: blur(6px) }` (`:106-110`). A heading
   still armed when the shopper prints loses its text: `FR-013`'s "no lost content" fails. The reduced-motion
   case is saved only by the `matchMedia` guard in `HeadingArrival.tsx:56-59` (which has no change listener),
   and print has no guard at all.

### E. Two more, which will read as test failures rather than as design facts

- **`animation-range: entry 100% exit 0%` (`:92`) is invalid-by-geometry for this subject.** `entry`/`exit` are
  containment-bounded, and a subject three times the height of the scrollport can never be contained, so the
  range's endpoints are unreachable; the `*-crossing` variants exist for oversized subjects. The structural
  problem is worse than the keyword: a `view()` timeline's progress is a function of (subject size, scrollport
  size), while the pin window is (track − shell). They coincide today only because `--band-track` happens to be
  `shell + 1600px`. Change the shell and the scrub silently decouples from the pin. `T028` should be rewritten in
  those terms instead of "has to be measured".
- **`FR-001` and `FR-012`/`US2-AC1` collide inside the pin.** The arrival needs words at `opacity: 0` and
  `blur(6px)`; the band needs all text legible at every point of the sequence; `FR-012` says a blurred heading is
  not exempt. Because beat 0 stacks the three headings and the shell is pinned, all three arrivals fire
  simultaneously *during* the choreography. `T020` frames this as an arming-logic bug; it is a requirements
  collision, and `T048`'s contrast sweep is what will call it.
- **`close`'s anchor can never arrive when the blueprint promises it.** `useAtmosphereGround.ts:54-68` measures
  anchors on mount/resize/load/+1500ms and **never on scroll**, so (i) any anchor inside the pinned region
  freezes at whatever offset the measurement happened at — `#band-settled` must stay outside the shell, where
  `AssemblyBand.tsx:196` already puts it — and (ii) `blueprint.md:168`'s "interpolates to `close` no later than
  the lock beat (t≈0.85)" is unreachable, because `band-settled` sits at the track's *end* (band t = 1.0) while
  the ground is linear in document scroll. `SC-009`/`T036` are therefore written to fail on geometry. Either
  `band-settled` moves to ~85% of the track or that sentence is amended. My `T015` arithmetic (9 rendered vs 9
  accounted) is unaffected by either choice — the guard will stay green and tell me nothing about this.
- `--band-track: calc(100svh + 1600px)` makes a **length criterion viewport-relative**: on a 1,440px-tall desktop
  window the band is ~3,040px, so `spec.md:158-159`'s tall/short-viewport edge cases have no task, and "≤2,400px
  at 360" is really "≤2,400px at an 800px-tall phone".
- Minor and structural, will bite during any restructuring: `AssemblyBand.tsx:61`, `:126`, `:157` spread
  `part(id)` — which includes `className` — and then override `className` with a literal that repeats
  `assembly-band__part`. Harmless today, silent if `part()` ever changes.

## What is still unmeasured (running now, `T027`)

The decisive number, and the reason `T012` is on hold: **what is the band's static section height at 360, does
the shell pin at all, and where exactly do the bar, the dock and the header boxes land.** The probe is
`app/(main)/band-spike/page.tsx` — a throwaway route that mounts `<AssemblyBand />` alone, alongside nothing it
replaces, so nothing is deleted to measure it; it is deleted before any commit. First two runs timed out because
three browser pools were hammering one dev server on this box; it is being re-run serially. Everything in §A-§E
above is verified from source; §B's pixel figures are the reviewer's arithmetic and remain *unmeasured* until
that probe returns.

## The ruling the owner has to make

`FR-004` (only parts that exist) + `FR-003` (all present and legible in the settled composition) + `SC-008` (no
new strings) + `FR-016` (replace, no rollback) + `SC-001` (≤2,400px) + `FR-017` (phone-first) is not an
unimplemented constraint set, it is an **unsatisfiable** one at the current content volume. Something has to
give, and the three coherent options are:

1. **Cut the band's content first.** Make the static composition ≤ ~1,600px at 360 (this is the continuation of
   what `T089` was doing all day), then a ~800px pin fit inside the budget and the pinned cast has a chance of
   fitting one viewport. Meets `SC-001` honestly. Costs: the band says less than the three sections did.
2. **Pin a subset.** Only the three statements + the two immovable actions fly; the long card grids stay in flow
   and simply scroll. `SC-001` becomes reachable (`flow + short pin`), `FR-003`/`FR-004` still hold, and
   `US2`'s "the parts separate and re-lock" applies to a named subset rather than to everything. Costs: it is a
   narrower reading of "squeeze the sections below into one animation" than the owner asked for, and needs an
   explicit exception written into `FR-003` rather than implied.
3. **Stop pinning.** Scrub across the band's natural pass with two beats instead of four. Cheapest and most
   robust on phones (it removes §A/§C/§E entirely), and it is what the research in
   `mobile-scroll-pin-failure-modes.md` points at for mobile. Costs: `FR-016`'s own words say "one **pinned**
   closing movement", so this amends a decision the owner made, not a technical choice.

My recommendation is **2, with 1 as a precondition** — cut the two remaining fat blocks while the band is being
built, and let the pin carry only what fits a phone screen. But this is a product ruling: it decides what the
homepage's ending *is*, and `T012` deletes the current one irreversibly.

**What I have done and not done.** Done: ground re-anchor (`T014`), the guard's `SUBTREE_ANCHORS` arithmetic and
its new exemption test (`T006`), the retraction of my false blueprint claim, the lock/handoff and lane postings,
the push. Not done, deliberately: `T012` (page swap + the three deletions), `T011`/`T013` (the design under
ruling). `lib/atmosphere/progression.ts` and the test file are edited in the worktree and **uncommitted** — the
guard is red on one assertion (`expected 11 to be 9`) because the anchors now describe a band the page does not
render yet. That red is the guard working. If it must be reverted, say so and I will put both files back by hand.
