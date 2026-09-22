# Feature Specification: Mobile Brands Row Presentation

**Feature Branch**: `004-mobile-brands-rows` (no dedicated branch created — no `before_specify` hook is configured; work continues on `Hami-v3`)

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "ALWAYS MOBILE FIRST — use this style for the brands section in mobile view."

**Reference**: the attached implementation — a stacked full-width menu of items. Each row shows the
item's label, a small index number, and a thumbnail. On touch, the first tap expands the row and slides a
coloured band up over it containing an infinitely scrolling repetition of the label plus a pill-shaped image;
a second tap follows the link. On pointer devices the band is driven by hover, entering from whichever edge
of the row is closest to the cursor.

## Standing Instruction

**"ALWAYS MOBILE FIRST" is treated as a standing preference for this initiative, not a property of this
feature.** Mobile is the primary design case and desktop is derived from it, everywhere. This belongs in the
constitution alongside Principle II rather than being restated in every spec; see Next Actions.

## Related Initiative

Fourth feature of the frontend-only initiative governed by `.specify/memory/constitution.md` v1.0.0, and a
refinement of the brands surface within `specs/001-premium-rtl-storefront`. Inherits **I** Honest Interface,
**II** Persian RTL by Default, **III** Static Data Seam, **IV** Design Is Open. Uses the citation notation
established by feature 003: bare `FR-0nn` means this file; siblings are written `001/FR-0nn`.

## Clarifications

### Session 2026-09-20

- Q: Which brands actually get a row in the mobile brands section? (FR-005) → A: **The six brands that have both an authentic mark and a Persian label today** — APPLE (اپل), SAMSUNG (سامسونگ), XIAOMI (شیائومی), NOKIA (نوکیا), REALME (ریلمی), TCH (تی‌سی‌اچ). VOCAL, NEXA and OAK are excluded, and the 15-brand populated catalog set is not adopted.

- Q: Must the categories and brands surfaces become the same widget, or may they stay two different ones with a shared sense of motion? (FR-032) → A: **Option B — two widgets, one motion language.** Recorded reciprocally as FR-032 here and in `005/FR-038`.
- Q: Where do the three written brand stories go — in the expanded row, or nowhere in this section? (FR-004) → A: **Option A — the stories appear in the expanded row for the three brands that have them** (APPLE, SAMSUNG, XIAOMI). FR-004 is sharpened to forbid *negative* signals — disabled, dimmed, "coming soon", an empty frame — rather than to demand identical content depth. NOKIA, REALME and TCH present at full compositional weight with mark and name only, which is a complete row, not a short one.

**Consequence, and it removes work rather than adding it:** the open conflict in FR-027 dissolves. All six already have a real mark, so **no brand tile needs generating at all** — the instruction to produce brand imagery with the image bridge has nothing left to do in this section. Generated artwork remains in scope for categories (feature 005), where three populated departments genuinely lack it.

## Why This Reference Is Risky Here — Read This First

Three collisions with what already exists in this repository. None is hypothetical; all three were read out of
the current code.

### 1. The image each row needs does not exist, and fake brand imagery was already removed once

Every row in the reference is built around an `image` — a thumbnail at rest and a larger pill when expanded.
The brands section has no such asset:

| Available today | Count |
| --- | --- |
| Brands listed in the curated wall | 9 — **reduced to 6** by Clarification Q1 |
| Brands with a written brand story | 3 |
| Brands with both a real vector mark and a Persian label | 6 — **this is the selected set** |
| Brands with a photograph of the brand | **0** |
| Brands in the catalog that carry products | 15 |

`BrandShowcase` carries a comment recording exactly why this gap has not been filled before:

> "The story card previously illustrated each brand with generic banner PNGs — a gaming laptop for Xiaomi, a
> headphone for Samsung — **borrowed stock in a page whose entire positioning is authenticity-first**. Until
> brand-true visuals exist … the wall of real wordmarks and the story copy carry the section alone."

A previous iteration already solved this by *deleting* inauthentic brand imagery. This reference asks for one
image per brand row, which is pressure to reinstate exactly that. **Question 1** is what fills the slot;
whatever the answer, a row must never be illustrated with a photograph that is not that brand.
(Constitution I.)

### 2. This page already has an infinite brand marquee — better engineered than the reference's

`BrandTicker`, the trust band beneath the hero, *is* a seamless looping strip of the six real brand marks,
with the problems the reference does not solve already handled there: a documented seamless-loop mechanism,
per-copy minimum width so no blank strip sweeps through at the end of a cycle, pause on hover **and** on
keyboard focus, a mask rather than re-tintable gradient overlays at the edges, and a contrast decision
pinned in the stylesheet because the band once silently dropped to 1.21:1 against a changed hero.

Adopting this reference adds a second, different marquee system to the same page — six more of them, one per
row. **Question 3** asks whether the two coexist or whether the row treatment supersedes the existing band.

### 3. The section sits on a light surface; the reference assumes a dark one

`BrandShowcase` is entered through a white wave transition and the current chapters place it on a
light ground. The reference's row separation, thumbnail framing, and expanded-band legibility all depend on
semi-transparent light borders and dark overlays that only read against a dark surface — on the paper
chapter they are close to invisible, and the row list loses its divisions entirely.

The owner has confirmed the destination is a **dark ground**, so this is a sequencing problem rather than a
contradiction: this feature cannot be validated on the section's current surface. It is a dependency, not a
blocking question.

## What Genuinely Transfers

Setting the collisions aside, four ideas in the reference are strong and worth adopting, and they are the
reason this is specified rather than declined:

- **Rows over tiles.** A stacked list of full-width brand rows reads as a curated shop floor and survives a
  narrow phone; a grid of logo boxes does not. This is a real improvement on the current wrap of
  text wordmarks, which is the weakest section on the page.
- **One row answers at a time.** Concentrating emphasis on the row the shopper chose is a disciplined,
  editorial device, and it is what makes a list feel art-directed rather than generated.
- **Movement inside the chosen row only.** Everything else stays still.
- **Numbering and index cues**, if rendered in Persian numerals and correctly ordered for right-to-left
  reading. The reference emits Latin digits and hardcodes right-alignment.

**What does not transfer**: the two-tap navigation gesture (Question 2), the always-running marquee on every
row, the reference's literal colours and sizes, and its viewport-relative desktop type sizing.

## Terminology

- **Brand row** — one full-width stacked entry for a single brand in its resting state.
- **Expanded row** — the row the shopper has chosen, which carries the emphasis treatment.
- **Emphasis band** — the coloured surface that slides over an expanded row and carries the moving content.
- **Marquee** — content repeating horizontally in continuous motion.
- **Two-tap pattern** — first tap expands, second tap navigates.
- **Brand mark** — a brand's real logo glyph or wordmark. Six exist; three brands have none.
- **Row visual** — whatever occupies the image slot in the reference. Unresolved; see Question 1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the brands as a considered list on a phone (Priority: P1)

A shopper on a phone reaches the brands section and reads a vertical stack of brand rows — one per brand,
each legible, evenly spaced, and clearly separated — and understands within a moment that these are the
makers Hami Hamrah carries. They can enter any brand's products from here. The list should feel like the
merchant chose these brands, not like a database dumped logos into a grid.

**Why this priority**: This is the durable value in the reference and it survives every answer to every open
question. Rows, restraint, and one-at-a-time emphasis are the improvement; the marquee is decoration on top.
It also fixes a section that is currently the weakest on the homepage.

**Independent Test**: Render the section on a narrow phone with no expansion, no marquee, and no animation
enabled at all, and confirm it reads as a complete, intentional brand list that reaches real product
listings. Fully testable alone.

**Acceptance Scenarios**:

1. **Given** a shopper on a phone, **When** they reach the section, **Then** each brand occupies its own
   full-width row and all six are distinguishable without tapping.
2. **Given** the same list, **When** the shopper taps any brand, **Then** they arrive at that brand's
   products, and the row is a real destination rather than a display-only element.
3. **Given** rows carrying an index number, **When** the shopper reads the list, **Then** numerals are
   Persian and ordered correctly for right-to-left reading.
4. **Given** the three brands with no written story (NOKIA, REALME, TCH), **When** a shopper expands one,
   **Then** the row reads as deliberately finished, with no dimming, placeholder, or pending notice, and the
   only difference from the other three is that it carries no story line.
5. **Given** the three brands that do have a written story (APPLE, SAMSUNG, XIAOMI), **When** a shopper
   expands one, **Then** the story appears in the expanded state and its length does not break the row.
6. **Given** the longest brand name in the six, **When** the row renders, **Then** the layout holds without
   clipping or overlap, and no visual is invented to fill space.
7. **Given** the section with animation fully disabled, **When** a shopper browses it, **Then** nothing they
   need is only available through motion.

---

### User Story 2 — Choose a row and have it answer (Priority: P2)

When a shopper selects a brand row, that row becomes the focus: it gains presence, colour, and movement, and
the rest of the list stays quiet. The shopper understands immediately which row they hold, how to release
it, and where they will go.

**Why this priority**: This is the reference's best idea and the second thing the request is actually
asking for. It ranks after the plain list because the list must work without it. Its exact gesture is the
subject of Question 2.

**Independent Test**: Tap one row, then another, then the same row twice, on a phone, and record whether
the shopper can describe what just happened and what their next tap will do. Testable with no marquee.

**Acceptance Scenarios**:

1. **Given** a resting list, **When** the shopper selects a row, **Then** that row becomes visually dominant
   and the others remain unchanged.
2. **Given** an expanded row, **When** the shopper selects a different row, **Then** the first releases and
   the second expands, with no state where two rows are both dominant.
3. **Given** an expanded row, **When** the shopper selects it again, **Then** it releases and the list
   returns to rest.
4. **Given** an expanded row, **When** the shopper taps outside it or scrolls away, **Then** it releases
   rather than remaining stuck in the emphasised state.
5. **Given** the emphasis transition, **When** it is watched closely, **Then** it arrives smoothly and settles,
   with no flicker, no jump in the rows below it, and no content shifting out from under a thumb mid-tap.
6. **Given** a shopper who expanded a row by accident, **When** they look for the way out, **Then** it is
   discoverable without trial and error.

---

### User Story 3 — Reaching the brand must never cost an extra step (Priority: P3)

A shopper who taps a brand row to see that brand's products gets there. The emphasis treatment must not
stand between a shopper and the thing they asked for, and a shopper who taps twice quickly must not be left
confused about where they are.

**Why this priority**: The reference's mobile pattern deliberately intercepts the first navigation tap. In a
menu that is a defensible taste choice. In a storefront, where every row is a route to products, it adds a
mandatory step to every single brand visit and removes the ordinary meaning of a link. It is the one
behaviour in the reference that can measurably cost shoppers, which is why it is a question rather than a
requirement. See Question 2.

**Independent Test**: Ask a first-time shopper to "show me the Samsung phones," time it and count taps, both
on the reference's pattern and on a single-tap navigation. Then check that keyboard and screen-reader paths
reach the same destination in one action.

**Acceptance Scenarios**:

1. **Given** a shopper wanting a brand's products, **When** they act on its row, **Then** they reach those
   products, and the number of steps is no greater than it is today.
2. **Given** a keyboard user tabbing to a row, **When** they activate it, **Then** they navigate — expansion
   must not require a gesture a keyboard does not have.
3. **Given** a screen-reader user, **When** they reach a row, **Then** it announces as what it is, and the
   expanded state is conveyed without reusing a control role that means something else.
4. **Given** a shopper double-tapping quickly, **When** the second tap lands, **Then** the result is
   unambiguous and never leaves the row visually expanded on a page the shopper has already left.
5. **Given** the "tap again" affordance in the reference, **When** it is localised, **Then** it is Persian,
   reads right-to-left, and is legible against the band at an acceptable contrast rather than a faded tint.
6. **Given** any shopper and any input method, **When** they attempt to reach a brand, **Then** no state
   exists where a row is expanded but its destination has become unreachable.

---

### User Story 4 — Motion that stays calm on a phone (Priority: P4)

Whatever movement the emphasis carries must be smooth, brief, and cheap on a mid-range phone, must not
compete with the rest of the page's motion, and must stop completely for shoppers who ask it to.

**Why this priority**: Six rows each running a continuous horizontal loop is six simultaneous animations on
the page's longest section, on the device class this storefront is for. Left unspecified, that is precisely
what this reference implements, because in the original every row animates whether or not it is visible. This
story is what keeps the borrowed idea from becoming the noise the whole redesign exists to avoid.

**Independent Test**: Measure responsiveness while scrolling through the section on a mid-range phone with
several rows expanded in sequence, and compare against the same section with all motion disabled. Check the
reduced-motion path reaches identical content.

**Acceptance Scenarios**:

1. **Given** the section, **When** nothing is being interacted with, **Then** no row is animating.
2. **Given** an expanded row, **When** its movement runs, **Then** only that row moves.
3. **Given** a shopper scrolling quickly and expanding a row mid-scroll, **When** the motion starts, **Then**
   the scroll is not interrupted and the row settles correctly once movement stops.
4. **Given** a shopper with reduced motion enabled, **When** they use the section, **Then** rows still expand
   and navigate, without travelling animation, and every brand, mark, and story is identical.
5. **Given** a paused or hidden section, **When** the shopper is not looking at it, **Then** nothing in it is
   animating.
6. **Given** a mid-range phone, **When** the shopper expands rows in quick succession, **Then** the page
   remains responsive and no expansion visibly stutters.
7. **Given** this section's motion alongside feature 002's scroll-driven ground and feature 003's product
   motion, **When** all are active on the homepage, **Then** the page reads as one choreography rather than
   three competing ones.

---

### Edge Cases

- **A brand added later without a mark** — the excluded three (VOCAL, NEXA, OAK) are out by Q1, so this is now
  a future-drift case: it renders without a visual, never with an invented one (FR-027).
- **The six catalog brands carrying products but absent from the curated wall** — out of scope by Q1.
- **A story long enough** to overflow the expanded row on a narrow phone, and a row with no story at all —
  both must read as finished (FR-004).
- **Brand name lengths** from three Latin characters to a long Persian phrase, in one row and in the moving
  repetition.
- **Right-to-left motion**: a marquee travelling in the direction that reads naturally for a Persian reader,
  and index numbers ascending the correct way.
- **The expanded row overlapping the one below it** and pushing content during expansion.
- **Tapping a row while a previous expansion is still animating.**
- **Very tall expanded rows** on a short phone screen, where the row plus the browser's own interface bar
  exceeds the visible height.
- **The fixed header** overlapping the row a shopper is reaching for.
- **Slow connection** where a brand visual arrives late or never.
- **Rotating the device** while a row is expanded.
- **Returning to the section** via browser back after visiting a brand's products.
- **Two rows triggered together** — a tap and a scroll at once.

## Requirements *(mandatory)*

### Structure and Content

- **FR-001**: On phone widths the brands section MUST present brands as a vertical stack of full-width rows,
  replacing the current wrap of text marks.
- **FR-002**: Every brand row MUST lead somewhere real — that brand's products. A brand row MUST NOT be a
  display-only element.
- **FR-003**: Rows MUST be visually distinct from one another at rest without depending on a coloured band.
- **FR-004**: A brand's written story, where one exists, MUST appear in that row's expanded state. Where
  none exists the row MUST still read as complete at full compositional weight, and MUST NOT expose a
  negative signal of any kind — no disabled or dimmed styling, no empty frame, no "coming soon" or pending
  notice, and no affordance that only works for some brands. Uniform *content depth* is not required;
  uniform *quality of finish* is. (Clarification Q3)
- **FR-005**: The section presents exactly the **six** brands listed in Clarifications above. The brand set
  MUST NOT silently expand to the 9-item wall or the 15 catalog brands carrying products; any addition
  requires an authentic mark and a Persian label to exist first. (001/FR-028, 001/FR-029)
- **FR-006**: The number of rows MUST be treated as variable content, not a fixed layout assumption.

### Emphasis Behaviour

- **FR-007**: At most one row may hold emphasis at a time.
- **FR-008**: Selecting a row while another holds emphasis MUST release the first and emphasise the second
  without an intermediate state where both or neither are emphasised.
- **FR-009**: Emphasis MUST release when the shopper taps the row again, selects elsewhere, scrolls the
  section out of view, or navigates away and returns.
- **FR-010**: Emphasis MUST be visually clear within a single glance — a shopper who looks away and back must
  know which row they hold.
- **FR-011**: Where emphasis changes a row's height, the rows below it MUST NOT move in a way that takes a
  target out from under a thumb mid-press. Whether emphasis changes height or only surface follows from
  Question 2; either is acceptable provided this holds.

### Navigation — the commerce guarantee

- **FR-012**: Reaching a brand's products MUST NOT require more steps than the current section requires.
  Tapping a brand row MUST navigate to that brand's products on the first tap; the reference's two-tap
  interception is not adopted (Resolved Q2 = C). Emphasis is triggered by a dedicated, separately labelled
  control rather than by the row itself, so both actions stay reachable and unambiguous.
- **FR-013**: Keyboard activation of a row MUST navigate to that brand's products in one action.
- **FR-014**: Screen-reader users MUST be able to reach every brand's products and MUST be told the state of
  a row in terms that match what it actually does.
- **FR-015**: Any instruction shown to the shopper about how to act on a row MUST be Persian, correctly
  ordered for right-to-left reading, and legible at an acceptable contrast against whatever surface it sits
  on.
- **FR-016**: Where emphasis and navigation are separated, both controls MUST be separately reachable and
  separately labelled.

### Motion

- **FR-017**: No row may animate continuously while not holding emphasis, and no row may animate while the
  section is off screen.
- **FR-018**: Where a repeating horizontal movement is used it MUST be confined to the emphasised row, MUST
  be calm in pace, and MUST be pausable or removable without losing content. (002/FR-020, 002/FR-021)
- **FR-019**: Movement MUST come to rest when the shopper stops interacting and MUST NOT loop
  indefinitely.
- **FR-020**: A shopper with reduced motion enabled MUST receive the identical brands, marks, content, and
  destinations, with emphasis expressed as a state change rather than as travel.
- **FR-021**: Motion here MUST NOT contend with feature 002's ground behaviour or feature 003's product
  motion; the three MUST be reconciled as one choreography on the homepage. The existing looping brand-mark
  band beneath the hero is reworked into a non-moving presentation, so the homepage keeps a single
  travelling element per region and the twenty-year claim stays pinned and readable (Resolved Q3 = C). Its
  content and contrast decisions are preserved; only the movement is removed.
- **FR-022**: The section MUST remain responsive on a mid-range phone while emphasis is moving, and MUST
  not delay the shopper's next input.

### Cultural and Structural Fit

- **FR-023**: The layout MUST be designed right-to-left from the start. Every alignment, index order,
  reading direction, inset, and motion direction in the reference assumes left-to-right and MUST be
  re-derived rather than mirrored mechanically. (Constitution II)
- **FR-024**: Index numbers and any counts MUST render in Persian numerals. (001/FR-011)
- **FR-025**: The section MUST remain coherent with the scroll surface it sits on. Because that surface is
  currently light and the confirmed destination is dark, row separation and band legibility MUST be proven
  on the dark ground and MUST NOT depend on translucent layers calibrated for a different one.

### Information Integrity

- **FR-026**: A brand row MUST NOT be illustrated with any image that is not that brand. No generic
  device, lifestyle, or stock photograph may substitute for a brand identity. (Constitution I; the
  precedent recorded in `BrandShowcase`)
- **FR-027**: Every row MUST use that brand's authentic mark. **No generated imagery is used in this
  section**, because Clarification Q1 restricted the set to the six brands that already have a real mark and
  a Persian label — so the case this requirement was written to handle does not arise. The prohibition stays
  in force as a guard against future scope drift: if a seventh brand is ever added without a mark, its row
  goes without one rather than receiving an invented visual, since a generated mark would misrepresent an
  authorization the merchant may not hold. (Constitution I)
- **FR-028**: Brand names, marks, and claims MUST reflect what the merchant actually carries and can
  substantiate.

### Design Freedom and Scope

- **FR-029**: This specification MUST NOT fix row heights, expansion heights, radii, colours, type sizes,
  motion durations, or easing curves. The reference's literal values are not adopted. (Constitution IV)
- **FR-030**: Mobile is the primary design case; the phone presentation is the specification and any wider
  presentation is derived from it rather than designed separately.
- **FR-031**: The reference's viewport-relative type sizing MUST NOT be carried over, as it does not hold
  across real phone and desktop heights.

### Coherence With The Categories Surface

Added because `005/FR-038` bound this section from the other direction while nothing here acknowledged it.

- **FR-032**: This section and the categories surface (feature 005) MAY remain two different widgets —
  stacked rows here, a bending arc carousel there — provided both honour a single shared motion vocabulary
  (one duration scale and easing family, chosen once and applied to both surfaces, never independently per
  surface); one emphasis rule (exactly one element holds emphasis at a
  time, and it releases the same way); one interaction contract (a press on a selectable destination always
  navigates and is never intercepted to reveal decoration first); one visibility rule (nothing animates while
  off screen, and at most one travelling element per page region); and one reduced-motion behaviour, identical
  in both. Any divergence across these five is the failure mode `001/FR-049` exists to prevent: two
  adjacent homepage sections that each feel like a different product.
  Neither surface may claim its motion, emphasis or press semantics as a local exception.

## Key Entities

- **Brand Row**: one stacked entry — its name, its visual if any, its index, its destination.
- **Emphasis State**: which single row currently holds attention; the invariant that at most one may.
- **Emphasis Band**: the surface distinguishing the emphasised row, and any movement inside it.
- **Row Visual**: the brand's authentic mark, or nothing. Unresolved; Question 1.
- **Brand Mark**: one of the six real vector logos and wordmarks in the repository.
- **Brand Story**: finished Persian copy existing for three of the six brands; shown when present and simply
  absent otherwise, never flagged as missing.
- **Navigation Action**: the single act by which a shopper reaches a brand's products; separated from
  emphasis only if Question 2 chooses the reference's pattern.
- **Motion Budget**: the allowance for simultaneous animation — here, at most one row.
- **Reading Direction Contract**: the right-to-left re-derivation applied to every positional assumption in
  the reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time shopper on a phone can name which brands Hami Hamrah carries after one pass
  through the section, unprompted, in at least 8 of 10 trials.
- **SC-002**: Reaching a specific brand's products takes no more taps than it does today, measured on the
  same task before and after, and no more than two taps in absolute terms.
- **SC-003**: Zero shoppers become unsure whether a row will expand or navigate when they tap it, measured
  across at least 10 first-time attempts.
- **SC-004**: At most one row is in the emphasised state at any moment, verified across every row and every
  ordering of taps including rapid double taps and taps during motion.
- **SC-005**: No animation runs while nothing is emphasised and the section is off screen — verified by
  observation, not by assumption.
- **SC-006**: A shopper using only a keyboard reaches every brand's products in one activation per brand.
- **SC-007**: A reduced-motion shopper reaches identical brands, content, and destinations, with nothing
  present only through movement.
- **SC-008**: Zero fabricated brand visuals: every image shown for a brand is that brand's own mark or a
  product of that brand, verified across all rows.
- **SC-009**: The section holds together at the narrowest common phone width with no clipping, overlap, or
  horizontal scrolling, for the longest brand name and for a brand with no visual.
- **SC-010**: The page remains responsive while emphasis moves on a mid-range phone, with no perceived delay
  to the shopper's next input.
- **SC-011**: At least 7 of 10 reviewers judge the section more premium and considered than its current
  form, and fewer than 2 of 10 judge it busier.
- **SC-012**: With three motion systems active on the homepage — this one, feature 002's ground, and feature
  003's product motion — at least 8 of 10 reviewers describe the page as coherent rather than busy.

## Out of Scope

- The desktop and wide-screen presentation as a separately designed experience; wider layouts derive from
  the phone design.
- The existing brand trust band beneath the hero, except as resolved by Question 3.
- Brand story pages, brand product listings, and any change to how brand filtering works.
- The section's content inventory — which brands exist at all — which is catalog data this feature reads and
  does not decide. (Constitution III; 001/FR-001)
- Writing brand stories for the six brands that lack them.
- Product image isolation work owned by feature 003.
- Any change to data, endpoints, or storage.

## Assumptions

- **Six brands, not nine and not 39** — fixed by Clarification Q1. 001/FR-028 forbids an undifferentiated
  full list, and the three dropped names lacked both a mark and a Persian label.
- **Three of the six have no story and none will be invented** — NOKIA, REALME and TCH. Under Clarification
  Q3 that asymmetry is allowed to be visible as an absence, but never as a defect. Inventing brand narratives
  for them is excluded by Constitution I, and PRODUCT.md warns against embellishing brand claims.
- **The phone is the primary device** for this storefront, per the standing instruction and 001's
  assumptions.
- **The destination ground is dark**, confirmed by the owner on 2026-09-20. This section must be proven on
  it, and its current light chapter is a temporary state.
- **Row separation must not depend on the reference's translucent borders and overlays**, which were tuned
  for a surface this page does not have.
- **The motion budget is one row**, on the grounds that six simultaneous loops on the longest section of a
  mobile storefront is a defect rather than a design choice.
- **All six selected brands already have a Persian label** in the existing marks data (اپل، سامسونگ، شیائومی،
  نوکیا، ریلمی، تی‌سی‌اچ) and render as that, without transliteration or Latin substitution.
- **Two of three open questions are answerable later**: Question 1 (visual) and Question 3 (relationship to
  the existing band) can be deferred until design; **Question 2 cannot** — it decides the interaction's
  fundamental shape, and building the wrong one is expensive to undo.

## Resolved Clarifications

All answered by the owner on 2026-09-20 and now binding. **Open questions remaining: none.**


### Question 1: What fills the visual slot in each brand row?  —  **RESOLVED: the six existing authentic marks**

The owner selected Option A under Clarification Q1, restricting the set to brands that already have a real mark. Nothing needed generating.

**Context**: "Why This Reference Is Risky Here" §1; FR-026 … FR-028. The design is image-led. No brand has a
photograph of itself, only 6 of 9 have a real mark, and generic brand imagery was already deleted from this
section once for being inauthentic.

**What we need to know**: What is authentic enough to put in that slot?

| Option | Answer | Implications |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| A | The six existing real vector marks; rows without one go without | Honest and available today; three bare rows; marks are monochrome line art, not photographic |
| B | A real product photograph from that brand's own catalog | Photographic and truthful; risks reading as generic device imagery again, and needs per-brand selection |
| C | Owner supplies authentic brand assets | Best-looking outcome; blocked on delivery, and third-party logo usage needs confirming |
| D | No image at all — type-led rows | Cleanest and calmest; abandons the reference's central visual device |
| Custom | Provide your own answer | Decides whether the section is photographic, graphic, or typographic |

### Question 2: Does the first tap e  —  **RESOLVED: C**xpand, or does the first tap navigate?

**Context**: User Story 3; FR-011 … FR-013. The reference intercepts the first tap to expand and navigates
on the second. Every row here is a route to products.

**What we need to know**: Is that interception acceptable for a storefront, or must a tap on a brand row
always navigate?

| Option | Answer | Implications |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| A | Keep two-tap: first expands, second navigates | Strongest fidelity to the reference; costs every brand visit one tap; keyboard and screen-reader paths must be solved separately |
| B | Single tap navigates; emphasis is held only while pressed | Preserves the link's meaning; emphasis is transient and less dramatic |
| C | Single tap navigates; a dedicated control expands | Both actions explicit and reachable; adds a target on a narrow screen |
| D | Emphasis follows the row in view as the shopper scrolls | No extra tap and no second control; marquee becomes ambient motion, which risks the calm this feature is for |
| Custom | Provide your own answer | Sets the core interaction; the hardest of these three to change later |

### Questi  —  **RESOLVED: C**on 3: What happens to the brand band already on this page?

**Context**: "Why This Reference Is Risky Here" §2. `BrandTicker` is already a seamless looping strip of the
real brand marks beneath the hero, with pause-on-hover-and-focus and contrast work already solved.

**What we need to know**: Do two marquee systems coexist on one page, or does this treatment take over the
role the band currently plays?

| Option | Answer | Implications |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| A | Keep both, unchanged | Two marquees on one page; the loudest possible reading of "messy" |
| B | Adopt rows here, and remove or quiet the existing band | One marquee system; changes the hero region, which feature 002 also owns |
| C | Adopt rows here, and rework the band into something non-moving | Single motion system; the trust claim stays pinned and visible |
| Custom | Provide your own answer | Determines this feature's blast radius beyond the brands section |
