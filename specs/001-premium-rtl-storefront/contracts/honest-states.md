# Contract: Honest States

**Owner**: `lib/product-identity.ts` (labels) and the availability/action mapping at every product surface | **Date**: 2026-09-23
**Requirements served**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-037, FR-038, FR-039, FR-040, FR-053, FR-056, SC-004, SC-005
**Constitution**: Principle I. **No exception path exists for this contract.** If a rule below is
unimplementable, the claim comes out; the rule does not get softened.

## Availability × action

`stockType` is the seam's normalized state (`lib/catalog.ts:100-104`, unknown → `call`).
`available` is the merchant's own sellability flag (`:200`). **Both are required; neither alone is
sufficient**, and the current code reads only `stockType`, which is why 22 unsellable records present as
buyable.

| Record state | Label | Primary action | Wording rules |
|---|---|---|---|
| `available === true`, `stockType` unlimited | «موجود است» | add to cart | only combination that may offer a cart control |
| `available === true`, `stockType === "limited"` | «موجود محدود» + the real quantity | add to cart, capped | the cap MUST come from `variant.stock`; today the PDP prints «حداکثر ۰ عدد» while offering the button |
| `available === false`, `stockType === "limited"` | «تماس بگیرید» | contact | **this is the case shipped wrong**: `ProductDetail.tsx:96` treats `limited` as purchasable |
| `stockType === "call"` | «تماس بگیرید» | contact | never a cart control, in any enabled or disabled form |
| `stockType === "out_of_stock"` | «ناموجود» | contact **plus** an alternative (related, category) | «ناموجود» is a status, not an action; FR-037 demands one unambiguous action per state |
| any state, price absent (`priceOf() === 0`) | label unaffected | as above | price area MUST read as ask-us, never `۰`, never `−`, never a bare currency word |
| unrecognized / future / empty state string | «تماس بگیرید» | contact | FR-056: a refresh MUST NOT be able to create a false positive by omission |

**Forbidden wording** (FR-038): anything imitating a completed or placeable order on a record that cannot
be ordered — «به سبد اضافه شد», «افزوده شد», «ثبت سفارش», «خرید», «نهایی کردن سفارش», «پرداخت».
**Required on a non-purchasable record**: the action's text describes what will actually happen.

## Price display

| Condition | Renders | Never renders |
|---|---|---|
| `displayPrice > 0`, no compare-at | the Toman amount | |
| `compareAtPrice > displayPrice` (strictly) | amount + struck compare + percentage | a percentage from an equal or lower compare-at |
| `compareAtPrice <= displayPrice` | the amount alone | a strike, a badge, a "sale" frame |
| price absent (coerced `0`) | «قیمت فروشگاه» **as an action-bearing ask-us line with a reachable number**, or «تماس بگیرید» | «۰ تومان» (`ProductListRow.tsx:59`), a bare currency word, `NaN`, «قیمت فروشگاه» as a dead string |
| variant selected | `variant.price` | `variant.unitPrice` — **does not exist** |
| any | Persian digits only | Latin digits alongside Persian on the same surface |

The last row is a live defect, not a hypothetical: the PDP currently resolves to `formatToman(undefined)`,
whose NaN guard emits the *string* "قیمت فروشگاه" (`lib/utils.ts:10-11`). That string reads like a
deliberate ask-us label and is not one — it has no phone, no action, and appears on products that do have
prices. The guard is honest; the caller is not.

## Section presence

A section is absent when its own data is empty, never present-and-empty (FR-005, FR-008). Concretely:

- `specs.length === 0` → no specifications block (23 records). **Currently the block is absent for all
  189, because the component reads `product.analysis` and the seam emits `specs`.**
- no description → no description block (35 records).
- one image → no gallery affordance, no thumbnails, no dots, no counter (56 records have no second view).
- a section with nothing true and useful to say stays **empty** — which in practice means it is not built.
  Three homepage panels are currently CSS compositions with pseudo-English labels
  (`components/home/WhyHami.tsx:16-42`), which FR-008 forbids.

## Admissible claims (closed list)

Trust (FR-006) — these four and no others:
1. twenty years of trading history,
2. a physical store in Mashhad,
3. certified Redmi dealership granted via Radman Paj,
4. official TCH regional representation.

Contact (FR-007) — from `lib/content/contact.ts` only. That file holds a phone number and hours and names
the phone as the repo's only verified contact fact. A street address or email MUST NOT appear anywhere
until supplied **and confirmed** — not as a real value, not as an obviously-placeholder value.

Currently on screen and inadmissible: «گارانتی رسمی» (the seam hardcodes `guarantee: null`),
«ضمانت اصالت ۱۰۰٪», «تضمین ۱۰۰٪ اصالت», «قیمتی بی‌رقیب», «بهترین قیمت», «همان قیمت» at one and a hundred
units (no tiers exist), «انتخاب‌های بی‌نهایت», «ویترین رسمی برندهای برتر», the six-logo «برندهای همکار»
wall, «مشهد • مجتمع تجاری موبایل» as a venue line, the `info@hamihamrah.ir` address, and **a
«تصویر واقعی فروشگاه در انتظار افزودن» placeholder shown to shoppers** with an apology note beneath it.

**Store imagery is inadmissible as proof.** FR-006 forbids certificate and store photography outright,
because the owner confirmed no documents and no store photos are coming. `components/home/ShopWindow.tsx`
renders a file whose own header comment (lines 4–20) documents an AI re-light pass on the owner's original,
captioned «نمای کلی فروشگاه … فضای واقعی مجموعه» with invented `SAMSUNG`/`ACCESSORIES` signage and a
`MASHHAD FLAGSHIP` badge. That is the largest image above the fold at 1280px. It comes out; re-captioning
it as a rendering is the rewording that D5 rejects.

## Capability honesty (FR-040)

Where the shopper would expect a purchase capability the feature cannot honour, the interface MUST say the
capability is not available here, and MUST NOT leave a control that merely appears to work.

Today the whole path looks live: a cart tab in the mobile dock, a header badge with a count, card and PDP
add-to-cart controls, `/cart` with «خلاصه سفارش» and «ادامه و تسویه حساب», and `/checkout` headed «تکمیل
خرید» with «پرداخت آنلاین از طریق درگاه امن انجام می‌شود» — while `lib/catalog.ts:23-29` records that
export ids will not match database rows and those flows have never been exercised. The backend stays
frozen under Constitution III; **the affordance is a frontend decision and band 0 owns it.** What replaces
it is the owner's business call and is listed in `quickstart.md` §1.

Related: a control MUST NOT be operable in a state where it cannot respond (FR-043). Four currently are:
`FeaturedProducts.tsx:177`'s «تلاش دوباره» calls `setTab(tab)` with the same value, so nothing refetches;
`ShopResults.tsx:129-133` renders a link labelled «تلاش دوباره» pointing at the page you are on;
`StoreExperience.tsx:140`'s «اطلاعات فروشگاه» anchors to the section it sits inside;
`BrandRows.tsx:93-102` draws an expand chevron on all six rows while three have no story, revealing a
fixed-height empty band.

## Contact reach (FR-039)

At most one interaction from any product, and functional where calling is impossible.

Today there is no contact action on any product surface at all — the PDP's ask-us line is text plus an icon
with no number and no link (`ProductDetail.tsx:277-280`), and the mobile dock deliberately dropped its
«تماس» tab (`MobileDock.tsx:26-30`), while the footer's «تماس با ما» points at a `/contact` route that does
not exist. Two `tel:` links exist sitewide, both in the footer region. The number is stored as Persian
digits («۰۹۳۳ ۱۲۱ ۴۰۰۰», `lib/content/contact.ts:16`) and **no copy affordance exists anywhere in the
repo**, so on a device that cannot dial, the shopper cannot take the number with them.

## Refresh tolerance (FR-053, FR-054, SC-015)

Every rule in this document reads a record's own field. The following are prohibited, and one of them is
load-bearing today:

- embedding the current 5-of-189 count, or any ratio, in logic;
- a display rule that compares against a hand-typed snapshot total (`lib/category-departments.ts:139`
  against its `:57-66` literals);
- an empty-state or section that only composes at one end of the availability range;
- a render path that **throws** when a category empties, taking the homepage with it (`:113-126`);
- unit tests that restate the totals they claim to be robust to
  (`tests/unit/category-departments.test.ts:39-57`, `tests/unit/product-images.test.ts:79-93`).

## Verification

No test in `tests/` covers any rule in this contract, which is how every violation above reached a passing
CI. Band 0 adds: a per-record assertion that no `purchasable: false` record can render an obtainable label
or a live cart control; that `priceOf() === 0` never renders a numeral or a currency word; that the
admissible-claim list is the only trust copy in the DOM; and that no address, email, certificate or store
photograph reaches the DOM. Browser walk per `../quickstart.md` §1–§2.
