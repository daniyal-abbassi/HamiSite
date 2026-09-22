# Owner decisions — 001 band 0 gate

**Task**: `tasks.md` T003 | **Date**: 2026-09-23 | **Asked in three rounds, all eight answered. Nothing in
band 0 is blocked.**

These are merchant facts and brand calls, not engineering choices. Where a decision *replaces* something
the plan had assumed, that is noted, because `plan.md`, `research.md` D5 and
`contracts/honest-states.md` were written on the assumption that the answer would be "delete".

---

## 1. Unsupported claims — only the warranty was confirmed

**Warranty: real, and now a verified merchant fact.** The owner supplies the exact on-screen wording:

> **گارانتی ۱۸ ماهه شرکتی**

This replaces `contracts/honest-states.md`'s prohibition on the warranty claim — the claim is no longer
unsupported, because the merchant has stated it. Two consequences the implementation must honour:

- The string lives in the verified-facts module alongside `lib/content/contact.ts`, **not** hardcoded in
  `components/shop/ProductCard.tsx` and `components/shop/ProductDetail.tsx`. A merchant fact with no single
  source is how the next one becomes a guess.
- `lib/catalog.ts:170` currently hardcodes `guarantee: null` per variant. That field becomes meaningful:
  the guarantee is universal by the owner's statement, so it is a storefront-wide fact, and the card must
  not imply it is per-product data the export holds. The seam stays as it is; the label must not pretend to
  read it.

**Everything else in that question went unconfirmed and therefore comes out**, per FR-001 — an unconfirmed
claim is exactly what Principle I forbids rendering. Deleted, not reworded (research D5):

| Claim | Where | Fate |
|---|---|---|
| «ضمانت اصالت ۱۰۰٪» / «تضمین ۱۰۰٪ اصالت» | `components/shop/ProductDetail.tsx:256-258`, `components/layout/Footer.tsx:62` | **out** |
| «قیمتی بی‌رقیب» | `app/(main)/page.tsx:103-106` | **out** |
| «بهترین قیمت برای …» | `app/(main)/page.tsx:86` | **out** |
| «چه یک دستگاه بخواهید و چه صد دستگاه، همان قیمت منصفانه» | `app/(main)/page.tsx:108-109` | **out** — no B2B tiers exist in the export (`lib/catalog.ts:179`) |
| «انتخاب‌های بی‌نهایت» | `components/home/BrandShowcase.tsx:50` | **out** |
| Six logos under `aria-label="برندهای همکار"` | `components/home/BrandTicker.tsx:48` | **out** as a partnership claim; the marks may stay only as decorative Latin labelling with no partner wording |

If any of these is also true, one sentence from the owner reinstates it — that is the whole mechanism.

## 2. The AI store photograph — removed everywhere

> *"Remove it everywhere."*

`components/home/ShopWindow.tsx` and `components/home/StoreExperience.tsx:39-46` come out of the trust
role entirely, along with the «فضای واقعی مجموعه» caption and the `MASHHAD FLAGSHIP` badge. FR-006 forbids
store imagery as proof and none is coming, so the physical-store claim is carried in words: twenty years,
Mashhad, the phone number, the hours. **The hero slot is then empty rather than filled with something
nearby** — FR-008: a place with nothing true to say stays empty. T030 and T089 inherit this; it also
narrows T073, since the radial "light thrown onto the wall" behind the shop window (`ShopWindow.tsx:25-35`)
decorates an image that is leaving.

## 3. Address and email — removed until supplied

> *"Remove until you supply."*

`info@hamihamrah.ir` (`app/(main)/partners/page.tsx:67-68`) and the venue line «مشهد • مجتمع تجاری موبایل»
(`components/home/StoreExperience.tsx:98`) are deleted. `lib/content/contact.ts` continues to hold the
phone and hours and nothing else. When the owner supplies a verified address or email it goes into that
module first and only then onto a surface (T028, T029).

## 4. Buying — browsing stays, the purchase claim goes, the phone replaces it

> *"Call us instead."*

Cart and checkout logic stay frozen under Constitution III — **no behaviour change**. The frontend:

- keeps browsing and keeps the cart as a saved list,
- states plainly that online payment is not offered here, replacing «پرداخت آنلاین از طریق درگاه امن انجام
  می‌شود» (`components/checkout/CheckoutClient.tsx:424`), «ادامه و تسویه حساب»
  (`components/cart/CartPageClient.tsx:99-122`) and «تکمیل خرید» (`app/(main)/checkout/page.tsx:22-26`) with
  wording that describes what actually happens,
- puts tap-to-call and a copy-the-number control where a buy button stood (T034 with T068).

FR-039's "reachable in one interaction from any product" and FR-040's "no control that merely appears to
work" are both satisfied by the same mechanism, which is why T034 and T068 should land together.

## 5. The atmosphere extends to every shopper page

> *"Extend it to all pages."*

This **reverses the direction research D8 and T073 were leaning.** `components/atmosphere/PageGround.tsx:47`
is gated to `pathname === "/"`; that gate opens to `/shop`, the product page, `/cart`, `/orders` and
`/partners`. It is the largest single answer to FR-049 — `audits/05` named the homepage-only ground as a
main reason `/cart` reads as a different project.

Sequencing consequence, and it matters: **extend before deciding how much to strip.** Today the homepage
carries the ground *plus* a starfield, five body glows, per-section glows and a scrim (`audits/05` FR-052).
If T073 strips first and then T083 extends, the interior pages inherit the stripped version — which is
what FR-052 wants and what Constitution IV's consistency rule requires. If it goes the other way, the glow
field is multiplied across six surfaces instead of one. So T073 now **blocks** T083's extension task, and
the two are one decision, not two.

The scroll easing itself is already global — `components/atmosphere/ScrollSmooth.tsx` mounts in
`app/(main)/layout.tsx`, so it needs no change here.

## 6. SC-007 is scoped to interface-authored strings

> *"Scope the rule to UI."*

Product names and specification values render **exactly as the merchant wrote them**, including «۵۱۲»
written as `512` inside a Persian name — 186 of 189 names and 148 spec sets do this, and `data/` is frozen.
Converting them at render time would make the screen disagree with the shop's own wording, which Principle
I cares about far more than numeral aesthetics. The rule therefore binds every string the frontend authors:
prices, quantities, counts, percentages, ordinals, upload sizes, order ids.

`spec.md` SC-007 is **not** amended — the owner scoped the reading, not the requirement, so the narrowing
lives here and in `notes/validation.md`, and SC-007 is reported as met-with-stated-scope rather than
silently as "0 mixed screens". T079 is resolved by this; T078 is unchanged and becomes the whole of it.

## 7. No human panel — those boxes stay visibly empty

> *"Skip it, leave boxes empty."*

SC-001, SC-011, SC-012 and SC-013 have no evidence and get none. T098–T101 stay unchecked with the missing
instrument named, the third time this has been ruled on this project (002's human panel, 004's T049). **An
agent must not fill them, and must not substitute a screenshot, its own judgement, or a "reviewed" line.**
The consequence is stated plainly in Constitution IV's terms: the definition of done includes "feels
intentionally art-directed and premium", and the only instruments for that are now knowingly unrun — so
band 3's honest end state is *built, walked, screenshotted, unpanelled*.

## 8. No date for the refreshed export

> *"No date yet."*

Band 0's availability labels are therefore tested against today's snapshot — 5 purchasable of 189 — while
the refresh-tolerance work proceeds as if the number is about to change: T045 stops one emptied category
from taking the homepage down, T046 removes the snapshot totals from `lib/category-departments.ts`, and
T047 converts the tests that restate counts into property assertions. SC-015's synthetic replay (T102)
stays open and is **not** a band-4 blocker: it is the one criterion in that phase that an agent could still
build without people, and it waits on data shape, not on the owner.

---

## What this changes in tasks.md

Unblocked: **T018, T022–T027, T028, T029, T030, T034, T035, T048, T068, T073, T079, T083, T089, T102** —
every "decision-blocked, do not start blind" entry from the Dependencies section except the four panel
tasks, which are closed rather than unblocked. T073→T083 gains a new ordering constraint (strip, then
extend). T022 changes from *delete the warranty* to *source the warranty once and render it everywhere*,
which is the only answer that adds a claim rather than removing one.
