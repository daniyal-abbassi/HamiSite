# Feature Specification: Brands Stacking-Card Deck

**Feature Branch**: `008-brands-stacking-cards`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "use this style/design for brands section:
https://superdesign.dev/library/the-stacking-cards-effect — The 'Stacking Cards' Effect: *As the user scrolls
through the [brands], have each card stay sticky at the top, so the next card appears to slide over the
previous one like a deck of cards.*"

## Why this feature exists

The owner's verdict on the brands chapter tonight: **"brands is ugly also (current design is not what i gave
you!!)"**. This is the second time that chapter has been rebuilt away from what was asked. The fresh
instruction is specific and visual — a deck of cards that stacks as you scroll — and it replaces the
presentation that shipped in feature 004, not the data behind it.

Two prior findings are load-bearing here and are carried forward rather than re-litigated:

- The current rows reserve a fixed band under each brand name that three of the six brands can never fill,
  which feature 004's own contract forbids verbatim (C5: *"no empty frame"*) and whose task was nonetheless
  marked complete. A stacking deck must not recreate that hole in a new shape.
- Feature 007 attempted a pinned, scroll-scrubbed band on this same homepage and **shipped without the pin**:
  at 360 px the pinned stage left only tens of pixels of usable travel, so the effect could not run where the
  shop's shoppers actually are. A stacking deck belongs to the same family of behaviour, so the fit question
  is answered up front, in requirements, not discovered at the end.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The deck arrives one card at a time (Priority: P1)

A shopper on a phone scrolls down the homepage into the brands chapter. The first brand card settles at the
top of the view and stays there. As they keep scrolling, the next card slides up over it, taking the same
position, and the card beneath it remains visible only as the edge of a stack. Six brands, six arrivals, and
by the end the shopper has the feeling of having dealt through a deck — not of having scrolled past a list.

Each card is a destination: the shopper who wants that brand's products presses the card that is on top and
arrives at that brand's listing.

**Why this priority**: This is the whole request. Without the stacking arrival there is no deck, and a
different feature has been built.

**Independent Test**: Open the homepage at 360 px wide, scroll from the chapter's first frame to its last, and
record what is on screen at evenly spaced points. Six cards must be seen taking the top position in order,
each overlapping the one before it. Nothing else about the chapter — counts, stories, motion preference — needs
to be finished for this to be testable.

**Acceptance Scenarios**:

1. **Given** the shopper is above the brands chapter, **When** they scroll into it, **Then** the first brand
   card reaches the top of the view and holds there while the chapter continues to scroll.
2. **Given** the first card is holding at the top, **When** the shopper scrolls further, **Then** the second
   card slides up over the first, and the first remains visible only as a stacked edge behind it.
3. **Given** any card in the middle of the deck, **When** the shopper presses it while it is the topmost card,
   **Then** they land on that brand's product listing.
4. **Given** the shopper has reached the last card, **When** they scroll past it, **Then** the chapter releases
   and the rest of the homepage continues normally, with no leftover pinned layer.
5. **Given** the shopper scrolls backwards through the deck, **When** cards un-stack in reverse order,
   **Then** the sequence reads the same in reverse and no card flickers between states.

---

### User Story 2 — Every card is complete on its own terms (Priority: P2)

Three of the six brands have a written story; three do not. In the deck, a card without a story is not a card
with a gap in it — it is a shorter, complete card. Nothing on any card is padding, and nothing a card claims is
stronger than what the shop can back.

**Why this priority**: The deck is the draw, but a deck with three visibly unfinished cards in it is the same
defect the owner is complaining about, wearing a new coat.

**Independent Test**: Stop scrolling. Look at each of the six cards at rest, in turn, and check that every area
of each card carries something real. Then check each claim on the card against what that brand's listing
actually contains.

**Acceptance Scenarios**:

1. **Given** a brand with no written story, **When** its card is at rest, **Then** the card shows its mark and
   name at full compositional weight and occupies no space reserved for content it does not have.
2. **Given** any card, **When** it displays a number of products, **Then** that number equals what the
   destination listing shows for the same brand.
3. **Given** a brand whose listing holds nothing currently purchasable, **When** its card is shown, **Then** no
   count is displayed rather than a count that overstates the shop.
4. **Given** all six cards, **When** they are compared side by side, **Then** none is dimmed, greyed, marked
   "coming soon", or otherwise presented as lesser.

---

### User Story 3 — The deck holds up on the smallest screen and lets go on the calmest one (Priority: P3)

The chapter is designed at 360 px and only then widened. On a short phone the topmost card still shows its
mark and its Persian name in full at every point of the sequence. On a device where the shopper has asked for
reduced motion, or where the deck cannot be made to fit, the same six brands appear in the same order as a
composed static stack — the deck's *look*, without its travel — and the homepage remains fully scrollable.

**Why this priority**: This is what feature 007 got wrong and shipped twice-removed to fix. The fallback is not
polish; it is the reason the previous attempt had to be rebuilt.

**Independent Test**: Set the viewport to 360 × 640 and walk the sequence, sampling the position of each card's
label. Then enable reduced motion and reload: the six brands must still be present, in order, each still a
destination, with no scroll travel owned by the chapter.

**Acceptance Scenarios**:

1. **Given** a 360 px wide viewport, **When** the shopper is anywhere within the deck's sequence, **Then** the
   topmost card's mark and name are entirely within the visible area.
2. **Given** reduced motion is requested, **When** the shopper reaches the chapter, **Then** all six brands are
   visible without scrolling through any staged sequence, and every card is still a working destination.
3. **Given** the deck cannot be made to fit at 360 px, **When** the feature is finished, **Then** the static
   stack ships instead and the chapter still reads as a deck — the effect is dropped, the page is not broken.
4. **Given** the shopper reloads the page with the scroll position already inside the chapter, **When** the page
   settles, **Then** the deck shows the state that belongs at that position, not its opening frame.

---

### Edge Cases

- The viewport is shorter than the card (a landscape phone, or a desktop window dragged low): the deck must
  degrade to the static stack rather than clip a card's name.
- The shopper jumps past the chapter with the End key or a hash link mid-sequence: the chapter must release and
  the rest of the page must be reachable.
- A brand's mark fails to render: the card still shows its name and remains a destination; the absence is
  visible rather than papered over.
- The shopper scrolls backwards and forwards through the deck repeatedly: no card accumulates a wrong state, and
  the reading order never changes.
- A brand is later removed from the catalogue: the deck holds whatever number of brands the data supports,
  including fewer than six, without leaving a gap in the stack.
- Print: the chapter renders as the static stack.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chapter MUST present the six brands already approved in feature 004 — Apple, Samsung,
  Xiaomi, Nokia, Realme, TCH — in a single fixed order, and MUST NOT add brands that feature 004 excluded.
- **FR-002**: Each brand MUST occupy one card, and each card MUST present, at minimum, that brand's authentic
  mark and its Persian name.
- **FR-003**: During scrolling, each card MUST hold at the top of the chapter's view while the following card
  slides over it, and the card beneath MUST remain visible as a stacked edge rather than vanishing outright.
- **FR-004**: The stacking MUST read correctly in right-to-left layout: the order of arrival, the overlap
  direction, and the visible stack edge MUST be defined on logical axes and MUST NOT depend on physical left or
  right.
- **FR-005**: The topmost card MUST be a destination to that brand's existing product listing, reachable by a
  single press anywhere on the card.
- **FR-006**: Cards that are not the topmost MUST NOT capture a press intended for the card above them.
- **FR-007**: At 360 px width, the topmost card's mark and Persian name MUST be entirely within the viewport at
  every sampled point of the sequence — zero frames with a clipped label.
- **FR-008**: The chapter's total scroll length MUST be bounded so that the deck cannot consume the page: the
  distance from the chapter's first frame to its release MUST NOT exceed six and a half screen-heights at
  360 px.
- **FR-009**: On release, the chapter MUST return the page to normal scrolling with no residual held layer and
  no jump in position.
- **FR-010**: No card MAY reserve space for content it does not have. Where a brand has no written story, the
  card MUST be composed as a complete, shorter card — this restates feature 004's C5 ("no empty frame") for the
  new layout so the rule cannot be lost in a rebuild.
- **FR-011**: Any product count shown on a card MUST equal the number the same brand's listing displays, and
  MUST be omitted where the listing holds nothing purchasable.
- **FR-012**: All six cards MUST carry equal compositional weight; no card MAY be dimmed, greyed, disabled, or
  labelled as pending.
- **FR-013**: The chapter MUST honour a reduced-motion request by presenting the same six brands, in the same
  order, as a composed static stack with no staged travel, with every card still a destination.
- **FR-014**: The feature MUST ship in one of exactly two states — the deck, or the static stack — and MUST NOT
  ship a partially-fitting deck. If the fit requirement (FR-007) cannot be met at 360 px, the static stack IS
  the delivered feature.
- **FR-015**: A screen-reader and keyboard shopper MUST be able to reach all six brands in the same order, with
  each announced once, and the visual stacking MUST NOT reorder that sequence.
- **FR-016**: Brand imagery MUST stay authentic to what exists: the brand marks already in the shop. This
  feature MUST NOT introduce generated or stock brand photography, in line with feature 004's prohibition and
  Constitution Principle I.
- **FR-017**: The non-moving brand-mark band established in feature 004 MUST remain as it is; this feature
  changes the cards, not that band, and MUST NOT reinstate movement there.
- **FR-018**: The chapter MUST NOT disturb the homepage's tonal ground: the atmosphere progression that feature
  002 anchors to section positions MUST remain correct with the brands chapter occupying a different height.
- **FR-019**: Persian numerals MUST be used for any number rendered on a card.

### Key Entities

- **Brand Card** — one brand's presence in the deck: its mark, its Persian name, optionally a short written
  story, optionally a product count, and its destination listing. Its defining attribute in this feature is its
  position in the stack.
- **Stack Position** — the order in which cards arrive and hold. Distinct from document order only in that it
  must survive reversal (scrolling backwards) and re-entry (reload mid-chapter) unchanged.
- **Brand Story** — a short written line that exists for three of the six brands. Its absence MUST NOT be
  represented visually as an empty area.
- **Product Count** — a claim about the size of a brand's listing. Governed by FR-011; it may be absent, and
  absence is not a defect.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A shopper scrolling the chapter at 360 px sees six cards take the top position in order, each
  overlapping the last, in a single pass with no additional interaction.
- **SC-002**: Sampling the sequence at 360 × 640 yields **zero** frames in which the topmost card's mark or
  Persian name is clipped by the viewport edge.
- **SC-003**: Inspection of all six cards at rest finds **zero** areas of reserved-but-empty space — the defect
  that triggered this rebuild does not survive it.
- **SC-004**: The chapter's scroll length at 360 px is at most six and a half screen-heights, and the rest of
  the homepage below it remains reachable in a normal continuing scroll.
- **SC-005**: With reduced motion enabled, all six brands are present, in order, and each still opens its
  listing — a shopper who never sees the animation loses nothing but the movement.
- **SC-006**: Every number shown on a card matches its destination exactly; no card shows a count for a brand
  with nothing purchasable.
- **SC-007**: The owner, shown the chapter on their own phone, recognises it as the deck they asked for — the
  reference was supplied by name, so matching it is the acceptance test.

## Assumptions

- **The deck replaces the stacked rows.** The owner's instruction names the brands section and a specific
  presentation for it, so the six-row list from feature 004 is the thing being replaced, not extended. The
  brands themselves, their order, their marks and their stories carry over unchanged.
- **A visible stack edge, not full coverage.** "Like a deck of cards" is read as each previous card remaining
  partly visible beneath the arriving one; a card that fully hides its predecessors is a slideshow, and the
  owner pointed at a deck.
- **The topmost card owns the press.** While a card is mid-stack it is not the destination; the card the
  shopper is looking at is. This keeps a single press unambiguous, and preserves feature 004's resolved
  behaviour that the first press navigates.
- **Six cards, in the existing order.** No brand is added, dropped or reordered for the sake of the effect.
- **Counts may simply be absent.** Several of these brands have nothing currently purchasable, so the honest
  default is to omit the number rather than to surface a figure that overstates the shop. This is a narrower
  claim than feature 004 made, and is deliberate.
- **The static stack is a first-class outcome, not a failure state.** Feature 007 established that this
  homepage's pinned geometry does not reliably fit at 360 px; FR-014 exists so that discovering a bad fit ends
  in a shipped feature rather than a rebuild.
- **Data comes from the same place it always has.** Brands, marks, stories and listings are read through the
  existing catalogue seam; this feature adds no data and no new destination.
- **Verification is on a real phone or an exact 360 px viewport.** Judgement of smoothness on the development
  machine is explicitly not part of acceptance — that machine is too weak to answer the question, and a
  measurement taken there would be a false either way.
