# Research & Architecture Decisions: B2B Partner Bundles

**Feature**: `specs/025-b2b-partner-bundles`
**Status**: Completed

## 1. Bundle Data Model Architecture

### Decision
Introduce dedicated models in Prisma: `PartnerBundle` and `PartnerBundleItem`, linked to `Product` and `ProductVariant`, and link `PartnerBundle` to `CartItem` and `OrderItem`.

### Rationale
- Bundles are distinct marketing and commercial packages that contain multiple line items with individual quantities (e.g., 5x Charger + 2x Phone Case).
- Treating a bundle as an overloaded `Product` would corrupt existing product attributes (e.g., specs, brands, categories, dimensions) and create messy foreign key constraints.
- A dedicated `PartnerBundle` model cleanly encapsulates bundle-specific metadata: `title`, `slug`, `description`, `price`, `compareAtPrice`, `stock` (quota), `isActive`, and `imageUrl`.
- `PartnerBundleItem` connects the bundle to catalog products, storing `quantity` (multiplier per bundle) and `order` (display order).

### Alternatives Considered
- **Overloading `Product` with `isBundle: Boolean`**: Rejected because product catalog queries, filters, and brand associations would become heavily polluted with bundle logic.
- **JSON array inside `PartnerBundle` instead of `PartnerBundleItem` relation**: Rejected because relational integrity with cascade deletes/set-null ensures orphan protection and clean reporting if products change.

---

## 2. Cart & Order Representation for Indivisible Packages

### Decision
Extend `CartItem` and `OrderItem` in `prisma/schema.prisma` with an optional `bundleId` relation (`PartnerBundle?`).
- When `bundleId` is set, `productId` is null (or refers to a primary product representation), and the line item represents the composite bundle.
- In `CartProvider` and cart UI components (`CartDrawer`, `CartLine`), bundle items are rendered as a locked single card showing the bundle title, total package price, quantity selector (for number of bundles), and an expandable/visible list of included items.
- Item removal or quantity adjustment applies to the entire bundle. Constituent products cannot be individually deleted or altered.

### Rationale
- Directly satisfies user requirement: "از سبد نمیشه خرید انتخابی کرد" (No cherry-picking).
- Preserves existing checkout, invoice, and payment flows without requiring separate checkout pipelines for bundles vs. regular products.
- In historical orders (`OrderItem`), the line item captures `bundleId`, `productName` (bundle title), `price` (package price), `quantity`, plus a snapshot of the constituent products in order metadata or related items.

### Alternatives Considered
- **Exploding bundles into separate `CartItem` rows with zero price**: Rejected because the customer could modify or remove one row, breaking bundle integrity.
- **Creating a separate `BundleCart` and `BundleOrder` parallel pipeline**: Rejected because partners must be able to check out easily within the standard wholesale ordering flow.

---

## 3. Dual Synchronized Inventory & Concurrency Settlement

### Decision
Enforce transactional verification and deduction in `prisma.$transaction`:
1. Check `bundle.stock >= requestedBundleQuantity`.
2. For each `item` in `bundle.items`:
   - Compute required physical units: `item.quantity * requestedBundleQuantity`.
   - Verify `variant.stock >= requiredPhysicalUnits` (for limited stock items).
3. If any stock condition fails, reject the order with `409 Conflict` and descriptive Persian error message («موجودی سبد یا کالاهای تشکیل‌دهنده آن کافی نیست»).
4. Atomically:
   - Decrement `bundle.stock` by `requestedBundleQuantity`.
   - Decrement each constituent product variant's `stock` by `item.quantity * requestedBundleQuantity`.
5. If order is later canceled (`OrderStatus` -> `CANCELED`/`FAILED`/`REVERSED`), reverse both the bundle stock quota and constituent physical variant stock in `applyOrderStatusTransition`.

### Rationale
- Avoids overselling both the promotional bundle quota and the physical warehouse stock.
- Handles high-concurrency checkouts gracefully with PostgreSQL transactional isolation.

### Alternatives Considered
- **Isolated Bundle Quota Only (ignoring base stock)**: Rejected by stakeholder in clarification Question 1.
- **Pre-deducting stock upon bundle creation**: Rejected because it immobilizes physical warehouse stock from retail sales before any partner actually buys the bundle.

---

## 4. B2B Partner Access Control & Role Gating

### Decision
- **API Gate**: Use `withAuth(..., { roles: [Role.WHOLESALE, Role.AGENT, Role.ADMIN] })` on all `/api/partners/bundles` read and checkout endpoints.
- **Admin Gate**: Use `withAuth(..., { roles: [Role.ADMIN] })` on `/api/admin/bundles` CRUD endpoints.
- **Storefront & Catalog Isolation**: Public search and catalog endpoints (`/api/products`) do not include bundles. Public visitors navigating to `/partners/bundles` are redirected to `/login` or `/partners` application page.
- **Storefront Navigation**: A dedicated link to "سبدهای همکاران" is shown in the header/account menu only when the user has `Role.WHOLESALE` or `Role.AGENT`.

### Rationale
- Completely adheres to the requirement: "سبد رو فقط همکار ها میتونند ببینند (فقط در پنل همکارها قابل دیدنه و نه افراد عادی)".

---

## 5. Payment & Settlement Constraints

### Decision
In order validation (`app/api/orders/route.ts`):
- If the cart/order contains any line item with `bundleId`, enforce `paymentTerm === B2BPaymentTerm.CASH`.
- If a partner attempts to use `B2BPaymentTerm.CREDIT_60_DAYS` on an order containing a bundle, reject with `400 Bad Request` («خرید سبدهای تخفیف‌دار همکار فقط به‌صورت نقدی و پرداخت آنی امکان‌پذیر است»).

### Rationale
- Directly implements the stakeholder decision from clarification Question 3.
- Protects store margins on heavily discounted bulk packages.

---

## 6. Persian RTL & Luxury Design Alignment

### Decision
- All UI text in Persian (`fa-IR`) with numbers formatted via Persian numerals.
- Prices explicitly labeled in `تومان` (Toman).
- Admin management screen at `/admin/bundles`: Clean, tabular layout with active toggle, quota counter, and modal item picker.
- Partner view at `/partners/bundles`: Luxury editorial card layout matching Principle IV (refined dark/burgundy tones, clear savings tags, high-craft typography, real-time quota status badge «تنها ۵ بسته باقی‌مانده»).

