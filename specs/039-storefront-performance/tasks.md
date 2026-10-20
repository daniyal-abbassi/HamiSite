---
description: "Dependency-ordered implementation tasks for faster storefront performance"
---

# Tasks: Faster Storefront Experience

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [performance contract](contracts/performance-validation.md), and [quickstart.md](quickstart.md).

**Organization**: Four independently testable user stories, followed by full-feature acceptance. No application implementation has started in this task-generation phase.

**Tracking**: Beads remains the durable issue tracker. This explicitly requested Spec Kit task list is the implementation contract; record implementation status and blockers in Beads as well. Existing typography acceptance gaps remain separate.

## Format: `[ID] [P?] [Story] Description`

- `[P]` denotes work on independent files after its stated prerequisites; it does not authorize multiple agents. This checkout uses one agent.
- `[US1]`–`[US4]` map to the specification's stories.
- Paths are repository-relative. Paths under `specs/039-storefront-performance/evidence/` are new evidence artifacts to create during implementation; no new business-data entities or migrations are needed.
- A candidate optimization is complete only after a measured change or an evidence-backed rejection is recorded. Rejection of a candidate does not waive the story's performance targets.
- Browser acceptance scenarios and existing automated gates are required. New broad test suites are not prescribed; add focused semantic regression coverage only when selected logic changes warrant it.

## Phase 1: Setup

**Purpose**: Establish reproducible evidence and a safe production baseline.

- [X] T001 Review `CLAUDE.md`, `specs/039-storefront-performance/quickstart.md`, and the current checkout status; create/claim the Beads implementation issue and record starting commit, dirty paths, server process ownership, production build identity, and safe build/restart procedure in `specs/039-storefront-performance/evidence/environment.md` without reseeding data.
- [X] T002 Define the MeasurementProfile and the seven exact route samples in `specs/039-storefront-performance/evidence/manifest.json`, following `specs/039-storefront-performance/data-model.md`; record real product/category/bundle IDs, session aliases, themes, viewport, browser/runtime versions, network/CPU settings, and server warm-state policy. Enforce: "explicit units; baseline and final profiles must match except build identity"; "Secrets, session tokens, and customer-identifying data must not be recorded"; "Match server warm state for the primary comparison; report cold server starts separately."
- [X] T003 Verify applied throttling and timing/screenshot export capabilities against `specs/039-storefront-performance/contracts/performance-validation.md`; record the verified measurement procedure and unsupported capabilities in `specs/039-storefront-performance/evidence/measurement-procedure.md`, including actual 390px/1280px views and a successful interactive hydration check after the production server restart.

## Phase 2: Foundational prerequisites

**Purpose**: Collect baseline evidence before changing application code. Public-route measurements and tooling are required before optimization. Missing account access must be recorded and blocks the affected authenticated story acceptance, not independent public work.

- [X] T004 Capture five fresh and five returning baseline visits for home, shop, category, and product in `specs/039-storefront-performance/evidence/baseline-public.json`, with redacted traces and phone/desktop screenshots in `specs/039-storefront-performance/evidence/baseline/`; enforce: "five fresh and five returning valid samples per route and phase"; "A placeholder, authentication redirect, failed principal image, or wrong content state is not a valid successful-route sample"; "Keep failed attempts with reasons and replacements; never silently discard slow samples"; "Content-ready time is navigation start to the designated real content becoming visibly usable"; "LCP is separate because the principal content is not always the largest painted element."
- [X] T005 [P] Capture equivalent authenticated cart, checkout-review, and partner-bundle baselines in `specs/039-storefront-performance/evidence/baseline-authenticated.json`, using the T004 RouteSample constraints and approved stable test contents; record missing access as unverified, never as a guest replacement. Reference any unresolved access limitation in the Beads issue and `specs/039-storefront-performance/evidence/access-limitations.md`.
- [X] T006 Record baseline search, filter, sort, navigation, gallery, variant, quantity, cart, checkout, and partner interaction samples in `specs/039-storefront-performance/evidence/baseline-interactions.json`; enforce: "at least 20 repetitions per action under the same profile"; "Feedback is the first visible confirmation/pending state; completion requires actual data/state readiness"; "Pending feedback does not count as final results"; "Values are milliseconds"; "p95 uses sorted samples at index ceil(0.95*n), counted from one." Keep unavailable authenticated actions explicitly unverified.
- [X] T007 Rank measured bottlenecks and map them to selected/rejected candidate changes in `specs/039-storefront-performance/evidence/findings.md`, recording all OptimizationFinding fields from `specs/039-storefront-performance/data-model.md`; use state transitions "observed -> measured -> selected or rejected -> implemented -> validated or reverted" and enforce "Static candidates remain observed until measured." Record rejections with evidence rather than forcing unnecessary refactors.

**Checkpoint**: Public baseline and measurement method are usable; account limitations are explicit; every selected optimization has a measured hypothesis and correctness guard.

## Phase 3: User Story 1 — Start browsing sooner on mobile (Priority: P1) — MVP

**Goal**: Reduce public-entry delays without hiding useful content or changing catalog facts.

**Independent Test**: Compare home, shop, category, and product samples under the fixed profile; SC-001 principal-content timing and SC-003 layout stability pass, and all four pages remain interactive and visually intact.

- [X] T008 [US1] Measure duplicated metadata/page product reads in `app/(main)/shop/[slug]/page.tsx` and `lib/catalog-db.ts`; when confirmed, share a request-scoped memoized reader with stable primitive slug identity, preserve 404/metadata/nonce behavior, and record query evidence plus the decision in `specs/039-storefront-performance/evidence/us1-product-reads.md`.
- [X] T009 [US1] Evaluate overlapping independent freshness/product reads in `app/(main)/shop/[slug]/page.tsx` and actual filter-resolution dependencies in `lib/shop-query-db.ts`; remove only measured unnecessary sequencing, preserve existing `Promise.all` work in `app/(main)/shop/page.tsx`, and record resulting timings/error behavior in `specs/039-storefront-performance/evidence/us1-waterfalls.md`.
- [X] T010 [US1] Profile broad rail reads and serialized DTOs in `lib/home-rails-db.ts` and `lib/catalog-db.ts`; implement measured projection/query improvements only after comparing selected IDs, variant eligibility, discount ordering, ties, totals, and missing prices against the original algorithm. Record equivalence cases and any rejected limit reduction in `specs/039-storefront-performance/evidence/us1-rail-equivalence.md`; do not slice candidates before determining valid winners.
- [X] T011 [P] [US1] Inspect baseline layout shifts and principal-image timing in `app/(main)/page.tsx`, `components/home/HomeRailSkeleton.tsx`, and `components/shop/ProductGallery.tsx`; correct only demonstrated loading-space or image-delivery defects while preserving primary imagery and existing responsive assets, then record measurements in `specs/039-storefront-performance/evidence/us1-content-stability.md`.
- [X] T012 [US1] Trace public query behavior after selected reader changes in `lib/catalog-db.ts` and `lib/shop-query-db.ts`, checking filter intersection, unknown-slug refusal, price sorting, pagination and DTO compatibility; record regression outcomes and any focused regression-test paths in `specs/039-storefront-performance/evidence/us1-catalog-regressions.md` before accepting those changes.
- [X] T013 [US1] Capture paired final public-entry visits and phone/desktop views in `specs/039-storefront-performance/evidence/final-public.json` and `specs/039-storefront-performance/evidence/final/`; calculate SC-001/SC-003 per route against T004 and record pass/fail in `specs/039-storefront-performance/evidence/us1-acceptance.md`. Correct measured regressions before closing US1; keep unmet absolute targets open.

## Phase 4: User Story 2 — Browse and interact without delays (Priority: P1)

**Goal**: Improve action feedback and completed-state responsiveness while preserving selection and navigation behavior.

**Independent Test**: Run each defined public shopping action at least 20 times; p95 feedback is <=200ms, completion does not regress >10%, and the latest requested state wins.

- [X] T014 [US2] Trace first-load bytes and first/repeated drawer opening in `components/providers/CartProvider.tsx` and `components/cart/CartDrawer.tsx`; conditionally defer the drawer within a client boundary if measured benefit exists, preserving immediate pending feedback, focus, Escape, focus restoration and successful-add opening; record before/after evidence in `specs/039-storefront-performance/evidence/us2-drawer.md`.
- [X] T015 [P] [US2] Profile search/filter/sort/navigation behavior in `components/shop/FilterSidebar.tsx`, `components/shop/FilterSheet.tsx`, and `components/shop/ShopResults.tsx`; fix demonstrated unnecessary updates or absent pending feedback without changing URL semantics, and record rapid-input/back-navigation outcomes in `specs/039-storefront-performance/evidence/us2-catalog-interactions.md`.
- [X] T016 [P] [US2] Profile variant/quantity/gallery response in `components/shop/ProductDetail.tsx` and `components/shop/ProductGallery.tsx`; reduce measured redundant rendering or payload work while retaining official model strings, variant amounts, availability and the current `components/ui/TomanPrice.tsx` treatment; record the decision and samples in `specs/039-storefront-performance/evidence/us2-product-interactions.md`.
- [X] T017 [US2] Check affected motion and shared-shell listeners in `components/layout/Header.tsx`, `components/atmosphere/ScrollSmooth.tsx`, and measured `components/home/` consumers; fix only trace-proven overhead while retaining conditional Lenis loading, touch-native scrolling, keyboard and reduced-motion behavior, and document exact changed paths or evidence-backed rejection in `specs/039-storefront-performance/evidence/us2-motion.md`.
- [X] T018 [US2] Rerun the T006 public interaction sequence into `specs/039-storefront-performance/evidence/final-public-interactions.json` and report p95 feedback/completion, first-open costs, rapid selections, delayed replies and navigation outcomes in `specs/039-storefront-performance/evidence/us2-acceptance.md`; resolve regressions and keep failed SC-002 results open.

## Phase 5: User Story 3 — Keep purchasing accurate and dependable (Priority: P2)

**Goal**: Preserve private account data, accurate prices/stock, and reliable cart/checkout/partner actions under the optimized experience.

**Independent Test**: Use two approved account sessions and designated test contents to verify isolation, cart/checkout totals, partner prices, delayed responses and retries; all SC-004 behavior assertions pass without initiating payment.

- [X] T019 [US3] Verify account switching, logout, in-flight reads and stale responses in `components/providers/AuthProvider.tsx` and `components/providers/CartProvider.tsx`; fix any demonstrated race introduced or exposed by selected changes, preserve auth-before-cart ordering, and record two-account outcomes in `specs/039-storefront-performance/evidence/us3-account-isolation.md` without storing credentials.
- [X] T020 [P] [US3] Verify affected public reader freshness through `lib/revalidate-homepage.ts`, `lib/catalog-db.ts`, and the existing catalog mutation paths, using approved test records or isolated regression checks; preserve invalidation, purchase-time validation, and private-data boundaries, and record exact affected paths/results in `specs/039-storefront-performance/evidence/us3-freshness.md`.
- [X] T021 [US3] Exercise quantity, removal, re-add, delayed loading, failures and retry in `components/cart/CartPageClient.tsx` and `components/checkout/CheckoutClient.tsx`; compare displayed amounts with confirmed server values and check for duplicate mutations/orders/payment requests, correcting affected regressions and recording outcomes in `specs/039-storefront-performance/evidence/us3-purchase-correctness.md` without initiating a real payment.
- [X] T022 [P] [US3] Validate authenticated partner bundle quantity, price and designated test-cart behavior in `components/partners/bundles/PartnerBundleCard.tsx` and its existing consumers; correct affected regressions and record cross-account price isolation and final selections in `specs/039-storefront-performance/evidence/us3-partner-correctness.md`.
- [X] T023 [US3] Rerun authenticated route and action measurements into `specs/039-storefront-performance/evidence/final-authenticated.json` and `specs/039-storefront-performance/evidence/final-authenticated-interactions.json`; compare against T005/T006 and consolidate SC-002/SC-004 plus access limitations in `specs/039-storefront-performance/evidence/us3-acceptance.md`. Missing approved access leaves this task and affected acceptance open.

## Phase 6: User Story 4 — Demonstrate faster performance without losing quality (Priority: P2)

**Goal**: Give the owner reproducible improvement evidence and an honest visual/behavior acceptance record.

**Independent Test**: Recalculate results from raw paired samples, inspect identical phone/desktop states, and verify every result is classified pass/fail/unverified with its evidence and owner assessment.

- [X] T024 [US4] Audit profile/content comparability and aggregate all raw samples into `specs/039-storefront-performance/evidence/comparisons.json`, with JourneyComparison fields from `specs/039-storefront-performance/data-model.md`; enforce "Improvement percent = (baseline - final) / baseline * 100; zero/invalid baselines cannot produce a percentage." Retain failed attempts and identify mismatched data rather than silently substituting samples.
- [X] T025 [P] [US4] Review paired home/shop/category/product/cart/checkout/partner screenshots in `specs/039-storefront-performance/evidence/baseline/` and `specs/039-storefront-performance/evidence/final/` at both widths, including supported themes, Persian digits, long mixed names, clipped prices, keyboard access and reduced motion; record FR-007/SC-006 findings in `specs/039-storefront-performance/evidence/visual-review.md` and route observed defects back to their owning story tasks.
- [X] T026 [P] [US4] Run browser smoke checks on existing admin and Telegram screens affected by shared changes, recording the actual routes, operations tested and access restrictions in `specs/039-storefront-performance/evidence/operational-regressions.md`; do not treat unauthenticated redirects or an empty launch-context page as verification of real operational content.
- [X] T027 [US4] Present the matching phone/desktop comparison set and record the owner's premium-quality assessment in `specs/039-storefront-performance/evidence/owner-review.md`; revise rejected regressions and keep SC-006 visual approval pending until the owner actually responds.
- [X] T028 [US4] Produce `specs/039-storefront-performance/evidence/report.md` with every FR/SC outcome, per-route absolute/relative timing, measured findings and dispositions, functional/visual evidence, and unresolved limitations; enforce "A missing authenticated route, failed target, or unverified owner review prevents full acceptance." Keep laboratory samples separate from any field metrics and move JourneyComparison through "baseline-pending -> baseline-recorded -> final-recorded -> reviewed -> accepted" only when justified.

## Phase 7: Polish and cross-cutting verification

- [X] T029 Run `npm run typecheck`, `npm run test:unit`, `git diff --check`, and the safe stop/build/restart/interactive-browser procedure in `specs/039-storefront-performance/quickstart.md`; record results and any selected regression-test commands in `specs/039-storefront-performance/evidence/quality-gates.md`, verifying HTML, referenced client chunks and actual interactions after rebuilding. Never run a DB-reset suite against existing business data.
- [X] T030 Run `graphify update .` after the final source edits and document results, the final changed-file list, and preserved unrelated work in `specs/039-storefront-performance/evidence/handoff.md`; inspect `git status --short` and follow current commit/push authorization rather than automatically publishing.
- [X] T031 Reconcile final build identity with every accepted comparison in `specs/039-storefront-performance/evidence/comparisons.json`; rerun affected measurements if source/build/content changed after their capture, then update `specs/039-storefront-performance/evidence/report.md` without transferring earlier-build passes to unmeasured code.
- [X] T032 Reconcile `specs/039-storefront-performance/tasks.md` with evidence and Beads status, file concrete remaining blockers in Beads, and record completed work, open gates and next actions in `specs/039-storefront-performance/evidence/handoff.md`; close the implementation issue only when all mandatory acceptance gates actually pass.

## Dependencies & Execution Order

### Phase dependencies

Setup T001 -> T002 -> T003 establishes the environment. T004 and T005 can be collected independently after T003; browser measurements must be scheduled serially to avoid machine-load interference. T006 follows the relevant route baselines. T007 uses T004/T006 and all available T005 evidence. Unavailable account access is recorded explicitly and does not block measured public improvements.

```text
Setup -> Baseline and ranked findings
                 |-> US1 public loading ----|
                 |-> US2 interactions ------|-> US4 final comparison -> Polish
                 |-> US3 commerce safety ---|
                      (requires account access for acceptance)
```

US1 and US2 can be implemented independently after the foundation; serialize shared files (`ProductDetail`, `ProductGallery`, providers and catalog readers). US3 checks the current implementation independently, then repeats affected safety checks after US1/US2 edits. US4 evidence organization can begin early; its final comparison and owner review depend on all affected story results. No story may claim full acceptance while its own required coverage is unavailable.

### Within-story dependencies

- US1: T008 -> T009 -> T010; T011 can proceed after T007 independently of T008–T010; T012 follows changed reader work; T013 follows T008–T012.
- US2: T014/T015/T016 can proceed independently after T007 (and after any preceding edit to the same file); T017 follows traces for the selected work; T018 follows T014–T017.
- US3: T019 and T020 can proceed independently after the relevant changes stabilize; T021 follows T019; T022 can proceed alongside T021 if its provider behavior is stable; T023 follows T019–T022 and requires authenticated baselines.
- US4: T024/T025/T026 can proceed independently once their relevant final artifacts/build are ready; T027 follows T025 and any visual fixes; T028 follows T024–T027.
- Polish: T029 -> T030 -> T031 -> T032. If any final source fix changes an accepted result, repeat the affected story verification before closure.

## Parallel opportunities by story

These examples describe independent work, not permission to launch extra agents. Use a single agent in this checkout; do not run timing recordings concurrently.

| Story | Independent examples | Shared-file constraint |
| --- | --- | --- |
| US1 | T008 product-read review and T011 homepage loading-space review | Serialize all changes to catalog readers and later product-gallery edits. |
| US2 | T014 drawer loading and T015 catalog navigation | Keep provider contracts stable before cart/checkout validation. |
| US3 | T020 public freshness and T022 partner price review | Partner tests run after T019 provider changes stabilize. |
| US4 | T024 aggregation, T025 screenshot review, T026 operational review | Serialize browser measurement activity; keep evidence files separate. |

## Requirement coverage

| Requirement group | Tasks |
| --- | --- |
| FR-001/002/009: reproducible measured improvement | T001–T007, T013, T018, T023–T024, T028, T031 |
| FR-003/004: usable loading and interactions | T008–T018 |
| FR-005/006/008: privacy, prices, freshness, retries | T010, T012, T019–T023 |
| FR-007: visual, RTL, accessibility, metadata | T008, T011, T014–T017, T025, T027 |
| FR-010/011: interactive and operational regression coverage | T003, T018, T021–T023, T026, T029 |
| SC-001/003 | T013 |
| SC-002 | T018, T023 |
| SC-004 | T012, T019–T023, T026 |
| SC-005/006 | T024–T028, T031–T032 |

## Implementation Strategy

**MVP**: Complete setup, public baseline, ranked findings and US1. Validate four public routes against SC-001/SC-003 and the visual/behavior guards. A public MVP does not imply authenticated acceptance or full-feature completion.

**Incremental delivery**: Continue with US2 responsiveness, US3 commerce correctness, then US4 evidence and owner review. Preserve all raw measurements and rejected-candidate decisions. Use targeted fixes and verification; avoid blanket memoization, framework upgrades, arbitrary query caps, and redesigns.

**Authority boundary**: This invocation generates tasks only. Begin application changes in the implementation phase. Future implementation may proceed with useful public work when authenticated access is unavailable, but may not check off the missing acceptance or use a guest substitute. Owner visual approval must be explicit, not inferred from elapsed time.
