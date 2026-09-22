# Specification Quality Checklist: Premium Persian RTL Storefront

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-20
**Last reviewed**: 2026-09-20 (after clarification pass — 1 iteration, resolved on first re-check)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — **0 remaining**, all three answered by the owner
- [x] Requirements are testable and unambiguous — all 56, none gated
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

**Result: 13 of 13 pass. Specification is ready for `/speckit-plan`.**

## Verification Evidence

Re-checked against `spec.md` after folding in the owner's answers (617 lines, ~6,800 words):

| Check | Result |
| --- | --- |
| FR numbering contiguous, no duplicates | FR-001 … FR-056, contiguous |
| SC numbering contiguous | SC-001 … SC-015, contiguous |
| Mandatory sections present in template order | User Scenarios → Requirements → Key Entities → Success Criteria → Assumptions (verified programmatically) |
| User stories prioritized and independently testable | 5 stories, P1 … P5 |
| Acceptance scenarios (Given/When/Then) | 30 |
| Edge cases | 14 |
| Key entities | 13 |
| `[NEEDS CLARIFICATION]` markers | **0** (was 3, at the permitted maximum) |
| Dangling FR cross-references | none |
| Tech-term scan (frameworks, languages, API, file extensions, "component") | zero hits |
| Code-path leak scan (`lib/`, `app/`, `components/`, `data/`) | zero hits |
| Prescribed visual values (hex, font names, radii, px, spacing, motion curves) | zero — required by Constitution IV and FR-051 |
| Constitution cross-references | maintained (Principles I–IV) |
| Stale question references left behind | none — all rewritten as resolved records |
| Trailing whitespace | none |

### Changes made during clarification resolution

| Answer | Effect on the specification |
| --- | --- |
| **Q1 = B** (availability data is stale, will be refreshed) | Terminology redefined and "Refresh tolerance" added as a term; User Story 4 rationale rewritten; FR-040 resolved with an explicit boundary note; **new FR-053 … FR-056 group** (Catalog Currency and Refresh Tolerance); SC-005 reworded to survive a refresh; **SC-015 added** to test refresh tolerance; two Assumptions rewritten |
| **Q2 = A** (existing photography only) | FR-031 rewritten as a single constraint incl. remote-view degradation; new Assumption that no visual assets are being produced. **Amended 2026-09-20**: background removal now permitted under fidelity conditions |
| **Q3 = C** (address and email only) | FR-006 forbids document imagery permanently rather than provisionally; FR-007 makes address/email admissible once confirmed; Assumption rewritten |

### Factual claims audited against the catalog data

Every number cited was verified against the source records rather than assumed:

| Claim | Verified |
| --- | --- |
| 189 product records | yes |
| Only 5 marked purchasable; 162 out of stock; 21 limited; 6 call | yes |
| 5 records with no price even after option-price fallback | yes |
| 23 records without specifications | yes |
| 35 records without description text (33 without formatted description) | yes — corrected from an initial draft of 33 |
| 56 records with no gallery view beyond the first; 133 with more than one; 1 with no image at all | yes |
| 188 of 189 primary images mirrored locally | yes — files confirmed present on disk |
| 311 options across 105 products | yes |
| 15 of 39 brands carry products; 19 of 32 categories carry products | yes — corrected; draft implied all 32/39 usable |
| 115 records with a comparison price strictly above the current price | yes |
| Catalog export snapshot dated 2026-09-09 | yes |
| Remote gallery images measured at 5.8–7.5s and failing often | yes — documented in the catalog layer |

## Notes

- **The 5-of-189 figure is now known to be staleness, not strategy** (Q1 = B). This removed the single
  largest interpretive risk in the specification, but it introduced a hard dependency: the refreshed
  availability export must arrive before the design is validated against real states. FR-053 … FR-056 and
  SC-015 exist so that dependency does not silently invalidate the build.
- **Q2 = A was the defining constraint of the design phase — and has since been amended in part
  (2026-09-20).** It originally declined cinematic imagery, video, layered composition, and 3D product
  visualization as a group. Feature 003 re-asked the floating-product question and the owner chose
  background removal, so `FR-031` now permits isolating a product from its own photograph, bounded by
  fidelity conditions. **Still declined after the amendment**: video, modeling products never photographed,
  and generated imagery — so the note above remains true for everything except cut-outs. See the Amendment
  Record at the top of `spec.md`.
- **Q3 = C is a partial upgrade.** A real address and email give the trust story a physical anchor, which
  is the strongest available improvement. The two brand authorizations remain asserted claims with no
  evidence on screen — acceptable under Constitution I, but they carry no proof weight and should not be
  given visual emphasis that implies documentation exists.
- Constitution I (Honest Interface) is deliberately over-represented (FR-001 … FR-008, all of User Stories
  3 and 4) because the available data is sparse precisely where a premium storefront is tempted to invent.
- Constitution IV (Design Is Open) required the *absence* of a visual section. If a later reader asks why no
  palette or type scale appears here, that is the reason, and FR-051 is the guard.
- No item in this checklist is blocked. Next step is `/speckit-plan`.

---

## Persian Language Audit — 2026-09-20 (added with FR-057 … FR-064)

Six Persian references were installed and each rule was checked against this repository rather than assumed.

| Rule checked | State in this repo | Action |
| --- | --- | --- |
| Letter-spacing must be zero on Persian | **FAILS — 25 `tracking-tight` uses, effectively all on Persian headings**, including the shared `SectionHead` (4 variants), the hero title, every page `<h1>`, and `TrustBar` where the Persian string sits on the same element | FR-057 |
| Zero-width non-joiner | **FAILS — 3 uses of «جستجو» without the joiner** in `FilterSidebar` (placeholder + `aria-label`) and `ProductsAdminClient`; correct form is «جست‌وجو». `ثبت‌نام` and `می‌شود` elsewhere are already correct | FR-058 |
| Formal register, no bureaucratic or machine phrasing | **PASSES — 0 banned constructions found** across `lib`, `app`, `components` | FR-059 pins it so it cannot regress |
| UI glossary (no transliteration) | **PASSES — no «لاگین»**; ورود / خروج / ثبت‌نام used correctly | FR-060 |
| Persian calendar via locale, never hand-rolled | **PASSES — `toLocaleDateString("fa-IR")`** in the order content module for both date and date-time; no manual conversion anywhere | FR-061 |
| Digit normalisation before validation | **PASSES — `toLatinDigits`** handles Persian and Arabic digits and strips separators before every check | FR-062 restates it |
| Mobile number forms accepted | **FAILS — `^\+989…` / `^09…` / `^9…` only.** The `0098` international prefix that shoppers paste from contact apps is rejected | FR-062 |
| Fixed-line numbers not tested as mobile | **GAP — no fixed-line validator exists**, while the partner form collects branch phone numbers | FR-063 |
| Identity-code checksum correctness | **PASSES — algorithm is right.** Weights 10→2 over the first nine digits, `sum % 11`, expected `r` when `r < 2` else `11 - r`, all-same-digit values rejected, length-only for the 11-digit legal-entity id exactly as the reference requires | no change |
| Misleading comment | **DEFECT — `lib/validators.ts` calls the checksum "Luhn".** It is the Iranian weighted mod-11 check, not Luhn. Code is correct; the label invites a future "fix" that would break it | fix the comment, not the logic |

Two further reference rules were reviewed and deliberately **not** turned into requirements, because Constitution IV puts values out of bounds: the recommended three-weight palette, and the specific font-family guidance. The existing font stack already ships a variable Persian face with a Latin-capable fallback.
