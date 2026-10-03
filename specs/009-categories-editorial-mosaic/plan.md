# Implementation Plan: Categories Editorial Mosaic

**Branch**: `009-categories-editorial-mosaic` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-categories-editorial-mosaic/spec.md`

## Summary

Replace the homepage's curved category carousel with a static editorial mosaic: nine department tiles on the
existing light ground, sized by measured catalogue weight, each a full-bleed 3:4 panel with a live text label on
a scrim plate. All nine are visible at 360 px in plain vertical scroll, and the chapter needs no scripting.

The mechanism is a CSS grid with spanning tiles — no carousel library, no gesture, no JavaScript. The work is
therefore mostly **deletion plus verification**: two components and one stylesheet go away, one `image` field is
added to the department model, and the surviving claims (contrast, count honesty, tile size, keyboard path) are
each checked against a number rather than against taste.

**A spec defect was found during planning and is corrected below before anything is built**: FR-005's
"smallest tile ≥164 px at 360" is arithmetically impossible. The container has `padding: 1.5rem`
(`tailwind.config.ts:38`), so content width at 360 is **312 px**; two columns with the chosen 12 px gap yield
**150 px** each. 164 px would need a negative gutter. The requirement now reads ≥148 px, which the layout
actually delivers, and the change is recorded in research.md D1 rather than silently absorbed.

## Technical Context

**Language/Version**: TypeScript 5.x on Node 24 (Next.js 15.5 App Router, React 19.2)

**Primary Dependencies**: Tailwind CSS 3.4 for the grid; `next/image` for the panels; the existing
`lib/category-departments.ts` derivation. **No new dependency.** `embla-carousel-react` stays in
`package.json` — it has a second consumer in `components/home/NewArrivals.tsx` — but it leaves the homepage
categories path when the carousel component is deleted.

**Storage**: `data/hami-products.json` through `lib/catalog.ts` (Constitution III). The nine departments and
their counts are derived at request time; only the `image` filename is authored, and a new test asserts each
path exists on disk.

**Testing**: Vitest, **node environment, no DOM**. `npm run test:unit` (the frontend config, which omits
`setupFiles`). Geometry and contrast are verified in a real browser at exact widths.

**Target platform**: Mobile browsers first at 360 px; 768 and 1280 as designed steps.

**Project Type**: Single Next.js app, frontend-only feature.

**Performance goals**: No cumulative layout shift from the panels — every `<img>` carries intrinsic dimensions
plus `aspect-ratio`. No motion budget consumed: the chapter is static by design. **Image encoding is explicitly
out of scope** (see Complexity Tracking / deferred work), but the two 1.2–1.5 MB PNGs are named as the reason
the chapter must not be the page's Largest Contentful Paint element.

**Constraints**: FR-001 (all nine visible at 360), FR-005 (smallest tile ≥148 px — corrected), FR-008 (label
contrast ≥4.5:1, currently measuring 16.8:1 minimum), FR-009 (count honesty), FR-014 (the carousel is removed,
not kept alongside), FR-018 (works without scripting), FR-020 (the tonal ground's anchor for this section still
reads correctly).

**Scale/Scope**: One section on one page. Nine tiles. Two components deleted, one stylesheet deleted, one field
added to a model, one new test file. Four of those files are currently locked by another agent — see the
lock-contingency section, which is not hypothetical.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| **I. Honest Interface** | ✅ PASS | Counts appear only where `showsCount` is already computed true — five of nine departments, and the phone, charger and powerbank tiles show **no number** rather than a subset count. The 134:1 size hierarchy is measured from the export, not asserted. Missing imagery stays visibly missing (`alt=""` only while the photo is decorative; the rule "if the image gains content, it loses `alt=""`" is carried into the contract). |
| **II. Persian RTL by Default** | ✅ PASS | Grid placement on logical axes; the composition leads from the right; tab order follows DOM order, which RTL does not reorder. Persian digits wherever they already appear. |
| **III. Static Data Seam** | ✅ PASS | Departments and counts keep coming from `data/*.json` through `lib/catalog.ts`. The added `image` field is authored in the same place `slug` and `badge` already are, and is guarded by a test that every path resolves on disk — the same class of defect that made hand-written slugs silently 404 in feature 004. |
| **IV. Luxury is the quality bar** | ✅ PASS | This is the explicit anti-uniform-grid move: deliberate asymmetry, one hero panel, real photography, and a light ground kept because it works. Restraint is honoured by deleting machinery rather than adding it — the arc, the veil, the roving tabindex and the mount patch all go away with their reasons. |
| Constraint: prefer editing over new abstraction | ✅ PASS | No new component. Two are deleted. The one new file is a test. |
| Definition of Done | ⚠️ **CONDITIONAL** | `typecheck`, `build`, browser verification at both widths, RTL correctness and no fabricated data are all in scope and in quickstart.md. **The DoD cannot be met while four of the in-scope files are locked by another agent** — see the contingency below, which is a plan requirement, not a risk note. |

**Gate result: no principle violations.** The one conditional is an ownership problem, not a design one, and it
is handled explicitly rather than assumed away.

### Post-design re-check (after Phase 0 and Phase 1)

Still no violations. Two things changed shape during design and are worth stating: the corrected tile floor
(D1) tightened FR-005 rather than loosening it, and the audit of the pre-existing CSS candidate (D8) found it
**matches** the spec's intent on every point checked — spanning hero, three breakpoints, focus-visible ring,
forced-colors border, reduced-motion block — so no new violation entered through that door. The `alt=""`
decision (D5) is the one place where a WCAG rule is being applied by argument rather than by default, and the
argument is recorded in the contract so a reviewer can attack it.

## Project Structure

### Documentation (this feature)

```text
specs/009-categories-editorial-mosaic/
├── plan.md                          # this file
├── spec.md                          # requirement source (FR-005 corrected during planning)
├── research.md                      # Phase 0 — eight decisions, incl. the spec defect and the lock contingency
├── data-model.md                    # Phase 1 — the department, its image field, and what a tile may claim
├── quickstart.md                    # Phase 1 — how to run it and how to prove all nine are really visible
├── checklists/requirements.md       # spec-quality gate (passed)
└── contracts/
    └── category-mosaic.md           # Phase 1 — M1…M8, the acceptance contract
```

`tasks.md` is Phase 2 output from `/speckit-tasks` and is **not** created here.

### Source code (repository root)

```text
lib/
└── category-departments.ts          # add `image` to the seed and to Department (the only model change)

components/home/
├── CategoryHub.tsx                  # becomes the mosaic markup (ul > li > a, per the markup contract)
├── CategoryCarousel.tsx             # DELETE — the swipe/tilt presentation is replaced, not kept
└── category-carousel.css            # DELETE

app/(main)/
├── home.css                         # the .cat-mosaic block (≈165 lines already present, unverified)
│                                    #   + delete the band-paper mount patch it existed to serve
└── page.tsx                         # unchanged: <CategoryHub /> stays mounted where it is

tests/unit/
├── category-departments.test.ts     # extend: every image path must exist on disk
└── category-mosaic.test.ts          # new: the claims a tile may make, provable without a DOM

public/images/categories/v3/         # nine panels, already generated, read-only here
```

**Structure decision**: the mosaic lives in `CategoryHub.tsx`, which already owns the section, its heading and
the "view all" link. The carousel component and its stylesheet are deleted outright rather than left unused —
an unreferenced component is how the next agent finds the old design and wonders whether it was deliberate.

### Lock contingency (not a risk note — a requirement of this plan)

`qoder-ide` holds locks on `CategoryCarousel.tsx`, `category-carousel.css`, `CategoryHub.tsx`,
`lib/category-departments.ts`, `tests/unit/category-departments.test.ts`, `public/images/categories` and
`specs/006-category-showcase`, dated 2026-09-24, with its last heartbeat saying it is parked. A REQUEST was
posted on `.agent-pair/BOARD.md`. **Four of the seven files this feature must touch are in that set**, so the
plan states what happens if they never clear:

1. **Do not edit a locked file and do not delete its lock.** This is AGENTS.md rule 2 and it is not negotiable,
   including when the holder has been silent for two days.
2. Work that needs no lock proceeds first: the `.cat-mosaic` CSS block in `app/(main)/home.css`, and the new
   `tests/unit/category-mosaic.test.ts`.
3. The feature **stops** at that point with the carousel still mounted. A half-finished mosaic is not a delivery;
   a chapter still showing the old presentation is a chapter that still works.
4. Escalation to the human is the only path past step 3, which is why this section exists in the plan rather
   than in a comment.

## Complexity Tracking

> No constitution violations. This section records deferred work instead.

| Deferred | Why deferred | Where it lands |
|---|---|---|
| WebP/AVIF conversion of the nine panels (two PNGs at 1.2–1.5 MB) | A layout decision must not be blocked on an encoding decision, and the owner's acceptance question is about the mosaic. It is a **pre-ship** item, not a nice-to-have. | New feature or a task in the next performance pass |
| Removing `embla-carousel-react` from `package.json` | It still has a live consumer in `components/home/NewArrivals.tsx`. Only the categories usage ends here. | Only after that component is rebuilt |
| Retiring feature 005's carousel contracts in `specs/005-categories-carousel/` | Governance act for the owner, not a refactor an agent performs quietly. Flagged in the spec's scope and in quickstart.md. | Owner decision |
| The cream `#F0ECE9` transparent brand mark | The chosen composition closes on labels alone; the overlay is optional by design. | Nice-to-have, off the critical path |
