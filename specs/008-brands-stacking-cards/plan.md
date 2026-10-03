# Implementation Plan: Brands Stacking-Card Deck

**Branch**: `008-brands-stacking-cards` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-brands-stacking-cards/spec.md`

## Summary

The brands chapter becomes a deck: six cards, each holding at the top of the view while the next slides over
it, previous cards remaining visible as a stacked edge. The mechanism is **CSS `position: sticky` in normal
document flow** — no pinning, no scroll listener, no new dependency — because that is both what "like a deck of
cards" describes physically and the only mechanism this codebase has not already been burned by.

The spec's hard requirement is not the animation, it is the **fit**: FR-007 demands zero clipped-label frames at
360 px and FR-014 makes a static stack a complete delivery. Feature 007 shipped its pinned band without its pin
after the same geometry question was answered optimistically, so the fit budget here is arithmetic settled
*before* styling, and the fallback is designed rather than discovered.

## Technical Context

**Language/Version**: TypeScript 5.x on Node 24 (Next.js 15.5 App Router, React 19.2)

**Primary Dependencies**: Tailwind CSS 3.4 for the deck's geometry; the six brand marks already in
`public/brand/categories/`; `lib/brand-counts.ts` and `lib/content/home.ts` for card content. **No new
dependency.** `gsap@3.15` is already installed but `ScrollTrigger` is imported nowhere in this app, and this
plan does not change that — see research.md D1.

**Storage**: `data/hami-products.json` through the static catalogue seam (Constitution III). No database, no
API round-trip, no new field authored by hand.

**Testing**: Vitest in a **node environment only** — there is no DOM harness in this project and adding one is
out of scope. Everything structural is therefore asserted as pure data or pure arithmetic; everything visual is
verified in a real browser at an exact 360 px viewport.

**Target platform**: Mobile browsers first (360 px wide is the design; 640 px tall is the fit case), then
tablet and desktop. The homepage is the only surface.

**Project type**: Single Next.js app, frontend-only feature.

**Performance goals**: No frame-rate target is set, deliberately. The specification records why: the
development machine cannot measure it honestly. The substitute goals are structural — no scroll listener, no
per-frame JavaScript, no layout-affecting property animated — which is how the effect avoids needing a
frame-rate argument at all.

**Constraints**: FR-007 (zero clipped labels at 360 × 640), FR-008 (chapter length ≤ 6.5 screen-heights at
360), FR-010 (no reserved-but-empty area), FR-014 (deck or static stack, never a half-fit deck), and the
mobile dock clearance already established by feature 007 (`5.5rem` at `<768px`, none above it).

**Scale/Scope**: One section on one page. Six cards. Three existing components touched
(`BrandShowcase.tsx`, `BrandRows.tsx`, and the CSS that styles them), one ground anchor re-measured, no route,
no data model change, no backend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| **I. Honest Interface** | ✅ PASS | FR-011 and research D5: a count appears only when the destination really lists it, and is omitted for brands with nothing purchasable. FR-016 keeps brand imagery to the six authentic marks already in the shop — no generated or stock brand photography, which is the trap this effect invites because a deck looks better with pictures. |
| **II. Persian RTL by Default** | ✅ PASS | The stack is built on `inset-block-start` and flow order, never physical `top`/`left`/`right` (D8). Card labels are Persian-first; the brand's Latin name stays decorative. Counts render in Persian numerals (FR-019). |
| **III. Static Data Seam** | ✅ PASS | Brands, marks, stories and counts keep coming from `data/*.json` through `lib/catalog.ts` and `lib/brand-counts.ts`. This feature adds no data and no destination (FR-001, FR-005). |
| **IV. Luxury is the quality bar** | ✅ PASS | A stacking deck is a signature, not a grid — exactly the "deliberate visual emphasis, not a uniform grid of generic cards" the principle asks for. The restraint clause is honoured by the fit budget: a deck whose cards are cropped is cheap-looking, so the composition is capped by the viewport rather than by ambition. |
| Constraint: prefer editing over new abstraction/dependency | ✅ PASS | No new dependency; the deck reuses the existing brand components and their data seam. |
| Definition of Done | ✅ PASS | `typecheck` + `build`, verified in a real browser at both widths, RTL-correct, no fabricated data — all four are explicit verification steps in quickstart.md. |

**Gate result: no violations. Complexity Tracking stays empty.**

### Post-design re-check (after Phase 0 and Phase 1)

Re-run against research.md and the contract: still no violations. The one place the design could have drifted
is D1's rejection of a JS-driven pin, which was tested against the owner's own reference (the reference is a
deck, and a deck is stacking, not scrubbing) and against this repository's history rather than against taste.
FR-018 added a constraint the spec did not have at drafting time — the brands chapter is a **tonal-ground
anchor** (`PROGRESSION` stage `shelves`), so its new height moves where that stage begins. That is a real
coupling and is carried into the contract as C7 with a named check, not absorbed silently.

## Project Structure

### Documentation (this feature)

```text
specs/008-brands-stacking-cards/
├── plan.md                          # this file
├── spec.md                          # the requirement source
├── research.md                      # Phase 0 — nine decisions, each with the rejected alternative
├── data-model.md                    # Phase 1 — the card, its four claims, and its three stack states
├── quickstart.md                    # Phase 1 — how to run it and how to prove it fits
├── checklists/requirements.md       # spec-quality gate (already passed)
└── contracts/
    └── brand-deck-behaviour.md      # Phase 1 — C1…C9, the acceptance contract
```

`tasks.md` is Phase 2 output and is **not** created here; it comes from `/speckit-tasks`.

### Source code (repository root)

```text
app/
├── (main)/
│   ├── page.tsx                     # mount point — the brands section stays where it is
│   └── home.css                     # deck geometry lives beside the section that owns it
├── globals.css                      # touched only if a token is needed; no new mechanism
└── layout.tsx                       # NOT touched — sticky needs no wrapper (see D1)

components/home/
├── BrandShowcase.tsx                # the section shell: heading + deck + the non-moving mark band
├── BrandRows.tsx                    # becomes the deck; keeps its data wiring and destination rules
├── BrandTicker.tsx                  # NOT changed (FR-017 — it stays non-moving)
└── BrandMarks.tsx                   # the six authentic marks, reused as-is

lib/
├── brand-counts.ts                  # read only; supplies the count a card may show (D5)
├── content/home.ts                  # brand names, stories, `hasStory`
└── atmosphere/progression.ts        # ground anchor "brands" — re-measured, not edited (C7)

tests/unit/
└── brand-deck.test.ts               # new: the parts of this feature that are pure data or arithmetic
```

**Structure decision**: no new directory, no new component, no new dependency. `BrandRows.tsx` already owns the
six brands, their marks, their stories and their destinations; it is rebuilt in place as the deck. The one
genuinely new file is the unit test that guards the claims a card is allowed to make.

## Complexity Tracking

> No violations to justify.
