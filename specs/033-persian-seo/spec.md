# Feature Specification: Persian SEO (سئوی فارسی)

**Feature Branch**: `Hami-v3`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "check, install and implement : https://farsiui.ir/skills/persian-seo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Technical Persian SEO & Document Metadata (Priority: P1) 🎯 MVP

As a Persian-speaking shopper searching on Google or sharing product links on messaging apps (Telegram, Bale, WhatsApp), I see natural Persian titles, concise descriptions, correct language attributes, and high-fidelity Open Graph previews (`fa_IR`, canonical URLs, no broken character encodings), so that I can easily discover and trust Hami Hamrah in search results and social links.

**Why this priority**: Correct document-level language, Open Graph locale, canonical URLs, and natural Persian page titles form the non-negotiable technical baseline for search engines to index and rank Persian content properly.

**Independent Test**: Inspect the rendered HTML `<head>` across `/`, `/shop`, and `/shop/[slug]` pages: confirm `lang="fa"`, `dir="rtl"`, `og:locale="fa_IR"`, canonical `<link rel="canonical">`, and descriptive Persian titles/descriptions without raw ZWNJ or keyword stuffing.

**Acceptance Scenarios**:

1. **Given** any public storefront page (`/`, `/shop`, `/shop/[slug]`), **When** loaded by a user or crawler, **Then** the document declares `lang="fa"` and `dir="rtl"`, with `og:locale="fa_IR"`.
2. **Given** any page with Open Graph and Twitter card tags, **When** inspected or shared in messaging apps, **Then** the title and description are rendered in Persian, with the primary subject first and `حامی همراه` as the brand suffix.
3. **Given** any indexed URL, **When** accessed with or without query parameters, **Then** a clean canonical URL pointing to the definitive canonical path is rendered.

---

### User Story 2 - Persian Structured Data & Rich Snippets (Priority: P2)

As a potential customer searching for mobile accessories or digital devices on Google, I see rich snippets (product price, stock status, ratings, breadcrumbs, and site search bar) directly in search engine results pages (SERPs), so that I can evaluate prices and availability before clicking.

**Why this priority**: Structured data (JSON-LD) for products, breadcrumbs, and organization significantly enhances search snippet click-through rates and establishes brand authority in the Iranian e-commerce space.

**Independent Test**: Validate public pages with Google's Rich Results Test or schema validator; confirm zero errors on `Organization`, `WebSite`, `Product`, `Offer`, and `BreadcrumbList` schemas.

**Acceptance Scenarios**:

1. **Given** a product detail page (`/shop/[slug]`), **When** rendered, **Then** a valid `schema.org/Product` JSON-LD is injected containing Persian product name, Persian description, images, brand, SKU, and `Offer` with price in IRR/Toman and availability status (`InStock` / `OutOfStock`).
2. **Given** the storefront homepage, **When** rendered, **Then** valid `schema.org/Organization` and `schema.org/WebSite` JSON-LD scripts are injected with site name `حامی همراه`, logo, contact details, and potential search action (`SearchAction`).
3. **Given** a product or shop navigation page, **When** rendered, **Then** a valid `schema.org/BreadcrumbList` is present reflecting the logical hierarchical path in Persian.

---

### User Story 3 - URL Slug Normalization & Sitemap Hygiene (Priority: P3)

As a search engine crawler (Googlebot, Bingbot), I can systematically discover all active products and categories through an automated `sitemap.xml` and `robots.txt`, without encountering raw zero-width non-joiners (ZWNJ), broken character encoding, or crawl loops in URL slugs.

**Why this priority**: Persian characters often contain ZWNJ (`\u200c`) or Arabic variants (`ي`, `ك`). In URLs, raw ZWNJ creates ugly `%E2%80%8C` escape sequences, broken copy-pasted links, and 404 indexing errors if not cleanly normalized.

**Independent Test**: Fetch `/sitemap.xml` and `/robots.txt`; verify that product URLs contain sanitized, URL-safe slugs without raw ZWNJ or double hyphens, and that sitemap priorities and last-modified dates are valid.

**Acceptance Scenarios**:

1. **Given** product slugs generated from Persian titles containing half-spaces or ZWNJ, **When** converted to URL slugs, **Then** ZWNJ is normalized to hyphens or removed safely so no raw `\u200c` or `%E2%80%8C` breaks the slug.
2. **Given** `/sitemap.xml`, **When** requested by a search crawler, **Then** it returns valid XML listing all public routes, active products, and partner pages with valid `<lastmod>`, `<changefreq>`, and `<priority>`.
3. **Given** `/robots.txt`, **When** requested, **Then** it explicitly permits public storefront pages, disallows admin/auth/private paths, and references the full canonical sitemap location.

---

### Edge Cases

- **Mixed Persian and English titles**: Technical terms (e.g., `iPhone 16 Pro`, `Anker`, `Type-C`) must preserve their Latin spelling while surrounding prose remains natural Persian.
- **Arabic vs Persian characters**: Search terms and slugs with Arabic Yeh (`ي`) or Keheh (`ك`) must be normalized or matched seamlessly with Persian (`ی` and `ک`).
- **Product out of stock**: Product schema should update `availability` to `https://schema.org/OutOfStock` without breaking price or schema validation.
- **Zero-width non-joiner in copy vs slug**: ZWNJ (نیم‌فاصله) should be preserved in visible text (titles, descriptions, headings) for correct Persian typography, but normalized/hyphenated in URL paths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Document root in `app/layout.tsx` MUST enforce `lang="fa"`, `dir="rtl"`, and include `openGraph.locale: "fa_IR"`.
- **FR-002**: Page titles across the storefront MUST follow natural Persian format: primary subject first, followed by brand separator (`[موضوع اصلی] | حامی همراه`).
- **FR-003**: Meta descriptions MUST be descriptive, compelling, and written in natural Persian (around 120-160 characters), avoiding literal translations or English keywords.
- **FR-004**: Dynamic canonical URL generation MUST be implemented to ensure each page points to its definitive URL without tracking params or trailing slash ambiguity.
- **FR-005**: Product detail pages MUST render a valid `Product` and `Offer` JSON-LD schema with Iranian currency (IRR / Toman), stock status, and product imagery.
- **FR-006**: The storefront MUST provide `Organization`, `WebSite`, and `BreadcrumbList` structured data.
- **FR-007**: URL slug generator MUST normalize Persian characters and strip or hyphenate ZWNJ (`\u200c`) to prevent broken `%E2%80%8C` sequences.
- **FR-008**: Dynamic `sitemap.xml` and `robots.txt` MUST reflect all indexed public pages and block private admin/auth paths.

### Key Entities

- **Persian Metadata Definition**: Structured contract defining localized title, description, canonical URL, Open Graph `fa_IR` tags, and Twitter card attributes.
- **JSON-LD Schema Model**: Strongly typed representations for `Organization`, `WebSite`, `Product`, `Offer`, and `BreadcrumbList` schemas tailored for Persian e-commerce.
- **Slug Sanitizer Contract**: Utility interface for normalizing Persian/Arabic strings, handling ZWNJ, and generating clean URL-safe slugs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of audited public pages (`/`, `/shop`, `/shop/[slug]`) include valid `lang="fa"`, `dir="rtl"`, `og:locale="fa_IR"`, and canonical URL tags.
- **SC-002**: Google Rich Results and Schema validation tests pass with 0 errors for `Organization`, `WebSite`, `Product`, and `BreadcrumbList` schemas.
- **SC-003**: 0% of generated product URLs in `sitemap.xml` contain raw ZWNJ or broken `%E2%80%8C` characters.
- **SC-004**: 100% of automated unit tests for Persian SEO metadata, JSON-LD generation, and slug sanitization pass without regressions.

## Assumptions

- The primary audience is in Iran, using Persian as their native browsing language.
- The storefront currency for schema pricing is Rial (IRR) or Toman, aligned with schema.org standards.
- English brand names and model numbers (e.g. Apple, Samsung, Anker) are kept in Latin script where natural for Iranian search queries.
- Private routes (`/admin`, `/api/auth`, `/dashboard`) are protected from search indexing in `robots.ts`.
