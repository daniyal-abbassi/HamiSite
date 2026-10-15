---
description: "Dependency-ordered implementation tasks for the Persian typography refresh"
---

# Tasks: Refresh Persian Typography

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [typography contract](contracts/typography-contract.md), and [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by the four independent user stories. Tasks are marked complete only after implementation or review evidence is recorded.

## Format: `[ID] [P?] [Story] Description`

- **[P]** means the task can be prepared independently in a different file after its phase prerequisites. The repository's single-agent rule still applies.
- **[US1]–[US4]** map to the stories in [spec.md](spec.md).
- All paths are relative to the repository root.

## Phase 1: Setup

**Purpose**: Establish a reviewable baseline without changing the app.

- [X] T001 Review the current font declarations, font files, and inherited font aliases in `app/globals.css`, `tailwind.config.ts`, and `public/fonts/`; record rendered-family and file-size baseline in `specs/038-persian-typography/implementation-evidence.md`.
- [X] T002 Capture real-content phone and desktop baselines for home, shop, product, cart, and checkout and link the captures in `specs/038-persian-typography/implementation-evidence.md`; mark unavailable authenticated states unverified rather than inventing content.
- [X] T003 Verify the upstream source and usage rights of the Estedad and Vazirmatn files in `public/fonts/` and record evidence in `specs/038-persian-typography/implementation-evidence.md` before either is selected for release.

---

## Phase 2: Foundational

**Purpose**: Select a coherent type direction and shared roles before page work.

- [X] T004 Compare revised Estedad and Vazirmatn treatments against the identical five-screen samples in `specs/038-persian-typography/implementation-evidence.md`; document hierarchy, mixed-script behavior, readability, and premium fit, then select a direction or record why a third licensed candidate is required.
- [X] T005 Define the selected font stack, real available weights, and a compact shared type-role scale in `app/globals.css` and `tailwind.config.ts`, keeping Persian letter spacing at zero and preserving the existing RTL document in `app/layout.tsx`.
- [X] T006 Audit the untracked RTL helper `lib/persian-typography.ts` against the current `lib/utils.ts` formatter and document the one authoritative visible-price path in `specs/038-persian-typography/implementation-evidence.md`; do not overwrite or duplicate the earlier RTL work.

**Checkpoint**: The treatment, rights, and type roles are explicit. Each story can now be implemented and reviewed independently.

---

## Phase 3: User Story 1 — Clear storefront reading hierarchy (Priority: P1) 🎯 MVP

**Goal**: Give the main shopping journey a distinct, legible premium hierarchy.

**Independent Test**: Compare the five core screens at phone and desktop widths, then at 200% zoom. Their titles, body passages, prices, and primary actions remain distinct and fully readable.

- [X] T007 [US1] Apply the selected display, page-heading, section-heading, and supporting-text roles in `app/(main)/home.css` and `components/home/SectionHead.tsx`, preserving actual content, editorial emphasis, and the intentional mobile hiding of decorative microcopy in `app/globals.css`.
- [X] T008 [P] [US1] Replace cramped product and filter text treatments with the chosen roles in `components/shop/shop-luxury.css`, `components/shop/CatalogListing.tsx`, and `components/shop/FilterSidebar.tsx`; preserve responsive card density where it remains readable.
- [X] T009 [US1] Apply the selected name, supporting-copy, price, and action hierarchy in `components/shop/ProductCard.tsx` and `components/shop/ProductDetail.tsx`, checking long names and visible price units.
- [X] T010 [P] [US1] Align cart summary and checkout hierarchy with the same roles in `components/cart/CartLine.tsx`, `components/cart/CartPageClient.tsx`, and `components/checkout/CheckoutClient.tsx`, without changing totals or payment behavior.
- [ ] T011 [US1] Inspect the five core screens in a real browser, resolve observed defects in `app/(main)/home.css`, `components/shop/shop-luxury.css`, `components/shop/ProductCard.tsx`, `components/cart/CartLine.tsx`, or `components/checkout/CheckoutClient.tsx`, and record phone, desktop, and 200% results in `specs/038-persian-typography/implementation-evidence.md`.

**Checkpoint**: US1 provides an independently reviewable storefront typography refresh.

---

## Phase 4: User Story 2 — Mixed-script names, prices, and numbers (Priority: P1)

**Goal**: Make product identifiers and localized figures unambiguous without changing underlying values.

**Independent Test**: Review at least 20 Persian/Latin samples and compare prices and quantities across product cards, details, cart, checkout, and a numeric table.

- [X] T012 [US2] Inventory 20 real mixed-script product and UI examples in `specs/038-persian-typography/implementation-evidence.md`, including punctuation, long model codes, percentages, prices, and a narrow card.
- [X] T013 [P] [US2] Correct only observed reading-order or truncation defects in `components/shop/ProductCard.tsx`, `components/shop/ProductDetail.tsx`, and `components/shop/ProductListRow.tsx`, preserving official model spelling and meaningful Persian half-spaces.
- [X] T014 [US2] Align shopper-visible price and quantity presentation with the established `lib/utils.ts` conventions in `components/cart/CartLine.tsx` and `components/checkout/CheckoutClient.tsx`; retain the existing missing-price behavior and canonical input values.
- [X] T015 [US2] Apply readable numeric alignment where values are compared in `components/shop/ProductCard.tsx` and `components/admin/dashboard/sections/CatalogInventorySection.tsx`, without changing metric data or forcing a monospaced Latin face onto Persian prose.
- [X] T016 [US2] Recheck all 20 examples, price units, numeric columns, and word joining against `specs/038-persian-typography/contracts/typography-contract.md`; save actual pass/fail evidence in `specs/038-persian-typography/implementation-evidence.md`.

**Checkpoint**: US2 is independently verifiable through product and numeric-content examples.

---

## Phase 5: User Story 3 — Readable forms and operational screens (Priority: P2)

**Goal**: Carry the coherent type system into functional journeys without sacrificing dense-data clarity.

**Independent Test**: Inspect login, registration, account, partner, admin, and Telegram mini-app examples with long labels, an error state, and inherently LTR fields at phone and desktop widths.

- [X] T017 [US3] Review shared control text and error spacing in `components/ui/button.tsx`, `components/ui/input.tsx`, and `components/ui/textarea.tsx`; apply the selected label/control roles only where rendered evidence shows a mismatch.
- [X] T018 [P] [US3] Apply the selected form hierarchy to `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`, and `components/checkout/CheckoutClient.tsx`, preserving field meaning, labels, validation, and existing LTR input behavior.
- [X] T019 [P] [US3] Apply the selected body, label, and numeric roles to representative partner screens in `components/partners/PartnerForm.tsx` and `components/partners/bundles/PartnerBundleCard.tsx`, keeping long values readable.
- [X] T020 [P] [US3] Apply the selected dense-data hierarchy to an admin dashboard, table, and form in `components/admin/dashboard/sections/CatalogInventorySection.tsx`, `components/admin/ui/Pagination.tsx`, and `components/admin/products/ProductForm.tsx`; preserve current admin actions and data.
- [X] T021 [P] [US3] Apply the selected typography roles to representative Telegram mini-app product/order content in `components/tma/ProductCard.tsx`, `components/tma/OrderCard.tsx`, and `app/(tma)/tma/products/page.tsx`, preserving the current RTL edits already in progress.
- [ ] T022 [US3] Review the customer, partner, admin, and Telegram mini-app samples in a real browser at phone and desktop widths, including 200% zoom for form errors and controls; record results in `specs/038-persian-typography/implementation-evidence.md`.

**Checkpoint**: US3 can be reviewed on functional screens independently of font-loading work.

---

## Phase 6: User Story 4 — Stable font loading and fallback (Priority: P3)

**Goal**: Keep text and actions usable before and without the preferred font.

**Independent Test**: Load representative screens with delayed and blocked preferred-font requests; compare readable first render, layout movement, and action usability.

- [X] T023 [US4] Inspect actual font requests, glyph coverage, and computed families for Persian and Latin samples from `app/globals.css` and `public/fonts/`; record findings in `specs/038-persian-typography/implementation-evidence.md`.
- [X] T024 [US4] Correct only measured fallback or loading defects in `app/globals.css` and `tailwind.config.ts`, keeping the self-hosted strategy and checking the resulting font request count and layout movement.
- [X] T025 [US4] Verify home, product, checkout, and one operational screen during delayed and blocked font loading; record legibility and action stability in `specs/038-persian-typography/implementation-evidence.md`.

**Checkpoint**: US4 establishes usable first render and fallback behavior.

---

## Phase 7: Polish and cross-cutting verification

- [X] T026 Reconcile all observed defects with FR-001–FR-013 and SC-001–SC-006 in `specs/038-persian-typography/implementation-evidence.md`, marking unavailable states and owner assessment explicitly rather than claiming an unobserved pass.
- [X] T027 Run the non-destructive quality gates from `specs/038-persian-typography/quickstart.md` (`npm run typecheck`, `npm run test:unit`, `npm run build`, `git diff --check`); record command results and restart/verify any Next server whose `.next` output was replaced.
- [ ] T028 Present the same five before/after storefront screens and record the owner's four-of-five clarity and premium-fit assessment in `specs/038-persian-typography/implementation-evidence.md`; revise any screen the owner rejects before claiming SC-005.
- [X] T029 Review `git status --short` and document final changed files, validation limits, and remaining follow-up in `specs/038-persian-typography/implementation-evidence.md` without staging, committing, pushing, or altering unrelated work.
- [X] T030 [US1] Respond to the owner's review that numerals and prices do not fit the premium direction: establish a quieter proportional-figure hierarchy with a secondary Toman unit across the same five storefront screens, then capture a same-content review set in `specs/038-persian-typography/implementation-evidence.md`.

---

## Dependencies and execution order

- **Setup (T001–T003)** has no application-code dependency; capture and rights review can be prepared independently.
- **Foundation (T004–T006)** depends on setup; T005 depends on the T004 selection and T003 rights check. T006 must precede any formatter edit.
- **US1 (T007–T011)** and **US2 (T012–T016)** depend on shared roles. US2 can use existing screens independently, but recheck after US1 where files overlap.
- **US3 (T017–T022)** depends on shared roles. Its subareas can be prepared independently; overlapping checkout files require sequential edits.
- **US4 (T023–T025)** depends on the selected font and roles and can be reviewed independently of US2/US3 logic.
- **Polish (T026–T029)** follows the desired stories; owner review is a release criterion, not a substitute for technical validation.

## Parallel opportunities

| Phase | Independent file work | Constraint |
| --- | --- | --- |
| Setup | T002 screen capture and T003 rights research | Research is independent, but both write one evidence file, so record sequentially |
| US1 | T008 shop CSS and T010 cart/checkout hierarchy | T009 shares shop components, so integrate after T008 |
| US2 | T013 mixed names and T015 numeric tables | Both may touch ProductCard; edit that file sequentially |
| US3 | T018 auth, T019 partner, T020 admin, T021 Telegram mini-app | Distinct areas, but only one agent works in this checkout |

## Implementation strategy

**MVP**: Complete setup, select the treatment, establish roles, then deliver US1. Stop and validate the five storefront screens before extending the refresh.

**Incremental delivery**: Add US2 for accurate mixed-script and numeric presentation, US3 for functional surfaces, and US4 for loading resilience. Finish with the full quality gates and owner comparison.

**Authorization boundary**: Implementation began after the owner's explicit `/speckit-implement` confirmation. T025 is complete with delayed and blocked font evidence across its required route set. T011 and T022 remain open because actual 200% browser zoom could not be verified and authenticated admin/customer/TMA states were unavailable in the current browser session. T028 remains open for the owner's five-screen clarity and premium-fit judgment.
