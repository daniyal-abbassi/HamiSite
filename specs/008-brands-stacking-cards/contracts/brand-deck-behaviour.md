# Contract: Brand Deck Behaviour

**Surface**: `components/home/BrandShowcase.tsx` + `components/home/BrandRows.tsx` on `app/(main)/page.tsx`
**Spec**: [../spec.md](../spec.md) · **Decisions**: [../research.md](../research.md) · **Model**: [../data-model.md](../data-model.md)

This is the acceptance contract for the section. A clause is satisfied only by the stated evidence — "looks
right on my screen" is not evidence, and the last two rebuilds of this section both stopped at that sentence.

---

### C1 — The deck stacks in one direction, six times

As the shopper scrolls, each of the six cards must reach the top of the chapter's view and hold there while the
next card slides over it. Five cards behind the active one must remain visible as a stacked edge.

**Evidence**: a 360 × 640 walk of the sequence, sampled at evenly spaced scroll positions, showing six distinct
cards occupying the top position in source order.

*Rejects*: a grid, a carousel, a horizontal scroller, or a deck where each card fully covers its predecessors
(that is a slideshow — see research D3).

---

### C2 — The active card's identity is never cropped

At every sampled point, the topmost card's mark and its Persian name must be **entirely inside the viewport**.
Zero frames with a clipped label.

**Evidence**: the same walk, recording each label's bounding rect against the viewport rect. Any sample where
`bottom > viewport height` or `top < 0` fails the clause.

*Rejects*: sizing cards from ambition. This clause is the gate in research D2 and it is measured before
styling is signed off, not after.

---

### C3 — One press, one destination, and it is the card you are looking at

The topmost card navigates to its brand's listing on a single press anywhere on it. A recessed card must not
capture that press.

**Evidence**: with the deck mid-sequence, press the visible top card and confirm the route; then confirm a
recessed card's edge does not navigate to the wrong brand.

*Rejects*: the two-tap gesture, and any affordance that only works for some brands.

---

### C4 — No card reserves space it cannot fill

Three of the six brands have a written story; three do not. A card without a story must be a complete, shorter
card — no empty band, no placeholder, no dimming, no "coming soon".

**Evidence**: inspect all six resting states. Any area of a card that contains nothing and is not accounted for
by padding fails.

*Why this is restated*: feature 004's contract contained this rule verbatim ("no empty frame"), its task was
marked complete, and the shipped rows carried a fixed 44 px band that half the brands could never fill. A rule
that lives only in a closed spec does not survive a rebuild — this is that rule, in the new layout's terms.

---

### C5 — A number on a card is a promise the listing keeps

Any count shown must equal what the destination lists, and must be **absent** where the brand has nothing
purchasable.

**Evidence**: compare each card's number against its destination, and against `data/hami-products.json`
purchasability. Two of the six brands currently have zero purchasable products and must show no number.

*Rejects*: showing the total catalogue count, or showing zero as a discouraging figure.

---

### C6 — Nothing above the deck covers it, and nothing in it escapes upward

Cards stack among themselves and must never paint over the mobile dock or the header.

**Evidence**: scroll the deck with the dock visible at 360 px and with the header in place at 1280 px; the deck
must stay beneath both.

*Why*: `.wrap` already caps its descendants below `z-40`/`z-50`. The deck creates its stacking context on the
section (research D6) so card z-indexes cannot reach past that ceiling.

---

### C7 — The tonal ground still reads correctly

The brands chapter is an anchor of the homepage's atmosphere progression (stage `shelves`). Its new height moves
where that stage begins, and the ground must still be right.

**Evidence**: the existing `tests/unit/atmosphere-progression.test.ts` sweep passes unchanged, and the section
list still accounts for every rendered homepage section. No anchor is renamed or dropped.

---

### C8 — Reduced motion gets the same deck, without the travel

With `prefers-reduced-motion: reduce`, and in print, all six brands appear in the same order as a composed
static stack, each still a destination, with no scroll length owned by the effect.

**Evidence**: reload with reduced motion emulated; confirm six cards, source order, working destinations, and no
sticky offsets applied.

---

### C9 — The deck survives the boring ways of entering a page

Reload with the scroll position already inside the chapter, return via back/forward, and jump past it with the
End key: each must land in the state that belongs at that position, with no stuck layer and no jump.

**Evidence**: three explicit runs in the quickstart, each with what was on screen recorded.

*Why this is a clause*: these are the cases feature 007 had to hand-build around a pinned stage, and two of
them were wrong. With sticky-in-flow they should be free — this clause exists to prove that rather than assume
it.

---

## Non-negotiables inherited, not re-decided

- **No generated or stock brand photography** (Constitution I; feature 004 FR-026/FR-027). The six authentic
  marks are the only brand imagery.
- **The non-moving brand-mark band stays non-moving** (feature 004 FR-021, spec FR-017). This feature changes
  the cards.
- **Persian numerals** for every number on a card (Constitution II).
- **Logical CSS properties only** — no physical `top`/`left`/`right` in the deck (Constitution II, research D8).
