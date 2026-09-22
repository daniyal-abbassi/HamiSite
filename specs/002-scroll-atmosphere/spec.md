# Feature Specification: Scroll-Driven Atmosphere and Scroll Feel

**Feature Branch**: `002-scroll-atmosphere` (no dedicated branch created — no `before_specify` hook is configured; work continues on `Hami-v3`)

**Created**: 2026-09-20

**Status**: Draft — amended three times, 2026-09-22. See the Amendment Record.
**Scroll-feel work (US2) closed 2026-09-23 by the owner**: easing accepted at Lenis's `lerp 0.1`, glow
field accepted as-is so the FR-005 waiver is permanent, and the production cost measurement (FR-014 /
SC-006) explicitly closed **unmeasured** rather than passed. US1's seam and entry-position tasks and all
of US3/US4 remain open.

**Input**: User description: "On scrolling on first page, the main background should change on different sections - not so messy, but a coherent, luxury color change on scrolling, also, the changing should be smooth - also i want the scrolling be extra smooth and calm (fell luxery)"

## Amendment Record

All three amendments were made on 2026-09-22 at the owner's instruction. None was made to make a failing
check pass; in each case a requirement written under one reading of the brief was contradicted by the
owner's actual intent, and the requirement moved rather than the measurement.

| # | Class | Requirement | What changed | Why |
|---|---|---|---|---|
| 1 | **MINOR** | FR-010, FR-011; new FR-011a; Resolved Q1 | Q1 re-answered **A → C**. FR-010's "scrolling stays native" clause and FR-011's "key press MUST produce immediate movement" withdrawn; FR-011a added to pin the touch boundary. | The owner clarified the ask was scroll *physics* — "smooth and heavy" — which option A had explicitly excluded. FR-010 as written mandated the opposite of the feature. |
| 2 | **MINOR** | FR-005 | Second clause waived: the progression need not read *calmer than the existing glow field*. First clause — must not increase busyness — stands. | Resolved Q2 = C keeps the glow field untouched. That field paints at `z-10`, above the ground layer at `z-0`, so no opacity on the layer can damp it; measured across α = 0.2/0.5/0.85 the rendered asymmetry does not move (`notes/busyness.md`). The owner chose to keep the field and accept the consequence rather than to reduce it (option B) or replace it (option A). |
| 3 | **CORRECTION** | FR-011, FR-011a | FR-011's amendment claimed "the rendered content settles toward [a key press] over the smoothing window". **That was a property of ScrollSmoother, not of the easing as such, and it is false for the mechanism now shipped** — see correction note under FR-011. | The easing mechanism was swapped the same day (GSAP ScrollSmoother → Lenis, `research.md` D10) because the owner named a reference site whose feel they wanted. Lenis animates the real document scroll and binds no key handler, so a key press moves the document and the visible page with it, with no settle. The requirement's substance — never blocked or redirected, `prefers-reduced-motion` restores instant movement — is unchanged and still met. |

**What is explicitly not amended**: the measurements. `notes/busyness.md` stands as recorded — rendered
left/right asymmetry 7.05 without the layer and 6.90 with it at the draft alpha, direction-reversal count
rising from 7 to 9, and both axes getting *worse* at α = 0.85. The gate did not pass and is not restated as
having passed. It was waived by the person who owns the requirement.

## Related Initiative

This is the second feature of the frontend-only initiative governed by
`.specify/memory/constitution.md` v1.0.0, and it refines the homepage experience defined in
`specs/001-premium-rtl-storefront/spec.md`. It inherits those principles directly: **I** Honest Interface,
**II** Persian RTL by Default, **IV** Design Is Open. It has no bearing on the **III** Static Data Seam
because it changes no data — it changes how a page looks and feels while moving through it.

## Why This Is Not a Greenfield Feature

The homepage already has a background system, and it is the most important constraint here.

The page ground is currently painted as **five stacked radial glows** in oxblood tones, distributed down
the height of the document — the implementation names it a "travelling atmospheric glow". There are
**46 gradient declarations** in the global stylesheet. This is a static field that a shopper *discovers* by
scrolling through it, rather than a response *to* scrolling.

That matters for three reasons:

1. The parent brief states that luxury must **not** come from gradients, glowing effects, or visual noise.
   The existing ground is precisely that. The request's phrase "not so messy" is most plausibly a reaction
   to this, so the feature must be understood as a correction and not an addition.
2. Adding scroll-responsive color on top of the existing glow field makes the page busier, which is the
   outcome being complained about. The two systems will compete.
3. The homepage's eleven sections currently paint **no** background of their own; they all sit on the one
   shared ground, which is why the page reads as a single continuous surface today. Any sectional change
   therefore introduces a mechanism the page has never had, rather than adjusting an existing one.

**Consequence**: this feature must decide what the page ground *is*, not merely attach color changes to
scroll position. Whether the existing glow field is replaced, reduced, or kept as a base layer is the
subject of Question 2, and it is a scope question rather than a styling one.

## Terminology

- **Page ground** — the background surface behind all homepage content, as one system rather than a
  collection of layers.
- **Atmosphere stage** — one of the distinct tonal states the page ground passes through while scrolling.
- **Sectional cue** — the point at which a content section's region of the scroll is expressed as a change
  in the page ground.
- **Tonal progression** — the ordered sequence of atmosphere stages from the top of the page to the bottom,
  read as one continuous movement.
- **Scroll feel** — how the page responds to the shopper's own scrolling input, independent of anything
  that changes color.
- **Fixed element** — an element that stays in place while content moves past it. The header is one, and it
  already alters its own appearance once the shopper starts scrolling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — One continuous atmosphere that moves with the shopper (Priority: P1)

A shopper scrolls the homepage from the hero down to the footer. The ground behind the content changes tone
as they pass through the major sections, so the page feels composed and directed rather than static — but
the change is a single deliberate progression, never a flicker, never a hard seam, and never something the
shopper notices as a trick. On returning to the top the page is the same page they left.

**Why this priority**: This is the literal request, and it is what makes the difference between a page that
is one flat surface and one that feels art-directed across its length. Everything else in this feature is
in service of it.

**Independent Test**: Scroll the full length of the homepage slowly, then quickly, then backwards, and
answer two questions: did the environment change, and did it ever feel like more than one page? Testable
without any change to scroll feel or to content.

**Acceptance Scenarios**:

1. **Given** a shopper at the top of the homepage, **When** they scroll to the bottom at a normal pace,
   **Then** the page ground passes through a recognisable sequence of tonal states and never remains the
   same from top to bottom.
2. **Given** the same scroll, **When** the ground moves between two states, **Then** the movement is
   gradual and no frame shows a visible seam, band, or abrupt jump.
3. **Given** the shopper pauses anywhere mid-page, **When** they look at the screen, **Then** the
   environment reads as intentional and settled rather than caught mid-fade.
4. **Given** the shopper scrolls down then back up, **When** they reach the top, **Then** the hero presents
   exactly as it did on arrival.
5. **Given** the shopper scrolls as fast as their device allows, **When** they reach the bottom, **Then**
   the ground has kept up with them and does not lag visibly behind the content, overshoot, or snap.
6. **Given** a shopper shown the page with the effect on and with it off, **When** asked which feels more
   considered, **Then** a clear majority prefer the effect and can name why.
7. **Given** the progression as a whole, **When** it is judged against the existing decorative glow field,
   **Then** the page reads as calmer and less busy than before, not busier.

---

### User Story 2 — Scroll that feels calm and expensive (Priority: P2)

The shopper moves through the page and the motion itself feels composed: no jerkiness, no stutter, no
sense of the page struggling. The scroll has weight and continuity rather than a twitchy, brittle quality.

**Why this priority**: Explicitly requested, and second only to the visual progression because it is the
part the shopper feels rather than sees. It also carries the feature's only real risk: the technique that
delivers this feeling most convincingly is the technique that can break accessibility, so it must be
decided deliberately rather than assumed. See Question 1.

**Independent Test**: Perform the same three navigation tasks — read to the third section, jump to the
footer, return to a product — using keyboard, wheel, and touch, and record any moment the motion feels
rough, delayed, or unresponsive. Testable independently of the color behavior.

**Acceptance Scenarios**:

1. **Given** a shopper scrolling with a wheel or a trackpad, **When** the content moves, **Then** the
   motion is continuous and free of visible stutter or dropped frames on a mid-range device.
2. **Given** a shopper on a touch device, **When** they flick through the page and it decelerates to rest,
   **Then** the page stops where their gesture intends and never settles short or past a readable
   boundary.
3. **Given** a shopper using only a keyboard, **When** they advance through the page, **Then** the page
   responds immediately and predictably, with no perceptible delay between key press and movement.
4. **Given** any scroll method, **When** the shopper stops abruptly mid-motion, **Then** the page stops
   with them rather than continuing to travel.
5. **Given** a shopper on a small phone, **When** they scroll long content, **Then** the effect never costs
   them responsiveness, and the page feels no slower to reach than before the feature existed.
6. **Given** a shopper who returns to the page or reloads it partway down, **When** the page settles,
   **Then** they are where they left it, at the correct ground tone, without an introductory animation.

---

### User Story 3 — Content stays readable through every change (Priority: P3)

Whatever the ground does, the shopper must always be able to read it. Product names, prices, and headings
hold their legibility at every point of the transition, and the fixed header remains usable over any tone
passing behind it.

**Why this priority**: A tonal progression that quietly drops text below readable contrast at its midpoint
is a defect that only appears during motion, which is exactly when nobody is checking. It is the highest
probability failure of this feature and the least likely to be caught by ordinary review.

**Independent Test**: Step through the scroll position in small increments across the whole page and
measure text-on-ground contrast at each step, including over the fixed header. Independent of the other
stories.

**Acceptance Scenarios**:

1. **Given** any position in the tonal progression, **When** meaningful text is measured against the ground
   behind it, **Then** contrast holds at every step of the transition and not merely at its endpoints.
2. **Given** the header in each of its appearance states, **When** any ground tone passes behind it,
   **Then** its labels and controls stay legible and its boundary against the page stays clear.
3. **Given** product imagery sitting on the ground, **When** the tone behind it shifts, **Then** the image
   edges do not visually bleed into the background or lose their separation.
4. **Given** a section whose content is shorter than the screen, **When** it is scrolled past, **Then** the
   ground still resolves to a coherent tone rather than an unintended intermediate.
5. **Given** a shopper using an operating-system high-contrast or forced-colors preference, **When** they
   scroll, **Then** legibility is preserved or improved rather than compromised by the effect.

---

### User Story 4 — Quiet, accessible, and harmless by default (Priority: P4)

A shopper who has asked their device to reduce motion, or who is on a weak device, or who is using a screen
reader, gets a page that is calm and complete: the sectional identity survives, the motion does not. Nobody
should be able to tell that they received a lesser page.

**Why this priority**: Scroll-linked visual change is one of the most reliably uncomfortable effects on the
web, and this feature's whole purpose is comfort. Treating this as a fallback bolted on at the end is how
motion features become the reason someone leaves.

**Independent Test**: Browse the page with reduced motion enabled, with keyboard and screen reader only,
and on a deliberately throttled device. Confirm the page remains complete and calm in all three. Requires
no change to the progression design.

**Acceptance Scenarios**:

1. **Given** a shopper with a reduced-motion preference, **When** they scroll, **Then** the ground presents
   a settled tone per region without animated travel between them, and the page is not faster or slower to
   reach than before.
2. **Given** the same shopper, **When** they compare the page to the animated version, **Then** every
   section, product, price, and link is identical in both.
3. **Given** a screen-reader user, **When** they move through the page, **Then** the effect is silent, adds
   nothing to the reading order, and does not move focus or content unexpectedly.
4. **Given** a device that cannot sustain the effect smoothly, **When** the shopper scrolls, **Then** the
   page sheds the effect rather than degrading responsiveness, and the ground it falls back to is a
   deliberate tone rather than an unstyled default.
5. **Given** the page in a background tab, **When** the shopper returns to it, **Then** the ground is
   already correct for the current position with no catch-up animation.

---

### Edge Cases

- **Extreme scroll velocity** — a long flick or an end-key jump traversing several atmosphere stages at
  once: does the ground arrive correctly, and does it skip gracefully rather than sprinting through every
  intermediate state?
- **Reverse scrolling** through a progression designed as a sequence.
- **Window resize and device orientation change** mid-page, which moves every section boundary and
  therefore every stage anchor.
- **A single section taller than several screens** versus a section only a fraction of a screen tall.
- **Browser scroll restoration** on reload and on back/forward navigation.
- **In-page anchor jumps**, which already animate movement today and must land at the correct ground tone.
- **The final section into the footer** — the transition must not end in an abrupt tone change at the seam.
- **Very long browsing sessions** where the shopper scrolls up and down repeatedly: no compounding drift,
  stutter, or memory pressure that eventually freezes the effect.
- **Text selected or a control focused** while the ground is between stages.
- **Print or saved-page rendering**, where scroll-linked state does not exist.
- **Content loading late** and changing section heights, moving the stage anchors underneath the shopper.
- **Interaction with the header's existing appearance change**, which already fires at a scroll threshold
  and must not double up with the ground change.

## Requirements *(mandatory)*

### Atmosphere Progression

- **FR-001**: The homepage page ground MUST change across the length of the page so that a shopper
  scrolling from top to bottom passes through more than one tonal state.
- **FR-002**: The change MUST be tied to the content sections the shopper is passing, so the tonal shift
  reads as belonging to the page's structure rather than as an independent animation.
- **FR-003**: The stages MUST form one coherent progression: a single deliberate sequence with a clear
  overall direction, related in character to one another, and consistent with the brand identity used
  elsewhere on the site.
- **FR-004**: Every transition between stages MUST be gradual and continuous. No hard seam, band, visible
  step, or instantaneous change is acceptable at any scroll position.
- **FR-005**: The progression MUST NOT increase the perceived busyness of the page.
  ~~The result MUST read as calmer than the existing decorative glow field it follows, and MUST NOT combine
  with it to produce more simultaneous visual activity than either alone.~~
  **Amended 2026-09-22 — the second clause is waived by the owner, not met.** See the Amendment Record and
  `notes/busyness.md`. What remains binding is the first sentence: the progression must not make the page
  busier. What was withdrawn is the requirement that it make the page *quieter than it already is*, which
  Resolved Q2 = C makes mechanically unreachable — the glow field paints at `z-10`, above the ground layer
  at `z-0`, so nothing the layer does can damp it. The owner's decision keeps the existing field untouched
  and accepts the consequence. The measurement stands unchanged and is not restated as a pass.
  (Constitution IV; FR-052 of feature 001)
- **FR-006**: The page MUST read as one continuous environment at every scroll position — never as a stack
  of separately-decorated pages.
- **FR-007**: The ground MUST return to its exact initial state when the shopper returns to the top of the
  page, and MUST be correct for its position whenever the page is entered at an arbitrary point.
- **FR-008**: The tone at the boundary between the final homepage section and the footer MUST resolve
  without an abrupt change.

### Scroll Feel

- **FR-009**: The shopper's scrolling MUST feel continuous, weighted, and calm, with no visible stutter,
  jitter, or dropped frames on a mid-range phone or laptop.
- **FR-010**: The visual response to scroll MUST keep up with the shopper's own position: the ground MUST
  NOT lag behind the content, overshoot it, or snap into place after movement stops.
  ~~The shopper's own scrolling stays native and is not intercepted, eased, or substituted (Resolved Q1 =
  A), so "smooth" here means the visual response is smooth, not the scroll physics.~~
  **Amended 2026-09-22 for Resolved Q1 = C.** The first sentence stands unchanged and is now the harder
  half of the requirement: the ground is driven by the *rendered* position, so it must track the eased
  content rather than the raw scroll target. The second sentence is withdrawn — the scroll physics are
  now exactly what changes, on desktop.
  **Harder under the first mechanism than under the shipped one.** ScrollSmoother kept two positions
  (the document at the target, the content at a lerped offset), which is what made this sentence a real
  test. Lenis animates the single document position (`research.md` D10), so the ground's input and the
  content's position are the same number by construction. Verified holding on 2026-09-22: `--hami-ground`
  resolves to a stage colour mid-scroll, and the page eases 0→38→72→132→201→237→253→280→301→319→334→346
  toward a 400px wheel target with no snap.
- **FR-011**: ~~A shopper's keyboard navigation MUST NOT be delayed, intercepted or substituted for, and
  a key press MUST produce immediate movement.~~
  **Amended 2026-09-22 for Resolved Q1 = C.** ~~On desktop the easing is input-agnostic, so a key press
  moves the document immediately and the rendered content settles toward it over the smoothing window —
  that lag is the requested effect, not a defect.~~ **Corrected same day (Amendment 3):** that sentence
  described ScrollSmoother. The shipped mechanism binds no key handler, so a key press moves the document
  and everything rendered on it together, with no settle and no lag to defend. What MUST hold is that
  keyboard navigation is never *blocked or redirected*: every key that worked before still reaches every
  position, and `prefers-reduced-motion` restores instant movement with no easing at all. On touch, where
  this feature does not engage, key behaviour is unchanged.
  Measured 2026-09-22: PageDown from the top reached 492px within 120ms and 609px when settled — the
  document moved, nothing intercepted it. The ramp between those two readings is the pre-existing
  `html { scroll-behavior: smooth }` (`app/globals.css:127`), not the new easing; it predates this
  feature. It does not fight the easing either, because Lenis writes each frame with an explicit
  `behavior: "instant"` (`lenis.mjs:532`), which overrides the CSS.
- **FR-011a (new)**: Touch scrolling MUST remain native. The easing engages only on precision-pointer
  devices; a phone, tablet or touchscreen laptop keeps its operating system's own momentum, flick
  deceleration and stop-mid-gesture behaviour. This is the boundary that makes Q1 = C different from B,
  and it is the reason mobile-first survives a change whose benefit is a desktop one.
  **Holds on the shipped mechanism for two independent reasons.** Lenis's `syncTouch` default is `false`
  and its handler returns before touching a touch event unless that flag is set (`lenis.mjs:434`,
  `lenis.mjs:617`); and the gate in `components/atmosphere/ScrollSmooth.tsx` refuses to construct an
  instance at all when `(any-pointer: coarse)` matches. Verified 2026-09-22: in a 390x844 touch context the
  `<html>` element never receives Lenis's class even after the page is scrolled, and the same is true
  under `prefers-reduced-motion: reduce` at desktop width.
- **FR-012**: Whatever is done to scroll feel MUST NOT interfere with touch gestures, including flick
  deceleration and stopping mid-gesture, and MUST remain correct for a right-to-left document. (Constitution II)
- **FR-013**: If the shopper's scrolling is ever programmatic rather than direct, stopping that movement
  MUST be immediate and MUST NOT overshoot the intended position.
- **FR-014**: Scroll feel work MUST NOT make the page slower to reach or to interact with than it is today.

### Legibility and Coexistence

- **FR-015**: Meaningful text MUST hold its contrast against the page ground at every point of every
  transition, not only at each stage's settled endpoints.
- **FR-016**: The fixed header MUST remain legible and visually distinct over every ground tone, in each of
  its own appearance states.
- **FR-017**: Product imagery MUST keep clear separation from the ground throughout the progression.
- **FR-018**: Where the ground and an existing decorative layer would both be visible, they MUST be
  reconciled with it rather than competing with it. The owner directed that the existing decorative glow
  field be **left in place, unaltered** (Resolved Q2 = C), so reconciliation here means the scroll
  progression is layered over it and must be proven not to increase busyness — see FR-005, which is now the
  binding guard on that risk rather than a change to the field itself.
- **FR-019**: No effect in this feature may obscure, displace, or reduce the clarity of product
  information, prices, or availability labels. (Constitution I; feature 001 FR-030, FR-034)

### Accessibility and Resilience

- **FR-020**: A shopper with a reduced-motion preference MUST receive a static equivalent: distinct settled
  tones per region, with no animated travel between them.
- **FR-021**: The reduced-motion variant MUST be content-identical to the animated one — same sections,
  products, prices, links, and reading order.
- **FR-022**: The effect MUST be absent from the accessibility experience: no announcements, no focus
  movement, no change to reading order or document structure.
- **FR-023**: Legibility MUST be preserved or improved under an operating-system high-contrast or
  forced-colors preference.
- **FR-024**: On a device that cannot sustain the effect smoothly, the page MUST shed the effect rather than
  lose responsiveness, and MUST fall back to a deliberate chosen tone rather than an unstyled default.
- **FR-025**: When the page is not visible, the effect MUST NOT consume attention or resources, and MUST
  already be correct on return without catch-up animation.
- **FR-026**: Existing behavior that animates movement to an in-page anchor MUST land at a correct ground
  tone, and the two mechanisms MUST NOT conflict.

### Design Freedom

- **FR-027**: This specification MUST NOT fix the number of atmosphere stages, their colors, their
  positions, the transition duration or curve, or the section groupings they follow. Those are design
  decisions. (Constitution IV)
- **FR-028**: The premium quality MUST come from restraint, continuity, and precision rather than from
  ornament, glow, or visible effect.

## Key Entities

- **Page Ground**: the single background system behind all homepage content; the thing this feature changes.
- **Atmosphere Stage**: one settled tonal state of the ground, associated with a region of the page.
- **Tonal Progression**: the ordered sequence of stages and the transitions between them, read as one movement.
- **Sectional Anchor**: the region of scroll where a stage is considered to be in effect, derived from the
  homepage's existing section order.
- **Transition Response**: how the ground moves between stages, including its continuity and its follow of
  the shopper's position.
- **Scroll Feel**: the character of the page's response to the shopper's own scrolling input.
- **Legibility Guarantee**: the requirement that text, imagery, and the fixed header hold against the ground
  at every point of the progression.
- **Motion Preference**: the shopper's device-level request for reduced motion, which converts the
  progression from animated to settled.
- **Fallback Ground**: the deliberate tone used when the effect cannot run smoothly, which must itself be
  an intentional design decision.
- **Fixed Element**: the header, which changes its own appearance during scroll and must remain distinct
  from and compatible with the ground behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a comparison of the page before and after this feature, at least 7 of 10 viewers judge the
  after version as more premium, and at least 8 of 10 judge it as no busier than the before version.
- **SC-002**: No viewer describes the effect as flickering, flashing, or jumping when asked open-endedly
  after a full scroll of the page.
- **SC-003**: A shopper scrolling the full length of the homepage can describe the page as one continuous
  environment: fewer than 1 in 10 reports it feeling like separate pages stitched together.
- **SC-004**: Measured at every small increment of scroll position across the whole page, no meaningful
  text falls below its legibility threshold at any intermediate point — zero failing measurements, not an
  average.
- **SC-005**: No visible stutter, jump, or blank frame is observed during scrolling on a mid-range phone or
  a mid-range laptop, by a reviewer performing ordinary navigation tasks.
- **SC-006**: Time to reach the bottom of the homepage and to interact with content there is no worse than
  before the feature, measured on the same device with the same route.
- **SC-007**: Keyboard-only scrolling produces movement that begins immediately on input, with no
  perceptible lag, at every point of the page.
- **SC-008**: A shopper with reduced motion enabled receives a page that is content-identical to the
  animated page — same number of sections, products, prices, and links — verified by direct comparison.
- **SC-009**: Entering the page at an arbitrary position, after reload, or after back/forward navigation
  shows the correct ground tone immediately in 100% of attempts.
- **SC-010**: After fifteen minutes of continuous up-and-down scrolling, the effect still responds with the
  same quality it had in the first minute, with no drift in tone-to-position correspondence.
- **SC-011**: Zero reports of discomfort, dizziness, or visual strain from test participants who browsed the
  page for at least two minutes, and zero from participants browsing with reduced motion enabled.

## Out of Scope

- Any change to homepage content, section order, or section design beyond what the ground requires.
- The listing, product, partnership, and administrative pages. This feature is the homepage; extension
  elsewhere is a separate decision once the progression is proven.
- Horizontal, diagonal, or gesture-driven movement of content, parallax layering of content itself, and
  scroll-linked animation of products, imagery, or text. Only the page ground responds.
- Any data, availability, or pricing behavior. Nothing in this feature touches the static catalog seam.
- Sound, haptics, or cursor effects.
- Third-party scroll or motion services, and any effect requiring the shopper to wait for an additional
  resource before the page is usable.

## Assumptions

- **The homepage is the subject.** The request specifies the first page. Other surfaces inherit the
  page's existing single ground unchanged until someone decides otherwise.
- **The header's existing scroll-triggered appearance change stays as it is** unless it demonstrably
  conflicts with the ground; FR-016 and FR-026 require compatibility rather than replacement.
- **In-page anchor animation already exists** and stays; this feature must cooperate with it, not remove it.
- **Section boundaries are derived from the current homepage structure**, which is eleven sections over a
  long page — enough room for a genuine progression without inventing stages.
- **Coherence beats variety.** A progression of three or four closely-related stages that reads as one
  movement satisfies this feature; many contrasting stages do not.
- **The effect is decorative, never load-bearing.** No information may exist only in the ground.
- **Question 2 is unresolved**: whether this feature replaces, reduces, or preserves the existing
  decorative glow field as a base. FR-005, FR-018, and the "Why This Is Not a Greenfield Feature" section
  all depend on the answer, so the design phase cannot lock the ground until it is settled.

## Resolved Clarifications

Answered by the owner on 2026-09-20; **Question 1 was re-answered on 2026-09-22** (A → C).
**Open questions remaining: none**, but FR-010…FR-014, `research.md` D2 and User Story 2's tasks were all
written against the superseded answer and need re-derivation before any of them is implemented.

### Question 1: Does the shopper's own scrolling change, or only what happens visually while scrolling? — **RESOLVED: C** (re-answered 2026-09-22; previously A)

> **2026-09-22, owner:** chose **C** — ease the scroll on desktop wheel and trackpad, leave touch native.
>
> The reasoning that decided it, recorded because it is the constraint on any implementation: a phone already
> runs an OS-level momentum scroll tuned per device, and a JS lerp layered on top of it usually reads as
> slushy and late rather than expensive, so C buys the desktop quality without spending the mobile one — which
> is also what the standing mobile-first instruction requires. C additionally carries B's re-implementation
> burden for keyboard, caret browsing, find-in-page and restore-position, but only on a non-touch code path.
>
> **Dependency cost is not a constraint here.** The owner ruled the same day that quality outranks it, and
> `gsap@3.15.0` is already a dependency of this project with `node_modules/gsap/ScrollSmoother.js` present
> and unused — GSAP's club plugins became free at 3.13. So `research.md` D2's rejection of scroll libraries
> no longer stands as written, and this feature's implementation should be re-planned with ScrollSmoother (or
> an equivalent) on the table rather than excluded on price.

### Question 1 — the superseded answer (2026-09-20, A). Kept because FR-010 still quotes it.

**Context**: User Story 2 and FR-010 … FR-014. The request is that scrolling itself feel "extra smooth and


### Question 1 — original record (2026-09-20). Superseded by the reversal above; the options table is still the one to choose from.

**Context**: User Story 2 and FR-010 … FR-014. The request is that scrolling itself feel "extra smooth and
calm". There are two very different readings, and they are not equally safe.

**What we need to know**: Should the page's response to scroll be smoothed (the motion itself is eased and
given weight, which changes how scrolling behaves for every shopper on every input method), or should the
visuals be smoothed while scrolling stays entirely native?

| Option | Answer                                                   | Implications                                                                 |
| ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A      | Visuals only; scrolling stays completely native          | Safest; keyboard, touch, and assistive tech untouched; ceiling is easing effects, not feel |
| B      | Ease the scroll motion itself, on every input method     | Strongest sense of weight and luxury; must re-implement scroll correctly for keyboard, touch, screen readers, RTL, and restore-position behavior |
| C      | Ease scroll on desktop wheel and trackpad only, native on touch | Common middle path; the two most divergent feel targets, and the desktop half still carries B's risks |
| Custom | Provide your own answer                                  | Sets the entire scope of User Story 2 and half the accessibility requirements |

### Question 2: What happens to the existing decorative glow field?  —  **RESOLVED: C**, re-confirmed 2026-09-22

> **Re-confirmed by the owner on 2026-09-22 after the FR-005 gate failed**: keep the field as it is and
> ship the ground progression on top. The consequence — that the result will not read calmer than before —
> was presented with measurements and accepted, so FR-005's second clause is waived rather than met.
> Options B (reduce the field to a quiet base) and A (replace it) remain on the table and were declined,
> not dismissed; B is the one with measured evidence that the page gets quieter (asymmetry 7.05 → 0.49,
> range down 26% — `notes/busyness.md`). Re-open Q2 if the background is ever revisited.

**Context**: "Why This Is Not a Greenfield Feature"; FR-005 and FR-018. The ground today is five stacked
radial glows. Adding a scroll-responsive progression on top of it makes the page busier, which is the
outcome being objected to.

**What we need to know**: Is this feature permitted to remove or replace the existing atmospheric ground as
part of installing the progression?

| Option | Answer                                                    | Implications                                                          |
| ------ | --------------------------------------------------------- | --------------------------------------------------------------------- |
| A      | Replace it — the progression becomes the only ground      | Cleanest result; touches the whole page identity, so larger change    |
| B      | Reduce it to a quiet base, then layer the progression on  | Preserves depth; requires careful restraint to avoid the messiness     |
| C      | Leave it exactly as is and add the progression on top     | Smallest change; likely to reproduce the busyness the request objects to |
| Custom | Provide your own answer                                   | Determines whether the design phase may touch the page ground at all   |
