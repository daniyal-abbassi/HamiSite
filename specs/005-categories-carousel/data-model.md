# Phase 1 Data Model: Categories Carousel

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-09-22

Four entities. Three are pure data that exist on the server and never enter the client bundle as anything
but a serialised array; one is transient client state that never round-trips to the server. Nothing here is
persisted — the shopper's position lives for the visit only (FR-015).

---

## Department

One panel's worth of truth. Derived from the export, not authored.

| Field | Type | Source | Rule |
|---|---|---|---|
| `kind` | the 9 populated `kind` values | `data/hami-products.json` → `products[].kind` | The identity of the department. Never a category id — the tree conflates brand with type (spec, "Bad news"). |
| `label` | Persian string | authored in `lib/category-departments.ts` | FR-006: the name a shopper recognises, not the internal label. `computer_accessory` is **not** «تجهیزات کامپیوتر و لبتاب» verbatim — the stored name misspells لپ‌تاب. |
| `slug` | category slug | authored, **verified by test** | `research.md` D1. Must resolve to a real category and reach ≥1 product. |
| `categoryId` | number | resolved from `slug` through `lib/catalog.ts` | Never authored. Resolved at derivation time so a re-keyed export is caught. |
| `href` | string | `/shop?category=<slug>` | The existing route (spec Assumptions: "adds no new destination type"). |
| `badge` | `/brand/categories/*.svg` path or `null` | six exist on disk; three are new work | FR-033: authentic artwork or **none**. `null` renders a labelled text panel, never a placeholder. |
| `productCount` | number or `null` | measured at derivation | Persian digits when shown (FR-025). **`phone` is always `null`** — see the honesty rule below. |
| `reachableCount` | number | measured | What the route actually returns. Shown nowhere; it exists so the drift test can compare it to `productCount`. |

**Validation, enforced by `tests/unit/category-departments.test.ts`:**

1. Exactly nine departments, one per populated `kind`, and their `productCount` totals sum to 189.
2. Every `slug` resolves to a category that exists in the export.
3. Every route reaches ≥ 1 product — FR-002, SC-002, "zero dead doors".
4. No route category's name matches a name in `data.brands`, and `آیفون-استوک` is additionally on an
   explicit deny list because "آیفون" is not among the 39 brand names and would otherwise pass check 4.
   This is FR-004, and `research.md` D1 records why the obvious implementations of it both fail.
5. No two departments share a `slug` — FR-003's duplicate rule, structurally.
6. `reachableCount === productCount` for every department **except** `phone`, `charger` and `powerbank`,
   which are recorded as 8/134, 9/10 and 6/7. A new gap fails the test.

**The count-visibility rule (FR-005).** `productCount` may be displayed only where it equals
`reachableCount`. The phones department is the case that forces this: 134 phones exist, the route holds 8,
of which **1 is purchasable**. A panel reading «۱۳۴ گوشی» would promise a listing it does not deliver, and
Principle I has no exception path. So `phone.productCount` is `null` by rule, not by omission, and the
department is named and shown without a number.

---

## CarouselState

Client-only, and mostly **owned by Embla** — which is the point of `research.md` D2, and why there is so
little state here. The section models what it announces and what it persists. The physics in between belong
to the library that already ships in this project.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `selectedScrollSnap` | integer `0…8` | Embla | The active panel. Exactly one, always — Embla snaps and cannot rest between two (A1, A3). Read, never set directly; movement goes through `scrollTo()`. |
| `scrollProgress` | 0…1 | Embla | The input to the arc, read on Embla's `scroll` event and converted to per-slide distances (D3, D4). |
| `arcOffset[i]` | number, panel units | derived each frame | `i − (progress × (n − 1))`, wrapped to the shortest arc through ±4 of 9 panels. Written as one custom property per slide; **never held in React state**, because a per-frame `setState` is precisely FR-020's failure mode. |
| `live` | boolean | this section | Whether Embla is instantiated. Flipped by the `IntersectionObserver`; `false` means no scroll watch, no resize interpreter, no transition (FR-019). |
| `restoredIndex` | integer `0…8` | this section | The only thing here that survives anything (FR-015). |

**Vertical gesture intent is not modelled at all.** Embla claims only its own axis, binds nothing outside its
viewport node, and ships no wheel handler in the installed dependency set — so there is no intent state to
get wrong, and FR-016, FR-018, I2 and I4 are structural guarantees rather than code paths to be tested.
`isMoving` is likewise absent: Embla's own `select`/`settle` events carry it.

**Derived, never stored:** `zIndex`, rotation, scale and dim for each panel are functions of `arcOffset[i]`.
Storing per-panel state is what makes a carousel's arc drift out of sync with its own track.

**Persistence (FR-015).** `restoredIndex` survives the shopper browsing the rest of the page and is restored
on return within the same visit — including across the `destroy()`/re-init cycle at a `live` boundary, which
is exactly where a carousel would otherwise forget. Held in a module-scoped variable in the client component
tree, not `localStorage` — a new page load legitimately starts at panel 1, and `localStorage` would make a
returning shopper's carousel disagree with the server-rendered first frame.

---

## PanelGeometry

The mapping from an offset to something drawn. Pure, and expressed as CSS custom properties rather than JS
objects, so it can be unit-tested as a formula and applied by the compositor.

```
offset(i) = i − (progress × (n − 1)), wrapped to the shortest arc through ±4 of 9 panels
rotateY   = −offset × bend            (sign follows the inline axis, not the physical one)
scale     = 1 − min(|offset|, 3) × depth
dim       = |offset| × falloff
zIndex    = 9 − min(|offset|, 4)
```

**There is no `translate` term, and that absence is load-bearing.** Embla's track already moves the slides;
adding a per-panel `translate` derived from the same progress would apply the motion twice and the arc would
run ahead of the drag it is attached to. Only the *non-translational* parts of the arc are layered on. Where
a wider spread is needed, it comes from Embla's own `align`/slide sizing, not from a second offset.

`bend`, `depth`, `falloff` are authored values (`research.md` D6), resolved against the 360px case first per
FR-037, with the desktop presentation deriving by widening the slide basis so more edge panels show.

**Why the wrap is shortest-arc:** with nine panels and a visible span of five, an unwrapped offset would send
three panels the long way around during a loop transition, and FR-012 requires the loop neither skip nor
strand a panel. Embla's `loop: true` handles the track's wraparound; this is the arc agreeing with it, and it
is the one piece of the geometry that has to be checked against Embla's own wrap boundaries rather than
assumed.

**Edge cases carried into geometry, from the spec:** fewer than four visible on a very narrow screen
(`step` clamps to a minimum, and panels beyond the viewport are `visibility: hidden` but still focusable);
very wide screens (the arc stops growing at a max `step` rather than spreading until the edges look empty);
rotation mid-drag (the gesture is released to `snap` immediately, geometry recomputed, no crash); browser
zoom (geometry is in `em`-derived custom properties so it scales with text rather than against it).

---

## FallbackPresentation

Not a runtime mode. The server-rendered DOM that `CategoryHub` produces before any client component exists,
which the client component then animates.

- All nine departments present as a plain vertical list, each a real link with its live-text label.
- No arc, no motion, no observer, no script.
- Identical destinations to the carousel, so FR-021's "complete, static, fully usable" is the default
  rather than a branch, and a failure to hydrate degrades to it instead of to an empty band.

This choice is why there is no `capabilities` probe, no WebGL check, and no error boundary in this design:
the fallback is the base.

---

## Relationships

```
data/hami-products.json ──read──▶ lib/catalog.ts ──▶ lib/category-departments.ts
                                                                │
                                                          Department[]
                                                                │
                                        ┌───────────────────────┴──────────────────────┐
                                        ▼                                              ▼
                              CategoryHub (server)                        CategoryCarousel (client)
                              renders FallbackPresentation                 owns CarouselState,
                              + inert markup for the arc;                  applies PanelGeometry,
                              hydrates into the carousel                   handles intent and drag
```

`app/(main)/page.tsx` mounts `CategoryHub` where it mounts it today. No route, API or database entity is
added, and no entity here is written anywhere.
