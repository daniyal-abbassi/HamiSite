# Specification Quality Checklist: Brand Card Identity

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

**Two deliberate technical mentions, and why they stayed.** FR-014 names the deck's mechanism ("sticky cards in
normal flow, no pin, no scroll-linked script") and FR-015 names "live text, not artwork". Both are *inherited*
constraints from feature 008 and from the accessibility rule against colour-only information, and both are stated as
things that must not change rather than as a method for the new work. Removing them would make the requirement
untestable — "the behaviour must be unchanged" needs a referent. Everything the feature itself introduces (colour
treatment, description lines) is specified as an outcome.

**Zero [NEEDS CLARIFICATION] markers.** Three questions could have been asked and were decided instead, each
recorded in Assumptions:

1. *Generated imagery — yes or no?* Decided **no**, and the reason is a rule the project already holds rather than a
   preference: generated maker imagery either reproduces a protected look or depicts merchandise as stock the shop
   claims to sell. The owner offered to generate if needed; it isn't, and that answer is written down rather than
   left to be rediscovered at implementation time.
2. *Real slogans or our own lines?* Decided **ours, written from researched attributes**, because a maker's slogan on
   the shop's page reads as the maker speaking and implies a relationship nobody established. FR-008 still allows a
   genuine published line if it is presented as theirs.
3. *What about the brand with no hue?* Decided it **gets no hue** (FR-003) rather than being assigned an invented
   one. This is the assumption most likely to be challenged in planning, so it is flagged in Assumptions with the
   direction of the fallback: if research contradicts it, the treatment changes and the rule against inventing does
   not.

**The judgement calls that cannot be closed by writing.** FR-010 (shop identity stays dominant), FR-011 (premium
register) and SC-004 (a cold viewer says it is one page) are subjective by nature. They are given a human
measurement rather than a numeric one that would be false precision — the same way the categories chapter was
accepted on sight. SC-001's "five of six from colour alone" is the one genuinely numeric claim, and it is the number
the owner's sentence actually implies.

**Dependency on live research.** SC-003 requires a source per line, so the spec is only satisfiable if the research
finds sources. That is a real risk, not a formality — TCH is the likeliest gap, and the edge case for "research
finds nothing" is written down deliberately so the feature ships a quieter card rather than an invented claim
(FR-018).

**Ready for `/speckit-plan`.** No blockers. Planning should start by resolving the hue-harmony mechanism against
the shop's existing burgundy-and-champagne palette, and by checking whether the research table arrived with sources
or with gaps.
