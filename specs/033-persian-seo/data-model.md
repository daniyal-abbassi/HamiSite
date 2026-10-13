# Data Model: Persian SEO (سئوی فارسی)

**Feature**: [spec.md](spec.md) | **Persistence**: Stateless schema generator & metadata helpers; no database schema change.

## 1. PersianSeoMetadata

Represents standardized metadata configuration for a public storefront route.

```typescript
export interface PersianSeoMetadata {
  title: string;          // Page subject (e.g., "گوشی موبایل اپل مدل iPhone 16 Pro")
  fullTitle: string;      // Full branded title ("[title] | حامی همراه")
  description: string;    // Natural Persian description (120-160 characters)
  canonicalUrl: string;   // Full canonical URL (e.g., "https://hamihamrah.com/shop/slug")
  locale: "fa_IR";        // Open Graph locale
  ogType: "website" | "article" | "product";
  images: Array<{
    url: string;
    width?: number;
    height?: number;
    alt: string;
  }>;
}
```

## 2. ProductJsonLdSchema

Represents `schema.org/Product` and `Offer` structured data.

```typescript
export interface ProductJsonLdSchema {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  image?: string[];
  sku?: string;
  brand?: {
    "@type": "Brand";
    name: string;
  };
  offers: {
    "@type": "Offer";
    priceCurrency: "IRR" | "IRT";
    price: number;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock" | "https://schema.org/PreOrder";
    url: string;
    seller?: {
      "@type": "Organization";
      name: string;
    };
  };
}
```

## 3. BreadcrumbJsonLdSchema

Represents `schema.org/BreadcrumbList` structured data.

```typescript
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbJsonLdSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}
```

## 4. SlugSanitizerRules

Validation and transformation rules for generating clean, crawl-friendly Persian slugs:

- **Character Normalization**: Replace Arabic `ي` (U+064A) with Persian `ی` (U+06CC), Arabic `ك` (U+0643) with Persian `ک` (U+06A9).
- **Separator Conversion**: Replace ZWNJ (`\u200c`), spaces (`\s+`), underscores (`_`), and pipes (`|`) with a single hyphen `-`.
- **Character Filtering**: Keep letters (`\p{L}`), numbers (`\p{N}`), and hyphens `-`; drop all other punctuation.
- **De-duplication**: Collapse repeated hyphens (`-+` -> `-`).
- **Trimming**: Remove leading and trailing hyphens.

