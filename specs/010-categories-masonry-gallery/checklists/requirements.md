# Specification Quality Checklist: Categories Masonry Gallery

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
- [x] The authored prominence decision (FR-013) has an owner input — answered: rhythm only

## Notes

### The two open questions, now answered

**FR-023 — what triggers the arrival.** The owner chose **scroll into view**, so a shopper who scrolls quickly
still meets the animation instead of arriving at a page that already performed. FR-024 was added to make the
consequence explicit: the chapter's height must be fixed before the arrival begins, otherwise a fast scroll
lands mid-collapse and the page jumps.

**FR-013 — what decides tile height.** The owner chose **rhythm only**. Heights vary so the columns stagger and
the page reads as composed; **no department is large because it sells more and none is small because it sells
less.** This deliberately drops the catalogue-weight hierarchy that 009 was built around, so FR-013a was added:
because size no longer carries meaning, each department's picture and name must carry its identity on their
own. It also means the pattern of heights has to be written down somewhere — an unstated rhythm becomes an
accident the next agent "fixes" by evening it out.

### Six refusals, and why they are requirements rather than opinions

The supplied reference component is a good gallery. Six of its behaviours would damage this shop, and each is
written as a requirement with the harm named inline, so a later implementer cannot treat it as an
oversight to be tidied away:

| Reference behaviour | Requirement that refuses it | Harm prevented |
|---|---|---|
| Title revealed on hover only | FR-005, SC-003 | On a touch device the hover never fires — department names would simply never appear to the shop's main audience |
| Opens the destination in a new window | FR-007 | Strands a shopper who wanted to keep browsing; breaks the browser's own back behaviour |
| Layout computed entirely in the browser, tiles absolutely positioned | FR-008, SC-004 | Without scripting the section is an empty fixed-height box — a shopper on a slow phone sees nothing where the departments should be |
| Letter-spacing and uppercase label styling | FR-006 | Persian has no case and takes no letter-spacing; the shipped rule on this page forbids it |
| Blur animated across every tile at once | FR-010, FR-011, Assumptions | The arrival must be skippable and never load-bearing; no smoothness claim is made because this machine cannot substantiate one |
| Colour tokens the project does not define | FR-016, FR-006 | A gradient referencing absent tokens renders as nothing, silently |

### What the rhythm answer asks of planning

Choosing rhythm over data does not remove the need to assign heights — it moves the decision from "what the
catalogue says" to "what the page needs", and planning must produce an actual pattern (which departments are
tall, which short, at each width) rather than leaving it to a layout algorithm. The one trap named here: an
arbitrary pattern that happens to make **خدمات آنلاین**, the one-product department, the largest tile would
recreate the accident the owner saw and rejected in 009's variant B.

### What carried over from 009 rather than being re-derived

The nine derived departments, the honest-count rule, the "no reserved empty area" rule, the
missing-data-stays-missing rule, the light ground, the at-a-glance recognisability bar, and the tonal-ground
anchor coupling. 009's **layout** decision is superseded; its data and honesty requirements are not. Its
catalogue-weight hierarchy is explicitly **not** carried over — see FR-013.

### Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`

None. All 16 items pass and both owner questions are answered. Ready for `/speckit-plan`.
