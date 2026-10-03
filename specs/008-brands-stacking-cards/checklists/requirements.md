# Specification Quality Checklist: Brands Stacking-Card Deck

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-26
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

### What was checked, and against what

**No implementation leak.** The spec names no library, no API, no component and no file it intends to change.
It does name two *governance* sources — feature 004's C5 ("no empty frame") and feature 002's tonal-ground
anchors — because a requirement that contradicts a standing contract is a defect, not a design choice, and the
reader has to be able to see which contract is being carried forward. Those are references to rules, not to
code.

**Ambiguity that was closed by decision rather than by question.** The instruction left four things open:
whether the deck replaces the existing rows, whether previous cards stay visible, which card owns a press, and
what a card shows when it has no story. Each has a stated answer in **Assumptions** with the reason, so a
planning pass inherits a decision instead of re-opening it. No `[NEEDS CLARIFICATION]` marker was used, and
none is needed — none of the four has more than one reading that survives the owner's own words ("use this
style for the brands section", "like a deck of cards").

**Measurability.** Where a criterion could have been left as "feels smooth" or "fits the screen", it carries a
number instead: six and a half screen-heights of chapter length (FR-008/SC-004), zero clipped-label frames at
360 × 640 (FR-007/SC-002), zero empty areas at rest (SC-003). These can be verified by sampling a scroll and by
looking at the six resting states, without knowing how any of it is built.

**One criterion is deliberately qualitative.** SC-007 asks whether the owner recognises the result as the deck
they asked for. The reference was supplied by name and by link, so matching it *is* the acceptance test, and a
spec that pretended otherwise would be measurable but wrong.

### Two things this spec intentionally does not promise

- **No smoothness or frame-rate target.** The development machine cannot answer that question — it is the box
  that lost three agent processes to load average 33 in one night — and a number taken there would be a false
  number in whichever direction it landed. Verification is specified on a real phone or an exact 360 px
  viewport instead, and that constraint is recorded in Assumptions.
- **No requirement that the deck exists.** FR-014 makes the static stack a complete, shippable outcome. This
  is the specific lesson of feature 007, whose pinned band shipped without its pin after the geometry failed at
  360 px: a fit requirement with no stated fallback is how that rebuild happened. Here the fallback is named in
  advance so "it does not fit" ends the feature rather than restarting it.

### Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`

None. All items pass. `/speckit-clarify` is still worth running if the owner wants to confirm the four
decisions recorded in Assumptions before a plan is built on top of them; `/speckit-plan` can proceed without
it.
