# Implementation Plan: Faster Storefront Experience

**Branch**: `Hami-v3` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Input**: `specs/039-storefront-performance/spec.md`

## Summary

Measure the production shopping journey, then reduce the largest demonstrated delays while retaining the current Persian premium design and commerce behavior. Start with server read duplication and sequencing, unnecessarily broad rail reads, and optional client code in the shared shell. Apply changes in bounded increments and keep only measured improvements that pass correctness and visual checks. Existing streaming, responsive hero imagery, and conditional desktop scrolling are retained unless evidence identifies a defect.

This is the Phase 0/1 design output. Baseline measurements and application changes belong to implementation; no speed improvement is claimed here. The setup script returned `039-storefront-performance` as its logical feature branch, but `git branch --show-current` confirms the actual checkout remains `Hami-v3`.

## Technical Context

**Language/Version**: TypeScript ^5.5.4; Next.js 15.5.25; React/React DOM 19.2.8 as declared in `package.json`. Record exact lockfile/runtime versions in each measurement run.

**Primary Dependencies**: Prisma ^5.20.0, Tailwind CSS ^4.3.3, GSAP, Motion, Lenis, existing UI components. The installed Vercel skill is engineering guidance, not a new runtime dependency. No framework upgrade or new caching library is planned.

**Storage**: Existing PostgreSQL catalog, customer carts, orders, and partner records. No schema change. Performance evidence is local JSON, trace, and image artifacts with sanitized account identifiers.

**Testing**: Vitest through `vitest.frontend.config.ts`; typecheck; production build; real-browser traces and functional scenarios. Database suites are permitted only with a verified disposable test database.

**Target Platform**: Existing same-origin web application, mobile first (390px) with desktop comparison (1280px), including authenticated shopping and partner states.

**Project Type**: Next.js App Router commerce application with existing API contracts.

**Performance Goals**: Spec SC-001–SC-006: median public-page principal-content timing <=2.5s; >=20% improvement for originally slower routes; p95 action feedback <=200ms; median CLS <=0.1; no >10% completion-time regression; preserved commerce and visual behavior.

**Constraints**: Do not weaken auth/CSP/CSRF, leak account data through caches, change prices or stock semantics, lose metadata, remove principal content to improve scores, reseed data, or build while a process is serving the same `.next` directory. Auth-before-cart is a real dependency and must not be blindly parallelized.

**Scale/Scope**: Seven representative routes: home, shop, one category, one product, authenticated cart, checkout review, partner bundle browsing. Shared UI changes additionally require admin and Telegram smoke checks; dedicated admin/TMA optimization is out of scope.

## Constitution Check

| Gate | Pre-research | Post-design evidence |
| --- | --- | --- |
| I: Authentic content | PASS | Existing persisted content and fixed sample identities; no synthetic stock or prices. |
| II: Persian RTL | PASS | Preserve TomanPrice, canonical formatting, mixed-script order, and logical layout. |
| III: Database authority | PASS | Optimize shared readers while retaining query semantics and existing API envelopes; no new persistent cache of private data. |
| IV: Premium quality | PASS | Matching mobile/desktop captures, theme checks, motion preservation, and owner assessment required. |
| Safety and completion | PASS | Safe build lifecycle, isolated DB requirement, interactive browser verification, and explicit unverified states. |

All design gates pass. These are design compliance results, not implementation acceptance results. Authenticated access and browser throttling are execution prerequisites; unresolved access must keep the affected verification open.

## Project Structure

### Documentation (this feature)

```text
specs/039-storefront-performance/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/performance-validation.md
```

`tasks.md` is produced by the next phase. `evidence/` will hold baseline/final manifests, measurements, redacted traces, screenshots, and the findings-to-change report during implementation.

### Source Code (repository root)

```text
app/(main)/page.tsx                   # Homepage streaming boundaries
app/(main)/layout.tsx                 # Shared storefront shell
app/(main)/shop/page.tsx              # Parallel listing reads
app/(main)/shop/[slug]/page.tsx       # Product and metadata reads
app/(main)/categories/               # Representative category route
lib/catalog-db.ts                    # Catalog querying and DTOs
lib/shop-query-db.ts                 # Filter/facet assembly
lib/home-rails-db.ts                 # Rail selection and payloads
lib/revalidate-homepage.ts           # Existing freshness mechanism
components/providers/               # Auth and cart lifecycle
components/cart/CartDrawer.tsx       # Optional drawer UI
components/shop/                     # Filters, product details/gallery
components/home/                     # Product rails and motion
components/atmosphere/ScrollSmooth.tsx
components/checkout/CheckoutClient.tsx
components/partners/bundles/
tests/unit/                         # Targeted semantic regressions
```

**Structure Decision**: Optimize existing seams and components. A new abstraction is justified only if it eliminates a measured shared cost without obscuring correctness. Preserve existing URL and data contracts; do not introduce an alternate catalog source.

## Phase 0 — Research conclusions

See [research.md](research.md) for source evidence, decisions, and rejected alternatives. Static inspection identifies candidates, not proven bottlenecks. Technical unknowns have concrete resolution methods: record runtime conditions, trace actual queries and browser activity, and rank measured costs before selecting patches.

## Phase 1 — Implementation design

1. **Establish evidence and safety boundaries.** Freeze route IDs/content state and test accounts. Record five fresh and five returning visits for all seven routes, plus at least 20 repetitions per interaction. Export browser traces and exact throttling settings. Confirm controls hydrate. Capture baseline design at both widths. If controlled throttling is unavailable, record the limitation and do not substitute unthrottled results for acceptance.
2. **Remove measured server duplication and unnecessary waits.** Product metadata and page both call `findProductBySlug`; measure duplication and, if confirmed, share one request-scoped memoized reader with a normalized primitive slug key. Start independent freshness reads alongside product reads where missing-product handling and errors remain correct. Shop already uses `Promise.all`; preserve necessary filter resolution and do not parallelize dependent calls blindly.
3. **Reduce measured catalog work and serialization.** Profile `discountedProductsRail` and `obtainableNowRail`, which request up to 1,000 rows before selecting a small result. Preserve variant-level purchasability, discount-rate ordering, totals, all filters, and tie order. Do not merely lower the cap: a later product may be the correct winner. Prefer equivalent bounded queries/projections only when equality can be established; otherwise retain the current algorithm and address another measured cost. Keep the existing image-only legacy association distinct from authoritative product facts.
4. **Defer optional client work.** If bundle/trace evidence shows a benefit, load the drawer on demand within its client boundary and preserve immediate opening feedback, first-open focus, Escape, focus restoration, and successful-add behavior. Inspect product detail payload/rendering and home motion only where traces show material cost. Keep hero/primary product imagery and meaningful content server-rendered; do not globally disable server rendering.
5. **Protect responsiveness and freshness.** Trace filters, sorting, variant/quantity updates, and cart operations. Fix demonstrated redundant updates or stale-response races locally. Recheck logout/account switching and overlapping requests whenever providers change. Do not add cross-request private caches or alter mutation validation. Keep existing public invalidation semantics.
6. **Compare and accept.** Rerun identical measurements and meaningful regression tests after selected increments; reject changes with a confirmed regression outside SC tolerances. Finish all seven route comparisons, shared admin/TMA smoke tests where affected, screenshots, and owner visual review. Lack of account access is an unresolved verification gap, not a pass.

## Validation mapping

| Requirements | Evidence |
| --- | --- |
| FR-001/002/009 | Frozen route manifest; paired raw samples; findings-to-change decisions |
| FR-003/004 | Content/loading traces; per-action timing and latest-selection behavior |
| FR-005/006/008 | Account isolation, stock/price refresh, mutation and retry checks |
| FR-007 | RTL/price/keyboard/theme/reduced-motion screenshots and owner review |
| FR-010/011 | Interactive shopping journey and affected operational smoke checks |

## Complexity Tracking

No constitution deviation or additional service is proposed. Request memoization and client splitting are conditional changes within the existing architecture; production measurements decide their value.
