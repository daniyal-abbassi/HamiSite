# Data Model: Storefront SEO Audit

**Feature**: [spec.md](spec.md) | **Persistence**: A versioned audit report. Existing catalog records remain the source of truth; no new database table is planned.

## Audit Target

A representative URL and the conditions under which it was inspected.

| Field | Meaning | Validation |
| --- | --- | --- |
| Page type | Home, shop, product, category, brand, private, or unavailable | One target per available public type; private and unavailable targets required |
| Requested URL | URL entered or fetched | Absolute URL within the inspected environment |
| Final URL and status | Result after redirects | Record redirect chain and response status |
| Environment and time | Local, staging, or production and observation date | Required for reproducibility |
| View | Crawler-facing response, desktop, or mobile | State which view supports each observation |
| Data state | Current catalog record or absence | Absent record is unverified, never a fabricated sample |

## Preferred URL Decision

The intended URL for a page or set of substantially similar pages.

| Field | Meaning | Validation |
| --- | --- | --- |
| Target | Associated audit target | Must reference a sampled page |
| Preferred URL | Chosen absolute URL | Same public origin; resolves to eligible content |
| Variant type | Base, tracking, sort, filter, pagination, slug alias, or redirect | Distinct content is assessed before collapsing variants |
| Rationale | Why this URL represents the content | Must cite observed content and URL behavior |
| Alignment | Rendered canonical, sitemap, redirect, internal links | Record each as aligned, divergent, or unverified |

## SEO Finding

A confirmed observation or a source-only hypothesis that warrants checking.

| Field | Meaning | Validation |
| --- | --- | --- |
| Target | URL or page type | Required |
| Severity | Critical, high, medium, or low | Critical means a sampled public page cannot be reached, crawled, or correctly identified |
| Evidence status | Observed, inferred from source, or unverified | Never present inference as a live failure |
| Evidence | Response, browser observation, audit result, or source location | Include date, environment, and reproduction step |
| Impact | Effect on a shopper or discoverability | Explain without predicting ranking |
| Correction | Proposed or completed change | Required, even if deferred |
| State | Open, corrected-pending-check, verified, or unverified | See transitions below |

## Verification Result

A repeated observation after a correction.

| Field | Meaning | Validation |
| --- | --- | --- |
| Finding | Corrected finding being checked | Required |
| Same check | Reused URL, environment, and observation method | Deviations must be explained |
| Result | Pass, fail, or unverified | Include actual observation |
| External limit | Indexing, ranking, rich-result display, or field data not observed locally | State explicitly where relevant |

## Audit Report

Contains the installation source and revision, environment and date, target inventory, checks performed, preferred URL decisions, findings, and verification results. Implementation stores it at `specs/034-seo/audit-report.md` so a maintainer can repeat the audit from a clean checkout. The report records when a current product/category/brand sample is unavailable and why.

## State transitions

```text
source hypothesis -> observed finding or unverified
observed finding -> correction -> corrected-pending-check -> verified or still open
external search outcome -> unverified until platform evidence exists
```

These are audit states, not persisted application states. The existing product, category, and brand data models are unchanged.
