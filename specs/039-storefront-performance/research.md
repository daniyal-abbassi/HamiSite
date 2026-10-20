# Research: Faster Storefront Experience

**Date**: 2026-10-15. Source inspection only; no new runtime baseline has been collected.

## 1. Retain the installed guidance and current stack

**Decision**: Use `.agents/skills/react-best-practices/SKILL.md`, especially `async-parallel`, `bundle-dynamic-imports`, and `server-cache-react`, selectively against the current Next.js 15.5.25 / React 19.2.8 stack.

**Rationale**: The user-linked [FarsiUI skill](https://farsiui.ir/skills/vercel-react-best-practices) is already installed; duplicating it adds no runtime benefit. Existing code already implements several high-priority patterns.

**Alternatives considered**: Bulk application of all rules, dependency upgrades, or installing a new data-fetch library. Rejected absent measured need and compatibility review.

## 2. Preserve working streaming and mobile media behavior

**Decision**: Measure existing boundaries before changing them.

**Evidence**: `app/(main)/page.tsx` has separate Suspense boundaries for featured, discounted, and additional product sections, a responsive hero picture, and `revalidate = 60`. `app/(main)/shop/page.tsx` runs listing, category tile, and freshness reads in parallel. `ScrollSmooth.tsx` dynamically imports Lenis only after fine-pointer/reduced-motion checks.

**Rationale**: Reimplementing these patterns would duplicate working behavior. The null discounted-products fallback is a possible layout-shift contributor to verify, not an established failure.

**Alternatives considered**: Adding streaming everywhere or dropping motion wholesale. Neither is justified by static source inspection.

## 3. Product reads and request memoization

**Decision**: Measure the repeated product reader across metadata/page; if confirmed, share request-scoped memoization with a stable primitive slug, and overlap genuinely independent reads.

**Evidence**: `app/(main)/shop/[slug]/page.tsx` invokes `findProductBySlug` from both `generateMetadata` and `ProductPage`; the page then awaits `catalogGeneratedAt`. The reader in `lib/catalog-db.ts` performs a direct Prisma lookup.

**Rationale**: [React cache documentation](https://react.dev/reference/react/cache) describes per-request memoization. One shared cached function and stable arguments are required; it is not a persistent cache and does not replace authorization.

**Alternatives considered**: Process-global caching of product/account objects. Rejected because freshness and private-data lifetime would require a broader design. Do not remove nonce/header handling or SEO metadata to obtain static rendering.

## 4. Broad queries need semantic equivalence

**Decision**: Profile rail selection and catalog DTO size; optimize only with equivalent results across variants, filters, totals, ordering, and missing prices.

**Evidence**: `discountedProductsRail` requests up to 1,000 products with variants, computes eligible discounts and sorts them before taking five. `obtainableNowRail` similarly selects a small shelf from a broad read. `queryProducts` has separate query paths for computations requiring price or search semantics. `homepageProductsRail` retains explicit legacy variant-image associations as image-only fallbacks.

**Rationale**: Smaller arbitrary limits can silently change the winning discount or displayed totals. Payload projection is a separate opportunity from selection changes.

**Alternatives considered**: Push every computed condition into a simplistic database filter, slice before sorting, or use snapshot product/pricing data. Rejected because these change behavior or violate database authority. Retain expensive logic if no safe measured improvement is demonstrated.

## 5. Shared drawer and interactions

**Decision**: Inspect route bundles and first-open behavior before splitting the optional drawer; profile expensive consumers before adding memoization.

**Evidence**: `CartProvider.tsx` imports `CartDrawer` eagerly and renders it in the provider mounted by the main layout. Auth resolution precedes the cart request by design. Product detail is a client component with variant state and gallery content.

**Rationale**: [Next.js 15 lazy-loading documentation](https://nextjs.org/docs/15/app/guides/lazy-loading) supports on-demand client-component loading. Client-only options belong in client boundaries; a dynamic import alone does not prove bytes were deferred. Measure the first drawer open as well as startup.

**Alternatives considered**: Disable server rendering for primary content or parallelize cart before authentication. Rejected for content visibility and security/behavior risks.

## 6. Measurement and test safety

**Decision**: Use production-equivalent browser traces, the specification profile, paired data, and nearest-rank percentiles. Keep laboratory action-feedback timing separate from field INP. Timing targets remain unproven until baseline/final evidence exists.

**Evidence**: `vitest.frontend.config.ts` intentionally omits DB-reset setup; the general suite can reset DB tables. `CLAUDE.md` documents the stale-build/chunk mismatch failure. `tools/shots/viewport.mjs` is an existing screenshot utility with machine-specific browser paths; it does not supply the required controlled timing protocol by itself.

**Alternatives considered**: Use dev-mode timing, an overall score alone, prior build-size reports, or guest checkout redirects as proof. Rejected as non-comparable evidence. Browser tooling must verify actual CPU/network controls before measurements; missing capabilities are recorded explicitly.

## Resolved scope and prerequisites

Public routes are first priority; authenticated cart, checkout review, and partner browsing are mandatory acceptance coverage. Admin/TMA are regression checks only where shared code changes. Approved test accounts and stable data are execution prerequisites, not reasons to invent values or reseed. No production purchase is necessary. Existing security, SEO, and freshness guarantees constrain every optimization. Research was performed sequentially to honor the checkout's single-agent rule.
