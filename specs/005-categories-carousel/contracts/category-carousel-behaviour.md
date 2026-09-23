# Contract: Category Carousel Behaviour

**Feature**: [spec.md](./spec.md) | **Model**: [data-model.md](./data-model.md) | **Research**: [research.md](./research.md)

Browser-observable promises. This is what "done" means at 360px and 1280px; nothing here is satisfied by a
unit test, and no unit test here is a substitute for looking at it.

`G1` outranks every other clause. Where a clause below is unachievable at a viewport or a device, the
section falls back to `FallbackPresentation` — it does not partially work.

---

## G. Overrides

- **G1 — The page is not this section's to take.** Nothing in this contract justifies capturing, delaying or
  cancelling the document's own vertical scroll, on any input device, with the pointer anywhere. If the arc
  and that promise conflict, the arc loses. (FR-016, SC-003; the reference's disqualifying property.)
- **G2 — No fabricated content.** A department panel carries its authentic badge or no image at all; a count
  is shown only where the destination actually holds that many products. No placeholder, no stock photo, no
  reference-bundled asset. (FR-033, FR-034, FR-005, Constitution I.)

## C. Composition and destinations

- **C1** Exactly nine panels, one per populated product kind, in the order established in `research.md` D1.
  No panel is a brand. (FR-001, FR-004, FR-003.)
- **C2** Every panel's destination resolves to a listing containing at least one real product, verified by
  visiting it. Zero dead doors. (FR-002, SC-002.)
- **C3** The `phone` panel shows no product count anywhere on the panel. Every other panel may show a count
  in Persian digits and MUST show the count its destination holds. (FR-005, FR-025, `data-model.md`.)
- **C4** Total departments is conveyed both visually and to assistive technology, so a shopper can tell they
  have seen all nine. (FR-007, FR-030, SC-012.)
- **C5** Both routes to a department — this carousel and the site's existing category navigation — land on
  identical results. (US4/7.)

## A. Active panel and movement

- **A1** One and only one panel is identifiable as active at all times, without reading the geometry. Emphasis
  is colour plus scale, not colour alone. (FR-008.)
- **A2** *(amended 2026-09-23 — see 005's Amendment Record)* Pressing **any** panel navigates to its products,
  on the first press, active or not. Centring is a browsing act and stays available through swipe, wheel, drag,
  arrow keys and the direction buttons. This is now the same rule `004` set for its brand rows: on a storefront,
  a card that is a destination answers to one press. (FR-009, FR-010.)
- **A3** After any release — pointer-up, flick, wheel step, key press — movement settles onto exactly one
  panel. It never rests between two. (FR-011.)
- **A4** Every panel is reachable from every other, in both directions, through the loop, with none skipped or
  stranded. (FR-012, US1/7.)
- **A5** A flick that intends one panel advances one panel, or settles on the panel gestured toward, in at
  least 9 of 10 attempts. Inertia travel is capped. (FR-014, SC-004.)
- **A6** The direction indicator (FR-013) reflects RTL reading, not physical screen edges: "more to come" is
  expressed on the trailing side of Persian reading. (FR-026.)
- **A7** The shopper's position survives browsing the rest of the page and is restored on return within the
  same visit. A fresh load starts at panel 1. (FR-015.)

## I. Input boundaries

Mechanism note: `research.md` D2 puts Embla in charge of drag, snap and loop, so most of this group is a
property of the architecture rather than of code written here. It is still asserted, because the failure mode
is the reference's and would return the moment a document-level listener is added.

- **I1** No listener in this section attaches outside its own element, and the wheel plugin is not installed.
  Verified by dispatching pointer and wheel events at `document` and at a distant section: the carousel does
  not respond. (FR-017, US3/2.)
- **I2** A gesture whose first resolved movement is vertical is a page scroll for its whole duration, even if
  it turns horizontal mid-drag. (FR-018, US1/3, US1/4.) Embla's axis-scoped drag provides this; the
  requirement survives the change of mechanism because a future `touch-action` or CSS edit could break it.
- **I3** The section's computed `touch-action` keeps vertical ownership with the browser at every scroll
  position, checked on the element and on its panels. (Mechanism guard, not a substitute for I2.)
- **I4** A wheel event with a dominant `deltaY` over the section scrolls the page. The section does not
  consume it, and does not advance either — advancing is the click control's job and the keyboard's.
  (FR-016, US3/1.)
- **I5** Two simultaneous touches, a drag continued outside the section's bounds, and a drag released outside
  it all settle to a valid single-active state. No stuck, split or off-index resting state. (Edge cases.)

## P. Performance and cost

- **P1** With the section off-screen: Embla is destroyed, so no scroll watch, no resize interpreter and no
  transition is live. Verified by recording frames while scrolling a distant region with the section present
  versus removed. (FR-019, SC-008.)
- **P2** The section never plays an entrance animation, on first appearance or after returning. Re-init on
  re-entry lands at the stored index without animating. (FR-019, US3/3, US3/4.)
- **P3** The looping list is nine DOM nodes. No duplicated panels, so every department is one tab stop and
  one accessible node. (Mechanism for FR-012 and FR-027. Note Embla's `loop` does not clone slides — it
  repositions, so this holds by default and breaks only if someone adds a duplicate-list loop of the kind the
  reference uses.)
- **P4** During movement the only per-frame writes are custom properties on existing nodes. Zero React state
  updates and zero forced reflows attributable to this section over a two-second drag at 60fps. A per-frame
  `setState` of the arc is the specific way to fail this clause. (FR-020.)
- **P5** Scrolling, image loading and interaction elsewhere on the homepage are measurably unchanged with the
  section present versus removed, on a throttled phone profile. (FR-020, SC-009.)

## T. Text, language, and typography

- **T1** Labels are live text: selectable, copyable, announced, and shaped by the platform's Persian
  shaper. The reference's baked-image labels are not adopted in any form. (FR-022, resolved Q2 = A, SC-006.)
- **T2** Labels remain sharp at the smallest size used on a 2× and 3× phone display — they are not rasterised,
  so this is a design-size check, not a rendering one. (FR-023.)
- **T3** The longest label in the set is accommodated without clipping or truncation at 360px and at 200%
  browser zoom. Panel width derives from the label, never the reverse. (FR-024.)
- **T4** All layout uses logical properties. Grep for physical `left:`/`right:` in the new CSS returns
  nothing. (Constitution II, FR-026.)
- **T5** `letter-spacing` remains `0` on Persian text, per `001/FR-057`. Applying a tracking value to Persian
  breaks letter joining and is the single most common regression on this page.

## K. Keyboard, screen reader, reduced motion

- **K1** The section is one tab stop. Arrow keys move the active panel; `Enter`/`Space` activates its
  destination; `Home`/`End` jump to first and last. (FR-027, SC-005.)
- **K2** `ArrowRight` moves forward in **reading** order, which in RTL is visually to the left. A physical
  mapping is a failure, not a preference. (FR-028, US4/2.)
- **K3** Focus is always visible and never off-panel; focusing a panel makes it the active panel, so keyboard
  position and visual position cannot disagree. (FR-027.)
- **K4** Pointer users can advance and retreat without dragging. (FR-029, US4/3.)
- **K5** Assistive technology announces each department's name, its position in the set, the total, and which
  one is active. (FR-030.)
- **K6** With `prefers-reduced-motion: reduce`: identical departments, labels and destinations; movement
  resolves instantly; the arc's geometry remains, because it is layout. The behaviour matches `004`'s
  reduced-motion rule exactly, as FR-038 requires. (FR-031.)
- **K7** Touch targets are ≥44×44 CSS px and none sits beneath the fixed header island at any scroll position
  on a 360×640 viewport. (FR-032, US4/5.)

## F. Fallback and resilience

- **F1** The server-rendered markup is a complete, usable, unanimated list of all nine departments with real
  links, before any script runs. The animation is a layer over it, never a precondition of it. (FR-021.)
- **F2** A department with no badge renders as a legible text panel with no image. The three new badges are
  production work, not a TODO; shipping them late degrades to F1, not to a placeholder. (FR-033.)
- **F3** Artwork that arrives late or never leaves the panel's label and destination intact and does not
  reflow the arc. (Edge case.)
- **F4** Under `forced-colors: active` the arc survives and the active state is conveyed by something other
  than colour. (Constitution II/FR-027 spirit; matches `002`'s treatment.)

## X. Coherence with neighbours (FR-038, reciprocal with `004/FR-032`)

- **X1** One duration scale and easing family across this carousel and `004`'s brand rows:
  `220ms cubic-bezier(0.2, 0.7, 0.3, 1)` for every non-drag state change, neither surface inventing its own.
- **X2** One emphasis rule: exactly one element holds emphasis at a time, and it releases the same way.
- **X3** One interaction contract: a press on a destination always navigates and is never intercepted to
  reveal decoration first (see A2).
- **X4** One visibility rule: nothing animates off-screen, at most one travelling element per page region.
  With feature 002's ground also live, the homepage's moving parts must read as one choreography — US3/6.
- **X5** One reduced-motion behaviour, identical in both surfaces (see K6).
- **X6** Proven against the homepage's **dark** ground, never the light chapter (FR-039).

---

## Non-goals of this contract

Whether the arc is beautiful, and whether the delegated values in `research.md` D6 are the right ones.
FR-035 hands those to the implementer and forbids escalating them; they are reviewable as taste, not
testable as behaviour. Constitution IV's quality bar is the governing standard there, and its Definition of
Done — "a page that works correctly but looks ordinary… is NOT considered complete" — is the one this
section will be judged by when it is stood in front of a human.
