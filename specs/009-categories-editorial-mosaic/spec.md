# Feature Specification: Categories Editorial Mosaic

**Feature Branch**: `009-categories-editorial-mosaic`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "rebuild the homepage categories chapter as an editorial mosaic (owner-picked
option A). Nine departments, each a tile with a 3:4 panel image, one vivid hue per department, on the existing
light ground which the owner explicitly praised and told us to keep. Tile size carries catalogue weight
honestly. At 360: all nine visible, phone full-width tall plus four paired rows each ≥164px, plain vertical
scroll, no nested horizontal scroller, zero JS. At 1280: composed 4-column block, phone spanning 2×2, no orphan
row. Labels are live overlay text on a scrim plate. Deletes the carousel and its swipe/tilt behaviour."

## Why this feature exists

The owner's verdict on the categories chapter: **"categories section is so ugly! (but the white background is
so pretty, keep it) you must re-generate images and the way categories are shown."**

Two things followed. Nine new panels were produced — one per department, 3:4, dark oxblood ground with a
champagne-gold light and a single vivid hue each. And three layout directions were put in front of the owner,
who chose **the editorial mosaic**. This feature is that choice, written down before any of it is built.

The presentation being replaced is a curved 3D carousel that showed one department at a time behind a swipe
gesture. On the shop's actual device — a phone in a hand — that means eight of nine doorways are hidden until
the shopper discovers the gesture. The mosaic's whole argument is that all nine are doorways and all nine
should be visible.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Every department is on the table at once (Priority: P1)

A shopper on a phone scrolls into the categories chapter and sees all nine departments without swiping
sideways, tapping a control, or discovering a gesture. The largest department is the biggest thing in the
chapter; the smallest is still a real, tappable tile with its own photograph and its own name. One tap on any
tile takes them straight into that department's products.

**Why this priority**: This is the request. If a shopper has to perform anything to find a department, the
chapter has failed in the same way the carousel did, whatever it looks like.

**Independent Test**: At 360 px wide, scroll the chapter from top to bottom. Count the departments seen and the
horizontal gestures required. Nine seen, zero swipes, and one tap reaches each — nothing else about the feature
needs to exist for this to be testable.

**Acceptance Scenarios**:

1. **Given** a shopper above the chapter at 360 px, **When** they scroll into it, **Then** all nine department
   tiles are present in the page's vertical flow and none requires a sideways gesture to reach.
2. **Given** any tile, **When** the shopper taps it, **Then** they arrive at that department's product listing.
3. **Given** a shopper who has never seen the site, **When** they look at the chapter for five seconds,
   **Then** they can name most of the departments without reading a label — the photograph does the work.
4. **Given** a department with a single product, **When** its tile is shown, **Then** it looks like a doorway,
   not like a leftover.

---

### User Story 2 — What a tile claims, the shop can back (Priority: P2)

A tile may show a number of products. It may show that number only when the listing it links to actually shows
the same number, and it shows nothing at all when the shelf behind it is empty. No tile is dimmed, greyed,
labelled "coming soon", or given a placeholder where a real thing should be.

**Why this priority**: The mosaic's size hierarchy is a statement about weight — phones are big, online services
are small. A shopper will read that as truth, so the rest of what the tile says has to be true too.

**Independent Test**: For each of the nine tiles, compare any number shown against the number on the page it
links to. Then look for anything that reads as unfinished or unavailable.

**Acceptance Scenarios**:

1. **Given** a tile that shows a count, **When** the shopper follows it, **Then** the listing shows the same
   count.
2. **Given** a department whose shelf holds nothing purchasable, **When** its tile is shown, **Then** no count
   appears rather than a number that overstates the shop.
3. **Given** all nine tiles, **When** they are compared, **Then** none is dimmed, disabled, or marked pending.
4. **Given** a data refresh that empties a department, **When** the homepage renders, **Then** that tile is
   absent and the layout closes up without leaving a hole.

---

### User Story 3 — Composed on a big screen, calm on a small one (Priority: P3)

The light ground the owner praised stays exactly as it is; only what sits on it changes. At desktop width the
chapter reads as one deliberate block — the phone panel anchoring the composition, the others arranged around
it, no orphaned row at the end. At phone width it is a plain vertical stack of tiles with nothing moving.

**Why this priority**: This is the difference between a designed page and a grid that happened to fit. It is
third only because the first two stories must exist for it to matter.

**Independent Test**: View at 360, 768 and 1280. Confirm the light ground is unchanged, the composition holds
at each width, and nothing at the end of the block looks stranded.

**Acceptance Scenarios**:

1. **Given** a 1280 px viewport, **When** the shopper sees the chapter, **Then** the tiles form one composed
   block with no trailing row of leftovers.
2. **Given** any width, **When** the shopper compares the chapter's background to the rest of the page,
   **Then** the light ground is the same treatment it was before this feature.
3. **Given** a shopper with scripting disabled, **When** they browse the chapter, **Then** all nine tiles are
   still visible and still tappable.
4. **Given** a right-to-left reader, **When** they scan the block, **Then** the composition leads from the
   right and nothing is mirrored incorrectly.

---

### Edge Cases

- A department's photograph fails to load: the tile still shows its name and remains a doorway; the missing
  image is visible as missing rather than papered over with a stand-in.
- The catalogue grows a tenth department: the layout must absorb it without a stranded tile or a re-flow that
  demotes everything.
- A very wide screen: the block stops growing rather than stretching nine thin panels across a 4K display.
- A short, wide phone in landscape: tiles keep a usable minimum size and the vertical scroll continues to work.
- Print: every department is present with its name, since the chapter's job is wayfinding.
- A shopper uses the keyboard: nine tiles, in reading order, each reachable and each visibly focused.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chapter MUST present every department the shop currently has products for, and MUST show them
  all within the page's vertical scroll at 360 px wide — no sideways gesture, no pager, no hidden set.
- **FR-002**: Each department MUST be identifiable at a glance from its panel alone, before its label is read.
  The owner's bar: *"مشاری باید در اولین نگاه متوجه بشه این چه دسته بندیه هست"*.
- **FR-003**: Shoppers MUST be able to reach a department's listing with one tap or click on its tile.
- **FR-004**: The light ground of the chapter MUST be preserved as it is today. The owner asked for it by name:
  *"the white background is so pretty, keep it"*.
- **FR-005**: Tile area MUST express relative catalogue weight, and the smallest tile MUST still be at least
  148 px across at 360 px. The measured spread across departments is **134 : 1** (134 products in the largest,
  1 in the smallest), so the hierarchy is a fact about the shop, not a decoration.
  *(Corrected during planning from "≥164 px", which is arithmetically impossible: the container's `1.5rem`
  padding leaves 312 px at 360, so two columns give 150 px each and 164 would need a negative gutter. See
  `research.md` D1.)*
- **FR-006**: Size hierarchy MUST NOT imply importance hierarchy as a doorway: every tile is a complete,
  working entrance, and none may be dimmed, disabled, or labelled pending.
- **FR-007**: Department names MUST be live text, never baked into a panel image. Persian models render Persian
  script as gibberish, and live text stays sharp, translatable and repositionable.
- **FR-008**: Label text over a panel MUST meet at least 4.5 : 1 contrast against whatever is behind it. The
  panels were generated with an intentionally empty dark bottom third for this purpose; the measured minimum
  across the current nine is **16.8 : 1**, and the scrim treatment is what keeps that guarantee independent of
  any panel generated later.
- **FR-009**: A count shown on a tile MUST equal the count the destination listing displays, and MUST be
  omitted where the destination holds nothing purchasable.
- **FR-010**: Panel imagery MUST NOT depict a real brand's protected trade dress and MUST NOT represent a
  specific product as merchandise the shop sells.
- **FR-011**: The chapter MUST NOT introduce a second scroll axis inside the page's vertical scroll.
- **FR-012**: Keyboard shoppers MUST be able to reach every tile in reading order with a visible focus
  indicator.
- **FR-013**: A screen reader MUST announce each tile as one link carrying the department name, plus its count
  when one is shown — and nothing else.
- **FR-014**: The existing swipe/tilt carousel presentation of this chapter MUST be removed, including its
  gesture affordance and its per-tile motion. This is the owner's chosen replacement, not an addition to it.
- **FR-015**: A department that empties MUST disappear from the chapter without leaving a gap, and its absence
  MUST NOT break the composition.
- **FR-016**: The layout MUST hold at 360, 768 and 1280 px, with no orphaned trailing row at the widest step.
- **FR-017**: Panels MUST keep their 3:4 proportion; a tile may crop a panel only where the department's object
  remains fully visible.
- **FR-018**: Browsing the chapter MUST NOT require scripting.
- **FR-019**: Missing data MUST stay visibly missing rather than being filled with a stand-in photograph or an
  assumed value.
- **FR-020**: The chapter's position in the homepage's tonal sequence MUST remain correct after it changes
  height — it is one of the fixed points the page's background progression is anchored to.
- **FR-021**: Right-to-left layout MUST be respected: the composition leads from the right, and no part of the
  block depends on a left-to-right reading order.

### Key Entities

- **Department** — a wayfinding doorway the shop can actually back: a name, a panel image, a destination
  listing, and optionally a product count. Its catalogue weight is measured, never typed by hand.
- **Panel** — the 3:4 image for one department. Dark ground, one vivid hue per department, deliberately empty in
  its bottom third so a label can sit on it.
- **Tile** — the composed unit: panel, label, optional count, one destination. Its size is the only thing that
  varies between departments.
- **Mosaic** — the whole block, and the relationship between tile sizes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 360 px wide, a shopper sees **all nine** departments by scrolling vertically, and performs
  **zero** horizontal gestures to do it.
- **SC-002**: Someone shown the chapter for five seconds correctly names **at least six of nine** departments
  from the panels alone.
- **SC-003**: Every tile reaches its listing in **one** tap, and **zero** tiles lead to an empty or wrong
  destination.
- **SC-004**: Label text on every tile is at or above **4.5 : 1** contrast; the current set measures a minimum
  of **16.8 : 1**.
- **SC-005**: The owner confirms the chapter's light ground is unchanged from the version they praised.
- **SC-006**: A keyboard-only shopper reaches all nine tiles within **nine** stops, each visibly focused.
- **SC-007**: The chapter renders fully with scripting disabled, with all nine tiles present and tappable.

## Assumptions

- **The mosaic replaces the carousel outright.** The owner picked one of three layouts to fix "the way
  categories are shown"; keeping both presentations would re-create the problem being reported.
- **Nine departments, as the data currently supports them.** The set is derived from what actually has products,
  not from the stored category tree, which includes empty categories and brand-named ones.
- **A layout decision made in chat is input to this spec, not a substitute for it.** Roughly 165 lines of mosaic
  CSS were written into the homepage stylesheet before this document existed. They are treated here as an
  unverified candidate: the planning phase must check them against these requirements rather than inherit them
  as a decision.
- **The panels are mixed format and mixed size** — seven at 896×1200 JPEG, two at 1086×1448 PNG, the latter
  around 1.2–1.5 MB each. Conversion to a modern format is a real pre-ship task and is deliberately **not** part
  of this feature's acceptance, so that a layout decision is not blocked on an encoding one.
- **Counts may be absent, and that is a correct state**, not a degraded one — several departments have nothing
  purchasable today.
- **More online services are coming**, so the smallest department (one product today) is not a candidate for
  removal and its tile must not be treated as temporary.
- **The brand mark overlay is not required.** The chosen design closes its composition on labels alone; the
  cream transparent mark that an earlier document asked for stays a nice-to-have and off the critical path.
- **No frame-rate or smoothness target**, because there is no motion to measure: the chapter is static by
  design, which is also why it works with scripting off.
