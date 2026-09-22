# Implementation Plan: Scroll-Driven Atmosphere and Scroll Feel

**Branch**: `002-scroll-atmosphere` (work continues on `Hami-v3` — no dedicated branch, no `before_specify` hook) | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-scroll-atmosphere/spec.md`

## Summary

The homepage ground becomes a designed tonal progression that follows the shopper through the page's
sections, while their own scrolling stays completely native (Resolved Q1 = A). The mechanism is one
fixed, body-level layer whose colour is driven by a single normalized scroll progress value written to a
CSS custom property — no scroll library, no easing of the shopper's input, and no animation running
while the page is not visible.

The binding constraint is that Q2 = C leaves the existing five-glow field exactly as it is, while FR-005
requires the result to read **calmer** than today. Those pull against each other, and the plan resolves
them by refusing to add light: the new layer only shifts the ground's overall value and hue *within* the
band the existing field already occupies. It moves the room darker and warmer as the shopper descends; it
does not install a second set of lamps. See [research.md](./research.md) D1 and the contradiction
recorded in the Complexity Tracking table.

## Technical Context

**Language/Version**: TypeScript 5.5.4, React 19.2.8, Next.js 15.5.25 App Router

**Primary Dependencies**: nothing new. GSAP 3.15, `motion` and `embla-carousel-react` are installed and
**deliberately not used here** — see research.md D2. Tailwind 3.4.19 supplies the token scale.

**Storage**: N/A. This feature changes no data and touches no seam (Constitution III is not engaged).

**Testing**: Vitest 4.1.10 with `environment: "node"` — no DOM harness exists and none is added
(research.md D6, same decision as 004/D6). Anything visual is verified in a real browser through the
connected `browser-use` MCP plus scripted Playwright runs, which is the only way to satisfy SC-004
(contrast at every scroll increment) and SC-009/SC-010.

**Target Platform**: the homepage, mobile-first at 360px up, on mid-range Android Chrome and desktop
Chromium/Safari/Firefox. RTL (`lang="fa"`, `dir="rtl"`) is the primary document direction.

**Project Type**: web application (single Next.js app; this feature is frontend-only)

**Performance Goals**: 60fps scroll with the effect active on a 4× CPU-throttled mid-range phone; zero
main-thread layout work per scroll frame; the page no slower to reach or interact with than today
(FR-014, SC-006).

**Constraints**:
- The shopper's own scrolling MUST stay native — no `preventDefault`, no wheel/touch interception, no
  substituted scroll position (Q1 = A, FR-010 … FR-013).
- `html { scroll-behavior: smooth }` already exists and in-page anchor animation must keep working
  (FR-026).
- **A transformed ancestor captures `position: fixed` and `background-attachment: fixed`.** Every
  homepage section is wrapped in `Reveal`, which animates `transform: translateY(26px)`. This is already
  recorded once in `app/globals.css` (the tray-field grid note, lines 280-297) and it is the single
  hardest constraint here: the ground layer cannot live inside `main`. See research.md D3.
- The horizontal-overflow trap: this page has had a horizontal scrollbar from sideways bleed three
  separate times, each documented. Any new full-bleed layer must be clipped on the inline axis.

**Scale/Scope**: one page, eleven sections plus header and footer. Roughly: one new component, one new
hook, one new stylesheet block, and a measured contrast harness.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Note |
|---|---|---|
| **I. Honest Interface** | Pass | The ground carries no information. FR-019 and the "effect is decorative, never load-bearing" assumption are enforced by a contract clause that no state may be expressed *only* in the ground. |
| **II. Persian RTL by Default** | Pass with a real obligation | The progression is direction-agnostic, but scroll progress on an RTL document is **not** a trivial quantity and the overshoot/anchor behaviour differs. Logical properties only; no `left`/`right`. |
| **III. Static Data Seam** | Not engaged | No data changes. |
| **IV. Design Is Open — Luxury Is the Quality Bar** | **Tension, resolved by constraint** | IV states luxury MUST NOT come from "excessive decoration, gradients, glow effects". This feature is about a glow ground. The resolution is not to add more of what IV objects to: FR-005 and FR-028 make *restraint* the acceptance test, and SC-001 requires ≥ 8 of 10 to judge the result **no busier** than today. The mechanism is deliberately the least decorative one available. |

**Gate result: pass, with one item carried into Complexity Tracking** — the Q2 = C / FR-005 /
Constitution-IV triangle, which is a scope contradiction rather than an architectural violation.

## Project Structure

### Documentation (this feature)

```text
specs/002-scroll-atmosphere/
├── plan.md              # This file
├── research.md          # Phase 0 — six decisions (D1 … D6)
├── data-model.md        # Phase 1 — the progression as a view model
├── quickstart.md        # Phase 1 — how to run and verify it
├── contracts/
│   └── page-ground-behaviour.md   # The observable promise, clause by clause
└── tasks.md             # Phase 2 — created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
app/
├── globals.css                  # existing ground: body glows (130-154), section lighting (171-230)
└── (main)/
    ├── layout.tsx               # mounts <PageGround/> — outside <main>, so nothing transforms it
    └── home.css                 # homepage section styles

components/atmosphere/           # NEW — one concern, one directory
├── PageGround.tsx               # the fixed layer; client component, no visual markup of its own
└── useScrollProgress.ts         # rAF-throttled scroll → one CSS custom property; reduced-motion aware

lib/atmosphere/                  # NEW — pure, testable, no DOM
└── progression.ts               # stage table, interpolation, tone-at-position, fallback tone
```

**Structure Decision**: single existing Next.js app. The split is deliberate and it is the whole design:
`lib/atmosphere/progression.ts` holds *what the ground should be at any position* as a pure function, so
the legibility guarantee (SC-004) and the fallback tone (FR-024) are unit-testable in the harness that
already exists; `components/atmosphere/` holds only the parts that require a browser. The layer mounts in
`app/(main)/layout.tsx` rather than in the page, because `Reveal` transforms every section and a
transformed ancestor would capture a fixed layer (D3).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Constitution IV tension: a feature about gradients and glow, under a principle that says luxury must not come from gradients and glow | The principle objects to *excess*, and FR-005/FR-028/SC-001 make "calmer than today" a measured pass condition rather than a taste argument. The mechanism adds no new light sources — it moves the existing ground's value along one axis. | Refusing the feature outright was not an option: the owner asked for it, and the existing field is already the loudest thing on the page. Doing nothing is the status quo IV also objects to. |
| **Recorded contradiction, owner-level:** Resolved Q2 = C is the option whose own implication column in the spec reads *"likely to reproduce the busyness the request objects to"*, and FR-005 requires the opposite outcome | Binding as answered, so the plan honours it and constrains the new layer to be value-shifting rather than additive. The quickstart makes FR-005 a gate that can fail the feature. | Re-asking is the owner's call, not a planning decision. Flagged here rather than silently re-litigated: **if the FR-005 gate fails in validation, the honest result is to return to Q2 and choose B (reduce the field to a quiet base), not to weaken FR-005.** |
| **Stale spec text found while planning** | The Assumptions section still says "**Question 2 is unresolved** … the design phase cannot lock the ground until it is settled", while Resolved Clarifications says "Open questions remaining: none" and answers Q2 = C. | Correcting it is a documentation fix, not a scope change; it is called out so nobody plans from the stale line. Left to `/speckit-clarify` or the owner rather than edited silently during planning. |

## Post-Design Re-check

Constitution Check after Phase 1: **unchanged, still passing with the same two carried items.** The
contracts add nothing that violates a principle — `contracts/page-ground-behaviour.md` clause G1 makes
"the effect never carries meaning" a testable promise, and D6 keeps the dependency set frozen, which is
what Principle III's spirit asks for even where the letter does not apply.

Sources: [research.md](./research.md) · [data-model.md](./data-model.md) ·
[contracts/page-ground-behaviour.md](./contracts/page-ground-behaviour.md) ·
[quickstart.md](./quickstart.md)
