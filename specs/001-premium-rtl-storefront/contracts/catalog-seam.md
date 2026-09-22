# Contract: Catalog Seam

**Owner**: `lib/catalog.ts` | **Consumers**: every shopper-facing surface | **Date**: 2026-09-23
**Requirements served**: FR-001, FR-030, FR-031, FR-032, FR-033, Constitution III

This contract exists because the seam was rewritten around the flat export and its consumers were not
moved with it. `components/shop/ProductDetail.tsx:191` still reads a key the seam does not emit, and an
unchecked `apiGet<ProductDetail>` cast meant TypeScript could not see it. The result: **no product page in
the store displays a price.** See `../data-model.md`.

## Scope

`lib/catalog.ts` is the only reader of `data/*.json` for shopper-visible data, and its response shape MUST
remain compatible with the existing `/api/products` output so a live source can replace the export without
editing any consumer (Constitution III). Nothing in this contract authorises a change to `app/api/`,
`prisma/` or `data/`.

## Product shape (normative)

| Field | Type | Emitted at | Notes |
|---|---|---|---|
| `id`, `name`, `englishName`, `slug` | scalar | `lib/catalog.ts:191-194` | `slug` is Persian text; consumers MUST URL-encode it |
| `description` | `string \| null` | `:195` | **raw `description_html`** — MUST NOT be rendered as text |
| `descriptionText` | `string \| null` | `:196` | the clean form; **this is the field the PDP must render** |
| `kind` | `string \| null` | `:197` | the only fully-populated grouping axis; 3 sim-card and 1 service record exist |
| `specialOffer`, `specialOfferEnd` | bool, date | `:198-199` | 11 records; all 11 are currently **not purchasable** |
| `available` | bool | `:200` | `p.stock?.purchasable ?? false`. **This is the merchant's own sellability signal and no consumer reads it today.** |
| `stockType` | enum | `:201` | output of `stockTypeOf()`; unknown → `"call"` at `:100-104` |
| `brand`, `mainCategory`, `otherCategories[]` | object / array | `:202-210` | slugs via `slugify()` |
| `tags[]` | string[] | `:211` | |
| `images[]` | object[] | `:150-162` | locally-mirrored file is promoted to index 0; remote views remain and MUST NOT be depended on |
| `specs[]` | `{name, value}[]` | `:213` | 166 records non-empty, 23 empty. **No consumer reads this field.** |
| `basePrice`, `displayPrice` | number | `:214,216` | both from `priceOf(p)`; `0` means **absent**, not free |
| `compareAtPrice` | number \| null | `:215` | gated strictly-greater at `:114-120` |
| `variants[]` | object[] | `:165-188` | see below |

## Variant shape (normative)

| Field | Notes |
|---|---|
| `price` | `v.price ?? price`. **This is the unit price.** |
| `compareAtPrice` | raw `v.compare_at_price`. **Ungated** — 40 of 311 variants have compare-at ≤ price. Consumers MUST apply the strict-greater test themselves until the seam does, and band 1 moves the gate into the seam. |
| `color` | `v.options?.["رنگ"]`. Real key, works for 104 of 105 variant products. |
| `storage` | `v.options?.["حافظه"]`. **Never matches the data** — 0 of 311 variants carry that key, so this is `null` site-wide. FR-033's capacity selector depends on finding the real key. |
| `stock`, `stockType` | per-variant quantity, and the product-level state (the export carries no per-variant state) |
| `guarantee` | `null`, hardcoded at `:170`. **No consumer may render a warranty claim.** |
| `quoted.unitPrice`, `quoted.matchedTier` | `matchedTier` is always `null` — the export has no B2B tiers, so no bulk-price claim is admissible |
| ~~`unitPrice`~~ | **does not exist at the top level.** `ProductDetail.tsx:191` reads it. Fixing this one read is the single highest-value change in the feature. |

## Rules

1. A consumer MUST read a field listed above, and MUST NOT invent a name for a concept it needs. Where a
   field is missing from the shape, the shape is extended at the seam and this document updated — not
   guessed at the call site.
2. Transport typing MUST be declared, not asserted. `apiGet<T>(url) as Promise<ProductDetail>` at a
   boundary whose shape is owned elsewhere is the defect-enabling pattern; the fetch boundary takes a
   declared type that this contract can be checked against.
3. Absent ≠ zero. Any helper that coerces a missing price to `0` for **sorting** (as `priceOf()` does)
   MUST NOT be reused for **display**, for a `min`/`max` filter, or for a discount test.
4. Unknown state falls back to `call`, at every layer. `?? "limited"` at `ProductDetail.tsx:94` and
   `default: return "limited"` at `lib/serializers.ts:13-26` both violate this and both feed shopper-visible
   labels.
5. Every count, ratio or threshold in this shape belongs to a record. Snapshot totals MUST NOT appear in
   logic (FR-053) — see `lib/category-departments.ts:57-66`.
6. Browsing MUST NOT require an API round-trip (Constitution III). Until band 1 lands, `/shop`, the PDP
   and the home rails breach this: they hydrate empty and fetch.

## Verification

`npx vitest run tests/unit` covers none of this — there is no seam-shape test at all today. Band 1 adds a
unit test that asserts, per product, that the fields the PDP reads exist on the serialized record, which
turns the entire class of drift into a failing test rather than a wrong price. Browser check per
`../quickstart.md` §2: open a variant product, a no-variant product, and a call-for-price product, and
confirm each shows the number the export holds.
