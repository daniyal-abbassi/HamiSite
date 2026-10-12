# Data Model: B2B Partner Bundles (سبد کالای اختصاصی همکاران)

**Feature**: `specs/025-b2b-partner-bundles`
**Status**: Ready

## 1. Entities & Prisma Schema Additions

### 1.1 `PartnerBundle` (سبد همکار)
Represents a curated, discounted bulk package created by administrators exclusively for wholesale partners.

| Field | Type | Attributes / Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `title` | `String` | Required, min 2, max 200 | Title in Persian (e.g., «سبد ویژه لوازم جانبی پاییز») |
| `slug` | `String` | `@unique`, kebab-case | Unique URL-safe identifier |
| `description` | `String?` | Optional text | Detailed description or promotional terms |
| `price` | `Decimal` | `@db.Decimal(12, 2)`, min 0 | Package price for the complete bundle in Toman |
| `compareAtPrice`| `Decimal?` | `@db.Decimal(12, 2)`, optional | Sum of individual constituent items' prices (for savings display) |
| `stock` | `Int` | `@default(0)`, min 0 | Maximum number of bundles available for purchase |
| `isActive` | `Boolean` | `@default(true)` | Active status controlled by admin |
| `imageUrl` | `String?` | Optional URL | Primary representative banner/image for the bundle |
| `createdAt` | `DateTime`| `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime`| `@updatedAt` | Last modification timestamp |

**Relations**:
- `items`: `PartnerBundleItem[]` (Constituent product items in the bundle)
- `cartItems`: `CartItem[]` (Active cart line items holding this bundle)
- `orderItems`: `OrderItem[]` (Historical order items that purchased this bundle)

---

### 1.2 `PartnerBundleItem` (اقلام سبد)
Represents an individual product and its required quantity multiplier within a bundle.

| Field | Type | Attributes / Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `bundleId` | `Int` | Foreign key to `PartnerBundle` | Parent bundle reference (`onDelete: Cascade`) |
| `productId`| `Int` | Foreign key to `Product` | Catalog product reference (`onDelete: Cascade`) |
| `variantId`| `Int?` | Foreign key to `ProductVariant` | Specific variant if product has variants (`onDelete: SetNull`) |
| `quantity` | `Int` | `@default(1)`, min 1 | Multiplier of this product in 1 unit of bundle (e.g. 5 units) |
| `order` | `Int` | `@default(0)` | Display sort order within the bundle card |
| `createdAt`| `DateTime`| `@default(now())` | Creation timestamp |
| `updatedAt`| `DateTime`| `@updatedAt` | Modification timestamp |

**Indexes & Constraints**:
- `@@index([bundleId])`
- `@@index([productId])`
- `@@unique([bundleId, productId, variantId])`

---

### 1.3 Updates to Existing Models

#### `CartItem` (موجود در `prisma/schema.prisma`)
- Make `productId` optional (`Int?`) so cart items can represent either a single product or a composite bundle.
- Add `bundleId`: `Int?` with relation `bundle: PartnerBundle? @relation(fields: [bundleId], references: [id], onDelete: Cascade)`.
- Enforce validation: exactly one of `productId` OR `bundleId` must be non-null.

#### `OrderItem` (موجود در `prisma/schema.prisma`)
- Add `bundleId`: `Int?` with relation `bundle: PartnerBundle? @relation(fields: [bundleId], references: [id], onDelete: SetNull)`.
- When `bundleId` is present:
  - `productName` stores the snapshot of bundle title at time of order.
  - `price` stores the bundle package price.
  - `quantity` stores the number of bundles ordered.
  - `lineTotal` stores `price * quantity`.

---

## 2. Validation Rules

1. **Bundle Creation & Edit**:
   - `title`: Non-empty string after trimming, max 200 characters.
   - `price`: Must be greater than 0.
   - `stock`: Integer $\ge 0$.
   - `items`: Must contain at least 1 item with quantity $\ge 1$, total units across items $\ge 2$.
   - Each constituent product must exist, be active (`available: true`), and have sufficient warehouse inventory to fulfill at least 1 bundle.

2. **Cart Addition**:
   - User must have `role === Role.WHOLESALE` or `role === Role.AGENT`.
   - Bundle must be `isActive === true`.
   - Requested quantity must be $\le bundle.stock$.
   - Each constituent product/variant must have base inventory $\ge constituent.quantity \times requestedQuantity$.

3. **Checkout Validation**:
   - `paymentTerm` must be `B2BPaymentTerm.CASH`. If `CREDIT_60_DAYS`, reject with 400.
   - Real-time stock recheck in database transaction: both bundle quota and all constituent physical stocks must satisfy the order.

---

## 3. State Lifecycle & Transitions

```
[Draft/Inactive] ──(Admin toggles isActive: true)──> [Active]
                                                        │
                      ┌─────────────────────────────────┴───────────────────────────────┐
                      │                                                                 │
          (Stock > 0 & Base Stock > 0)                                       (Stock == 0 OR Base Stock Depleted)
                      ▼                                                                 ▼
           [Available for Partner]                                             [Sold Out / تکمیل ظرفیت]
                      │                                                                 │
          (Partner purchases bundle)                                            (Admin adds stock)
                      │                                                                 │
                      ▼                                                                 │
     (bundle.stock - quantity,                                                          ▼
   variant.stock - (item.qty * qty))                                           [Available for Partner]
```

- When an order transitions to `CANCELED`, `FAILED`, or `REVERSED`:
  - `bundle.stock` increments by purchased bundle quantity.
  - Each constituent variant's `stock` increments by `item.quantity * purchasedBundleQuantity`.

