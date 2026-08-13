# HamiHamrah Landing Page — Design Spec

## Context

This project's backend (Next.js API routes + Prisma/Postgres) is complete and
seeded with real data from the live HamiHamrah shop it replaces — a mobile
phone wholesale distributor based in Mashhad's Central Mobile Market. There is
currently no frontend anywhere in this repo (`app/page.tsx` is a one-line
placeholder). This spec covers the first real page: a public marketing/
partner-acquisition landing page, arrived at through an iterative visual
brainstorm (12 mockup rounds against a live-reload preview) rather than a
from-scratch brief.

Two source materials informed this, neither of which is the literal spec:
- `Downloads/Telegram Desktop/prompt.txt` — an unrelated build prompt for a
  different product ("Aura," an email client). Its *stack* (React 18,
  motion/framer, lucide-react) was **not** adopted — this project builds
  directly in the existing Next.js app, not a separate Vite/React app.
- `Downloads/aura-landing (1).html` — a static, hardcoded-data HTML mockup of
  a real HamiHamrah landing page, used only to source the actual brand color
  identity (oxblood `#640211`, paper `#F2F4ED`) and confirm the business's
  real content (partnership tiers, daily price list, RTL Persian/Vazirmatn).
  Its specific layout, liquid-glass card treatment, and hardcoded `DATA`
  object were explicitly rejected during brainstorming in favor of an
  original design (see Visual Design System below) and real API data.

## Goal

A single, real, data-wired Next.js homepage at `app/page.tsx`, replacing the
static file's hardcoded `DATA` object and non-functional contact form with
live queries against this project's own API and a real partner-application
endpoint. Explicitly **not** in scope for this pass (confirmed during
brainstorming):

- Login, cart, or checkout flows — this is the public front door, not the
  authenticated shopping experience.
- A full implementation of the dedicated `/prices` (complete price list) page
  the homepage's price section links out to — only the homepage's *preview*
  of it is built here. The full page is a natural next spec.
- Any 3D graphics (Three.js brand-orbit selector, per-section banners). The
  human is building these separately; this pass reserves the layout space
  for them with simple flat placeholders (see Visual Design System).
- The `liquid-gooey` npm package's actual morph physics wiring for the nav
  category-dropdown and price-panel brand-tab transitions — call sites and
  static layout are specified; the live spring/morph behavior is a follow-up
  once the package is added as a real dependency (see Technical Notes).

## Visual Design System

Established through the brainstorm (12 rounds); the human's own words: **"its
60% good — we will adjust it later for bad parts — its the page for now."**
Treat this as the current baseline, not a final pixel spec — expect a
follow-up pass.

**Color tokens** (CSS custom properties, `app/globals.css`):
```css
:root {
  --ink: #140B0C;          /* page background */
  --ink-2: #0D0708;        /* ticker strip, deepest surfaces */
  --oxblood: #640211;      /* primary brand action color */
  --oxblood-lite: #9C0A22; /* gradient partner, hover */
  --oxblood-deep: #3A010A;
  --gold: #C9A227;         /* secondary accent */
  --gold-lite: #F0DCA0;    /* headline gradient, price emphasis */
  --gold-deep: #8A6A15;
  --paper: #F2F4ED;        /* primary text on dark surfaces */
  --paper-muted: rgba(242, 244, 237, .62);
  --paper-section-bg: #EFE9DF; /* the ONE light section (price list) — same
                                   paper family as --paper, toned as a surface */
  --ink-on-paper: #2A1B14; /* headings on the light price section */
  --live-green: #3FBF7F;   /* in-stock/live indicator only — not a brand color */
}
```

**Type:** Vazirmatn (Google Fonts, weights 400/500/600/700/800) via
`next/font/google`, loaded once in `app/layout.tsx`. `<html lang="fa"
dir="rtl">`. Headlines at 800, body at 400/500, generous line-height (`1.9`+)
for Persian readability, per the reference file's own convention.

**Signature element:** a continuously scrolling live price ticker
(`.ticker-track`, CSS `@keyframes` translateX loop, duplicated content for a
seamless wrap) at the very top of the page, above the nav. This is the one
deliberate bold move — the business's whole pitch is transparent daily
pricing, so the page opens with moving real numbers instead of a generic
hero. Everything else stays quieter around it.

**Navigation:** three independent zones, not one bar. Logo (right, RTL) and
phone number + "ثبت‌نام همکار" CTA (left) sit directly on the page background
— no container. Only the center cluster of links is a floating glass pill
(`backdrop-filter: blur(14px)`, `background: rgba(242,244,237,.07)`, gold-
tinted border). Inside that pill: **"فروشگاه"** rendered as a distinct filled
button (oxblood gradient), **"دسته‌بندی‌ها"** as a dropdown trigger (chevron),
then plain text links (لیست قیمت / برندها / درباره ما).

**Hero:** full-viewport-height section. Headline with one gradient-text
accent word (gold gradient, matching the reference file's `.grad` technique
but re-keyed to the gold palette instead of its original cyan). A floating
abstract blob shape (irregular `border-radius`, oxblood-to-gold gradient,
slow CSS keyframe float — explicitly **not** a literal phone silhouette,
per brainstorming: "modern shape," abstract) plus 1-2 floating glass stat
chips (real counts: brand count, years active).

**Price list section:** the one light-background section (`--paper-
section-bg`), signaling "this is the trust/data moment" by breaking the dark
pattern. A single floating card, full content-width (matches hero/nav width,
not a narrow centered island), dark (oxblood/gold-on-near-black) — a genuine
"screen on a light desk" contrast. Internally split **70/30**: 70% is the
real price panel (brand name header + rows of model / رنگ (color, not
موجودی/stock) / price), 30% is reserved space for the human's future
Three.js brand-orbit selector — built here as a flat placeholder (a dashed
circle with a few brand-initial chips arranged around it, static, clearly
labeled as a reservation, not a real interaction).

**Best-sellers section:** full-height. A row of category filter chips
(همه دسته‌ها / [real category names]) above product cards **grouped by
brand** — a brand-name header row, then that brand's cards, repeated per
brand — not one flat mixed grid.

**پیشنهادهای ویژه (special offers) section:** full-height, new (didn't exist
in the reference file). Cards use real `Product.specialOffer`/
`compareAtPrice` data: current price emphasized, `compareAtPrice`
strikethrough beside it, a gold "تخفیف محدود" pill on the section header.

**Per-section placeholder shapes:** every full-height section carries a
small, quiet corner accent shape (irregular blob or soft radial-gradient
circle, `position: absolute`, low opacity, CSS float keyframe) — reserved
space for the human's own future per-section Three.js banner graphics.
Deliberately bounded/corner-positioned, not full-bleed backgrounds: a full
video/3D background behind the price table and product grids would hurt
legibility for this audience (shop owners scanning prices to decide a
purchase, not browsing a brand story) — this tradeoff was raised explicitly
during brainstorming and the human agreed with bounded placeholders over
full-section video/3D backgrounds.

## Page Structure & Data Wiring

`app/page.tsx` is a Server Component composing section components from
`app/components/homepage/`. Each section fetches its own data server-side
against this app's own existing API routes via `fetch` with an absolute URL
built from `APP_BASE_URL` (already an established env var in this codebase,
used the same way for payment gateway callbacks — see `.env.example`) —
reusing the existing, tested route handlers (auth-free, public GETs) rather
than duplicating their query/pricing logic into a second code path. Apply a
light cache (`{ next: { revalidate: 300 } }`, 5 minutes) — generous relative
to the business's own stated "updates once daily at 9:00" cadence.

| Section | Component | Data source |
|---|---|---|
| Ticker | `Ticker.tsx` | `GET /api/products?specialOffer=true&includeVariants=false&page=1` (or a small recent/featured set — first 6-8 by `updatedAt desc`) — name + price only |
| Nav category dropdown | `CategoryDropdown.tsx` | `GET /api/categories?tree=true` — real parent→child structure |
| Hero stat chips | inline in `Hero.tsx` | `GET /api/brands` for the brand count (`total` from the response envelope); years-active is static copy (`از ۱۳۹۳`) |
| Price list preview | `PriceListPreview.tsx` | `GET /api/products?brandId={firstBrandId}&includeVariants=true&page=1&pageSize=5` for the initially-active brand tab; brand tab switching is a follow-up client interaction (see Technical Notes) |
| Best-sellers | `BestSellers.tsx` | `GET /api/products?page=1&pageSize=12` grouped client-side by `product.brand.name`; category chips from `GET /api/categories` |
| Special offers | `SpecialOffers.tsx` | `GET /api/products?specialOffer=true&page=1&pageSize=6` |

"مشاهده همه لیست قیمت" links to `/prices` (not built this pass — a future
spec). "فروشگاه" nav button links to `/shop` (not built this pass). Both are
real `<a href>`s to routes that don't exist yet — acceptable for this pass
since the brief explicitly scoped "just this page for now."

## New Backend Piece: Partner Application Endpoint

"ثبت‌نام همکار" submits to a **new** endpoint, not the existing
`/api/auth/register` — confirmed during brainstorming: register requires a
password and immediately creates an active, logged-in session, but a
landing-page partner inquiry should create a **pending** record for staff
review (`isActive: false`), collecting only name/phone/shop/city — no
password field on this form.

`POST /api/partners/apply` (new, public, unauthenticated):
- Request: `{ firstName, lastName, phoneNumber, shopName?, city?, brandInterest? }` (zod-validated, mirroring `register`'s validation style).
- Duplicate check on `phoneNumber` against `User`, same conflict pattern as
  `register` (409 if an account already exists).
- Creates a `User` row: `role: WHOLESALE`, `isActive: false`,
  `businessVerified: false` (both already the schema defaults for the
  verification flag; `isActive` needs to be explicitly set false here since
  the schema defaults it `true`), `username` derived from the normalized
  phone number (same `+98…` normalization the legacy-import pipeline already
  uses at `prisma/legacy-import/normalize.ts` — since that module is
  import-script-specific, not app runtime, the plan should add an equivalent
  small `normalizePhoneNumber` to `lib/` rather than importing across that
  boundary; two near-identical 3-line functions is an acceptable YAGNI trade
  against reaching into a script-only module from a live API route),
  `shopName`/`city` passed through, `creationMethod: "partner_application"`,
  `referer: brandInterest` (repurposing the existing free-text `referer`
  field rather than adding a new column).
- `passwordHash`: a random, unguessable, bcrypt-hashed placeholder (the
  applicant never sets one on this form) — the account cannot log in until
  a staff-driven activation/password-reset flow exists. **That activation
  flow itself is out of scope for this pass** — the endpoint's job is only
  to produce a real, findable row. Staff already see it via the existing
  `GET /api/admin/users` customer list (built in the admin-api phase),
  filterable by `isActive: false` to find pending applications.
- No session is created and no cookie is set (unlike `register`) — the
  response is just a success confirmation.

## Technical Notes

- **`liquid-gooey`** (the human's own React library, `homepage:
  https://gooey.jakubantalik.com`, already installed at
  `/home/lain/node_modules/liquid-gooey` but **not yet a dependency of this
  project** — `npm install liquid-gooey` needs to happen when a future pass
  wires the real nav-dropdown/price-tab morph). It requires React ≥18
  (satisfied by Next.js) and its `<Liquid>`/`<Liquid.Item morph={{shape:
  true}}>` API is the mechanism for both the category-dropdown open/close
  and the price-panel brand-tab switch — confirmed by the human as the
  intended tool, not a generic CSS transition. This pass builds the static
  layout those interactions will attach to; the spring physics themselves
  are follow-up work once the package is a real dependency.
- **Styling approach:** plain CSS custom properties in `app/globals.css`
  (mirroring the reference file's own `:root` token technique) plus
  component-scoped CSS Modules per section — no new styling framework
  dependency (this project has no Tailwind/styled-components today, and
  none of the brainstorm mockups needed one).
- **No schema changes** beyond none — every field this page and the new
  endpoint need already exists on `Product`/`Category`/`Brand`/`User`.
