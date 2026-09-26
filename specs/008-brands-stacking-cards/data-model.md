# Phase 1 Data Model: Brands Stacking-Card Deck

This feature adds no stored data. It defines one **view model** — what a card is allowed to claim — and one
**state machine** that is purely visual. Both are derived from sources that already exist, which is the
constraint that keeps the deck honest.

## Sources of truth (read-only)

| Source | Supplies | Notes |
|---|---|---|
| `lib/content/home.ts` → brand list | the six brands, their order, Persian names, Latin marks | feature 004's resolved set: Apple, Samsung, Xiaomi, Nokia, Realme, TCH |
| `lib/content/home.ts:93` → `brandStoriesByName` | the one-line story, for the three brands that have one | absence is a normal state, not a gap |
| `lib/brand-counts.ts` | the count a card may show | computed at request time from the export; never authored by hand |
| `components/home/BrandMarks.tsx:71-94` | the six authentic inline SVG marks | the only brand imagery permitted (FR-016) |
| `data/hami-products.json` via `lib/catalog.ts` | purchasability behind the count | Constitution III: no database, no API round-trip |

## Entity: `BrandCard`

The unit of the deck. One per brand, six total.

| Field | Type | Rule | Source |
|---|---|---|---|
| `name` | string | the stored brand name; identity key | brand list |
| `label` | string | Persian display name, non-empty | brand list |
| `mark` | node | the authentic SVG for this brand | `BrandMarks.tsx` |
| `story` | string \| absent | one line; present for exactly three brands today | `brandStoriesByName` |
| `count` | number \| absent | **only present when the destination lists purchasable products** (D5) | `lib/brand-counts.ts` |
| `countLabel` | string | `count` rendered in Persian numerals (FR-019) | derived |
| `href` | string | the brand's existing listing route | brand list |
| `stackIndex` | 0…5 | position in the deck; sets the sticky offset and paint order | derived from order |
| `stickyOffset` | length | `stackIndex × 16px` (D3) | derived |
| `zIndex` | integer | `stackIndex + 1`, inside the section's stacking context (D6) | derived |

**Validation rules — each is assertable in a node-environment unit test, no DOM needed:**

1. Exactly six cards, in the source order, with no brand added or removed (FR-001).
2. Every card has `mark`, `label` and `href`. Nothing else is mandatory.
3. A card with no `story` has **no placeholder** for one: the field is absent, not empty-string, not `null`
   rendered as a gap (FR-010).
4. `count` is present only where the brand's own destination would list at least one purchasable product; the
   number equals what that destination displays (FR-011).
5. `stackIndex` is unique and dense over `0…n-1` — no gaps if the brand set ever shrinks (edge case: a brand
   removed from the catalogue).
6. No card carries any image path that is not one of the six marks (FR-016).

## State machine: card presentation

Three states. They are **visual only** — the DOM order, the destinations and the accessible name never change
with them, which is what keeps FR-015 true.

```
   queued ──(scroll reaches its offset)──▶ topmost ──(next card arrives)──▶ recessed
      ▲                                      │                                │
      └──────────(scroll backwards)──────────┘────────(scroll backwards)──────┘
```

| State | What it means | Visual contract |
|---|---|---|
| `queued` | below the deck, not yet reached | in normal flow, nothing pinned |
| `topmost` | the card the shopper is looking at | at `stickyOffset`; mark and Persian name **entirely within the viewport** (FR-007); it is the press target (FR-005) |
| `recessed` | covered by a later card | shows a 16 px edge (D3); **must not capture a press** (FR-006); must not be the tab stop that steals focus from the top card |

**Transitions are driven by scroll position alone.** There is no timer, no animation queue, and no state stored
in JavaScript — which is why reload, back/forward, End-key jumps and reverse scrolling all land correctly
without a line of code (D1).

**Static-stack mode** (reduced motion, print, or the FR-014 fallback): `topmost` and `recessed` do not exist.
Every card is `queued`, laid out in a column with a normal gap. All six remain destinations.

## Relationship to the rest of the page

| Coupling | Direction | Consequence |
|---|---|---|
| `app/(main)/page.tsx` mount | unchanged | the section keeps its position and its `id="brands"` |
| `lib/atmosphere/progression.ts` | the brands chapter is a **ground anchor** (stage `shelves`) | the chapter's new height moves where that stage begins. Anchors are measured from the DOM at runtime, so this is correct automatically — but the unit sweep over `HOMEPAGE_SECTIONS` must still pass unchanged (FR-018, contract C7) |
| `components/home/BrandTicker.tsx` | none | it stays non-moving; FR-017 keeps it out of scope |
| mobile dock (`z-40`) and header (`z-50`) | the section sits under the existing `.wrap` ceiling | cards must not paint above either (D6) |

## Out of scope

No new brand, no new route, no new field in `data/`, no product photography, no change to the catalogue seam,
no change to the ticker, and no persisted notion of which card was last viewed.
