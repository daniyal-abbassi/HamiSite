# HamiHamrah Landing Page — Design Spec

## Context

This project's backend (Next.js API routes + Prisma/Postgres) is complete and
seeded with real data from the live HamiHamrah shop it replaces — a mobile
phone wholesale distributor based in Mashhad's Central Mobile Market. There is
currently no frontend anywhere in this repo (`app/page.tsx` is a one-line
placeholder). This spec covers the first real page: a public marketing/
partner-acquisition landing page.

**Design source — revised.** An earlier version of this spec (see git
history, commit `f87203e`) was built from an original 13-round visual
brainstorm exploring a distinct redesign (a scrolling price ticker as
signature element, a floating glass nav pill, per-section 3D-graphics
reservations, `liquid-gooey` morph interactions). That direction was
explicitly abandoned: **"i feel disappointed... use [the static HTML file]
itself for now."** This revision replaces it with a direct, faithful port of
`Downloads/aura-landing (1).html` — an existing, complete, real HamiHamrah
landing page (Persian/RTL, oxblood `#640211` + gold `#C9A227` + paper
`#F2F4ED` palette, Vazirmatn font) that already has every section this
business needs, just with a hardcoded `DATA` object standing in for live
pricing and a contact form that does nothing (`onsubmit="return false"`).
The job of this pass is narrower than the original spec implied: **port,
don't redesign** — turn that static file into real Next.js/React components
wired to this project's actual API, with no unrequested layout/style
changes.

## Goal

A single, real, data-wired Next.js homepage at `app/page.tsx`, a faithful
React port of `Downloads/aura-landing (1).html`'s structure, styling, and
Persian copy — with its hardcoded `DATA` object replaced by live API queries
and its non-functional contact form wired to a real partner-application
endpoint. Not a redesign: every section, class name's visual intent, color,
and copy string in the reference file carries over unless this spec calls
out a specific reason it can't (only where static content must become
data-driven).

Explicitly **not** in scope for this pass:
- Login, cart, or checkout flows — this is the public front door, not the
  authenticated shopping experience. The reference file's nav links
  (لیست قیمت, برندها, خدمات پخش, سطوح همکاری, درباره ما, تماس) are all
  same-page anchor links (`#pricelist` etc.) in the static file and stay
  that way here — no new pages are built this pass.
- Any redesign, restyling, or "improvement" of the reference file's layout.
  That was tried (see Context) and explicitly rejected in favor of this
  direct port.

## Page Structure & Data Wiring

Every section below is `Downloads/aura-landing (1).html`'s own section,
identified by its existing `id`/class, ported to a React component under
`app/components/homepage/`. `app/page.tsx` is a Server Component that
fetches each section's data and passes it down; interactive pieces (price
panel tab-switching, plans cash/credit toggle, mobile nav burger, scroll-
reveal) become small Client Components holding the same state the reference
file's vanilla JS (`document.getElementById`, `onclick`, `IntersectionObserver`)
currently manages by hand.

| Reference section | Component | Static in the file today | Real source now |
|---|---|---|---|
| `<header class="nav">` | `Nav.tsx` | Hardcoded links, phone number | Copy unchanged — these are same-page anchors, not data |
| `.ticker` | `Ticker.tsx` | 5 hardcoded announcement strings (list-updated time, free-shipping threshold, registry/warranty, settlement terms, support hours) | Static copy, unchanged — these are business-policy statements, not queryable data. (This is a scrolling *text announcement* strip, not a price ticker — distinct from the abandoned redesign's ticker concept.) |
| `.hero` | `Hero.tsx` | Static headline/copy, 3 floating stat chips (۱٬۸۰۰+ همکار, ۹۸٪, ۱۲ سال) | Copy unchanged (marketing claims, no DB equivalent for partner count or delivery %); years-active stays static |
| `.brands` marquee | `BrandsMarquee.tsx` | Hardcoded array of 16 brand names | `GET /api/brands` — real brand list, same marquee treatment |
| `.panel` (`#pricelist`) | `PricePanel.tsx` (client) | `DATA` object: brand → array of `{n, v, p, s}` (name, variant label, price, stock). 3-pane: brand sidebar (`#pSide`) / model list (`#pList`) / detail pane (`#pDetail`) with 3 price-tier rows (1-9 / 10-49 / 50+, computed client-side as `price × 0.965` / `× 0.93`) | Brand sidebar from `GET /api/brands`. Model list + detail from `GET /api/products?brandId={id}&includeVariants=true&paymentTerm=CASH` — real product/variant data. Price tiers: **not** the file's fake multiplier — use the real `variant.priceTiers` already returned by that endpoint (quantity-bracket CASH pricing from the actual B2B pricing engine), mapped onto the same tier-row visual layout. **Data gap to handle, not paper over:** `PriceTier` rows only exist for the synthetic demo catalog seeded by `prisma/seed.ts` (3 brackets each) — the 178 real products imported from the legacy shop currently have zero `PriceTier` rows, since that data is admin-created, never legacy-sourced (see `docs/superpowers/specs/2026-08-13-legacy-data-import-design.md`). The component must render a real product with no tiers as a single base-price row, not an empty or broken 3-row layout — this is expected current data state, not a bug to work around. Stock badge (`موجود`/`محدود`/`ناموجود`) from `variant.stockType`. |
| `.cards` (`#services`) | `Services.tsx` | 6 static service description cards | Copy unchanged — these describe business services (registry, credit terms, dedicated rep), not data |
| `.stats` | `Stats.tsx` | 4 static numbers (۱۲ سال, ۱٬۸۰۰+, ۴۰+, ۳۱) | ۴۰+ برند wired to the real `GET /api/brands` count (`total` in the response envelope); the other 3 have no DB equivalent (years active, partner count, provinces shipped) and stay static marketing copy |
| `.quotes` | `Quotes.tsx` | 3 static testimonials | Copy unchanged — no testimonial model exists or is being added |
| `.plans` (`#plans`) | `Plans.tsx` (client) | 3 static tier cards (خرده‌فروش/عمده‌فروش/نماینده استانی) with a cash/credit toggle switching displayed `%` | Copy unchanged — these are account-tier marketing terms, not literal `PriceTier` rows (the real B2B pricing engine prices per-product/variant by quantity bracket, not "X% off everything" by account tier). Toggle interaction ported as-is (client-side state swap, same two `data-cash`/`data-credit` values per card). |
| `.cta` form (`#contact`) | `PartnerForm.tsx` (client) | `<form onsubmit="return false">`, fake success message | Real `POST /api/partners/apply` — see below. Fields unchanged: نام و نام خانوادگی, شماره موبایل, نام فروشگاه, شهر, برندهای مورد نیاز (select) |
| `.foot` | `Footer.tsx` | Static | Copy unchanged |

## New Backend Piece: Partner Application Endpoint

The reference file's `#contact` form submits to a **new** endpoint, not the
existing `/api/auth/register` — `register` requires a password and
immediately creates an active, logged-in session; this form has no password
field and is a lead-style application, so it should create a **pending**
record for staff review (`isActive: false`).

`POST /api/partners/apply` (new, public, unauthenticated). Request body maps
1:1 onto the reference form's fields:
```
{
  fullName: string,       // "نام و نام خانوادگی" — split into first/last on whitespace
  phoneNumber: string,    // "شماره موبایل"
  shopName?: string,      // "نام فروشگاه"
  city?: string,           // "شهر"
  brandInterest?: string   // "برندهای مورد نیاز" select value
}
```
- Duplicate check on `phoneNumber` against `User`, same conflict pattern as
  `register` (409 if an account already exists).
- Creates a `User` row: `role: WHOLESALE`, `isActive: false` (schema
  defaults this `true`, so it must be set explicitly here),
  `businessVerified: false` (already the schema default), `username`
  derived from the normalized phone number (same `+98…` normalization the
  legacy-import pipeline already uses at
  `prisma/legacy-import/normalize.ts` — since that module is import-script-
  specific, not app runtime, add an equivalent small `normalizePhoneNumber`
  to `lib/` rather than importing across that boundary), `shopName`/`city`
  passed through, `creationMethod: "partner_application"`,
  `referer: brandInterest` (repurposing the existing free-text `referer`
  field rather than adding a new column).
- `passwordHash`: a random, unguessable, bcrypt-hashed placeholder — the
  applicant never sets one on this form, and the account cannot log in
  until a staff-driven activation/password-reset flow exists. **That
  activation flow is out of scope for this pass** — the endpoint's job is
  only to produce a real, findable row. Staff already see it via the
  existing `GET /api/admin/users` customer list (built in the admin-api
  phase), filterable by `isActive: false`.
- No session is created and no cookie is set (unlike `register`) — the
  response replaces the file's fake `#ok` success message with a real one
  on success, and a real error message (e.g., "این شماره قبلاً ثبت شده") on
  the 409 case, which the static file's `onsubmit="return false"` never had
  to handle.

## Technical Notes

- **Faithful port, not a rewrite of the CSS.** The reference file's
  `<style>` block (CSS custom properties, `.glass`, `.btn`/`.btn-gold`/
  `.btn-ghost`, `.card`, `.plan`, responsive breakpoints at 1100/900/560px)
  moves into `app/globals.css` largely as-is — same custom property names,
  same values. This is a deliberate exception to "no new dependency"
  concerns: there's nothing to add, the file is already plain CSS.
- **Vanilla JS → React state**, section by section:
  - Price panel brand/item selection (`curBrand`/`curItem`, `renderList`/
    `renderDetail`) → `useState` in `PricePanel.tsx`, same interaction,
    real data instead of `DATA`.
  - Plans cash/credit toggle → `useState<'cash'|'credit'>` in `Plans.tsx`.
  - Ticker/brand-marquee infinite scroll (`t.innerHTML += t.innerHTML`
    duplication trick) → duplicate the mapped list twice in JSX, same CSS
    `@keyframes slide` animation.
  - Scroll-reveal (`IntersectionObserver` + `.rv`/`.in` classes) → a small
    shared `useReveal` hook wrapping the same `IntersectionObserver` logic,
    reused across sections instead of the file's one global
    `querySelectorAll('.rv')` pass.
  - Mobile nav burger toggle → `useState<boolean>` in `Nav.tsx`.
- **Font:** Vazirmatn via `next/font/google` (weights 100-900, matching the
  file's own `@import` range) instead of the file's Google Fonts `<link>`
  tags — the Next.js-idiomatic equivalent of the same font load.
- **`<html lang="fa" dir="rtl">`** in `app/layout.tsx`, matching the
  reference file's own root attributes.
- **No schema changes** — every field this page and the new endpoint need
  already exists on `Product`/`ProductVariant`/`PriceTier`/`Category`/
  `Brand`/`User`.
- Not carried over from the abandoned redesign (see Context): the
  `liquid-gooey` library, the scrolling price-ticker-as-signature concept,
  the floating-glass-pill nav, and the per-section Three.js graphics
  reservations. None of those exist in the reference file being ported.
