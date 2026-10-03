# Routes

Next.js 15 App Router. Two route groups: `(main)` storefront, `(admin)` panel.
Root layout is `app/layout.tsx` (`<html lang="fa" dir="rtl">`).

## Pages

| URL | File | Layout |
|---|---|---|
| `/admin/brands` | `app/(admin)/admin/brands/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/categories` | `app/(admin)/admin/categories/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/coupons` | `app/(admin)/admin/coupons/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/orders/[id]` | `app/(admin)/admin/orders/[id]/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/orders` | `app/(admin)/admin/orders/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin` | `app/(admin)/admin/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/products/[id]` | `app/(admin)/admin/products/[id]/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/products/new` | `app/(admin)/admin/products/new/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/products` | `app/(admin)/admin/products/page.tsx` | `app/(admin)/layout.tsx` |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` | `app/(admin)/layout.tsx` |
| `/cart` | `app/(main)/cart/page.tsx` | `app/(main)/layout.tsx` |
| `/checkout` | `app/(main)/checkout/page.tsx` | `app/(main)/layout.tsx` |
| `/login` | `app/(main)/login/page.tsx` | `app/(main)/layout.tsx` |
| `/order/[id]` | `app/(main)/order/[id]/page.tsx` | `app/(main)/layout.tsx` |
| `/orders` | `app/(main)/orders/page.tsx` | `app/(main)/layout.tsx` |
| `/` | `app/(main)/page.tsx` | `app/(main)/layout.tsx` |
| `/partners` | `app/(main)/partners/page.tsx` | `app/(main)/layout.tsx` |
| `/register` | `app/(main)/register/page.tsx` | `app/(main)/layout.tsx` |
| `/shop/[slug]` | `app/(main)/shop/[slug]/page.tsx` | `app/(main)/layout.tsx` |
| `/shop` | `app/(main)/shop/page.tsx` | `app/(main)/layout.tsx` |

## API route handlers (39)

- `/api/addresses/[id]` — DELETE, GET, PATCH — `app/api/addresses/[id]/route.ts`
- `/api/addresses` — GET, POST — `app/api/addresses/route.ts`
- `/api/admin/brands/[id]` — DELETE, PATCH — `app/api/admin/brands/[id]/route.ts`
- `/api/admin/brands` — POST — `app/api/admin/brands/route.ts`
- `/api/admin/categories/[id]` — DELETE, PATCH — `app/api/admin/categories/[id]/route.ts`
- `/api/admin/categories` — POST — `app/api/admin/categories/route.ts`
- `/api/admin/coupons/[id]` — DELETE, PATCH — `app/api/admin/coupons/[id]/route.ts`
- `/api/admin/coupons` — POST — `app/api/admin/coupons/route.ts`
- `/api/admin/orders/[id]/status` — PATCH — `app/api/admin/orders/[id]/status/route.ts`
- `/api/admin/orders` — GET — `app/api/admin/orders/route.ts`
- `/api/admin/products/[id]` — DELETE, PATCH — `app/api/admin/products/[id]/route.ts`
- `/api/admin/products/[id]/variants/[variantId]` — DELETE, PATCH — `app/api/admin/products/[id]/variants/[variantId]/route.ts`
- `/api/admin/products/[id]/variants` — POST — `app/api/admin/products/[id]/variants/route.ts`
- `/api/admin/products` — POST — `app/api/admin/products/route.ts`
- `/api/admin/reports/summary` — GET — `app/api/admin/reports/summary/route.ts`
- `/api/admin/users/[id]` — GET, PATCH — `app/api/admin/users/[id]/route.ts`
- `/api/admin/users` — GET — `app/api/admin/users/route.ts`
- `/api/admin/variants/[id]/stock` — PATCH — `app/api/admin/variants/[id]/stock/route.ts`
- `/api/auth/change-password` — POST — `app/api/auth/change-password/route.ts`
- `/api/auth/login` — POST — `app/api/auth/login/route.ts`
- `/api/auth/logout` — POST — `app/api/auth/logout/route.ts`
- `/api/auth/me` — GET, PATCH — `app/api/auth/me/route.ts`
- `/api/auth/register` — POST — `app/api/auth/register/route.ts`
- `/api/brands` — GET — `app/api/brands/route.ts`
- `/api/cart/items/[id]` — DELETE, PATCH — `app/api/cart/items/[id]/route.ts`
- `/api/cart/items` — POST — `app/api/cart/items/route.ts`
- `/api/cart` — DELETE, GET — `app/api/cart/route.ts`
- `/api/categories` — GET — `app/api/categories/route.ts`
- `/api/coupons/validate` — POST — `app/api/coupons/validate/route.ts`
- `/api/health` — GET — `app/api/health/route.ts`
- `/api/orders/[id]/pay` — POST — `app/api/orders/[id]/pay/route.ts`
- `/api/orders/[id]` — GET, PATCH — `app/api/orders/[id]/route.ts`
- `/api/orders` — GET, POST — `app/api/orders/route.ts`
- `/api/partners` — POST — `app/api/partners/route.ts`
- `/api/payments/callback` — GET — `app/api/payments/callback/route.ts`
- `/api/payments/mock-confirm` — GET — `app/api/payments/mock-confirm/route.ts`
- `/api/pricing/quote` — POST — `app/api/pricing/quote/route.ts`
- `/api/products/[slug]` — GET — `app/api/products/[slug]/route.ts`
- `/api/products` — GET — `app/api/products/route.ts`

## Key pages

- **`/`** — storefront home. Hero, trust bar, category hub, featured products, why-hami, brand showcase, campaign banner, new arrivals, B2B section, accessory universe, online services, store experience, customer trust, final conversion, mobile dock.
- **`/shop`** — product listing with filter sidebar.
- **`/shop/[slug]`** — product detail.
- **`/cart`, `/checkout`, `/order/[id]`, `/orders`** — commerce flow.
- **`/partners`** — B2B partner application.
- **`/admin/*`** — admin panel, client-gated by `AdminGate` (API enforces roles).
