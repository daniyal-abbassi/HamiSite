# Research: Storefront SEO Audit and Improvements

**Date**: 2026-10-14 | **Feature**: [spec.md](spec.md)

## 1. Skill source and reproducible installation

**Decision**: Treat the selected FarsiUI SEO listing as the requested skill and the installed `seo` package from `addyosmani/web-quality-skills` as its inspectable source. Document the upstream install command and record the installed revision during implementation. Keep this feature's audit procedure in versioned project documentation because `.agents/skills/` is ignored by Git.

**Rationale**: The local `.agents/skills/seo/SKILL.md` and structured-data reference are present, but cannot be relied on in a clean checkout. The upstream [skill listing](https://www.skills.sh/addyosmani/web-quality-skills/seo) gives a repeatable install command and the [source](https://github.com/addyosmani/web-quality-skills/blob/main/skills/seo/SKILL.md) identifies the guidance.

**Alternatives considered**: Checking in a copied skill duplicates an upstream package and risks stale guidance. Treating the present ignored file as installation completion fails the clean-checkout scenario.

## 2. Evidence and environment

**Decision**: Inspect rendered HTTP responses and a real mobile/desktop browser view for representative pages. Use Lighthouse SEO results where available, supplemented by direct checks of redirects, robots, sitemap, links, metadata, and structured data. Record the environment, date, URLs, commands, and evidence status in a saved audit report. Keep Search Console and field performance conclusions pending unless data is provided.

**Rationale**: Source inspection alone cannot prove what crawlers or shoppers receive. The selected skill distinguishes rendered-page evidence from source hypotheses and does not equate an audit score with ranking.

**Alternatives considered**: Unit tests alone miss runtime redirects, streamed metadata, catalog data, and browser behavior. A Lighthouse score alone covers only part of SEO.

## 3. Preferred URLs and catalog variants

**Decision**: Make a route-by-route policy for home, shop, product, category, brand, and alternate URLs. Strip tracking and display-only parameters only when they do not change substantial content. Assess filtered and paginated views separately; do not assume every query must canonicalize to page one. Align rendered canonical, redirect target, prominent internal links, and sitemap entry. Review `formatCanonicalUrl` because it currently removes all query strings.

**Rationale**: [Google's canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) treats canonical links as preference signals and advises consistency among methods. A blanket query removal could collapse genuinely different catalog pages.

**Alternatives considered**: Force all query variants to `/shop`; simple but can misrepresent distinct pages. Preserve all parameters; simple but can create many duplicate or low-value URLs.

## 4. Crawl control and private pages

**Decision**: Audit `app/robots.ts`, private-page indexing signals, authentication behavior, and missing-page status together. Do not claim that a robots disallow hides a URL from search. Where index exclusion matters, choose a crawler-visible response or noindex strategy appropriate to that route, without exposing private content.

**Rationale**: [Google's noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing) says crawlers cannot observe noindex on a robots-blocked page. Existing routes use both disallow rules and page-level noindex, so the effect must be evaluated, not assumed.

**Alternatives considered**: Treat every disallow as successful deindexing; contradicted by crawler behavior. Remove all disallows; unnecessary and potentially exposes private journeys to crawling.

## 5. Sitemap and catalog authority

**Decision**: Derive public product, category, and brand URLs from the existing database-backed catalog and verify that every included URL resolves to an eligible current page. Check completeness beyond the current 50,000-product selection and apply sitemap limits or a sitemap index if needed. Keep absolute URLs aligned with the deployment origin. Do not change the database schema or reseed.

**Rationale**: The current `app/sitemap.ts` fetches up to 50,000 products and builds category/brand entries from catalog queries. [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) asks for absolute preferred URLs. The implementation must inspect publication and availability semantics before deciding filters.

**Alternatives considered**: Static URL list becomes stale; treating every database row as indexable could include missing or nonpublic content.

## 6. On-page and structured facts

**Decision**: Review descriptive Persian titles, summaries, heading hierarchy, links, images, mobile content, and existing product/organization/breadcrumb structured data against visible content and verified catalog/contact facts. Remove unsupported claims rather than fabricating a price, stock state, rating, image, or contact detail. Do not impose an exact one-H1 or character-count rule.

**Rationale**: Constitution Principle I requires honest claims; Principle II requires Persian RTL. The selected SEO skill treats heading and title lengths as contextual quality checks. Existing `buildProductJsonLd` may emit an offer with a fallback zero price, making data comparison a necessary implementation check.

**Alternatives considered**: Add rich-result fields simply for eligibility; conflicts with source-of-truth and visibility requirements. Blanket markup removal would discard accurate facts.
