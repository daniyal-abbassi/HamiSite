# Implementation Plan: Storefront SEO Audit and Improvements

**Branch**: `Hami-v3` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Revised feature specification in `specs/034-seo/spec.md`.

## Summary

Install the selected SEO guidance reproducibly, then audit representative live storefront routes and correct confirmed technical and on-page SEO problems. Compare crawler-facing responses with catalog and visible content, align preferred URLs and sitemap entries, remove unsupported search-facing facts, and retain a repeatable evidence report. Use existing Next.js metadata, catalog, and structured-data paths; preserve the database as source of truth. The plan ends with browser, HTTP, test, typecheck, and build verification; search-engine indexing and ranking remain external outcomes.

## Technical Context

**Language/Version**: TypeScript 5.5.4, Next.js 15.5.25, React 19.2.8.

**Primary Dependencies**: Existing Next.js App Router metadata, `lib/seo-metadata.ts`, `lib/persian-seo.ts`, `lib/catalog-db.ts`, Prisma 5.20.0; upstream `seo` agent skill for audit guidance.

**Storage**: Existing PostgreSQL catalog is authoritative; versioned Markdown audit report. No schema change or catalog reseed.

**Testing**: Existing Vitest frontend configuration, HTTP/HTML inspection, real browser at mobile and desktop widths, Lighthouse SEO when available, `npm run typecheck`, and `npm run build` after checking the dev-server state.

**Target Platform**: Same-origin public storefront, sampled at `/`, `/shop`, one current `/shop/[slug]`, `/categories/[slug]`, and `/brands/[slug]`, plus private and unavailable URLs.

**Project Type**: Single Next.js App Router web application.

**Performance Goals**: No measured regression to representative mobile page experience; record lab or field evidence where available. A Lighthouse SEO score is diagnostic, not a ranking target.

**Constraints**: Honest catalog/price/availability/contact data; Persian RTL; no new dependency unless necessary; protect active dev-server build state; no destructive database operation; preserve owner changes.

**Scale/Scope**: Five public page types plus at least one private and one unavailable URL, query/redirect variants, sitemap and robots outputs, existing structured data, and a reproducible audit report. No backlink campaign, broad copy rewrite, AI crawler integration, or redesign.

## Constitution Check

*Gate before Phase 0: pass. Re-checked after Phase 1: pass.*

| Principle or gate | Design response | Result |
| --- | --- | --- |
| I. Honest Interface | Compare titles, summaries, product schema, offers, images, and contact facts with visible content and current records; omit unsupported claims. | Pass |
| II. Persian RTL by Default | Preserve natural Persian text, numeral conventions, and mobile RTL layout during SEO corrections. | Pass |
| III. Database-backed Storefront | Keep Prisma-backed catalog as authority for route eligibility and sitemap entries; no JSON runtime source, schema change, or reseed. | Pass |
| IV. Luxury Quality Bar | Adjust semantic structure and links within the existing premium design; verify mobile and desktop appearance in a real browser. | Pass |
| Definition of Done | Typecheck, build, real-browser interaction and chunks, mobile/desktop, RTL, honest content, and visual quality are implementation gates. | Pass |

No constitutional exception is requested. This planning phase changes documentation only; the gates above apply when code is implemented.

## Project Structure

### Documentation (this feature)

```text
specs/034-seo/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/seo-contract.md
├── quickstart.md
├── audit-report.md           # Created during implementation from observed evidence
├── checklists/requirements.md
└── tasks.md                  # Existing task file; refresh in the tasks phase
```

### Source Code (repository root)

```text
app/
├── layout.tsx
├── robots.ts
├── sitemap.ts
└── (main)/
    ├── page.tsx
    ├── shop/page.tsx
    ├── shop/[slug]/page.tsx
    ├── categories/[slug]/page.tsx
    └── brands/[slug]/page.tsx
lib/
├── seo-metadata.ts
├── persian-seo.ts
├── catalog-db.ts
└── shop-query-db.ts
components/shop/             # Rendered headings, links, images, and mobile content
tests/unit/seo.test.ts        # Existing untracked SEO test; inspect before editing
```

**Structure Decision**: Extend the existing app and catalog modules. Keep the audit report and install procedure under the feature directory so a clean checkout can reproduce the review. Avoid a new SEO service or database model.

## Phase 0: Research

Decisions and alternatives are recorded in [research.md](research.md): skill installation, evidence sources, canonical policy, crawl controls, sitemap authority, and honest structured facts. All technical choices for this phase are resolved.

## Phase 1: Design and Contracts

[Data model](data-model.md) defines the audit target, preferred URL decision, finding, verification result, and report without adding database tables. [SEO contract](contracts/seo-contract.md) defines observable route and report expectations. [Quickstart](quickstart.md) provides the installation and end-to-end validation procedure.

**Post-design gate**: Pass. The design reuses the current catalog and routes, requires evidence for every correction, and leaves production indexing claims explicitly unverified without external data.

## Implementation Sequence for the Tasks Phase

1. Confirm skill installation and record its source/revision; inventory existing SEO edits and establish sampled routes and baseline report.
2. Resolve critical crawl/index and preferred-URL findings using actual responses, including private/missing routes and sitemap eligibility.
3. Resolve observed on-page, mobile, link, and structured-fact findings without inventing catalog or contact data.
4. Repeat the same checks, add focused regression coverage for corrected behavior, and finish constitutional quality gates and saved report.
