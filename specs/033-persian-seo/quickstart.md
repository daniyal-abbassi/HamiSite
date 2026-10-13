# Quickstart: Persian SEO Validation

## Overview
This guide validates that Persian SEO enhancements (document language, OpenGraph `fa_IR`, JSON-LD schemas, Persian slug sanitization) work correctly across the storefront.

## Automated Verification

Run unit test suites for Persian SEO and typography:

```bash
npx vitest run tests/unit/persian-seo.test.ts
```

Run TypeScript compilation check:

```bash
npm run typecheck
```

## Live Inspection Steps

1. **Document Metadata & OpenGraph**:
   - Inspect `/` and `/shop`:
     - Confirm `<html lang="fa" dir="rtl">`
     - Confirm `<meta property="og:locale" content="fa_IR">`
     - Confirm `<link rel="canonical" href="...">`

2. **Product Detail JSON-LD**:
   - Inspect `/shop/[slug]`:
     - Confirm presence of `<script type="application/ld+json">` containing `@type: "Product"`
     - Confirm presence of `offers` with `priceCurrency` and `availability`

3. **Slug Sanitization**:
   - Test `sanitizePersianSlug("سیم‌کارت ایرانسل")` -> returns `سیم-کارت-ایرانسل` without `%E2%80%8C` or raw `\u200c`.

