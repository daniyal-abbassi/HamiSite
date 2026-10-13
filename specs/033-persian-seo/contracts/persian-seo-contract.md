# Contract: Persian SEO & Structured Data

**Scope**: Local utilities and JSON-LD components for Persian SEO.

## 1. Slug Sanitization Contract

```typescript
/**
 * Normalizes Persian and Arabic text:
 * - Replaces Arabic Yeh (ي) with Persian Yeh (ی)
 * - Replaces Arabic Kaf (ك) with Persian Keheh (ک)
 * - Trims whitespace
 */
export function normalizePersianText(input: string): string;

/**
 * Sanitizes Persian input into a URL-safe, search-engine-friendly slug:
 * - Normalizes Arabic characters
 * - Converts ZWNJ (\u200c), spaces, and separators to hyphens
 * - Removes non-alphanumeric/non-hyphen characters
 * - Collapses consecutive hyphens and trims edges
 */
export function sanitizePersianSlug(input: string): string;
```

## 2. JSON-LD Generation Contracts

```typescript
/**
 * Builds schema.org/Product structured data object for product detail pages
 */
export function buildProductJsonLd(params: {
  name: string;
  description: string;
  slug: string;
  images?: string[];
  price?: number;
  currency?: "IRR" | "IRT";
  inStock?: boolean;
  brandName?: string;
  sku?: string;
}): object;

/**
 * Builds schema.org/BreadcrumbList structured data object for hierarchy navigation
 */
export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>): object;
```

## 3. SEO Metadata Contract

```typescript
/**
 * Standard page metadata generator with Persian SEO conventions:
 * - Sets OpenGraph locale to "fa_IR"
 * - Appends brand suffix "| حامی همراه" to title
 * - Sets dynamic canonical URL
 */
export function generatePersianMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata;
```

