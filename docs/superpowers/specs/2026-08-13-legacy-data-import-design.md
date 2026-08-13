# Legacy Data Import — Design Spec

## Context

The 4-phase backend-completion effort (auth, authorization-hardening, admin-api,
payments — see `docs/superpowers/specs/2026-08-12-backend-completion-design.md`)
is done: 133/133 tests pass, all routes exist, no TODOs. `npm run db:seed`
currently only inserts synthetic demo data (3 fake products, 4 demo accounts) and
is itself broken (`ts-node --transpile-only` throws `Unknown file extension
".ts"`).

Before starting the next phase (frontend or otherwise), the dev database should
be seeded with **real catalog, customer, and order data** pulled live from the
old production shop this project is replacing, so the new API's behavior can be
validated against real-world data shapes, volumes, and edge cases instead of 3
hand-picked demo products.

Credentials for the legacy shop's API live in `actuall_old_webSite_api_token.txt`
(repo root, now gitignored — it was previously untracked and ungitignored,
a live-credential exposure risk that this plan fixes as its first step):

```
API_TOKEN=<redacted>
WEBSITE_URL=https://hamihamrah-shop.com/
```

`openapi.json` (repo root) is that legacy shop's own OpenAPI document ("Mixin
API v4") — this project's `prisma/schema.prisma` was already explicitly modeled
to align field names/enums with it (see schema header comment). This spec is the
result of live-probing that API with the token above to confirm exact response
shapes, enum value domains, and record counts as of 2026-08-13 — every mapping
decision below is based on real observed responses, not the OpenAPI doc alone
(the doc's `servers.url` is a placeholder and several response shapes returned
by the live API differ from what a generic reading of the spec would suggest).

## Goal

A one-shot, idempotent (safe to re-run) import script that populates the local
Postgres dev database with the legacy shop's real:

- Categories (28, up to 3 levels deep)
- Brands (39)
- Products + variants + images (178 products, 97 with variants, 295 variants
  total)
- Customers, imported as `RETAIL` users (233)
- Orders + order items + payments (57 orders, 106 payment attempts)

...wired into the existing `npm run db:seed` flow alongside (not replacing) the
existing synthetic B2B demo accounts (admin/agent/wholesale/retail + coupons),
since the legacy store has no B2B/wholesale/agent concept — those synthetic
accounts remain the only way to exercise the B2B pricing engine in dev.

## Explicitly out of scope

- **Live sync / webhooks.** This is a one-shot import for dev-seed purposes, not
  an ongoing integration. Re-running it refreshes data (see Idempotency) but
  there's no polling, no scheduled job.
- **Legacy passwords.** The legacy API does not expose password hashes (nor
  should it). Imported users get a fixed, documented dev-only password (see
  Customers section) — they're for realistic *data*, not real logins.
  matched the "SMS OTP / AGENT-flow / IMEI tracking" scope already fenced off by
  the backend-completion spec.
- **`ProductTag` import.** Every sampled product returned an empty `tags: []`
  from the legacy API. No tag data exists to import.
- **Per-customer `/addresses/customer/{id}/` calls.** Sampled customers return
  `addresses: []` — the legacy shop stores shipping info as an inline snapshot
  on each order, not a maintained address book. Addresses are instead derived
  from order shipping snapshots (see Orders section), which is where the real
  address data actually lives.
- **Coupons, discounts, taxes.** The legacy `/orders/` list response has no
  coupon/discount/tax breakdown fields. Imported orders get `discountAmount:
  0`, `taxAmount: 0`, `couponId: null`.
- **Schema/migration changes.** Every mapping below uses existing unique fields
  (slug, phoneNumber, orderNumber, transactionNumber, barcode,
  productIdentifier) as natural idempotency keys — no new "legacy source id"
  columns are added.

## Legacy API access

- Base URL: `https://hamihamrah-shop.com/api/v4` (from `WEBSITE_URL` in the
  token file, `/api/v4` appended)
- Auth header (confirmed live — the OpenAPI doc's `securitySchemes` block does
  **not** document this correctly; the real scheme was found in an
  `x-codeSamples` cURL example instead):
  ```
  Authorization: Api-Key <API_TOKEN>
  ```
  `Authorization: Bearer`, `Authorization: Token`, and `X-API-KEY` all return
  `401 {"detail":"Unauthorized"}`.
- Pagination: every list endpoint returns
  `{status, data: [...], message, pagination: {page, page_size, total_count,
  total_pages, has_next, has_previous}}`. `page_size` up to at least 250
  confirmed working (products: 200 in one page; product-variants: 250, 2 pages
  for 295 rows).
- Credentials load from `actuall_old_webSite_api_token.txt` (dotenv-format,
  gitignored) via `dotenv.config({ path: 'actuall_old_webSite_api_token.txt' })`
  — no separate copy into `.env`/`.env.test`, avoiding a second place secrets
  can leak from.

## Endpoints used

| Resource | Endpoint | Notes |
|---|---|---|
| Categories | `GET /categories/?page_size=100` | Single page covers all 28. Has `level`, `parent_id` — import in ascending `level` order so parents exist before children. |
| Brands | `GET /brands/?page_size=100` | Single page covers all 39. **No `slug` field** — must be derived (see Brands). |
| Product IDs | `GET /products/?page_size=200` | Used only to enumerate IDs; the list shape is missing most fields (`slug`, `description`, `guarantee`, dimensions, `is_digital`, `variants`, etc. — confirmed by diffing observed keys). |
| Product detail | `GET /products/{id}/` | Has every field needed, **including embedded `variants[]` and `images[]`** — no separate `/product-variants/` calls needed. Called once per product id (178 calls). |
| Customers | `GET /customers/?page_size=100` | Loop pages (233 rows / 100 = 3 pages). List shape already has every field needed (no per-customer detail calls required). |
| Orders | `GET /orders/?page_size=100` | Single page covers all 57. Has embedded `items[]` and full shipping snapshot. |
| Order payments | `GET /order-payments/?page_size=100` | Loop pages (106 rows / 100 = 2 pages). Joined to orders via `order_id`. |

## Field mappings

### Categories → `Category`

Direct 1:1 field mapping (`name`, `slug`, `description`, `image_url→imageUrl`,
`icon_url→iconUrl`, `image_alt→imageAlt`, `available`,
`categories_menu_show→categoriesMenuShow`,
`top_menu_separate_show→topMenuSeparateShow`, `order`, `level`,
`seo_title→seoTitle`, `seo_description→seoDescription`). `parent_id` resolves
through an in-memory `Map<legacyCategoryId, ourCategoryId>` built as each
category is created (safe because import order is ascending `level`, so a
child's parent is always already created).

**Idempotency key:** `slug` (already `@unique` in schema, legacy-provided,
confirmed non-colliding across all 28 sampled).

### Brands → `Brand`

Same direct field mapping, except:
- `slug`: **not provided by the legacy API.** Derive as
  `name.trim().replace(/[\s|]+/g, "-")`, lowercased for ASCII names only
  (Persian has no case). On collision (two brands deriving the same slug),
  append `-${legacyBrandId}`.
- `iconUrl`, `isActive`, `order`: not provided by legacy; leave at schema
  defaults (`null`, `true`, `0`).

**Idempotency key:** derived `slug`.

### Products → `Product` + `ProductImage` + `ProductVariant`

Per product detail response, direct field mapping for: `name`,
`english_name→englishName`, `slug`, `description`, `analysis`, `is_digital→isDigital`,
`price`, `compare_at_price→compareAtPrice`, `special_offer→specialOffer`,
`special_offer_end→specialOfferEnd`, `cost_per_item→costPerItem`,
`batch_size→batchSize`, `length`/`width`/`height`/`weight` (rounded to nearest
int — schema is `Int?`, legacy may return floats), `barcode`, `available`,
`show_price→showPrice`, `has_variants→hasVariants`, `stock`,
`min_order_quantity→minOrderQuantity`, `max_order_quantity→maxOrderQuantity`,
`guarantee`, `product_identifier→productIdentifier`,
`processing_time→processingTime`, `seo_title→seoTitle`,
`seo_description→seoDescription`, `views`.

- `main_category.id` → `mainCategoryId` via the category id map.
- `other_categories[].id` → `otherCategories: { connect: [...] }` via the
  category id map.
- `brand.id` → `brandId` via the brand id map; `null` if legacy `brand` is
  `null` (4/178 products observed with no brand).
- `stock_type.value` → `StockType` enum. Only `"limited"` and
  `"out_of_stock"` observed in the live data, but map the full documented
  domain since the enum already covers it: `unlimited→UNLIMITED`,
  `limited→LIMITED`, `out_of_stock→OUT_OF_STOCK`, `call→CALL`.
- `tags`: skip — every sampled product returned `[]`.
- `images[]` → `ProductImage` rows created first (`url←image`,
  `altText←image_alt`, `isDefault←default`, `order`), building a
  `Map<legacyImageId, ourImageId>` for variant image resolution.
- `variants[]` (only present/non-empty when `has_variants` is true) →
  `ProductVariant` rows:
  - `price`, `compare_at_price→compareAtPrice`, `stock`,
    `length`/`width`/`height`/`weight`, `processing_time→processingTime`,
    `is_default→isDefault` map directly.
  - `barcode`, `product_identifier→productIdentifier`: both are `@unique` in
    schema; legacy frequently returns `""` for both — **empty string must
    become `null`**, not be stored literally (storing `""` on multiple
    variants would violate the unique constraint after the first row).
  - `stockType`: variants carry no `stock_type` field of their own (confirmed
    absent from every sampled variant object) — derive as
    `stock > 0 ? LIMITED : OUT_OF_STOCK`, matching the pattern the existing
    synthetic `prisma/seed.ts` already uses for the same situation.
  - `guarantee`: inherited from the parent product's `guarantee` (variants
    carry no guarantee override).
  - `image` (legacy image id) → `imageId` via the per-product image id map
    built above; `null` if unresolved.
  - `attributes[]`: 4 distinct attribute names observed across all 295
    variants — `رنگ` (color), `نوع` (type), `دامنه` (range), `سرور` (server/
    region). Schema only has dedicated `color`/`storage` fields for variant
    axes (no generic attribute bag). Mapping: the `رنگ` attribute's `value` →
    `color`. Every other attribute (`نوع`/`دامنه`/`سرور`), if present, joined
    as `"{name}: {value}"` pairs with `" | "` → `storage` (a pragmatic reuse
    of the free-text `storage` field as "other variant descriptor", since only
    18/295 variants carry more than one attribute and none of the 4 names is
    literally "storage capacity" the way the existing synthetic seed data
    uses that field for phones — this is a labeled trade-off, not a silent
    one).

**Idempotency key:** `slug` (legacy-provided, `@unique` in schema). On re-run,
an existing product's `ProductImage`/`ProductVariant` children are deleted and
recreated from fresh legacy data (full replace, not per-child upsert) — simpler
than requiring external-id columns, acceptable because these are legacy-sourced
rows, not admin-edited ones. **Caveat to document in code comments:** if an
admin has since edited an imported product's variants/images through the admin
API, re-running the import wipes those edits. This is a one-shot dev-seed
tool, not a sync — acceptable per the out-of-scope section above.

### Customers → `User`

Legacy customer object has no `city` field (unlike orders, which do) — left
`null`. Direct mapping: `first_name→firstName`, `last_name→lastName`, `email`,
`national_number→nationalNumber`, `card_number→cardNumber`,
`is_active→isActive`, `verified→phoneVerified`,
`receive_newsletters→receiveNewsletters`,
`management_sms_notifications→managementSmsNotif`,
`management_email_notifications→managementEmailNotif`, `referer`,
`creation_method→creationMethod`, `date_joined→createdAt` (explicit, for
realistic historical timestamps rather than "now").

- `role`: hardcoded `RETAIL` — legacy has no B2B concept (confirmed
  out-of-scope by the backend-completion spec already).
- `username`: legacy `username` field used as-is — in every sampled customer
  it already equals `phone_number` (e.g. `"09923286434"`), so it's already
  unique and login-shaped.
- `phoneNumber`: legacy `phone_number` normalized to the `+98…` form the rest
  of the app uses (strip a leading `"0"`, prefix `"+98"` — e.g.
  `"09923286434"` → `"+989923286434"`), matching the convention the existing
  synthetic seed accounts already use.
- `passwordHash`: `bcrypt.hash("Imported@12345", 10)` for every imported
  customer — same fixed-dev-password pattern the existing synthetic seed
  accounts use (see Goal). Documented in the script's console output banner
  alongside the existing admin/agent/wholesale/retail credentials.

**Idempotency key:** `phoneNumber` (`@unique` in schema).

### Orders → `Order` + `OrderItem` + `Payment`, and derived `Address`

Direct mapping: `payment_method→paymentMethod` (free-text passthrough:
`online`/`pos`/`card`), `shipping_method_name→shippingMethodName`,
`shipping_tracking_code→trackingCode`, `referer`,
`creation_date→createdAt` (explicit).

- `status`: legacy values observed are exactly `processing`, `finished`,
  `canceled` — which is precisely the "concrete transitions" half of the
  `OrderStatus` enum's own doc-comment (`schema.prisma:68-70`, written during
  the auth-sessions phase specifically to mirror this API's status vocabulary):
  `processing→PROCESSING`, `finished→COMPLETED`, `canceled→CANCELED`.
- `payment_status`: legacy values observed are exactly `pending`, `paid`:
  `pending→INITIATED`, `paid→COMPLETED`.
- `paymentTerm`: hardcoded `CASH` — no B2B concept in legacy orders.
- `firstName`/`lastName`/`phone`/`province`/`city`/`addressText`/`postalCode`
  ← `shipping_first_name`/`shipping_last_name`/`shipping_phone_number`/
  `shipping_province`/`shipping_city`/`shipping_address`/`shipping_zip_code`.
- `subtotal` = sum of `items[].total_price`; `totalAmount` = `final_price`;
  `shippingPrice` = `max(0, totalAmount - subtotal)` (legacy exposes no
  separate shipping-price field on the order); `discountAmount` = `0`;
  `taxAmount` = `0` (see out-of-scope).
- `orderNumber` = `` `LEGACY-${legacyOrderId}` `` — guarantees uniqueness and
  keeps the source id traceable without a schema change.
- `userId`: resolved via a `Map<phoneNumber, ourUserId>` built during customer
  import, keyed by the order's `customer_phone` (normalized the same way as
  Customer import). If a phone number genuinely isn't found (not expected —
  orders and customers come from the same store — but handled defensively), a
  minimal `RETAIL` user is created from the order's `customer_name`/
  `customer_phone` rather than the import crashing.
- `items[]` → `OrderItem` rows: `product_id`/`variant_id` resolved via the
  product/variant id maps built during product import (`null` if a
  referenced product/variant was deleted from the legacy catalog since the
  order was placed — `OrderItem.productId`/`variantId` are nullable exactly
  for this reason, per the existing schema design). `product_name`/
  `variant_name→productName`/`variantName` (snapshot), `quantity`, `price`,
  `compare_at_price→compareAtPrice`, `total_price→lineTotal`,
  `discountAmount: 0`.
- `Address`: for each order with a non-empty `shipping_address`, find or
  create an `Address` row for the resolved user — matched by
  `(userId, address)` to dedupe repeat customers reusing the same shipping
  info across multiple orders — populated from the same `shipping_*` fields,
  and `Order.addressId` set to it. A user's first imported address is marked
  `isDefault: true`.
- `Payment`: from `/order-payments/`, matched to its parent order via
  `order_id` → `` `LEGACY-${order_id}` `` → the order id map built during
  order import (skip with a logged warning if unmatched — not expected, but
  handled rather than silently dropped or crashing).
  - `transactionNumber` = `` `LEGACY-${mixin_transaction_number}` ``. **Not**
    the legacy `transaction_number` field — that field is `null` for 55/106
    payments and only 52/106 values are unique among the rest, so it cannot
    satisfy our `@unique transactionNumber`. `mixin_transaction_number` is
    unique across all 106 sampled rows.
  - `authority`: `null` — legacy doesn't expose a separate gateway authority
    token; schema already treats this as nullable for exactly this case
    ("non-gateway/seeded payments").
  - `amount` ← `price`. `method`/`method_display→methodDisplay`,
    `psp`/`psp_display→pspDisplay`, `card_number→cardNumber` direct.
  - `status`: legacy values observed are exactly `failed`, `sent`,
    `initiated`, `completed` — a 1:1 match to 4 of the 6 `PaymentStatus` enum
    members (`REVERSED`/`EDITED` unused, not observed in legacy data).
  - `userId` = the same resolved user as the parent order.

## Idempotency summary

Re-running the import script is safe:
- Category/Brand/Product/User: **upsert** by their natural unique key (slug /
  phoneNumber).
- Product's images/variants, Order's items/payments: **delete-and-recreate**
  under the parent on each run (parent found by its own unique key first).
- Order itself: **upsert** by `orderNumber`.

## Verification

After the script runs, spot-check row counts against the source-of-truth
pagination totals confirmed live on 2026-08-13: 28 categories, 39 brands, 178
products, 295 variants (across the 97 `has_variants=true` products), 233
customers, 57 orders, 106 payments. Exact match isn't guaranteed (the legacy
store is live and may change between spec-writing and script-running), but
counts should be in the same ballpark — a large deviation signals a pagination
or auth bug, not real data drift.
