# Data Model: Mobile-First First-Screen Redesign

**Feature**: 044-mobile-first-redesign · **Date**: 2026-10-25

This feature introduces no database entities. It extends one static content entity and consumes existing assets.

## Entity: TrustFact (static content, `lib/content/verified-facts.ts`)

The single source of factual claims the UI may render about the shop (Constitution I).

| Field | Type | Notes |
|-------|------|-------|
| `key` | `"history" \| "store" \| "redmi" \| "tch" \| "priceMatch" \| "officialDealership"` | Semantic identity; surfaces map keys to icons/labels. New keys added this feature; existing keys unchanged. |
| `label` | string (Persian) | Full verified sentence, e.g. «قیمت برد به برد با قیمت روز بازار». |

Derived per-surface (not stored): short labels and icons. The hero maps:

| key | short label (hero, per mockup) | icon |
|-----|-------------------------------|------|
| `history` | «۲۰ سال سابقه» | Clock |
| `store` | «فروشگاه حضوری در مشهد» | MapPin |
| `priceMatch` | «قیمت برد به برد» | Medal |
| `officialDealership` | «نمایندگی رسمی» | ShieldCheck |

**Validation rules**: every consumer that maps over `trustFacts` must type its icon/label records against `typeof trustFacts[number]["key"]`, so adding a key is a compile error until the surface decides how to render it. `redmi`/`tch` keep their existing full labels («نماینده‌ی فروش برند ریلمی» — orthography fix «نماینده‌ی» with ZWNJ included in this feature since the line is touched anyway — and «نماینده رسمی تی سی اچ در منطقه»).

**State transitions**: none (static content).

## Asset Inventory (existing, no modification)

| Asset | Path | Role |
|-------|------|------|
| H mark (alpha) | `public/brand/hami-mark-alpha.png` | Header lockup mark, CSS-inverted white on oxblood |
| Wordmark (alpha) | `public/brand/hami-wordmark-fa.png` | Header lockup wordmark, CSS-inverted white |
| Store photograph | `public/store/shop-ai-relight.png` (1126×1407) | Hero photo block (mobile per mockup) |
| Silk background, tall | `specs/044-mobile-first-redesign/mockups/background-mobile-silk.png` → copied to `public/images/hero/home-silk-mobile.png` | Mobile first-screen surface |
| Silk banner, wide | `specs/044-mobile-first-redesign/mockups/banner-silk-wide.png` → copied to `public/images/hero/home-silk-wide.png` | Desktop closing-CTA band surface |

**Rules**: official brand files are never redrawn; presentation-level color inversion is allowed (R2). Copying the supplied backgrounds into `public/images/hero/` keeps spec mockups as provenance and serves the site from public space.

## Relationships

- `TrustFact` → rendered by homepage hero (2×2 grid) and available to any future surface.
- Header lockup + hero photograph + backgrounds are referenced only by the homepage band styles and `Header.tsx`/`page.tsx` markup.
