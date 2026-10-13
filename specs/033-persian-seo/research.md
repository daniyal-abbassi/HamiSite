# Research: Persian SEO (سئوی فارسی)

**Date**: 2026-10-13 | **Feature**: [spec.md](spec.md)

## 1. Persian Typography, Document Direction & Language Metadata

**Decision**: Enforce `lang="fa"`, `dir="rtl"`, and `locale: "fa_IR"` across all public storefront layouts and Open Graph tags.

**Rationale**:
Search engines (specifically Google and local search engines) use document `lang` and `dir` as foundational signals for indexing and text segmentation in Persian. Open Graph and social scrapers (Telegram, Bale, WhatsApp, Twitter) render previews based on `og:locale="fa_IR"`.

**Alternatives considered**:
- Setting `lang="fa-IR"` globally: While valid, `lang="fa"` is standard across React/Next.js frameworks with specific `fa-IR` reserved for Open Graph `locale`. Both are compatible; using `lang="fa"` and `og:locale="fa_IR"` gives maximal crawler compatibility.

## 2. Persian Slug Sanitization & ZWNJ (نیم‌فاصله) Handling

**Decision**: Convert Zero-Width Non-Joiner (ZWNJ: `\u200c`), spaces, and separators to single hyphens (`-`), normalize Arabic characters (`ي` -> `ی`, `ك` -> `ک`), strip invalid URL punctuation, collapse consecutive dashes, and trim edges.

**Rationale**:
In Persian web applications, copy-pasting raw ZWNJ into URLs results in `%E2%80%8C` URL encoding. This leads to broken external links, inconsistent crawler indexing, and failed database slug lookups. Converting ZWNJ to `-` keeps words legible and search-engine crawlable (e.g., `سیم‌کارت-ایرانسل` -> `سیم-کارت-ایرانسل`).

**Alternatives considered**:
- Removing ZWNJ completely: Turns `سیم‌کارت` into `سیمکارت`, which alters search term indexing.
- Leaving raw ZWNJ in URLs: Results in ugly `%E2%80%8C` sequences that often get broken when shared across messaging platforms.

## 3. Structured Data (JSON-LD) for Iranian E-commerce

**Decision**: Implement `schema.org/Product`, `Offer`, `Organization`, `WebSite`, and `BreadcrumbList` schemas with Persian annotations and Iranian currency (`IRR` / Toman).

**Rationale**:
Rich snippets in Google Search show pricing, stock availability, breadcrumbs, and site search boxes. Adding strongly-typed JSON-LD scripts to server components guarantees zero layout shift while delivering immediate metadata to search engine crawlers without client hydration requirements.

**Alternatives considered**:
- Microdata inline HTML attributes: Harder to maintain in React Server Components and clutters JSX markup. JSON-LD scripts (`type="application/ld+json"`) are Google's recommended format.

## 4. Robots.txt and Dynamic Sitemap Hygiene

**Decision**: Maintain `app/robots.ts` with strict allow/disallow lists (protecting `/admin/`, `/api/`, `/checkout`, `/account`) and `app/sitemap.ts` dynamically fetching active products, categories, and brands from Prisma.

**Rationale**:
Ensures crawl budget is dedicated to indexable catalog pages while keeping private transactional and administrative surfaces hidden from search engines.

