# Phase 1 Data Model: Categories Editorial Mosaic

No stored data changes. One field is added to an existing derived model, and the rest of this file is about what
a tile is permitted to claim — which is where the honesty requirements live.

## Sources of truth (read-only)

| Source | Supplies | Notes |
|---|---|---|
| `lib/category-departments.ts` | the department set, order, Persian label, slug, route, and the computed counts | the set is **derived**, not authored: it comes from product *kinds*, because the stored category tree has 11 of 32 categories empty and fuses brand with type |
| `data/hami-products.json` via `lib/catalog.ts` | product counts per kind and per category subtree | Constitution III; measured today as `phone=134, audio=19, charger=10, smartwatch=7, powerbank=7, computer_accessory=5, sim_card=3, car_charger=3, service=1` |
| `public/images/categories/v3/` | the nine 3:4 panels | seven `.jpg` at 896×1200, two `.png` at 1086×1448 |
| `app/(main)/home.css` `--paper` tokens | the light ground | preserved unchanged by this feature (FR-004) |

## Entity: `Department` (existing, one field added)

| Field | Type | Rule | Source |
|---|---|---|---|
| `kind` | enum of nine | one per populated product kind | authored seed |
| `label` | string | Persian, shopper-recognisable name — deliberately not always the stored category name | authored seed |
| `slug` | string | MUST be read from the export, never retyped elsewhere | authored seed |
| `href` | string | the department's existing listing route | derived |
| `reachableCount` | number | what the destination actually holds, computed per request | derived |
| `kindTotal` | number | products of this kind in the export, counted at request time | derived |
| `showsCount` | boolean | `reachableCount === kindTotal` and non-zero — **false wherever the route is a subset of the kind** | derived |
| **`image`** *(new)* | string | filename **with its real extension**, resolved against `public/images/categories/v3/` | authored seed |

**The new field's validation rule, verbatim in intent**: every `image` value MUST resolve to a file that exists
on disk. A wrong extension produces an empty tile, and in a mosaic of photography an empty tile is a hole in the
composition, not a missing icon. This is guarded by a test that reads the real directory — the same discipline
that caught hand-typed slugs silently 404-ing in feature 004.

## Entity: `Tile` (view model — what a tile may claim)

A tile is one department rendered. It may carry exactly three claims, and each has a rule:

| Claim | Permitted when | If the rule fails |
|---|---|---|
| **Photograph** | always; decorative (`alt=""`) while it conveys nothing the label does not | if a future panel carries information (a bundle, a price sticker), it loses `alt=""` — research D5 |
| **Name** | always; live text, never baked into the image | a hard failure — the tile is not a doorway |
| **Count** | only when `showsCount` is true (five of nine today) | show **no number**. Neither over-promising nor understating with a confident small figure is acceptable |

**Prohibited on any tile**: dimming, disabled styling, "coming soon", a placeholder standing in for missing
data, and any count the destination does not display (FR-006, FR-009, FR-019).

## Tier assignment (measured, not chosen)

| Tier | Departments | Why |
|---|---|---|
| Hero (spans full width / 2×2) | گوشی موبایل | 134 products — 13× the next department |
| Medium (spans 2 columns at ≥768) | هدفون و ایرپاد, شارژر و کابل | 19 and 10 |
| Small (one cell) | ساعت هوشمند, پاوربانک, لوازم کامپیوتر, سیم‌کارت, شارژر فندکی, خدمات آنلاین | 7, 7, 5, 3, 3, 1 — within 7:1 of each other, so treated alike |

Small tiles are **not** lesser doorways (FR-006): same label treatment, same scrim, same tap behaviour, and a
minimum width of 148 px at 360 (research D1, corrected from an impossible 164).

## State: what a department does when it empties

| Event | Behaviour | Requirement |
|---|---|---|
| Data refresh leaves a department with no products | the tile is absent and the grid closes up — no gap, no placeholder | FR-015 |
| A department's image file is missing | **build/test fails** before it can reach a shopper | D4 guard |
| A panel fails to load in the browser | the tile keeps its name and remains a link; the missing image stays visibly missing | FR-019 |
| A tenth department is added | the grid absorbs it at every step without a stranded tile | edge case, D2 |

There is no client state in this feature. No selection, no hover-driven position, no gesture, no script — which
is what makes FR-018 (works without scripting) true by construction rather than by testing around a library.

## Relationships

- **Department → Tile**: one to one, in catalogue-weight order (phones first). DOM order = visual order = tab
  order = priority order; RTL does not reorder the tab sequence.
- **Tile → Listing**: exactly one destination per tile, reached by one press anywhere on the tile. No nested
  interactive elements inside a tile.
- **Mosaic → Ground**: the section remains one of the homepage's tonal anchor points, so its height feeds the
  atmosphere progression's existing anchor measurement (FR-020) rather than a new one.

## Out of scope

No change to the department derivation, no new department, no new destination, no product data, no image
encoding conversion (deferred, and named as pre-ship), and no brand mark overlay (the composition closes on
labels alone).
