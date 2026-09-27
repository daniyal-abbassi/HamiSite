# Feature Specification: Categories Masonry Gallery

**Feature Branch**: `010-categories-masonry-gallery`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "none of them [the two mosaic variants]. Apply this design for categories: MasonryGallery — a high-performance masonry layout with cinematic entrances and fluid interactions: a responsive multi-column masonry where items keep their own natural heights, entries animate in with a staggered blur-to-sharp directional reveal, and tiles scale on hover."

## Supersedes

This feature **replaces the layout decision of `specs/009-categories-editorial-mosaic`**, whose two variants
(hero mosaic, equal tiles) the owner saw rendered and rejected with "none of them". Everything in 009 that is
*not* a layout survives unchanged and is restated here: the nine derived departments, the panel imagery rules,
the honesty rules about counts, the light ground, and the requirement that the section work without scripting.
009's documents remain in the repository as the record of what was tried and why it was set aside.

## Why this feature exists

The owner's original complaint stands: **"categories section is so ugly! (but the white background is so
pretty, keep it)"**, with the bar for the replacement being **"مشاری باید در اولین نگاه متوجه بشه این چه دسته
بندیه هست"** — a shopper must understand which department they are looking at at first glance.

Two grid layouts were designed, rendered with the real panels, and rejected. The owner then supplied a
masonry gallery as the direction to adopt: an editorial, magazine-like arrangement of unequal heights with a
cinematic entrance, rather than a tidy matrix of equal cells.

This specification adopts that **look and motion**, and deliberately refuses six behaviours in the supplied
reference that would damage this shop. Those refusals are requirements, not preferences, and each is stated
with the harm it prevents.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A magazine page of departments, not a grid of cells (Priority: P1)

A shopper on a phone scrolls into the categories chapter and finds an arrangement where departments have
different heights and the columns stagger against each other, the way a magazine page breaks rather than the
way a spreadsheet does. Every department is still present, still named, still one press away from its
products.

**Why this priority**: This is the request. If the chapter ends up as an even grid of identical cells again, it
has been rebuilt into the thing that was just rejected twice.

**Independent Test**: At 360 px and at 1280 px, view the chapter and confirm the tiles do **not** line up into
uniform rows — column bottoms are deliberately uneven — while all nine departments remain present, named and
tappable.

**Acceptance Scenarios**:

1. **Given** a shopper at 360 px, **When** they scroll the chapter, **Then** they see all nine departments in
   an uneven, multi-column arrangement with no sideways gesture required.
2. **Given** a shopper at 1280 px, **When** they see the chapter, **Then** the columns stagger against each
   other rather than forming one flat row of equal cells.
3. **Given** any tile, **When** the shopper presses it, **Then** they arrive at that department's listing in
   the same window.
4. **Given** a shopper who has never seen the site, **When** they look for five seconds, **Then** they can name
   most departments from the pictures alone.

---

### User Story 2 — The cinematic arrival, without the cost (Priority: P2)

The first time a shopper reaches the chapter, the tiles do not simply appear: they arrive, one after another,
resolving from soft to sharp and settling into place — the feeling of a deck being dealt or a page assembling
itself. After that first arrival the chapter is calm; it does not perform again.

**Why this priority**: The entrance is half of what the owner is asking for and the half that makes masonry
read as editorial rather than as a broken grid. It is second only because a beautiful arrival on top of a wrong
layout is still a wrong layout.

**Independent Test**: Load the homepage, scroll to the chapter once and watch the arrival; then scroll away and
back. The arrival plays on the first visit to the chapter and does not replay.

**Acceptance Scenarios**:

1. **Given** a shopper who has not yet seen the chapter, **When** it first enters view, **Then** the tiles
   settle into place one after another with a short delay between each.
2. **Given** the same shopper, **When** they scroll away and back, **Then** the chapter is already composed and
   nothing replays.
3. **Given** a shopper who has asked for reduced motion, **When** they reach the chapter, **Then** every tile
   is simply there, fully sharp and fully placed, with no arrival at all.
4. **Given** a slow connection, **When** the shopper reaches the chapter before all pictures have arrived,
   **Then** the tiles that do have pictures show them and the rest are already in place rather than waiting in
   the dark.

---

### User Story 3 — Pressing a tile feels like pressing it (Priority: P3)

On a pointer device, moving onto a tile makes it respond — it draws in slightly and its name settles. On a
touch device, where there is no "moving onto", the same response happens at the moment of pressing, and the
department's name never depended on either.

**Why this priority**: This is the polish that separates a composed page from a correct one, and the reference
component's hover behaviour is the part most likely to be ported blindly onto a phone audience where it cannot
fire at all.

**Independent Test**: On a desktop, hover a tile and observe the response. On a phone, press and hold a tile and
observe the same response. In both cases, confirm the department name is visible with no interaction at all.

**Acceptance Scenarios**:

1. **Given** a pointer device, **When** the shopper hovers a tile, **Then** the tile responds with a slight
   inward scale.
2. **Given** a touch device, **When** the shopper presses a tile, **Then** the same response appears at press
   time.
3. **Given** either device, **When** no interaction is happening, **Then** every tile's department name is
   plainly readable.

---

### Edge Cases

- **A shopper with scripting turned off**: the whole chapter is present, correctly arranged, every department
  named and reachable. The arrival animation is the only thing lost.
- **A very tall or very short tile ratio**: the arrangement must not leave a column dramatically shorter than
  the others, which is how masonry reads as unfinished rather than editorial.
- **A department that empties on a data refresh**: its tile disappears and the arrangement closes up without a
  hole.
- **A tenth department is added**: the arrangement absorbs it without stranding a tile.
- **A picture fails to load**: the tile keeps its name and stays a doorway; the missing picture is visible as
  missing, not filled with a stand-in.
- **The shopper resizes the window or rotates the phone**: the tiles move to the new arrangement without
  overlapping, and without the section changing height in a way that throws their scroll position away.
- **A shopper arrives by a direct link to a department further down the page**: the chapter is already composed
  at that position, not mid-animation waiting to be triggered.
- **Print**: every department appears with its name; no tile is caught mid-arrival.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chapter MUST present every department the shop currently supports, in a multi-column
  arrangement whose tile heights differ from one another, at 360, 768 and 1280 px.
- **FR-002**: The arrangement MUST NOT collapse into a matrix of identical cells at any width — that is the
  shape the owner rejected twice.
- **FR-003**: All departments MUST be reachable by vertical scrolling alone. No sideways gesture, pager, or
  hidden set.
- **FR-004**: Each department MUST be recognisable from its picture before its label is read.
- **FR-005**: Every tile MUST carry its department name as **permanently visible text**. The name MUST NOT
  depend on hovering, focusing, pressing, or any other transient state. *The supplied reference reveals the
  title only on hover, which on a touch device — the shop's primary audience — means the department names are
  never shown at all.*
- **FR-006**: Labels MUST be rendered as live text, never baked into a picture, and MUST NOT use letter-spacing
  or capitalisation styling intended for Latin script. *Persian has no letter-spacing and no case; the
  reference's label styling is a Latin typographic habit.*
- **FR-007**: Pressing a tile MUST open that department's listing in the **same window**, preserving normal
  back behaviour. *The reference opens a new window, which strands a shopper who wanted to keep browsing and
  breaks the page's own history.*
- **FR-008**: The chapter MUST be fully present — every department, named, positioned and tappable — **before
  any scripting runs**, and MUST remain so if scripting never arrives. *The reference computes the entire
  layout in the browser and positions every tile absolutely, so without scripting the section is an empty box
  of a fixed height. A shopper on a slow phone would see nothing where the departments should be.*
- **FR-009**: The arrival animation MUST play once per page visit, on the chapter's first appearance, and MUST
  NOT replay on subsequent scrolls into view.
- **FR-010**: The chapter MUST honour a reduced-motion request by showing the finished arrangement immediately,
  with no entrance and no blur.
- **FR-011**: The arrival MUST NOT leave a tile in a state where its picture is soft, half-placed, or missing
    if the animation cannot run — the end state must be reachable by any path, including a stalled script or a
    disconnected browser.
- **FR-012**: Pointer hover MUST produce a visible response on tiles, and the equivalent response MUST be
  available on touch at press time. Neither may be the only way to see a department's name (see FR-005).
- **FR-013**: Tile heights MUST be a deliberate rhythm, **not** a statement of importance. Heights vary so the
  columns stagger against one another and the page reads as composed; no department may be given a tall tile
  because it sells more and no department may be shrunk because it sells less. The pattern of heights MUST be
  recorded in the feature's own documents so a later change is a change to a stated pattern rather than an
  accident of layout. *(Owner decision 2026-09-26: prominence comes from rhythm only — the catalogue-weight
  hierarchy from 009 is explicitly not carried over.)*
- **FR-013a**: Because height no longer carries the shop's data, each department's picture and name MUST carry
  its identity on their own: no tile may rely on being the largest one to be noticed.
- **FR-014**: A count shown on a tile MUST equal the count the department's listing displays, and MUST be
  omitted where the listing holds nothing purchasable.
- **FR-015**: No tile MAY be dimmed, disabled, marked pending, or given a reserved area it cannot fill.
- **FR-016**: The chapter's light ground MUST be preserved as it is today.
- **FR-017**: Picture content MUST NOT include Persian text, and MUST NOT depict a real brand's protected
  trade dress or present a specific product as merchandise the shop sells.
- **FR-018**: Missing data MUST stay visibly missing rather than being filled with a stand-in picture or an
  assumed value.
- **FR-019**: The chapter MUST NOT reorder or omit departments under right-to-left layout, and the column
  arrangement MUST read from the right.
- **FR-020**: A keyboard shopper MUST be able to reach every tile in reading order with a visible focus
  indicator, and a screen reader MUST announce the chapter as a list of departments, never as a gallery,
  carousel, or slideshow.
- **FR-021**: The chapter's position in the homepage's tonal sequence MUST remain correct after it changes
  height — it is one of the fixed points the page's background progression is anchored to.
- **FR-022**: The arrival MUST NOT be the reason a shopper sees an empty area: the chapter's height MUST be
  known before its tiles animate, so the rest of the page does not jump as the arrangement settles.
- **FR-023**: The arrival MUST be triggered by the chapter **entering the shopper's view**, not by the page
  finishing loading — so a shopper who scrolls quickly still meets it. *(Owner decision 2026-09-26.)*
- **FR-024**: The arrival MUST still be pending, not skipped, when the shopper reaches the chapter at speed:
  the chapter's height is fixed before the animation begins (FR-022), so a fast scroll lands on an arrangement
  that plays out rather than one that has already finished off-screen.

### Key Entities

- **Department** — a wayfinding doorway the shop can back: name, picture, destination listing, optional honest
  count, and now an authored **prominence** that decides how tall its tile is.
- **Tile** — one department in the arrangement: picture, permanently visible name, optional count, one
  destination.
- **Arrangement** — the whole masonry: which columns exist at a given width, the order tiles fill them in, and
  the uneven column bottoms that make it read as editorial.
- **Arrival** — the one-time entrance: the order tiles settle in, the direction they come from, and the soft-
  to-sharp resolution. Defined so it can be skipped safely, never required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 360 px, a shopper sees all nine departments by scrolling vertically, with zero sideways
  gestures, and the arrangement's column bottoms are visibly uneven.
- **SC-002**: Someone shown the chapter for five seconds names at least six of nine departments from the
  pictures alone.
- **SC-003**: Every department name is readable with **no interaction** on both a phone and a desktop — zero
  names revealed only by hover or focus.
- **SC-004**: With scripting disabled, all nine departments are still present, named, positioned and tappable.
- **SC-005**: The arrival plays exactly once per page visit; scrolling away and back replays nothing.
- **SC-006**: Every tile reaches its listing in one press, in the same window, with the browser's back button
  returning the shopper to the chapter.
- **SC-007**: The page's other sections do not move while the chapter arranges itself — zero layout shift
  attributable to the arrival.
- **SC-008**: The owner, viewing it on their own phone, accepts it as the direction they asked for — the two
  rejected variants were rejected on sight, so this is decided the same way.

## Assumptions

- **The masonry replaces the mosaic outright.** The owner rejected both prior layouts after seeing them
  rendered; nothing suggests keeping a grid as a fallback arrangement.
- **The nine departments, their names, routes and counts are unchanged** from 009 and remain derived from the
  catalogue rather than authored.
- **All nine supplied panels share one proportion (3:4)**, so a masonry's height variation cannot come from the
  pictures themselves. It must come from an authored prominence per department — which is why FR-013 exists and
  why the reference's per-item `height` value is treated as a design input rather than a technical parameter.
- **Hover is a desktop enhancement, not a desktop requirement.** Touch gets the equivalent at press time
  (FR-012), and no information lives behind either (FR-005).
- **The arrival is decorative.** It is allowed to fail, be skipped, or be turned off without losing a single
  department (FR-010, FR-011).
- **No frame-rate or smoothness target is set**, because the development machine cannot answer that question
  honestly; the substitute is structural — the arrival must be skippable, one-time, and never load-bearing.
- **Verification happens on a real phone or an exact 360 px viewport**, as with every recent frontend feature
  here.
- **The reference component is a design source, not a dependency to install.** Its own package manifest names
  an older React and libraries this project already carries; nothing here requires adding a package.
