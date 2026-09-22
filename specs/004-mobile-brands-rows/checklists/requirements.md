# Specification Quality Checklist: Mobile Brands Row Presentation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] **CLEARED 2026-09-20** — was 3 markers; all answered (Q1 bounded by Constitution I, Q2 = C, Q3 = C) (Q1 row visual, Q2 tap semantics, Q3 the existing brand band). At the permitted maximum, none defaulted.
- [x] Requirements are testable and unambiguous — all 31 unconditional
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

**Result: 13 of 13 pass.** The earlier override note is now moot: Clarification Q1 limited the set to the six
brands that already have authentic marks, so no brand imagery needed generating and the Constitution I
conflict dissolved without compromise.

## Verification Evidence

Checked against `spec.md` (471 lines, ~4,900 words):

| Check | Result |
| --- | --- |
| FR numbering monotonic, no duplicates | FR-001 … FR-031 |
| SC numbering monotonic | SC-001 … SC-012 |
| Mandatory sections in template order | User Scenarios → Requirements → Key Entities → Success Criteria → Assumptions |
| User stories prioritized, independently testable | 4 stories, P1 … P4 |
| Acceptance scenarios (Given/When/Then) | 25 |
| Edge cases | 12 |
| Key entities | 9 |
| `[NEEDS CLARIFICATION]` markers | **0** — all three resolved 2026-09-20 (Q1 bounded by Constitution I, Q2 = C, Q3 = C). An initial draft carried 4 and one was collapsed, since it follows from Q2 rather than being independent |
| Tech-term leak scan (framework, language, library, hook and file-extension names) | zero hits |
| Code-path references (`lib/`, `app/`, `components/`, `data/`) | zero |
| Literal values — hex, px, ms, radii, easing curves, viewport units | zero — Constitution IV and FR-029 |
| Cross-feature citation notation | `001/FR-001`, `001/FR-011`, `001/FR-028`, `001/FR-029`, `002/FR-020`, `002/FR-021` — each verified to exist and say what is claimed |
| Trailing whitespace | none |

### Factual claims audited against the code, not inferred from the reference

| Claim | Verified |
| --- | --- |
| Curated brand wall lists 9 brands | yes — `brandWall` in `lib/content/home.ts` |
| Only 3 of the 9 have a written brand story | yes — apple, samsung, xiaomi; the other 6 have no `story` key and render as disabled buttons today |
| Only 6 brands have an authentic mark | yes — `partnerMarks`: APPLE, SAMSUNG, XIAOMI, NOKIA as vector glyphs, `realme` and TCH as wordmarks |
| VOCAL, NEXA, OAK have no mark at all | yes — absent from `partnerMarks` |
| No brand has a photograph of itself | yes — no brand image field exists in the catalog data or the brand types |
| 15 catalog brands carry products | yes — matches the earlier catalog audit |
| Generic brand imagery was previously removed as inauthentic | yes — recorded verbatim in the `BrandShowcase` comment |
| The homepage already has a seamless looping brand-mark band beneath the hero | yes — `BrandTicker`, replacing an earlier seven-panel static grid |
| That band already solves loop seam, blank-sweep, hover **and** focus pause, edge masking, and a pinned contrast decision | yes — all four documented in its comments, including a measured contrast history (1.21:1 failure, 12.19:1 now) |
| The reference animates every row continuously regardless of visibility | yes — each item sets up its own infinite repeat on mount, independent of the active state |
| The reference detects touch and separates desktop hover logic from it | yes — a `(hover: none), (pointer: coarse)` query |
| The reference hardcodes Latin digits, right-alignment, and a bottom-right hint | yes |
| The reference uses viewport-relative type on wide screens | yes |
| The brands section currently enters through a light/white transition onto a light chapter | yes |
| The reference's row separators are translucent light borders and dark overlays | yes |

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`

- **The reference's central device is already implemented on this page, and better.** `BrandTicker` is a
  seamless brand marquee with the loop, blank-sweep, focus-pause, edge-mask and contrast problems already
  solved. Adopting this reference adds nine more marquee instances alongside it. Q3 exists because shipping
  both would put two competing motion systems on one page — the exact "messy" outcome the whole redesign is
  pushing against.
- **The image slot is the authenticity trap, and this repo has fallen into it once already.** A previous
  iteration illustrated brands with generic device photos and was deliberately stripped back to real
  wordmarks. The reference requires an image per row; nothing authentic exists to fill it. Q1 is not a
  styling question but a Constitution I question.
- **Q2 is the one that cannot be deferred.** It decides whether a tap on a brand row means "navigate" or
  "look first." Every brand row here is a route to products, so the reference's two-tap interception taxes
  each of them. It is also the part that is expensive to reverse after building, and the part with real
  keyboard and screen-reader consequences.
- **User Story 1 survives every answer.** Rows instead of a logo grid, one row answering at a time, and
  Persian-correct numbering are worth adopting regardless of what Q1–Q3 settle. If the open questions stall,
  that story is a shippable improvement on the weakest section of the homepage.
- **Motion budget was set deliberately to one row**, not asked about, because nine simultaneous loops on a
  mobile storefront's longest section is a defect rather than a taste choice. Flagged here in case the owner
  disagrees.
- **Standing instruction recorded but not yet governed.** "ALWAYS MOBILE FIRST" is written into this spec
  (FR-030) and asserted as initiative-wide, but the constitution has no principle covering device primacy.
  It probably belongs next to Principle II. See Next Actions.
- **Dependency, not a question**: the section must be validated on the confirmed dark ground. Its current
  light chapter makes the reference's translucent separators close to invisible, so nothing here can be
  signed off against the surface the section sits on today.

---

## Clarification Session — 2026-09-20

| Item | Detail |
| --- | --- |
| Questions asked | 1 of a permitted 5; stopped early because the answer resolved the feature's only blocking ambiguity |
| Question | Which brands get a row (FR-005) |
| Answer | Option A — the six with an authentic mark **and** a Persian label |
| Verification of the answer's premise | Confirmed against the code: `partnerMarks` defines exactly six marks, each with a Persian label (اپل، سامسونگ، شیائومی، نوکیا، ریلمی، تی‌سی‌اچ); the curated wall lists nine, so VOCAL, NEXA and OAK are the three dropped |
| Spec sections touched | Clarifications (new), FR-001 acceptance scenario 1, FR-005, FR-027, Key Entities (Brand Story), Edge Cases, Assumptions, risk-section counts, Resolved Question 1 |
| Net effect | **Reduces** scope. The brand-imagery conflict disappears because no selected brand lacks artwork |
| Stale text removed | Five references to "nine" rows/brands corrected; no contradictory counts remain |
| Remaining open questions in this spec | 0 |

### Terminology correction recorded

The brand is **TCH** (Persian label «تی‌سی‌اچ»), not TCL. Checked across `specs/`, `lib/`, `app/`,
`components/`, `PRODUCT.md` and `docs/`: **no file ever contained "TCL"** — the error appeared only in
assistant prose and never reached a specification or source file. No correction to committed text was needed.

---

## Clarification Session 2 — 2026-09-20 (questions 2 and 3)

| Item | Detail |
| --- | --- |
| Q2 | Must categories and brands be one widget or may they stay two with shared motion (FR-032) → **Option B**, two widgets one motion language |
| Effect | `005/FR-038` rewritten to name the five behaviours that must be shared and made **reciprocal**; new `004/FR-032` carries the same obligation, which 004 previously did not mention at all |
| Defect removed | FR-038's earlier "share … one carousel pattern" would have invalidated one of the two references the owner supplied, and it bound spec 004 unilaterally from inside spec 005 |
| Q3 | Where do the three written brand stories go (FR-004) → **Option A**, in the expanded row for APPLE / SAMSUNG / XIAOMI |
| Defect removed | **A contradiction inside spec 004.** FR-004 required the absence of a story to be invisible while three finished Persian brand narratives existed in the content data — so the spec simultaneously forbade showing real copy and required its absence to be undetectable. FR-004 now forbids negative signals (disabled, dimmed, pending, empty frame) and requires uniform finish rather than uniform depth |
| Rejected | Commissioning stories for NOKIA / REALME / TCH — inventing brand narratives is the same Constitution I failure as inventing brand logos |
| Stale text cleared | Five "nine" counts, one obsolete "present identically" clause, an assumption claiming story absence stays invisible, and one acceptance scenario referencing a brand with no mark (impossible under Option A) |
| Numbering | US1 scenarios renumbered 1–7 after an intermediate "4a" was introduced; no suffixed ids remain |
| Unchecked checklist items | 0 before this step, 0 after |
| Open questions in spec 004 | 0 |
