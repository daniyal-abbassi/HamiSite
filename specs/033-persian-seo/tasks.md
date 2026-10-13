# Tasks: Persian SEO (سئوی فارسی)

**Feature**: `specs/033-persian-seo`  
**Status**: Completed  

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Type definitions, structured data contracts, and test scaffolds

- [x] T001 [P] Create SEO type definitions and schema contracts in `types/persian-seo.ts`
- [x] T002 [P] Create test scaffold for Persian SEO in `tests/unit/persian-seo.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Text normalization, slug sanitizer, and schema builders

**⚠️ CRITICAL**: Must complete before user story integration

- [x] T003 Implement Persian character normalizer and ZWNJ slug sanitizer in `lib/persian-seo.ts`
- [x] T004 [P] Implement structured data builders (`buildProductJsonLd`, `buildBreadcrumbJsonLd`) in `lib/persian-seo.ts`

**Checkpoint**: Core SEO utilities and JSON-LD builders ready for component integration.

---

## Phase 3: User Story 1 - Technical Persian SEO & Document Metadata (Priority: P1) 🎯 MVP

**Goal**: Guarantee document language, RTL direction, OpenGraph `locale: "fa_IR"`, natural Persian titles, and dynamic canonical URLs across all public pages.

**Independent Test**: Load `/`, `/shop`, and `/shop/[slug]` routes; inspect rendered HTML headers for `lang="fa"`, `dir="rtl"`, `og:locale="fa_IR"`, and clean canonical links.

### Implementation for User Story 1

- [x] T005 [P] [US1] Verify and enforce `lang="fa"`, `dir="rtl"`, and `og:locale="fa_IR"` in `app/layout.tsx` and `lib/seo-metadata.ts`
- [x] T006 [P] [US1] Ensure natural Persian page title formatting (`[موضوع] | حامی همراه`) in storefront metadata
- [x] T007 [P] [US1] Add unit tests for Persian metadata and OpenGraph generation in `tests/unit/persian-seo.test.ts`

**Checkpoint**: Technical document metadata conforms to Persian SEO standards.

---

## Phase 4: User Story 2 - Persian Structured Data & Rich Snippets (Priority: P2)

**Goal**: Inject Google-compliant `schema.org/Product`, `Offer`, and `BreadcrumbList` JSON-LD scripts on public product detail and category pages.

**Independent Test**: Validate `/shop/[slug]` with Google Rich Results validator; verify valid Product, Offer (pricing/availability), and Breadcrumb schemas without errors.

### Implementation for User Story 2

- [x] T008 [P] [US2] Integrate `Product` and `Offer` JSON-LD schema into `app/(main)/shop/[slug]/page.tsx`
- [x] T009 [P] [US2] Integrate `BreadcrumbList` JSON-LD schema into `app/(main)/shop/[slug]/page.tsx`
- [x] T010 [P] [US2] Add unit tests validating schema structure for in-stock, out-of-stock, and breadcrumbs in `tests/unit/persian-seo.test.ts`

**Checkpoint**: Structured data is actively rendered and passes schema validation.

---

## Phase 5: User Story 3 - URL Slug Normalization & Sitemap Hygiene (Priority: P3)

**Goal**: Prevent raw ZWNJ (`\u200c`), broken `%E2%80%8C` sequences, and Arabic characters in URL slugs, ensuring clean sitemap entries and crawler access.

**Independent Test**: Request `/sitemap.xml` and `/robots.txt`; verify that all product/category URLs use sanitized, ZWNJ-free slugs, and crawl policies properly guard private paths.

### Implementation for User Story 3

- [x] T011 [P] [US3] Integrate `sanitizePersianSlug` into slug generation and lookups in `lib/persian-seo.ts` and `lib/catalog.ts`
- [x] T012 [P] [US3] Verify `app/sitemap.ts` dynamic product and category URLs for ZWNJ-free, URL-safe paths
- [x] T013 [P] [US3] Verify `app/robots.ts` crawler directives and sitemap reference
- [x] T014 [P] [US3] Add unit tests for slug sanitization and Arabic/Persian character normalization in `tests/unit/persian-seo.test.ts`

**Checkpoint**: All slugs and crawler endpoints are clean, normalized, and crawl-friendly.

---

## Phase 6: Polish & Quality Gates

**Purpose**: System verification and final validation

- [x] T015 Run full unit test suite with `npm run test:unit`
- [x] T016 Run strict TypeScript check with `npm run typecheck`
- [x] T017 Update `specs/033-persian-seo/tasks.md` with completion status

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - blocks user stories.
- **User Stories (Phases 3-5)**: Depend on Phase 2; can proceed in parallel or sequentially by priority (US1 -> US2 -> US3).
- **Polish (Phase 6)**: Depends on all user stories being completed.

### Parallel Opportunities
- T001 and T002 can run in parallel (types vs test scaffold).
- T003 and T004 can run in parallel (slug sanitizer vs JSON-LD builders).
- T008, T009, and T010 can run in parallel.
- T011, T012, T013, and T014 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1: Document Language & Metadata).
3. Validate metadata in browser/unit tests.

### Incremental Delivery
1. Add Phase 4 (User Story 2: Product & Breadcrumb JSON-LD).
2. Add Phase 5 (User Story 3: Slug Sanitization & Sitemap Hygiene).
3. Complete Phase 6 (Quality Gates: `tsc` & `npm run test:unit`).
