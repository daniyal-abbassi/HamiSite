# Feature Specification: Categories Carousel Presentation

**Feature Branch**: `005-categories-carousel` (no dedicated branch created — no `before_specify` hook is configured; work continues on `Hami-v3`)

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Use this style for categories (figure out the background's color — text's color and font and weight and floating state yourself)."

**Reference**: the attached implementation — a horizontally looping carousel that renders each item as an
image panel arranged along a circular arc, so panels bend away toward the edges of the screen. It carries
inertia-based drag and wheel movement, snaps to the nearest item on release, and draws a text label beneath
each panel. The reference ships with placeholder images hosted externally.

## Related Initiative

Fifth feature of the frontend-only initiative governed by `.specify/memory/constitution.md` v1.0.0, and a
refinement of the categories surface within `specs/001-premium-rtl-storefront`. Inherits **I** Honest
Interface, **II** Persian RTL by Default, **III** Static Data Seam, **IV** Design Is Open. Mobile-first is a
standing instruction from feature 004. Citation notation from feature 003: bare `FR-0nn` is this file;
siblings are `001/FR-0nn`.

## Visual Decisions Are Delegated

The owner explicitly delegated the surface's appearance: its background, label colour, typeface, weight, and
the resting/floating treatment of a panel are **for the implementing agent to decide**, under Constitution IV.
This specification therefore contains no visual values, and **an agent must not escalate them as questions**.
It contains structural, behavioural, and informational requirements instead, because those are the parts the
owner did not delegate.

## Two Findings That Change What This Feature Is

### Good news, and it is unusual: this is the one surface with authentic artwork

Unlike brands (feature 004), where no brand has a photograph of itself, the categories surface has **eight
real, purpose-made badges already on disk** — mobile, feature phone, audio, speaker, charger, power bank,
smartwatch, and online services. A carousel whose panels need an image each has something true to put in
them. The reference's core problem in feature 004 does not recur here.

### Bad news, and it is worse: the category taxonomy cannot be shown as it stands

The catalog carries 32 categories. Measured against the products that actually exist:

| Problem | Detail |
| --- | --- |
| **13 of 32 are empty** | No products attached at all |
| **7 of the 14 top-level categories are empty** | Including موبایل و تبلت, لوازم جانبی, گوشی موبایل, کالای دیجیتال, and two "لوازم جانبی…" variants — the labels a shopper would most expect to tap are the ones with nothing behind them |
| **The tree conflates brand with product type** | شیائومی، سامسونگ، نوکیا، ووکال، داریا باند، تی‌سی‌اچ، and ریلمی sit *as children of* "موبایل و تبلت" — so a category list built from this data would present "Samsung" beside "Headphones" as the same kind of thing |
| **Genuine duplicates** | موبایل و تبلت / گوشی موبایل / موبایل / کالای دیجیتال all mean roughly "phones"; پاور بانک and پاوربانک (شارژر همراه) are the same thing twice; نوکیا appears twice with different ids and product counts |
| **Non-merchandise mixed in** | خدمات آنلاین (1 item) and ارسال رایگان ویژه (3 items) sit at the same level as phones and chargers |
| **Depth is uneven** | Three levels, with level-2 nodes that are empty (the AirPods and QCY branches under هدفون) |

There is a cleaner axis in the same data: each product carries a **kind**, and there are exactly **9 kinds,
all populated**, covering all 189 products — phones 134, audio 19, chargers 10, smartwatches 7, power banks 7,
computer accessories 5, SIM cards 3, car chargers 3, service 1. That is a browsable taxonomy. It is not the
same thing as the category tree, and the two disagree.

The eight existing badges map to kinds only roughly: there is **no badge** for computer accessories, SIM cards,
or car chargers, and there **are** badges for feature phone and speaker, which are slices of phone and audio
rather than kinds. So artwork and data do not line up on either axis.

**Consequence**: choosing which categories to show is a real decision with no safe default, and it is
Question 1. A carousel that renders 32 tiles, 13 of them dead ends, fails `001/FR-028` (curated, not an
undifferentiated list) and would be the most visible honesty failure on the homepage.

### A note on the reference itself

A bending, inertial, swipe-driven carousel is a genuinely good fit for categories: there are few of them, they
are visual, and browsing them is a swiping activity. The device is well chosen. The specific implementation,
however, has four properties that cannot be carried over unchanged, and they are not visual taste issues:

1. **It has no way to select anything.** The reference responds only to drag and wheel; nothing happens when
   an item is tapped. Category panels are doorways, so this must be added, and `001/FR-029` requires reaching
   a category's products from a dedicated place.
2. **Its input handling is attached to the whole page, not to the section.** Wheel and pointer listeners sit
   at the document level, so hovering this section converts a shopper's vertical scroll into horizontal
   carousel movement, and pressing anywhere on the page drags the carousel. On the homepage's longest page
   this is the single most damaging property of the reference, and it collides directly with feature 002's
   calm-scroll work.
3. **Its labels are not text.** Each label is drawn into an image at a fixed pixel size and pasted onto the
   panel. For Persian this is not a detail: the drawing path uses a Latin font string, no reading direction,
   and produces a fixed-resolution bitmap. Real Persian type shaping, correct right-to-left order, crisp
   rendering on high-density screens, selection, and screen-reader access are all consequences of this one
   mechanism. This is Question 2.
4. **It animates continuously whether or not anyone is watching**, and it duplicates its item list to fake an
   endless loop. Both need bounding under the motion budget this initiative already carries.

## Terminology

- **Panel**: one category's card in the carousel, showing its visual and its label.
- **Focus panel**: the panel currently at the centre of the carousel, which the shopper is understood to hold.
- **Arc**: the curved arrangement that bends panels away toward the screen edges.
- **Inertia**: the carried-on movement after a swipe is released, settling onto the nearest panel.
- **Category set**: the list of categories the carousel presents. Unresolved; Question 1.
- **Badge**: one of the eight authentic category artworks already on disk.
- **Kind**: a product classification in the catalog data, distinct from the category tree, with 9 populated
  values.
- **Live label**: a label rendered as real text the shopper can select and a screen reader can announce, as
  opposed to an image of text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Swipe through the shop's departments and enter one (Priority: P1)

A shopper on a phone reaches the categories section and swipes through a small number of departments, each
shown as a panel with its own authentic artwork and its Persian name. One panel sits forward and centred; the
others curve away at the edges. Swiping brings the next department forward. Tapping the forward one takes the
shopper to that department's products.

**Why this priority**: This is the whole job of the section — orient the shopper in the range and let them
enter it. It also subsumes the feature's most serious defect risk: a carousel that traps page scroll or
cannot be entered defeats the purpose of a doorway surface.

**Independent Test**: On a phone, reach a named department's products in two actions from the section, and
confirm the page still scrolls vertically while the shopper is over the section. Testable with no bending
effect and no motion polish at all.

**Acceptance Scenarios**:

1. **Given** a shopper at the section, **When** they swipe horizontally, **Then** panels advance and the
   newly centred panel is unmistakably the active one.
2. **Given** a centred panel, **When** the shopper taps it, **Then** they arrive at that category's products.
3. **Given** the shopper's finger or cursor is over the section, **When** they scroll the page vertically,
   **Then** the page keeps scrolling and vertical intent is not stolen by the carousel.
4. **Given** a shopper swiping vertically to continue the page, **When** their gesture passes over the
   section, **Then** the section does not capture it as horizontal movement.
5. **Given** a shopper who taps the panel either side of centre, **When** they do so, **Then** the carousel
   brings that panel to centre rather than navigating them somewhere unexpected.
6. **Given** the release of a swipe, **When** movement settles, **Then** exactly one panel ends up centred and
   the section does not stop between two.
7. **Given** every panel in the set, **When** a shopper attempts to reach it, **Then** it is reachable in a
   bounded number of swipes and none is skipped or unreachable in the loop.

---

### User Story 2 — Persian labels that behave like real text (Priority: P2)

Every category name in the section reads correctly as Persian: proper letter joining, right-to-left order,
crisp at whatever size it is shown, selectable, and announced by a screen reader.

**Why this priority**: The reference renders labels as pictures of text, which is exactly the property that
fails for Persian. Everything else in this feature is presentation quality; this is correctness, and it is the
difference between a Persian storefront and a Latin one with Persian words pasted on it. Its scope is
Question 2.

**Independent Test**: Turn on a screen reader and traverse the section, attempt to select and copy a category
name, and compare label rendering on a high-density phone screen against the same name rendered as real text.
Independent of the arc and the motion.

**Acceptance Scenarios**:

1. **Given** a category name, **When** it is rendered, **Then** Persian letters join correctly and read
   right-to-left.
2. **Given** the same name, **When** a shopper selects it, **Then** it behaves as text and can be copied.
3. **Given** a screen reader, **When** it traverses the section, **Then** each category is announced by name
   as a reachable destination with its state indicated.
4. **Given** a high-density phone screen, **When** a label is read at its smallest size, **Then** it is
   sharp rather than soft or pixelated.
5. **Given** a long Persian category name, **When** it is displayed, **Then** it is not clipped, and the
   panel layout accommodates it rather than the label dictating a fixed panel width.
6. **Given** a category that is centred and one that is not, **When** labels are compared, **Then** both are
   legible and the difference is emphasis rather than legibility.

---

### User Story 3 — The section must not interfere with the rest of the page (Priority: P3)

A shopper browsing the homepage experiences this section as part of a page, not as a region with different
physics. The page scrolls normally, the section's movement does not startle or steal input, and other parts
of the homepage stay responsive while the carousel is running.

**Why this priority**: The reference's page-level input capture and its always-on render loop are the two
mechanisms most likely to make the homepage feel broken rather than premium, and the damage would land on the
scroll behaviour feature 002 exists to perfect. This is the constraint that keeps a nice section from ruining
the page it sits on.

**Independent Test**: Scroll the homepage past the section on a phone and on a laptop, then measure page
responsiveness with the section running and with it removed. Any point where vertical scrolling is captured,
or the page feels heavier only because this section exists, is a failure.

**Acceptance Scenarios**:

1. **Given** the section anywhere on the page, **When** the shopper scrolls the page, **Then** page scrolling
   is unaffected whether or not the pointer is over the section.
2. **Given** input handling, **When** the shopper presses outside the section, **Then** the carousel does not
   respond.
3. **Given** the section off screen, **When** the shopper browses elsewhere, **Then** it is not animating, not
   consuming continuous attention, and does not resume mid-motion when scrolled back into view.
4. **Given** the section returned to after being out of view, **When** it reappears, **Then** it is in the
   state the shopper left it and does not replay an entrance.
5. **Given** the rest of the homepage, **When** the section is present, **Then** scrolling, image loading, and
   interaction elsewhere are no slower than they are without it.
6. **Given** the section's movement alongside feature 002's ground behaviour and feature 003's product motion,
   **When** all run on the homepage, **Then** the page reads as one choreography.

---

### User Story 4 — Reaching any department without swipe-only discovery (Priority: P4)

A shopper who cannot or will not swipe — a keyboard user, a screen-reader user, someone on a desktop with a
mouse, someone who finds moving targets hard to hit — still reaches every department in the section.

**Why this priority**: A carousel that only responds to drag is a wall for anyone not dragging. The section is
the storefront's main orientation surface, so a single-input-only design would exclude exactly the shoppers
most likely to need help finding their way. It ranks last because it constrains how the first three are
built rather than being a separate experience.

**Independent Test**: Reach every department in the set using keyboard alone, then with a screen reader, then
with a mouse and no dragging. Compare against the swipe path and require the same destinations and no more
steps.

**Acceptance Scenarios**:

1. **Given** a keyboard user, **When** they move through the section, **Then** focus moves panel to panel in
   reading order, focus is always visible, and activating the focused panel navigates.
2. **Given** arrow-key use in a right-to-left document, **When** the shopper presses left and right, **Then**
   movement matches Persian expectations rather than physical screen direction.
3. **Given** a mouse-only shopper, **When** they want to advance without dragging, **Then** an ordinary click
   control or the wheel over the panel area works, and the page's own scrolling is not damaged.
4. **Given** a shopper who cannot perform a swipe, **When** they attempt to reach the last department, **Then**
   it is reachable by another route.
5. **Given** touch targets in this section, **When** measured, **Then** they are comfortable for a thumb and
   do not overlap the fixed header's area.
6. **Given** a shopper with reduced motion enabled, **When** they use the section, **Then** every department,
   label, and destination is present and the movement is settled rather than travelling.
7. **Given** the same departments, **When** a shopper browses them through the existing category navigation
   elsewhere on the site, **Then** both routes lead to identical results.

---

### Edge Cases

- **The set contains a category with a single product** (online services: 1, feature phones and computer
  accessories: a handful) — is a doorway to one item honest or is it a dead end dressed up?
- **A category with no artwork** among the three kinds that lack a badge.
- **Two categories whose names are near-duplicates** (the three "لوازم جانبی…" labels) appearing side by side
  in one loop and reading as an error.
- **A panel whose artwork arrives late or never**, on a slow connection.
- **The external placeholder images in the reference** — any of them reaching production is a defect.
- **Very small phone screens**, where the arc's bending pushes edge panels off-legibility, and **very wide
  desktop screens**, where the same arc leaves visible empty space.
- **Device rotation mid-swipe**, which recomputes every panel's geometry.
- **An odd number of panels**, and a set of fewer than four, where a "carousel" is barely warranted.
- **A shopper swiping hard**, where inertia could skip several panels and land unpredictably.
- **Two fingers on the section at once**, and a drag continued with a finger that leaves the section's bounds.
- **Browser zoom** at high magnification.
- **Returning via browser back** after entering a department.

## Requirements *(mandatory)*

### Category Set and Content

- **FR-001**: The section MUST present a deliberately chosen category set, and MUST NOT render the raw
  category tree. the set is defined by what actually has products, not by the stored tree (Resolved Q1): every group with at least one product is eligible and every group with none is excluded, which removes all 13 empty categories automatically. Where a populated group has no artwork, artwork is produced for it — see FR-033.
- **FR-002**: Every panel MUST lead to a listing containing at least one product. An empty category MUST NOT
  be presented as a doorway.
- **FR-003**: Categories that mean the same thing MUST be merged or excluded, and MUST NOT appear as separate
  panels.
- **FR-004**: Brand names MUST NOT appear as category panels. Brands are a separate axis with their own
  surface in feature 004.
- **FR-005**: Where the chosen set includes a category with a very small product count, the section MUST
  represent it accurately and MUST NOT imply breadth it does not have.
- **FR-006**: Category names MUST be the names shoppers recognise, in Persian, and MUST NOT be derived from
  internal labels or transliterations.
- **FR-007**: The section MUST state or convey how many departments exist, so a shopper can tell whether they
  have seen all of them.

### Carousel Behaviour

- **FR-008**: One panel MUST be identifiable as the active one at all times, without requiring the shopper to
  interpret the geometry.
- **FR-009**: Tapping the active panel MUST navigate to that category's products.
- **FR-010**: Tapping a non-active panel MUST bring it to active position rather than navigate.
- **FR-011**: Movement MUST settle onto exactly one active panel after a swipe, a wheel action, or a release,
  and MUST NOT rest between two.
- **FR-012**: Every panel in the set MUST be reachable from any other, and the looping MUST NOT skip or strand
  a panel.
- **FR-013**: The section MUST indicate that more panels exist beyond the visible ones, and in which direction.
- **FR-014**: Inertia MUST settle within a bounded distance so a shopper intending one panel does not travel
  three.
- **FR-015**: A shopper's position in the carousel MUST persist while they browse the rest of the page and
  MUST be restored when they return during the same visit.

### Non-Interference

- **FR-016**: The section MUST NOT capture, redirect, or cancel the page's own vertical scrolling, under any
  pointer position, on any input device.
- **FR-017**: The section MUST respond only to input originating within its own bounds, and MUST NOT listen
  for presses or movement occurring elsewhere on the page.
- **FR-018**: Horizontal intent MUST be distinguished from vertical intent at the start of a gesture, so a
  shopper scrolling the page with a finger over the section is not mistaken for a swipe.
- **FR-019**: The section MUST NOT animate, compute, or consume attention while it is outside the viewport,
  and MUST NOT replay an entrance sequence when it re-enters.
- **FR-020**: The section MUST NOT degrade scrolling, interaction, or image loading anywhere else on the page,
  measured against the same page without the section.
- **FR-021**: Where the section depends on graphics capabilities that a device lacks, it MUST fall back to a
  complete, static, fully usable presentation of the same categories and destinations rather than to an empty
  region.

### Labels and Language

- **FR-022**: Category labels MUST be live text: shaped correctly for Persian, ordered right-to-left,
  selectable, and announced by assistive technology. the panels bend and the labels do not (Resolved Q2 = A). The reference's baked-text mechanism is not adopted, because it is the direct cause of every Persian and assistive failure in this group. The arc, depth and inertia are kept; curved lettering is given up deliberately.
- **FR-023**: Labels MUST remain sharp at every display size the design uses, on high-density screens.
- **FR-024**: Panel geometry MUST accommodate the longest name in the set without clipping or truncation.
- **FR-025**: Numerals and any counts MUST render in Persian numerals. (001/FR-011)
- **FR-026**: Direction, order, alignment, and motion direction of the entire section MUST be designed for
  right-to-left reading rather than mirrored mechanically. (Constitution II)

### Accessibility

- **FR-027**: Every department MUST be reachable by keyboard, with visible focus and activation in reading
  order.
- **FR-028**: Arrow-key behaviour MUST match right-to-left reading expectations.
- **FR-029**: A pointer user MUST be able to advance and retreat without dragging.
- **FR-030**: Assistive technology MUST convey the active panel's state and the total number of departments.
- **FR-031**: A reduced-motion shopper MUST receive identical categories, labels, and destinations with
  settled rather than travelling movement. (002/FR-020, 002/FR-021)
- **FR-032**: Touch targets MUST be comfortable for a thumb and MUST NOT sit beneath the fixed header.

### Honesty

- **FR-033**: Each panel MUST use that category's authentic artwork, or none. No stock, placeholder, or
  unrelated photograph may illustrate a department, and the placeholder imagery bundled with the reference
  MUST NOT reach the product. (Constitution I)
- **FR-034**: Panel artwork MUST NOT depict a specific product in a way that implies that product is the
  category's contents, unless it genuinely represents them.

### Design Delegation

- **FR-035**: The surface colour, label colour, typeface, weight, panel treatment, resting and active
  appearance, corner form, and depth cue are **delegated to the implementing agent** by the owner and MUST
  NOT be escalated as clarification questions. They MUST be internally consistent, coherent with the
  homepage's dark ground, and consistent with what feature 004 establishes for the neighbouring brands
  surface. (Constitution IV)
- **FR-036**: This specification MUST NOT fix the arc's curvature, panel sizes, spacing, motion durations,
  easing, or inertia strength. (Constitution IV)
- **FR-037**: Mobile is the primary design case; a wider presentation derives from the phone presentation
  rather than being separately authored.

### Coherence With Neighbouring Surfaces

- **FR-038**: The categories and brands surfaces MAY remain two different widgets — a bending arc carousel
  here and stacked rows in `004` — provided they are not merely similar but explicitly bound to
  one shared motion vocabulary (a single duration scale and easing family, chosen once and applied to both
  surfaces, never independently per surface); one emphasis rule (exactly one element holds emphasis at a
  time, and it releases the same way); one interaction contract (a press on a selectable destination always
  navigates and is never intercepted to reveal decoration first); one visibility rule (nothing animates while
  off screen, and at most one travelling element per page region); and one reduced-motion behaviour, identical
  in both. Two visually distinct widgets that honour all five are coherent; two that invent their own
  motion, emphasis or press semantics are not. The obligation is reciprocal and restated as
  `004/FR-032`. This clause deliberately does **not** require one shared widget — a previous draft demanded
  "one carousel pattern", which would have forced discarding one of the two references the owner chose.
  (001/FR-049)
- **FR-039**: The section MUST be validated against the homepage's dark ground, which the owner confirmed on
  2026-09-20, and MUST NOT be signed off against its current light chapter.

## Key Entities

- **Category Panel**: one department's card — its artwork, its name, its destination, its active state.
- **Category Set**: the chosen list of departments. Unresolved; Question 1.
- **Department Source**: the underlying data axis a panel derives from — the category tree or the product
  kind — which currently disagree.
- **Badge**: one of the eight authentic category artworks on disk; three kinds have none.
- **Active Position**: the centred, current panel, and the state carried by the section.
- **Arc Treatment**: the curved arrangement distinguishing the section visually.
- **Inertia Model**: how a swipe carries on and where it settles.
- **Label**: the department's name — required to be live text; the reference makes it an image.
- **Input Boundary**: the section's own limits, beyond which it must not react to anything.
- **Fallback Presentation**: the complete static form used when the effect cannot run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time shopper on a phone reaches a named department's products within two actions from
  the section, in at least 9 of 10 attempts.
- **SC-002**: Zero dead doors: every panel in the set leads to at least one product, verified across all
  panels.
- **SC-003**: The page's own vertical scrolling is unaffected while the pointer is over the section, verified
  on a phone, a laptop with a mouse, and a laptop with a trackpad.
- **SC-004**: A shopper swiping one panel advances one panel, or settles on the panel they gestured toward, in
  at least 9 of 10 attempts.
- **SC-005**: Every department is reachable by keyboard alone and by screen reader alone, with the same
  destination set as the swipe route — no panel reachable only by gesture.
- **SC-006**: All category labels are real text: selectable, announced by a screen reader, and correctly
  shaped and ordered for Persian, verified on every panel.
- **SC-007**: Zero placeholder, stock, or unrelated artwork appears in the section.
- **SC-008**: Nothing in the section animates or computes while it is off screen, and no entrance replays on
  return, verified by observation.
- **SC-009**: Adding the section does not measurably change how responsive the rest of the homepage feels on
  a mid-range phone, judged before and after.
- **SC-010**: The section reads at least as premium and considered as its current form to 7 of 10 reviewers,
  and no more than 2 of 10 find the homepage busier as a result.
- **SC-011**: With categories, brands, the scroll ground, and product motion all active, at least 8 of 10
  reviewers describe the homepage as one coherent experience rather than several competing ones.
- **SC-012**: Shoppers can state how many departments exist after browsing the section, in at least 7 of 10
  trials.

## Out of Scope

- Cleaning, merging, or restructuring the underlying category data. This feature reads it and chooses from
  it; changing it is a data decision outside the frontend initiative. (Constitution III)
- The product listing behaviour a shopper lands on after choosing a department, owned by feature 001.
- The brands surface, owned by feature 004.
- Category pages as distinct destinations beyond an existing listing route.
- Any change to data, endpoints, or storage.
- Desktop as a separately authored design.
- The reference's bundled placeholder imagery and its external image dependencies.

## Assumptions

- **Eight curated departments is the most likely shape of the answer to Question 1**, because that set is the
  only one with authentic artwork already made for it and every member has products. It is not adopted as a
  default because three populated kinds would then be absent from the homepage's main orientation surface.
- **The badge set may need to grow** if the chosen set includes kinds without artwork; producing additional
  authentic artwork is in scope, fabricating substitutes is not.
- **The dark ground is settled** by the owner on 2026-09-20. This section must be proven on it.
- **The section sits adjacent to feature 004's brands rows**, so FR-038 binds the two. 004 is now settled
  (its Q1 selected the six marked brands, Q2 = C single-tap navigation with a separate expand control, Q3 = C
  the existing hero band reworked as non-moving), so those answers constrain here rather than the reverse.
  FR-038 has since been settled by Clarification Q2: the two surfaces stay distinct and share the five
  behaviours listed in that requirement.
- **The reference's placeholder data is scaffolding**, discarded entirely.
- **Motion budget carries over from 004**: at most one carousel system per page region, and nothing animates
  off screen.
- **Category-to-products routing already exists as a listing filter**, so this feature adds no new
  destination type; it makes existing ones discoverable.

## Clarifications

### Session 2026-09-20

- Q: Must the categories and brands surfaces become the same widget, or may they stay two different ones with a shared sense of motion? (FR-038) → A: **Option B — two widgets, one motion language.** The arc carousel and the brands rows both stand; FR-038 was rewritten to name the five things they must share and made reciprocal with `004/FR-032`.

**What this removed:** the previous wording of FR-038 ("share … one carousel pattern") would have invalidated one of the two references the owner supplied. The clause was also one-sided — it bound the brands surface from inside the categories spec while the brands spec never mentioned it.

## Resolved Clarifications

All answered by the owner on 2026-09-20 and now binding. **Open questions remaining: none.**


### Question 1: Which set of departments does the carousel present?  —  **RESOLVED: populated set**

**Context**: "Bad news, and it is worse"; FR-001 … FR-005. The raw tree has 13 empty categories of 32, mixes
brands into the type axis, and contains near-duplicate labels. The kind axis is fully populated but disagrees
with the artwork.

**What we need to know**: What is the shopper-facing list of departments?

| Option | Answer | Implications |
| ------ | -------------------------------------------------------- | -------------------------------------------------------------- |
| A | The eight curated departments the existing badges represent | Authentic artwork and populated listings today; three kinds invisible on the homepage |
| B | All nine product kinds | Complete and honest about inventory; needs three new artworks; "service" and "sim card" as departments is questionable |
| C | A merged, renamed set defined during planning | Best shopper-facing taxonomy; requires naming decisions and new artwork; slowest to settle |
| D | A reduced shopping-first set — phones, audio, wearables, power, accessories | Simplest and strongest; deliberately hides small categories rather than presenting them |
| Custom | Provide your own answer, or name the departments yourself | Sets the homepage's entire orientation surface |

### Question 2: Is the bent label require  —  **RESOLVED: A**d, or may labels stay live text?

**Context**: "A note on the reference itself" §3; FR-022, FR-023, FR-026 … FR-031. The reference's arc effect
on type exists because each label is an image of text. Persian cannot safely be rendered that way and
screens-readers cannot see it at all.

**What we need to know**: Must the type bend with the panels, or may the panels bend while the words remain
real text?

| Option | Answer | Implications |
| ------ | -------------------------------------------------------- | ------------------------------------------------------------ |
| A | Panels bend; labels stay live text | Correct Persian, selectable, screen-reader accessible; type does not curve — the recommended reading of the reference |
| B | Labels must bend too, as in the reference | Maximum visual fidelity; costs Persian shaping reliability, selection, assistive access, and sharpness |
| C | Abandon the bending effect; keep the arc's layout and motion only | Fully accessible and still distinctive; loses the reference's signature look |
| Custom | Provide your own answer | Decides whether the section's headline visual survives |
