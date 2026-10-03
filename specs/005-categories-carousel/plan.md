# Implementation Plan: Categories Carousel Presentation

**Branch**: `Hami-v3` (no dedicated branch — `spec.md` records that no `before_specify` hook exists)
**Spec**: [spec.md](./spec.md)
**Date**: 2026-09-22

**Input**: Feature specification from `specs/005-categories-carousel/spec.md`

## Summary

Replace the static category grid in `components/home/CategoryHub.tsx` with a horizontally looping carousel
whose panels are arranged along an arc, dragged with inertia, and snapped to one active panel — while
keeping every label live Persian text and every destination real.

The spec's headline risk is not the arc. It is that the category taxonomy cannot be displayed as stored:
11 of 32 categories are empty and the brand axis is fused into the type axis. The resolved answer to
Question 1 defines the set by what actually has products, and the data has a clean axis the tree does not —
the nine product **kinds**, all populated, covering all 189 products. This plan builds the carousel on that
axis: nine departments, each routed to the one real category that reaches its products, verified against the
export by test rather than by hand.

Second real risk, and it is the reason this plan front-loads it: the reference attaches its wheel and
pointer listeners to the document. On the longest page in this storefront that turns vertical scroll into
carousel movement for anyone whose cursor crosses the section, which is the exact behaviour feature 002
exists to protect. FR-016…FR-020 are treated here as the primary engineering constraint, not as polish.

## Technical Context

**Language/Version**: TypeScript 5.5.4, React 19.2.8, Next.js 15.5.25 App Router

**Primary Dependencies**: Tailwind CSS 3.4.19 for structure; `lucide-react` already present. **No new
package** — and the ceiling that constraint refers to already contains the tool this feature needs:
`embla-carousel-react@8.6.0` is installed and already running on this same page in RTL
(`components/home/NewArrivals.tsx:22`), so drag, inertia, snapping and looping are borrowed rather than
written, and only the arc is new code. `gsap@3.15` and `motion@13` are also installed and deliberately not
used here — see `research.md` D2 for why a document-level scroll tool is the wrong guest in a section whose
first requirement is to never touch page scroll.

**Storage**: `data/hami-products.json` read through `lib/catalog.ts`. No database, no new endpoint
(Constitution III).

**Testing**: Vitest 4.1.10, `environment: "node"` — **no DOM harness exists and none is being added**
(`002/research.md` D6). Everything asserted in tests is therefore pure derivation: the department table, its
counts, its routes, its label shapes. Behaviour — drag, snap, focus order, arc geometry — is verified in a
real browser at 360px and 1280px, and those checks are written as runnable scripts under
`specs/005-categories-carousel/tools/` the way feature 002 did, not as unit tests.

**Target Platform**: Browser. **Mobile is the primary design case** (FR-037, and the standing mobile-first
instruction from feature 004); the desktop presentation derives from the phone presentation.

**Project Type**: Single Next.js app, storefront frontend.

**Performance Goals**: 60fps on a mid-range phone while dragging; no measurable change to the rest of the
page's responsiveness with the section present versus removed (FR-020, SC-009).

**Constraints**: Must not capture vertical scroll (FR-016); must not run off-screen (FR-019); must degrade
to a complete static list (FR-021); Persian RTL throughout (Constitution II); no fabricated artwork
(Constitution I).

**Scale/Scope**: One homepage section, nine panels, one client component, one pure derivation module, three
new SVG badges. No route changes, no API changes, no data changes.

## Constitution Check

Gates from `.specify/memory/constitution.md` v1.1.0, evaluated before Phase 0.

| Principle | Status | Note |
|---|---|---|
| I. Honest Interface | **PASS, with one accepted limitation** | The eight badges on disk are authentic, purpose-made category artwork. Three departments have none and get new artwork (FR-033), which is in scope; nothing is filled with stock imagery. The phones department routes to `موبایل`, which reaches 8 of 134 phones and of those 8 only one is purchasable — see D1. It is an under-representation, not a false statement: every product the landing page shows is a real phone the shop sells. Recorded as a known ceiling, not smoothed over. |
| II. Persian RTL by Default | **PASS** | Guaranteed by construction: labels are live text nodes in an `dir="rtl"` document, geometry uses `inline-start`/`inline-end`, arrow keys map to reading order rather than screen direction (FR-028), counts use Persian digits. |
| III. Static Data Seam | **PASS** | `lib/catalog.ts` and `app/api/` are not modified. The department table is derived by reading the export, the same pattern feature 004 established with `lib/shop-category-tiles.ts`. |
| IV. Luxury Is the Quality Bar | **PASS — delegated, not escalated** | FR-035/FR-036 hand colour, typeface, weight, panel treatment, arc curvature and motion values to this implementation. They are decided in `research.md` D5 and D6 and recorded there, not raised as questions. |

**No gate violations. Complexity Tracking stays empty.**

Re-check after Phase 1: unchanged. The design adds no dependency, no endpoint and no fabricated data, and
the three delegated visual systems are specified in `research.md` rather than deferred to implementation
discretion.

## Project Structure

### Documentation (this feature)

```text
specs/005-categories-carousel/
├── spec.md                                   # input, unchanged
├── plan.md                                   # this file
├── research.md                               # Phase 0 — D1…D8
├── data-model.md                             # Phase 1 — Department, PanelGeometry, DragState
├── contracts/category-carousel-behaviour.md  # Phase 1 — the browser-observable contract
└── quickstart.md                             # Phase 1 — how to run and prove it
```

`tasks.md` is Phase 2 output and is produced by `/speckit-tasks`, not here.

### Source Code

```text
app/(main)/
├── page.tsx                     # mount point: replaces <CategoryHub /> in place
└── home.css                     # the section's styles, next to the other home blocks

components/home/
├── CategoryHub.tsx              # REWRITTEN — server component: owns the department table and renders
│                                # the static fallback form (FR-021) as its own SSR output
├── CategoryCarousel.tsx         # NEW client component — Embla wiring, arc transforms, keyboard, ARIA state
└── category-carousel.css        # NEW — geometry custom properties, panel states, reduced-motion

lib/
└── category-departments.ts      # NEW pure module — the nine departments, derived from the export

public/brand/categories/
├── computer-accessory.svg       # NEW — FR-033, one of three kinds with no artwork
├── sim-card.svg                 # NEW
└── car-charger.svg              # NEW

tests/unit/
└── category-departments.test.ts # NEW — the drift guard: routes resolve, counts match, no brand-shaped route
```

**Structure decision**: the carousel is one client island inside a server component that already exists.
`CategoryHub` keeps its identity as the categories surface and keeps rendering a complete, usable,
animation-free section on the server; the client component layers the arc onto that same DOM rather than
replacing it. That single choice satisfies FR-021 (the fallback is the default), removes any need for a
second component tree, and means a hydration failure degrades to a working category list instead of to a
blank band.

No file under `data/`, `app/api/`, or `prisma/` is touched.

## Complexity Tracking

> No violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |

## Key Decisions (summary — full reasoning in research.md)

- **D1** — Nine departments, one per populated product **kind**, each routed to the single non-brand
  category that reaches its products. Derived from data, pinned by test.
- **D2** — Build on the already-installed `embla-carousel-react`: it owns drag, inertia, snap, loop and RTL
  scroll physics, and it structurally cannot reproduce the reference's document-level scroll capture. Only
  the arc, the keyboard bindings and the ARIA state are written here. This decision was reversed mid-planning
  on evidence; `research.md` D2 records the error, the correction, and the ScrollSmoother fact that follows.
- **D3** — The arc is a per-panel transform derived from Embla's own scroll progress, not a canvas, not a 3D
  library, not JS layout per frame.
- **D4** — One custom property written per slide, on Embla's frame tick. No second animation loop.
- **D5** — Motion stops off-screen by tearing Embla down in an `IntersectionObserver`; there is no entrance
  animation to replay.
- **D6** — Visual direction decided here under FR-035: a dark lacquer stage, champagne label for the active
  panel, muted cream for the rest, one shared duration scale with feature 004's rows (FR-038).
- **D7** — Reduced motion keeps every destination and drops the travel, matching 004's rule exactly.
- **D8** — No new dependency, and no DOM test harness.
