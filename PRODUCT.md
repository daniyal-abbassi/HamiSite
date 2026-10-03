# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **B2C retail customers:** Persian-speaking shoppers, primarily in and around
  Mashhad, buying mobile phones, smartwatches, power banks, feature phones,
  and accessories. They come for wholesale-level pricing and authentic,
  brand-backed warranties they'd otherwise only get by shopping in person.
- **B2B partners:** retail resellers — small shops that buy in bulk at
  tiered wholesale pricing to resell to their own customers (`app/api/pricing/quote`,
  `app/(main)/partners`).

## Product Purpose

Hami Hamrah is the online storefront for a mobile-phone retailer with a
20-year operating history and a physical store in Mashhad. It replaces an
older legacy shop system (data migrated via `prisma/legacy-import`) with a
same-origin Next.js app serving both audiences above from one catalog and
backend. Success means the online experience carries the same trust,
pricing, and authenticity the physical store is known for, for both
individual buyers and reseller partners.

## Positioning

What a generic online phone retailer can't truthfully claim:

- 20 years of trading history and an existing physical store in Mashhad —
  this is an established merchant going online, not a new venture.
- Prices are undercut deliberately — retail customers get pricing close to
  wholesale, on top of tiered B2B pricing for resellers.
- Official brand authorization, not just reselling: certified Redmi dealer
  in Mashhad (certificate granted by Radman Paj), and official regional
  sales representative for TCH-brand products (mobile phones, smartwatches,
  power banks, feature phones).
- All phones sold carry valid, authentic manufacturer warranties — an
  explicit trust claim against grey-market competitors.

## Operating Context

- Physical store in Mashhad operates alongside the online platform
  (omnichannel, not online-only).
- REST API (contracts in `docs/api/`) with an httpOnly, `SameSite=Lax`
  session cookie as the only CSRF defense — the frontend must stay
  same-origin (`docs/api/auth.md` §2).
- B2B tiered pricing is computed server-side (`app/api/pricing/quote`) for
  reseller partners.
- Admin back office covers brands, categories, coupons, orders, products,
  reports, users, and variants (`app/api/admin/*`, `Role.ADMIN`-gated).
- Catalog/customer/order data is imported live from the legacy shop API
  this project replaces (`prisma/legacy-import`); re-running the seed can
  destroy B2B pricing tiers/carts/history on legacy-imported products (see
  `README.md`).

## Capabilities and Constraints

- The REST API is complete and test-pinned (`docs/api/`) — treat its
  contracts as fixed, not something the frontend renegotiates.
- No Prisma migration baseline; schema changes go through `db:push`, not
  `prisma migrate` — `db:reset` is intentionally disabled.
- Persian language, RTL layout — this is the platform's primary and
  currently only language, not a locale add-on.
- Payments: only a dev-only mock exists today (`app/api/payments/mock-confirm`).
  No production payment gateway is confirmed yet — do not assume a specific
  provider.
- No additional business constraints (regions served, warranty/return
  policy specifics, etc.) are confirmed beyond what's above; treat anything
  not listed here as undecided rather than inferred.
- About and Contact pages are planned but not built yet — the Footer links
  to `/about` and `/contact`, which don't exist as routes. The Footer's
  `/my-orders` link is a wrong path (orders live at `/orders` and
  `/order/[id]`); fixing it is a code change, not a product decision.
- Verified store contact fact: the phone number 0933 121 4000 (user-confirmed
  2026-09-19), single-sourced in `lib/content/contact.ts` — every tel: link
  imports from there. No verified street address or email exists yet: do not
  fabricate one anywhere. In-page CTAs that need a destination still route to
  `#store-experience` / `/partners`.
- A home-page CampaignBanner section existed and was removed (2026-09-19):
  it carried no real offer. Restore it only when there is an actual campaign
  to feature, wired to real promotion data.

## Brand Commitments

- Existing visual authority lives at
  `docs/inspires/HamiHamrah-DNA-Brand-Color/hami-hamrah-luxury/` — burgundy
  (RAL 3004) + champagne color system, Vazirmatn/DM Mono typography,
  editorial asymmetric layout. Visual reference only — its tRPC data layer
  and Manus OAuth do not apply to this backend.
- Real, factual brand affiliations to surface as trust signals (not to
  embellish further): certified Redmi dealer (Mashhad, via Radman Paj);
  official TCH regional sales representative.
- Real logo assets are on hand at `docs/Brand's Images/logo/` — square
  icon-only mark, Persian wordmark-only, and full lockups on both dark
  (burgundy) and light backgrounds. Deploy-ready copies live in
  `public/brand/`: `hami-mark.png` is wired into `components/layout/Header.tsx`,
  `components/layout/Footer.tsx` (on a champagne gradient tile),
  `components/home/CampaignBanner.tsx`, and `app/icon.png` (favicon); the
  cream/transparent variant `hami-mark-alpha.png` exists and is used inside
  `public/brand/categories/*.svg` badges. A Persian wordmark PNG
  (`hami-wordmark-fa.png`) is also on disk but not wired into any component
  yet.

## Evidence on Hand

- `docs/inspires/` — design references (see Brand Commitments).
- `docs/Brand's Images/logo/` — real brand logo files (see Brand Commitments).
- `docs/Brand's Images/highlitsLabel/` — circular metallic badge/icon
  renders (e.g. a compare-products icon) for product highlight labels; not
  wired into any component yet.
- `docs/Brand's Images/ProductsDNA/` — branded product hero-image examples
  (burgundy bg, logo lockup, gold accent spec callouts) for TCH-brand
  products (power banks etc.) — a style reference for future PDP/marketing
  imagery, not used anywhere yet.
- `prisma/legacy-import/` — real catalog/customer/order data pipeline from
  the legacy shop.
- 20-year operating history and physical Mashhad store, and the Redmi/TCH
  certifications — user-confirmed facts; no certificate files or citations
  are on hand, so don't fabricate images or documents of them.
- No testimonials, press, or case studies on hand — do not invent any.

## Product Principles

1. **Authenticity over marketing.** Every brand, warranty, or authorization
   claim must be real and verifiable — never imply certification the
   business doesn't hold.
2. **Wholesale pricing for everyone.** Retail customers already get pricing
   close to wholesale; B2B resellers get further tiered discounts on top —
   pricing is a core trust signal, not just a number.
3. **Omnichannel continuity.** The platform extends a 20-year physical-store
   reputation in Mashhad; it should read as the same trusted merchant online,
   not a disconnected new brand.
4. **One catalog, two audiences.** B2C and B2B share backend and catalog but
   need distinct pricing/workflow treatment — don't collapse them into one
   generic flow.
5. **API-first stability.** The backend contract (`docs/api/`) is complete
   and test-pinned; frontend work adapts to it, it doesn't redesign it.
