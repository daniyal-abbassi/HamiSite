# Implementation Plan: Persian SEO (سئوی فارسی)

**Branch**: `Hami-v3` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Active feature `specs/033-persian-seo`. Branch: `Hami-v3`.

## Summary

Implement comprehensive technical and on-page Persian SEO based on the `persian-seo` skill:
1. Ensure proper document language (`lang="fa"`, `dir="rtl"`), Open Graph locale (`fa_IR`), natural Persian titles (`[موضوع] | حامی همراه`), and canonical URLs.
2. Implement strongly typed JSON-LD structured data generators for `Product`, `Offer`, `BreadcrumbList`, `Organization`, and `WebSite` in `lib/persian-seo.ts`.
3. Provide robust Persian slug sanitization in `lib/persian-seo.ts` (converting ZWNJ `\u200c` to hyphens, normalizing Arabic `ي`/`ك`, removing invalid URL characters).
4. Integrate JSON-LD on product detail pages (`app/(main)/shop/[slug]/page.tsx`).
5. Verify dynamic `sitemap.xml` and `robots.txt` compliance.

## Technical Context

**Language/Version**: TypeScript 5.5.4, React 19, Next.js 15.5.25.

**Primary Dependencies**: Built-in Next.js App Router metadata, `schema-dts` / JSON-LD, existing `@/lib/catalog-db`, `@/lib/seo-metadata`.

**Storage**: Stateless metadata & schema utilities; reads existing Prisma catalog records. No new database table or migration.

**Testing**: Vitest (`tests/unit/persian-seo.test.ts`), `npm run typecheck`.

**Target Platform**: Public storefront routes (`/`, `/shop`, `/shop/[slug]`, `/categories/[slug]`, `/brands/[slug]`).

**Project Type**: Next.js App Router e-commerce application.

**Performance Goals**: Zero runtime overhead (server-rendered `<script type="application/ld+json">` and static metadata generation).

**Constraints**: Adhere strictly to the project Constitution (Honest Interface, Persian RTL by default, Luxury quality bar). Do not invent pricing or stock status.

## Constitution Check

*Gate before Phase 0: pass. Re-checked after Phase 1: pass.*

| Principle | Planned Behavior | Result |
| --- | --- | --- |
| I. Honest Interface | Schema and metadata only output actual stock status, real pricing, and verified contact facts. | Pass |
| II. Persian RTL by Default | Document language `lang="fa"`, `dir="rtl"`, Persian typography, OpenGraph `locale: "fa_IR"`. | Pass |
| III. Database-backed Storefront | Reads existing Prisma records for sitemap and product metadata without altering schema. | Pass |
| IV. Luxury Quality Bar | Clean, elegant Persian titles and snippets without keyword stuffing or robotic phrasing. | Pass |
| Definition of Done | Unit tests, typecheck, clean build, and verified markup in real browser. | Pass |

## Project Structure

### Documentation & Specifications

```text
specs/033-persian-seo/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/persian-seo-contract.md
├── quickstart.md
└── checklists/requirements.md
```

### Application Files

```text
types/persian-seo.ts              # Strongly typed interfaces for SEO metadata & JSON-LD
lib/persian-seo.ts                # Persian text normalizer, slug sanitizer, and schema builders
app/(main)/shop/[slug]/page.tsx   # Integrate Product & Breadcrumb JSON-LD
lib/seo-metadata.ts               # Shared pageMetadata with fa_IR locale and canonicals
app/sitemap.ts                    # Dynamic sitemap with sanitized Persian paths
app/robots.ts                     # Search engine crawler policies
tests/unit/persian-seo.test.ts    # Comprehensive unit tests
```

## Phase 0: Research

All technical decisions resolved in [research.md](research.md). No `NEEDS CLARIFICATION` markers remain.

## Phase 1: Design and Contracts

Data models defined in [data-model.md](data-model.md). Interface contracts defined in [contracts/persian-seo-contract.md](contracts/persian-seo-contract.md). Runnable validation outlined in [quickstart.md](quickstart.md).
