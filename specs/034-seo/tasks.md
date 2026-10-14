---
description: "Dependency-ordered implementation tasks for the storefront SEO feature"
---

# Tasks: Storefront SEO Audit and Improvements

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [SEO contract](contracts/seo-contract.md), [quickstart.md](quickstart.md)

**Organization**: Tasks follow the three user stories. Checked items were executed against the revised specification; the missing-product status correction remains open with a Beads follow-up.

## Format: `[ID] [P?] [Story] Description`

- **[P]** means separate files and no dependency on another unfinished task in the same phase. This repository is worked by one agent; the marker identifies safe separation of work, not a request for concurrent agents.
- **[Story]** maps to a user story in [spec.md](spec.md).
- Paths are relative to the repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the selected guidance and preserve existing work before auditing.

- [X] T001 Inspect current owner edits in `lib/seo-metadata.ts`, `app/sitemap.ts`, and `tests/unit/seo.test.ts`; record the preexisting state and any already-implemented behavior in `specs/034-seo/audit-report.md` without discarding files.
- [X] T002 Confirm the FarsiUI-selected upstream `seo` skill and its structured-data reference exist at `.agents/skills/seo/SKILL.md` and `.agents/skills/seo/references/STRUCTURED-DATA.md`; record source, installed version or revision, and installation command in `specs/034-seo/audit-report.md`.
- [X] T003 Confirm the server and database prerequisites in `specs/034-seo/quickstart.md`, including a separate test schema and the actual bound port; record the inspected origin and date in `specs/034-seo/audit-report.md` without resetting or reseeding data.

**Checkpoint**: Audit environment and provenance are known; prior edits are accounted for.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish evidence and route decisions before changing SEO behavior.

- [X] T004 Record in `specs/034-seo/audit-report.md` one current URL for each available home, shop, product, category, and brand page type, plus one private and one missing-product URL; mark an absent catalog sample unverified with its reason.
- [X] T005 Capture in `specs/034-seo/audit-report.md` baseline HTTP, rendered desktop/mobile, robots, sitemap, redirect, internal-link, and resource observations for those samples and representative sort/filter/pagination or alias URLs, following `specs/034-seo/quickstart.md`.
- [X] T006 Classify each baseline issue in `specs/034-seo/audit-report.md` as observed, source-only hypothesis, or unverified; record target, severity, evidence, impact, correction, and content-based preferred URL decisions using `specs/034-seo/contracts/seo-contract.md`.

**Checkpoint**: Findings and preferred URL decisions have evidence; no fix is justified solely by an assumed SEO rule.

---

## Phase 3: User Story 1 - Make Public Pages Discoverable (Priority: P1) 🎯 MVP

**Goal**: Public pages are reachable and send coherent discovery signals; private and unavailable pages do not claim to be current public destinations.

**Independent Test**: Re-fetch the sampled public, private, unavailable, and variant URLs; compare final status, crawler access, rendered preferred URL, prominent links, and sitemap membership against the recorded decisions.

### Implementation for User Story 1

- [X] T007 [P] [US1] Correct confirmed preferred-URL defects in `lib/seo-metadata.ts`; preserve content-distinct pagination/filter URLs when warranted instead of stripping every query string by default.
- [X] T008 [P] [US1] Correct confirmed crawl/index conflicts between `app/robots.ts` and private-route metadata in `app/(main)/account/page.tsx`, `app/(main)/checkout/page.tsx`, and `app/(main)/cart/page.tsx`; verify what a crawler can actually observe without exposing private content.
- [X] T009 [US1] Apply the recorded shop query and preferred-URL policy to `app/(main)/shop/page.tsx` and `lib/shop-query-db.ts`, changing only variants whose rendered content and current behavior justify it.
- [X] T010 [US1] Correct confirmed product/category/brand preferred-URL or missing-page inconsistencies in `app/(main)/shop/[slug]/page.tsx`, `app/(main)/categories/[slug]/page.tsx`, and `app/(main)/brands/[slug]/page.tsx`.
- [X] T011 [US1] Reconcile current, eligible, absolute URLs and any collection-size limit in `app/sitemap.ts` with the database-backed catalog and the decisions in `specs/034-seo/audit-report.md`; exclude missing, unpublished, and private destinations.
- [X] T012 [US1] Recheck sampled redirects, final statuses, crawler access, preferred URLs, internal-link targets, and sitemap coverage; record each corrected finding's repeated result and remaining uncertainty in `specs/034-seo/audit-report.md`.

**Checkpoint**: User Story 1 can be demonstrated from the sampled live responses without waiting for search-engine indexing.

---

## Phase 4: User Story 2 - Present Accurate Search Context (Priority: P2)

**Goal**: Search-facing text and structured facts agree with current visible Persian content, and the essential page remains usable on mobile.

**Independent Test**: Render home, shop, product, category, and brand samples at desktop/mobile widths; compare titles, summaries, headings, links, images, and structured facts to visible content and current catalog/contact records.

### Implementation for User Story 2

- [X] T013 [US2] Correct confirmed inaccurate or indistinct Persian titles, summaries, and prominent headings in `app/layout.tsx`, `app/(main)/page.tsx`, `app/(main)/shop/page.tsx`, `app/(main)/categories/[slug]/page.tsx`, and `app/(main)/brands/[slug]/page.tsx`.
- [X] T014 [P] [US2] Correct confirmed product schema claims in `lib/persian-seo.ts` and `app/(main)/shop/[slug]/page.tsx`; omit unsupported zero prices, availability, images, ratings, or other facts and keep schema aligned with visible catalog data.
- [X] T015 [P] [US2] Correct confirmed non-descriptive product-card links and content-image descriptions in `components/shop/ProductCard.tsx` and `components/shop/ProductGallery.tsx`; keep decorative media nonassertive.
- [X] T016 [US2] Correct confirmed listing/detail heading, link, and mobile-content issues in `components/shop/CatalogListing.tsx`, `components/shop/ProductDetail.tsx`, and `components/shop/shop-luxury.css` while preserving Persian RTL and the existing premium presentation.
- [X] T017 [US2] Compare any Organization or WebSite facts emitted from `app/(main)/page.tsx` and `lib/persian-seo.ts` with `lib/content/contact.ts`; remove or correct only unsupported claims.
- [X] T018 [US2] Repeat the same desktop/mobile content and structured-data checks for corrected findings, recording observed outcomes, source-only hypotheses, and external rich-result limits in `specs/034-seo/audit-report.md`.

**Checkpoint**: User Story 2 can be checked from visible pages and source-of-truth records independently of ranking outcomes.

---

## Phase 5: User Story 3 - Repeat an Evidence-Based SEO Review (Priority: P3)

**Goal**: A maintainer can install the guidance from a clean checkout and reproduce the evidence, corrections, and limits of the audit.

**Independent Test**: Follow the clean-checkout installation and audit procedure, record a finding using the required fields, and repeat the same observation after a correction.

### Implementation for User Story 3

- [X] T019 [P] [US3] Verify the published clean-checkout installation procedure for the selected skill and its reference file in `.agents/skills/seo/SKILL.md`; record the source, revision, elapsed setup time, and any installation limitation in `specs/034-seo/audit-report.md`.
- [X] T020 [P] [US3] Refine `specs/034-seo/quickstart.md` so the actual observed setup, sample selection, browser/HTTP checks, and same-check verification can be repeated without undocumented steps.
- [X] T021 [US3] Complete the provenance, targets, checks, preferred URL decisions, findings, and verification sections in `specs/034-seo/audit-report.md`; every finding must have target, severity, evidence status, impact, and correction, and every corrected finding must include a repeated observation.
- [X] T022 [US3] Record unavailable Search Console, field performance, indexing, ranking, or rich-result evidence explicitly as unverified in `specs/034-seo/audit-report.md`; retain measured Lighthouse details only when the tool was actually run.

**Checkpoint**: User Story 3 has a reproducible report and installation path, even if an external search platform has not yet validated outcomes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish the feature against the constitution and measurable outcomes.

- [X] T023 Run the existing SEO regression suite and `npm run typecheck`; record commands, results, and any unresolved failures in `specs/034-seo/audit-report.md` without rewriting `tests/unit/seo.test.ts` merely to match implementation.
- [X] T024 Stop any active Next server before `npm run build`, then restart and check real browser interactions, client chunks, mobile/desktop layout, Persian RTL, and visual quality; record results in `specs/034-seo/audit-report.md`.
- [X] T025 Check SC-001 through SC-006 from `specs/034-seo/spec.md` against the saved evidence, leave unsupported outcomes unverified, and record final status plus remaining work in `specs/034-seo/audit-report.md`.

**Checkpoint**: The report distinguishes verified site behavior from external search outcomes and the constitution's quality gates are evidenced.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately; inspect and preserve preexisting uncommitted SEO work.
- **Foundational (Phase 2)**: Depends on setup. Its sampled responses and decisions block corrective work.
- **User Stories (Phases 3–5)**: Depend on the foundational evidence. Their code and document work can be validated separately; execute in priority order in this one-agent checkout.
- **Polish (Phase 6)**: Depends on the selected user stories and their repeat checks.

### User Story Dependencies

- **US1 (P1)**: Depends only on foundational observations; delivers the crawl/discovery MVP.
- **US2 (P2)**: Depends only on foundational observations; compares search-facing facts with visible content and current records.
- **US3 (P3)**: Depends on the shared audit sample; its procedure can use any corrected finding from this feature and does not require a specific US1 or US2 code change.

### Within Each User Story

- Correct only observed failures or clearly justified source risks; repeat the same check after a correction.
- In US1, T009 follows T007's URL policy; T011 follows preferred URL decisions; T012 follows all US1 corrections.
- In US2, T016 follows the component-specific review, and T018 follows all US2 corrections.
- In US3, T021 uses the completed procedure and observations; T022 follows the evidence inventory.
- No new automated test-writing task is mandated by the spec; T023 runs the existing focused suite as a verification gate.

### Parallel Opportunities

- T007 and T008 touch separate URL and crawler-policy files after the shared baseline.
- T014 and T015 touch separate structured-data and product-card files after the content audit.
- T019 checks skill installation while T020 edits the versioned quickstart; T021 consolidates their results.

## Parallel Example: User Story 1

```text
T007: Review lib/seo-metadata.ts canonical behavior.
T008: Review app/robots.ts and private route indexing behavior.
Then T009–T012 integrate the recorded URL decisions and verify results.
```

## Parallel Example: User Story 2

```text
T014: Review product structured facts in lib/persian-seo.ts and product route.
T015: Review product-card links and gallery descriptions in components/shop/.
Then T016–T018 resolve shared rendering issues and repeat checks.
```

## Parallel Example: User Story 3

```text
T019: Check clean-checkout skill installation.
T020: Refine specs/034-seo/quickstart.md from the observed audit workflow.
Then T021–T022 consolidate the reproducible report.
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phases 1 and 2 to establish accurate baseline evidence.
2. Complete T007–T012 for public discovery and private/missing-route behavior.
3. Re-run US1's independent live-response check before moving to on-page changes.

### Incremental Delivery

1. US1 resolves confirmed crawl, preferred-URL, and sitemap issues.
2. US2 resolves confirmed content, link, image, mobile, and structured-fact issues.
3. US3 makes installation and audit repetition reliable from a clean checkout.
4. Phase 6 verifies code, browser behavior, and the saved report against all success criteria.

## Notes

- Existing uncommitted application edits and the previous marked-complete tasks are inputs to inspect, not proof that the revised feature is finished.
- The audit report is created during implementation; do not mark source hypotheses or unavailable platform data as observed successes.
- Do not run destructive database commands or rebuild `.next` under a running server.
