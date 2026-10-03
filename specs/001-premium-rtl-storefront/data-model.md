# Data Model: Premium Persian RTL Storefront

**Feature**: `specs/001-premium-rtl-storefront` | **Date**: 2026-09-23

This feature adds no storage. Shopper-visible catalog data is read from `data/*.json` through
`lib/catalog.ts` under Constitution III, and `data/`, `app/api/` and `prisma/` are frozen. So this
document's job is different from a normal data model: it records **the shape the seam actually emits**,
because the gap between that and the shape components still read is the single most severe defect in the
feature (`plan.md` Summary §1), and no other artifact makes the two comparable.

---

## The two shapes, side by side

`lib/catalog.ts::serializeProduct` (lines 138–218) is the source of truth. `types/store.ts:58-95` is the
pre-seam Prisma-era shape that `components/shop/ProductDetail.tsx` is still written against, reached
through an unchecked `apiGet<ProductDetail>` cast.

| Concept | Serializer emits | PDP reads | Consequence |
|---|---|---|---|
| Variant unit price | `variants[].price`, and `variants[].quoted.unitPrice` (`lib/catalog.ts:171,184`) | `selectedVariant.unitPrice` (`ProductDetail.tsx:191`) | `undefined` → `formatToman` NaN guard → the string «قیمت فروشگاه» on 105 products |
| Product-level price | `basePrice`, `displayPrice` (`:214,216`) | not read on the PDP | the correct value is present and unused |
| No-variant products | `displayPrice` from `priceOf(p)` | `selectedVariant` is `null` → `unitPrice = null` | 84 priced products render «برای استعلام قیمت تماس بگیرید» |
| Compare-at price | `variants[].compareAtPrice` (`:172`), `compareAtPrice` at product level (`:215`, gated strictly-greater at `:114-120`) | `selectedVariant?.compareAtPrice` | value is right, but `number > undefined` is always `false`, so genuine discounts never render |
| Bulk tier | `variants[].quoted.matchedTier: null` (`:185`) — the export has no tiers | `selectedVariant?.matchedTier` (`:193`) | dead branch, correct-by-data but misleading-by-code |
| Specifications | `specs: p.specs ?? []` (`:213`) — 166 records carry them | `product.analysis` (`:405-411`) | nothing renders: the field read never exists, and the field emitted is never read |
| Description | `description` = raw `description_html` **and** `descriptionText` = clean text (`:195-196`) | `product.description` (`:398-402`) | 147 records render visible `<p>` tags and `&zwnj;` markup instead of text |
| Storage capacity | `variants[].storage = v.options?.["حافظه"] ?? null` (`:169`) | `variant.storage` | always `null`: 0 of 311 variants carry a «حافظه» option key, so the capacity selector FR-033 asks for has no data behind the mapping |
| Colour | `variants[].color = v.options?.["رنگ"]` (`:168`) | `selectedVariant?.color` | works for 104 of 105 variant products; product 347's 18 variants use دامنه/سرور/نوع keys, so it gets no selector at all |
| Obtainability | `available: p.stock?.purchasable ?? false` (`:200`) | **not read by any shopper component** | 22 records the merchant cannot sell render as buyable |
| Stock state | `stockType: stockTypeOf(p)` (`:201`, unknown → `call` at `:100-104`) | `?? "limited"` fallback (`:94`) | an unreadable state becomes a positive claim |
| Warranty | `guarantee: null` hardcoded (`:170`) | «گارانتی رسمی» rendered anyway (`ProductCard.tsx:191-193`) | a claim with no field behind it |
| Images | `images[]`, mirrored local file promoted to index 0 (`:150-162`) | `resolveProductImage` picks the first local, else the placeholder | works; secondary remote views are never resolved or rendered anywhere |

**The general shape of the failure** is worth stating for whoever reads this after band 1: every row is a
*name* mismatch or an *unread* field, not a missing value. The serializer was rewritten around a flat
export and the components were never brought with it, and because the transport boundary is typed by a
cast, the compiler had no way to notice. `contracts/catalog-seam.md` is the artifact that closes that gap.

---

## Entities

### Product
One of 189 records in `data/hami-products.json`. Persian name (186 of 189 interleave Latin digits with
Persian inside the name), optional English name, one main category plus optional secondary categories, a
brand, a price in Toman that may be absent, an availability state, images, specifications, description
text, and a variant set. The whole record is read-only to the frontend; the export is dated 2026-09-09.

**Validation rules that bind the UI, not the data**
- A record with no price is *call-for-price*, never free, never zero (FR-003). `priceOf()` currently maps
  absent to `0` (`lib/catalog.ts:106-112`), which is correct for sorting and **wrong for display** — the
  same function feeds `min`/`max` filters, so any minimum silently deletes the 5 call-for-price records and
  any maximum silently admits them.
- A discount exists only where compare-at is *strictly* greater than price (FR-004). Product level:
  enforced at `lib/catalog.ts:114-120`, 57 of 172 dropped. Variant level: **not enforced** — `:172` passes
  `v.compare_at_price` through raw, and 40 of 311 variants have compare-at ≤ price. Currently latent only
  because the variant price read is broken.
- An unreadable availability state resolves to `call` (FR-002, FR-056). Enforced in the seam at
  `:100-104`; violated downstream twice, by `ProductDetail.tsx:94` and `lib/serializers.ts:13-26`.

**States.** Four availability labels are admissible — in stock, limited, contact us, out of stock — and
only `purchasable: true` supports an unqualified "in stock". Today 5 of 189 records do; the owner has
confirmed that figure is staleness, not the trading position (Resolved Q1), so the state machine must be
written against each record's own field and never against the count (FR-053).

**Transitions.** None. This entity is not mutated by the feature; the only "transition" that matters is a
new export replacing the old one, which is why refresh tolerance is a requirement rather than a hope.

### Product Variant (Option)
311 across the catalog; 105 products have at least one. Distinguished by colour and storage capacity, each
able to carry its own price and stock count. The mapping problem above is the reason FR-033 (see the
available colours *and* capacities) is half-implemented: the colour key exists, the capacity key is looked
up under a name the data does not use.

### Price / Comparison Price
An integer amount in Toman with no fractional unit, so readability at 360px is a real constraint (the
largest values are nine digits plus a currency word). May be absent. Comparison price is meaningful only
in the strictly-greater case.

### Availability State
The merchant's real selling status: `purchasable` plus a `state` string. 5 records support "in stock"
today; 16 carry `state: "limited"` **with** `purchasable: false` and must not read as obtainable; 6 are
explicitly "call"; 162 are out of stock. `stockTypeOf()` is the only legitimate bridge from record to
label.

### Product Image
188 of 189 have exactly one locally-held photograph (`/images/catalog/<id>.jpg`, promoted to index 0 at
`lib/catalog.ts:158-162`). 133 records have additional remote views on a host measured at 6–7.5s per image
and failing often; 56 have none. The single imageless record (id 347, «اپل آیدی») renders the brand
placeholder `/brand/placeholder-product.webp` by owner direction (2026-09-22).

**Open tension to own, not to smooth over**: Principle I says missing data must stay *visibly* missing, and
the placeholder drops into the product's own image slot at the same size with `alt={product.name}`, so
nothing on screen marks the absence. It is not a fabricated product claim — one identical brand tile, never
a guess — but the constitution and the owner's directive are not reconciled by the current code.

### Specification
A named attribute/value pair; present for 166 records, absent for 23. Emitted by the seam, read by
nobody, so FR-005's "absent rather than empty" is currently satisfied only because the feature is missing.

### Trust Credential / Contact Channel
The admissible set is closed and small: twenty years of trading history, the Mashhad physical store,
certified Redmi dealership via Radman Paj, official TCH regional representation. `lib/content/contact.ts`
holds **only** a phone number and hours, and names the phone as the repo's only verified contact fact. No
street address and no email is admissible until supplied and confirmed (FR-007) — so the email currently
rendered at `app/(main)/partners/page.tsx:67-68` is a fabricated value, and the venue line «مشهد • مجتمع
تجاری موبایل» at `components/home/StoreExperience.tsx:98` is not in the verified record either.

### Curated Collection
A merchant-chosen grouping presented with intent. Two exist today with **incompatible vocabularies**:
004's brand rows (`lib/brand-counts.ts`, `lib/content/home.ts:147-162`) and 005's kind-derived departments
(`lib/category-departments.ts:57-66`), plus a third list still used by the filter panel
(`FilterSidebar.tsx:47`, a blind `slice(0,8)` of root categories, 3 of them empty). The spec's counts
are 19-of-32 categories and 15-of-39 brands populated; the filter panel's own slicing leaves 2 populated
brands (`ترانیو-tranyoo`, `COMTEL`) and 11 populated categories unreachable as categories, including
`آیفون-استوک` at 45 records. FR-028 and FR-029 are about this entity, and D10 is where the vocabularies
get merged.

### Storefront Surface
Any shopper-reachable screen. Today: `/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/login`,
`/register`, `/orders`, `/order/[id]`, `/partners`. There is no `/brands`, no `/categories`, no `/about`,
no `/contact`, no `/my-orders`, and **no `app/not-found.tsx`** — so the three dead footer links land on
Next's unstyled English framework page: no RTL, no header, no footer, outside the brand entirely.

---

## Relationships

```
Brand 1 ── ∞ Product ∞ ── 1 Category (main)
                        └─ ∓ Category (other_categories)
Product 1 ── ∓ Variant ── 1 Price   (variant price may be absent → inherits product price)
Product 1 ── ∞ Spec                 (166 have ≥1, 23 have none → the block is absent, not empty)
Product 1 ── ∓ Image(local)         (188 have one; 1 has none → placeholder by owner directive)
Product 1 ── ∞ Image(remote)        (133 have extras; the UI resolves and renders none of them)
Product ── 1 AvailabilityState      (record-owned; never derived from a count)
Curated Collection ∞── Product      (must correspond to real products, FR-018/FR-028)
Trust Credential ── ∅ ContactChannel (only the phone qualifies today, FR-007)
```

## Invariants the code must keep able to prove

1. No displayed price, discount, availability label, specification, image or claim originates anywhere
   other than a record or `lib/content/contact.ts` (FR-001, SC-004).
2. Unknown, unreadable, empty, or **newly-seen** availability ⇒ «تماس بگیرید». No default in the chain may
   resolve to a positive state (FR-002, FR-056).
3. Absent price never renders as `0`, `−`, or a currency word alone (FR-003). This currently fails in the
   list row and via the PDP defect, in two different strings.
4. A discount renders only under strict `compareAt > price`, at product level **and** variant level
   (FR-004).
5. A section renders only when its own data is non-empty (FR-005, FR-008).
6. Every merchandising rule reads a record's own field; no threshold, ratio or count from the 2026-09-09
   snapshot appears in logic (FR-053). Today `lib/category-departments.ts:57-66,139` violates this, and
   four unit tests restate the totals, which defeats SC-005's re-verifiability clause.
7. Every shopper link resolves to a route that serves non-empty content (SC-014). Seven dead doors exist
   today: three footer routes, three empty category chips, one availability chip that matches 0 records.
8. Currency of a displayed price or availability figure is discoverable by the shopper (FR-055). No
   mechanism exists yet; the export date and `updated_at` are present in data and reach no surface.
