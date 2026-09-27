# Specification Quality Checklist: Liquid Dock Navigation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-27
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
- [x] User stories cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

**Passes with three deliberate exceptions, recorded rather than hidden.**

1. **Content Quality — "no implementation details."** The spec names the external reference's stack
   (Vite/GSAP) and states it is *read, not vendored*, because the single most likely way this feature gets
   built wrong is an agent installing or copying a demo that its own author says is not a package. That
   sentence is a guard rail, not a design choice. Tailwind class names and breakpoint tokens were removed
   from the requirements and edge cases on review; the remaining technical nouns (`tel:` dial request,
   server-sent markup, Persian digit widths) describe shopper-visible behaviour.

2. **No [NEEDS CLARIFICATION] markers, by decision, not by omission.** Four aspects of the request were
   genuinely open. Two were resolved and written into the Assumptions section without asking; two were put to
   the owner on 2026-09-27 because they change what gets built, and both came back:
   - *Is the cart being removed from the product?* — No, only its shortcut. Verified against the header
     control and the drawer's existing links before the spec was written, so this is evidence, not a guess.
   - *Does the freed slot get a new destination?* — No. Five entries, no replacement.
   - *Adopt the reference's drag-to-pull gesture?* — **Owner: "your call."** Declined, as FR-012a, on the
     semantic ground that a previewing marker contradicts what the marker means here. The advisor preferred it
     at 0.65; the dissent is recorded in `notes/jev-advisory.md`.
   - *How far should the language spread?* — **Owner: "everywhere you can."** FR-041 now enumerates **seven**
     surfaces, found by searching for controls that already publish a current-or-pressed state rather than by
     taste. This materially changed the spec: it added the concurrency cap (FR-033), the resting-cost floor
     (FR-034), the wrap rule (FR-045), the long-distance rule (FR-046), the accessible-name freeze (FR-047),
     and turned User Story 4 from a follow-up into a **gate on** User Story 3.

3. **SC-007 is a human gate and cannot be automated.** It is kept because it is the criterion that actually
   decides this feature — the same gate settled the categories and brands chapters — and because SC-001
   through SC-006 prove everything that *can* be measured without it. An owner verdict is listed separately
   from the measurable ones so nobody mistakes a green automated suite for acceptance.

**Two requirements exist purely to stop a known regression, and are worth flagging to the planner.**
FR-018 and SC-006 pin the bar's outer height and bottom inset to their current measured values. The
stacking-card deck's per-card height budget subtracts that inset as a constant established in feature 008.
A marker that grows the bar by a few pixels silently invalidates a measurement another shipped feature
depends on. FR-017 and SC-003 similarly exist because this exact bar once hardcoded its first entry as
active everywhere, which is documented in the component's own header comment.

**Scope is bounded by an enumerated list, not by an adjective.** "Everywhere you can" has no natural stopping
point, so FR-041 lists the seven in-scope surfaces and FR-043/FR-044 name the exclusions — the back office,
the deck, the arrival, the drawer, dialogs, body text. SC-005 makes it checkable in both directions: seven in,
zero out.
