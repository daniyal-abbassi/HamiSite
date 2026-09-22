# Specification Quality Checklist: Floating Product Presentation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-20
**Last reviewed**: 2026-09-20 — after clarification resolution (1 iteration; all three answered)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — **0 remaining** (was 3, all answered by the owner)
- [x] Requirements are testable and unambiguous — all 34, none gated
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

**Checklist result: 13 of 13 pass.**  
**Blocker status: cleared 2026-09-20 — `001/FR-031` amended.**

**No external blocker remains.** Resolved Q2 = B contradicted `001/FR-031` as it stood; that requirement was
amended on 2026-09-20 (MINOR) and 001's Resolved Q2 marked superseded in part, in the same change. This
spec is ready for `/speckit-plan`. See "Amendment Applied to Feature 001 — Complete".

## Verification Evidence

Re-checked after folding in the three answers (545 lines, ~5,860 words):

| Check | Result |
| --- | --- |
| Local FR numbering monotonic, no duplicates | FR-001 … FR-034 |
| Local SC numbering monotonic | SC-001 … SC-015 |
| `[NEEDS CLARIFICATION]` markers | 0 |
| Resolved answers recorded | Q1 = A, Q2 = B, Q3 = B |
| Mandatory sections in template order | User Scenarios → Requirements → Key Entities → Success Criteria → Assumptions |
| User stories prioritized, independently testable | 4 stories, P1 … P4 |
| Acceptance scenarios | 21 |
| Edge cases | 12 |
| Key entities | 10 |
| Literal hex colors | zero — reference values paraphrased so no reader can lift them |
| Prescribed typefaces, radii, durations, easing | zero — Constitution IV and FR-026/FR-027 |
| Tech-term and code-path leak scans | zero hits |
| Cross-feature citation hygiene | see note below |
| Trailing whitespace | none |

### Citation collision — found and fixed

This feature's own numbering grew to FR-034, which **collided with the sibling requirements it cites**: the
file both defines `FR-030/031/034` and cites `001/FR-030/031/034`, and `FR-020/021` exist in both 002 and
003. Bare references were therefore genuinely ambiguous to a reader or a downstream command.

Fixed by introducing an explicit notation, defined in Terminology: bare `FR-0nn` means this file; borrowed
requirements carry a prefix. All five cross-feature citations now use it — `001/FR-030`, `001/FR-031`,
`001/FR-034`, `002/FR-020`, `002/FR-021` — and every remaining bare reference was checked to confirm it
resolves locally.

### Factual claims audited against the actual files

| Claim | Verified |
| --- | --- |
| 188 of 189 products have a locally-held primary image | yes |
| All 188 are JPEG; JFIF headers throughout | yes |
| No file carries an alpha channel (3 components, RGB) | yes — every file |
| Max source dimension 900px; modal 800×800 (117 files) | yes |
| 45 files are portrait 675×900 | yes |
| Smallest sources 400×400 and 447×447 | yes — one each |
| Median weight ≈ 58 KB | yes |
| Reference states "zero 3D rendering" | yes — Imagery section, verbatim |
| Reference forbids shadows and glows | yes — Do's and Don'ts, Elevation |
| Reference documents no animation | yes |
| Reference's float is white-on-white color matching | yes — "floats without frame" on a white canvas |
| `001/FR-031` forbade new asset production and 3D visualization | yes — read back from the live 001 spec, then amended on 2026-09-20 |
| Product categories likely to resist clean isolation | inferred, not measured — cables, chargers, straps, SIM cards and service items all exist in the data (10 chargers, 3 car chargers, 3 SIM cards, 1 service), which is why FR-034 requires the failure rate to be measured rather than assumed |

## Changes Made During Clarification Resolution

| Answer | Effect |
| --- | --- |
| **Q1 = A** dark ground, sharpness over scale | FR-018 rewritten; resolution ceiling accepted rather than worked around; Assumption added |
| **Q2 = B** background removal across 188 files | FR-006 resolved to isolation as the mechanism; **"Governance Conflict" upgraded to a blocking amendment requirement, since satisfied (see below)** with a three-row route table; **new group FR-028 … FR-034** (derived asset integrity, per-file review, source retention, honest fallback, measured failure rate); **SC-012 … SC-015 added**; "Hard Constraint" section rewritten to make cut-out quality the central risk; Terminology updated |
| **Q3 = B** follow the remembered experience | FR-010 rewritten to make motion and dimensionality central; FR-009 rewritten to **permit contact shadows and grounding cues**, overriding the reference's prohibition; reference section annotated; Out of Scope tightened so synthetic 3D modeling stays excluded |

## Notes

- **The two hard-won findings.** First, the attached reference explicitly forbids the thing the request
  named — it states zero 3D rendering, bans shadows, and documents no animation. Following it faithfully
  would have produced a static gallery. Second, all 188 images are opaque JPEGs, so nothing could float
  until backgrounds are removed; Q2 = B now commits to exactly that.
- **Q1 = A and Q2 = B reinforce each other** rather than conflicting: isolated objects suspended on a dark
  ground is closer to the experience Q3 = B asks for than the reference's white-on-white trick could ever be
  on this brand. Worth knowing that the combined scope is larger than any single answer implies.
- **Governance debt: paid.** `001/FR-031` previously read "not by new asset production," which contradicted
  this feature's chosen route. It now permits background removal under the FR-028 … FR-034 conditions while
  still forbidding video, synthetic 3D modeling, and generated imagery. Both files were reconciled in one
  change, and the supersession is recorded inside 001's own Resolved Q2 entry so neither file reads as
  orphaned. What remains is execution risk, not contradiction.
- **FR-034 is the design gate.** If a large share of the catalog resists clean isolation — and chargers,
  cables, straps, SIM cards and reflective finishes suggest some will — this stops being a catalog-wide
  presentation and becomes a curated one. Measuring that before committing is far cheaper than after.
- **Three specs, one undecided identity question.** Feature 002's Q1 and Q2 remain unanswered. This spec now
  assumes a dark ground; if 002 later moves light, FR-008 and FR-009 are invalidated. The ground decision
  should be settled once, deliberately.
