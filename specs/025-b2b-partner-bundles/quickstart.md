# Quickstart Validation Guide: B2B Partner Bundles

**Feature**: `specs/025-b2b-partner-bundles`
**Status**: Ready

This guide outlines runnable end-to-end scenarios to validate the B2B Partner Bundles feature.

---

## Prerequisites

1. Development server running (`npm run dev`) on `http://localhost:3000`.
2. PostgreSQL database migrated with the updated Prisma schema (`npx prisma db push`).
3. Seeded accounts:
   - Admin user (`role = ADMIN`)
   - Wholesale Partner user (`role = WHOLESALE`)
   - Retail user (`role = RETAIL`)

---

## Scenario 1: Admin Creates and Publishes a Bundle

1. **Log in as Admin** at `/login` or via API.
2. **Navigate to Admin Bundles**: Open `/admin/bundles` in browser.
3. **Click "ایجاد سبد جدید"**:
   - Title: «سبد تستی همکار»
   - Price: `3,000,000` تومان
   - Stock quota: `5` سبد
   - Add Item 1: Select product A (e.g., Anker Charger) with quantity `4`.
   - Add Item 2: Select product B (e.g., Cable) with quantity `2`.
   - Toggle Status: Active (`فعال`).
4. **Submit Form**:
   - Verify bundle is created and listed in `/admin/bundles`.
   - Verify bundle has `stock = 5` and status `فعال`.

---

## Scenario 2: Public & Retail Access Blocking (Gating Check)

1. **Log out** (guest state).
2. Attempt to open `/partners/bundles` or call `GET /api/partners/bundles`.
   - **Expected Outcome**: Redirected to login or returns `401 Unauthorized`.
3. **Log in as Retail User** (`role = RETAIL`).
4. Attempt to open `/partners/bundles` or call `GET /api/partners/bundles`.
   - **Expected Outcome**: Access forbidden (`403 Forbidden`) with no bundle data leaked.
   - Storefront catalog (`/shop`, `/api/products`) does not show any partner bundles.

---

## Scenario 3: Wholesale Partner Views Bundle Showcase

1. **Log in as Wholesale Partner** (`role = WHOLESALE`).
2. Navigate to `/partners/bundles`.
   - **Expected Outcome**: Bundle card for «سبد تستی همکار» is rendered with:
     - Bundle title
     - Package price: ۳,۰۰۰,۰۰۰ تومان
     - Remaining stock: ۵ عدد
     - Item breakdown: ۴ عدد شارژر + ۲ عدد کابل
     - Savings indicator comparing to aggregate retail/wholesale price.

---

## Scenario 4: All-or-Nothing Cart Addition & Indivisible Item Check

1. On the bundle card, click **«افزودن سبد به سفارش»**.
2. Open the Cart Drawer (`CartDrawer` / `/cart`).
   - **Expected Outcome**:
     - The bundle appears as a single composite line item labeled «سبد تستی همکار».
     - Constituent products (۴x شارژر، ۲x کابل) are listed under the bundle.
     - There is NO delete/remove button on constituent items.
     - Quantity controls apply to the entire bundle package.

---

## Scenario 5: Checkout & Dual Synchronized Stock Decrement

1. Note initial warehouse stock for constituent products:
   - Product A stock: e.g. 50
   - Product B stock: e.g. 30
   - Bundle quota: 5
2. In checkout (`/checkout`), select payment method Cash/Online (`پرداخت نقدی / درگاه`).
   *(Attempting B2B 60-day credit must be rejected with 400 validation error).*
3. Finalize order submission.
4. **Inspect Results**:
   - Order created with order line item recording the bundle.
   - Bundle quota decremented: `5 -> 4`.
   - Product A stock decremented: `50 - (4 * 1) = 46`.
   - Product B stock decremented: `30 - (2 * 1) = 28`.

---

## Scenario 6: Out-of-Stock Protection

1. When remaining bundle quota reaches `0` (or constituent product warehouse stock falls below bundle requirement):
   - Bundle card on `/partners/bundles` updates badge to «تکمیل ظرفیت».
   - "Add to cart" button is disabled.
   - Any API attempt to purchase returns `409 Conflict`.

