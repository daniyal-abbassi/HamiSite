# Contract: Observable Storefront SEO Behavior

**Feature**: [spec.md](../spec.md)

This is an HTTP/rendered-page and audit-report contract. It does not introduce a new public API.

## Route matrix

| Route class | Expected observable behavior |
| --- | --- |
| Home `/` and shop `/shop` | Reachable public pages with accurate Persian title/summary, clear subject, eligible preferred URL, usable links, and crawlable main content |
| Current product `/shop/[slug]` | Product content and search-facing facts match current catalog data; preferred URL and sitemap agree |
| Current category `/categories/[slug]` and brand `/brands/[slug]` | Reachable when a meaningful current destination exists; metadata and preferred URL reflect the visible listing |
| Missing, deleted, or unpublished destination | Does not return a misleading successful storefront page or appear in the public URL listing |
| Private or transaction route | Does not expose private content or claim to be a current indexable storefront destination |
| Filter, sort, pagination, alias, or redirected URL | Final page and preferred URL follow the content-specific decision in the audit; no broken redirect or loop |

## Discovery contract

- The crawler access instructions identify the public URL listing and allow resources needed to render sampled public pages.
- The public URL listing uses absolute URLs on the configured public origin and includes only current, eligible preferred URLs. A fixed collection limit must not silently omit eligible pages.
- For each sampled public URL, compare the final response, rendered preferred URL, sitemap inclusion, and prominent internal links. Divergence is a finding, not an assumed search-engine penalty.
- Index exclusion for a private route is reported according to the mechanism a crawler can actually observe. A robots disallow does not count as proof of deindexing.
- Search engines may select a different canonical or snippet. The contract describes the site's emitted signals, not guaranteed search results.

## Content contract

- Distinct public subjects have identifying Persian titles, summaries, and descriptive primary content.
- Headings communicate a logical page structure; no fixed count of H1 elements is required solely for SEO.
- Meaningful links have understandable destinations; content images have appropriate descriptions and decorative imagery carries no false claim.
- Mobile and desktop views preserve the essential product/category information and usable navigation.
- Product and business structured facts agree with the visible page and verified catalog/contact data. Unknown price, availability, rating, image, or contact facts are omitted or represented without invention. Syntax validity alone does not imply rich-result eligibility.

## Audit report contract

The saved report has these required sections:

1. **Provenance**: selected skill source and installed revision, environment, date, and whether Search Console or field data was available.
2. **Targets**: one sample for each available public page type, one private URL, one unavailable URL, and representative variant/redirect URLs; unavailable data is recorded as unverified.
3. **Checks**: rendered responses, redirects/status, robots and public URL listing, preferred URL alignment, titles/content, structured facts, internal links/resources, and mobile view. Performance evidence is included only if measured.
4. **Findings**: target, severity, evidence status, observation/reproduction, user impact, and correction.
5. **Verification**: the repeated check and outcome for every corrected finding, plus remaining external uncertainty.

A finding cannot be marked verified from a source-only review. Rankings, indexing, traffic, and rich-result display remain unverified without relevant search-platform evidence.
