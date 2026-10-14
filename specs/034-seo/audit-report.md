# Storefront SEO Audit Report

**Feature:** [spec.md](spec.md)  
**Observed environment:** `http://localhost:3000`, local Next.js development server and existing PostgreSQL catalog  
**Date:** 2026-10-14, Asia/Tehran  
**Scope:** Site-emitted crawl, preferred-URL, content, and structured-data signals. Search Console, production indexing, rankings, traffic, field performance, and rich-result display are unverified.

## Provenance and setup

- Requested FarsiUI SEO listing resolves to the upstream `addyosmani/web-quality-skills` `seo` skill. Local install: `.agents/skills/seo/SKILL.md`, version `2.0`, SHA-256 `3c31dee5658c5e92fb6b263d097a368bd28c7a8587151160fc025eab2b4391d0`. Its `references/STRUCTURED-DATA.md` exists, SHA-256 `4d8156cf73b561700c5c1add80b9cb5a5b6d90997a78e924d8a981995bdeb796`. The skill directory is Git-ignored.
- Clean-directory reproduction: `npx --yes skills add https://github.com/addyosmani/web-quality-skills --skill seo --yes` completed with exit 0 in 12 seconds in `/tmp/hami-seo-install-bj0YnU`; both the skill and structured-data reference were installed. This measures a clean directory, not a full clean checkout with project dependencies.
- The development and test database targets are distinct; PostgreSQL listened on localhost:5432 and Next bound port 3000. No database reset or seed was run.
- Owner edits already present before this run: modified `lib/seo-metadata.ts` and `app/sitemap.ts`, untracked `tests/unit/seo.test.ts`. They were inspected and extended. Six unrelated untracked PNG files were untouched.

## Targets and baseline observations

| Page or variant | Requested URL | HTTP / final URL | Rendered baseline |
| --- | --- | --- | --- |
| Home | `/` | 200 / same | Persian title, root canonical, index/follow, descriptive H1 |
| Shop | `/shop` | 200 / same | Shop title, `/shop` canonical, index/follow, 12 server-rendered product cards |
| Product | `/shop/اپل-آیدی` | 200 / same encoded path | Product title/canonical/H1, but no catalog image; JSON-LD asserted generic store image |
| Category | `/categories/موبایل` | 200 / same | Page-specific title/canonical/H1 |
| Brand | `/brands/comtel` | 200 / same | Page-specific title/canonical/H1; desktop and 390×844 mobile browser content/navigation visible |
| Private | `/account` | 200 / same | `noindex,nofollow`; baseline robots disallowed this URL, preventing a crawler from reading noindex |
| Missing | `/shop/seo-audit-missing-product` | 200 / same | Next streaming rendered the 404 UI and `noindex,nofollow`; no canonical or sitemap entry. HTTP status remained 200. |
| Pagination | `/shop?page=2` | 200 / same | A different set of product links than page one, but baseline canonical was `/shop` |
| Sort | `/shop?sort=newest` | 200 / same | Reordered catalog; preferred URL `/shop` |
| Category filter | `/shop?category=موبایل` | 200 / same | Filtered catalog; baseline canonical was `/shop` |
| Search | `/shop?q=اپل` | 200 / same | Search results; baseline canonical was `/shop` |
| Contact-priced product | `/shop/هدفون-بلوتوثی-سامسونگ-مدل-galaxy-buds3-pro` | 200 / same encoded path | Visible contact guidance; JSON-LD asserted a zero-price OutOfStock Offer |

Cold first requests to some HTML routes timed out while Next compiled; warm retries produced the responses above. No redirect was observed in these requested/final URL pairs. `/robots.txt` returned 200 and an absolute sitemap link. `/sitemap.xml` returned 200 and valid XML with 230 absolute entries: 3 fixed, 189 products, 23 populated categories, and 15 brands. The private and missing samples were absent. A local static store image and a Next client chunk both returned 200. The product/card links sampled in the rendered listing pointed to current product routes.

## Preferred URL decisions

- Home, shop, product, category, and brand pages prefer their public path. Tracking parameters and an order-only page-one sort prefer the clean path.
- A valid `/shop?page=N` beyond page one identifies a different product slice and retains `page` in the preferred URL. If sorting also changes that slice, the sort key remains with page N.
- Category and brand filtered listings retain their content-changing filter keys in their preferred URL. Filtered, searched, stock, price-range, and special-offer variants are marked `noindex` to avoid publishing a large set of transient result URLs. Unsupported query keys are not echoed into preferred URLs.
- Private and missing pages are excluded from the sitemap. Customer pages must remain crawlable enough for their `noindex` metadata to be read; access to private records remains under application authentication.

## Findings and corrections

| ID | Target / severity | Evidence status | Impact | Correction and repeated observation | State |
| --- | --- | --- | --- | --- | --- |
| F-01 | Cold local compilation / audit delay | Observed: initial HTML requests timed out; warm retries returned 200 | Delayed baseline measurement | Warm responses were used; this is a local startup limitation, not an SEO code defect | Verified environmental |
| F-02 | Shop pagination and filters / high | Observed: page two and category-filter content differed while both declared `/shop` | Distinct content pointed at another page | `pageMetadata` now supports a deliberately retained query; shop metadata chooses page and filter preferred URLs. Repeated HTTP: `/shop?page=2` → self canonical; `/shop?category=موبایل` → self canonical and noindex; `/shop?sort=newest` → `/shop`; search variant → `noindex,follow`. | Corrected locally |
| F-03 | Robots and private metadata / medium | Observed: account page emitted noindex but robots disallowed it | Disallowed crawlers could not read the exclusion signal | Robots now disallows only `/api/` and `/admin/`; repeated `/robots.txt` showed that rule set and `/account` still emitted `noindex,nofollow`. Authentication remains the private-data boundary. | Corrected locally |
| F-04 | Product JSON-LD / high | Observed: contact-priced product emitted price `0` and OutOfStock; image-less product emitted generic store photo as Product.image | Unsupported product claims in search-facing data | Product schema now emits image only for real product imagery and Offer only for a positive, purchasable price. Repeated rendered JSON-LD: contact-priced product has no Offer; image-less product has no Product.image. | Corrected locally |
| F-05 | Missing product HTTP status / medium | Observed: 404 UI and noindex are streamed under HTTP 200 in development and production | HTTP status alone misstates that the destination exists | Calling `notFound()` in both `generateMetadata` and the page still yielded HTTP 200 with the segment loading boundary. [Next's loading documentation](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes) confirms this streaming behavior and the emitted noindex; a true 404 needs existence checked before streaming or a proxy response. Dedicated follow-up: `HamiSite-basic-structure-piu`. | Open |
| F-06 | Sitemap scale / low future risk | Source-only: `app/sitemap.ts` selects at most 50,000 newest products; current database has 189 | A larger future catalog could silently omit old product URLs | Current sample is complete. Partition before the catalog approaches the protocol limit. Follow-up: `HamiSite-basic-structure-bux`. | Follow-up |

Source review found no confirmed title, H1, product-card link, image-alt, RTL/mobile, category/brand preferred-URL, or Organization/WebSite contact mismatch in the sampled pages. Product-card and gallery descriptions use product names for real images and nonassertive placeholder/decorative descriptions. The Organization telephone is sourced from `lib/content/contact.ts`. These checks do not establish site-wide absence of issues.

## Verification

- Focused regression: `npx vitest run --config vitest.frontend.config.ts tests/unit/seo.test.ts tests/unit/persian-seo.test.ts` → 2 files, 32 tests passed. `npm run typecheck` → passed.
- Repeated live HTTP checks covered corrected F-02, F-03, and F-04 as detailed above. Local image and client chunk returned HTTP 200.
- Production `npm run build` passed four times, including after the filter-policy change and restoration of the missing-page metadata after an unsuccessful 404-status experiment. Final production HTTP repeat: page two returned a self canonical and index/follow; category filter returned a self canonical and noindex/follow; order-only sort preferred `/shop`; search returned noindex/follow; account returned noindex/nofollow; missing product remained HTTP 200 with noindex. The browser rendered page two with 12 product cards, RTL direction, working client assets, no broken loaded images, and product links. At 390×844, all five sampled public page types had their expected H1, RTL direction, no broken loaded images, and no horizontal document overflow (maximum scroll width 383). Desktop browser checks repeated those headings and image observations. Pagination links exposed `/shop?page=N`; automated activation did not visibly navigate in the in-app browser, so that interaction remains unverified.
- Lighthouse was not run; no Lighthouse score or findings are claimed. Search Console, field performance, indexing, ranking, traffic, and rich-result eligibility/display remain unverified.

## Success criteria review

| Criterion | Result and evidence |
| --- | --- |
| SC-001 | Met locally: home, shop, current product, category, brand, account, and missing product samples are listed above. |
| SC-002 | Met for the sampled public routes: preferred URL decisions and repeated signals are recorded; no critical crawl barrier was observed. |
| SC-003 | Met for the checked product claims: unsupported generic image and zero-price Offer were removed and rechecked. |
| SC-004 | Met: every finding above includes target/severity, evidence status, impact, correction, and repeated observation for corrected findings. |
| SC-005 | Partially verified: the skill and reference installed in 12 seconds in a clean directory; a full fresh checkout and complete repeat audit were not timed. |
| SC-006 | Partially verified: redirect, link, discovery, and mobile checks are recorded for sampled page types; direct browser activation of pagination was inconclusive, though the emitted links and direct destination response were valid. |

Remaining work is tracked in Beads as `HamiSite-basic-structure-piu` (true missing-product HTTP 404) and `HamiSite-basic-structure-bux` (sitemap partitioning before 50,000 products). These limits do not change the verified local corrections above.
