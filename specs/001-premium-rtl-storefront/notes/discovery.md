# Discovery — SC-002 interaction counts (T061)

**Feature**: `specs/001-premium-rtl-storefront` | **Criterion**: SC-002 — "at least 9 of 10 shoppers
complete a concrete finding task — reaching a product that matches a stated requirement — in **three
interactions or fewer** and under forty seconds." | **Date**: 2026-09-23

**Counting rule, stated so it can be argued with.** One interaction = one deliberate input: a tap, or one
search submission (the keystrokes inside a query are not counted separately). Scrolling to see what the page
already renders is not counted. The count ends when the **product page for the match is open** — the strict
reading of "reaching a product" — so the figures below are not the flattering version of this criterion.

**Instrument.** `verification/sc002-interactions.mjs`, headless Chromium at **390×840**, run against the
**production build** (`next start`), driving every step for real: it presses the named control, waits for
the URL to change, and reads the opened product's `h1` back out of the DOM. An earlier pass of this file was
measured against `next dev` with fixed sleeps and counted a step as an interaction whenever Playwright
reported a click, which produced a "met" that had never left the category page — see the two false readings
under task B. `verification/panel-press-navigates.mjs` grades the press contract on its own, and
`verification/department-first-card.mjs` checks the destination's served HTML without a browser at all.
No timing claim is made: the "under forty seconds" half of SC-002 cannot be measured on the owner's
hardware and is deliberately left unmeasured rather than estimated — the same rule that keeps any frame-rate
figure out of these notes.
---

## Task A — "a Xiaomi phone": **met, 2 interactions**

| # | Interaction | Result |
|---|---|---|
| 1 | press «گوشی موبایل» on the homepage carousel | `/categories/موبایل-و-تبلت` — ۱۳۵ محصولات، ۴ قابل خرید |
| 2 | tap the first card | it **is** a Xiaomi — «گوشی موبایل شیائومی مدل Poco X7 Pro…» |

Measured end to end by `verification/sc002-interactions.mjs` against the **production build**, with the
heading read back off the product page rather than inferred from the href. Before T059 was settled this was
3 (two presses on the panel, then the card); the search route was already 2 and still is — one submission
for «گوشی شیائومی» then a tap, which is the path the fold in `lib/persian.ts` (T049) made usable, since
`موبايل` had been returning 0 of 133.

## Task B — "the cheapest power bank that is actually available": **met, 3 interactions**

| # | Interaction | Result |
|---|---|---|
| 1 | press «پاوربانک» on the homepage carousel | `/categories/پاور-بانک` — 6 محصولات |
| 2 | tap «ارزان‌ترینِ قابل خرید ۱» | `?sort=price-asc&obtainable=1` — one card: «پاوربانک کامتل مدل OP18S ظرفیت 20000 میلی…», ۳٬۲۰۰٬۰۰۰ → **۲٬۸۰۰٬۰۰۰ تومان** |
| 3 | tap it | that product's page, heading read back from the DOM |

A fourth route to the same answer is now shorter than any of the others: the homepage shelf
«همین حالا قابل خرید» → its «مشاهده همه» (`/shop?stock=purchasable`) → a card, **2 interactions**.

### What it took to get here — the three ranked fixes, all applied on 2026-09-23

1. **T059 settled by the owner**: 005's FR-010 and contract A2 were amended, so a panel navigates on the
   first press. Worth one interaction on every door in the carousel, and the reason the page now has **no**
   click handler on its panels: calling `goTo()` from the press makes Embla treat the gesture as a drag and
   swallow the navigation, so "just centre it too" quietly undoes the fix.
2. **The composite control** «ارزان‌ترینِ قابل خرید», one link that sets obtainability and cheapest-first at
   once — `listingViewHref()` guarantees its URL is byte-identical to pressing the two controls in turn,
   so there is not a second meaning of the same view. Its count is this destination's own obtainable total
   (پاوربانک ۱, موبایل و تبلت ۴), and it is simply absent where that number is zero: not a door onto nothing.
   The rejected alternative was pre-applying `?obtainable=1` on the door itself, which would have made the
   tile mean something other than what it says.
3. **The homepage shelf**, `obtainableNowRail()` — the five records the merchant's own flag and a real
   price agree on, cheapest first, with the count in the sentence being the whole set rather than the
   rendered six. `tests/unit/obtainable-rail.test.ts` pins that, because the shelf's heading is the only
   availability claim on the homepage and an availability refresh is already promised.

### The two false readings this section went through first

Recorded because both would have become "findings" if the instrument had not been checked:

- Counting a step as an interaction because Playwright reported a click, when the URL had not changed: the
  first version reported task B as **met in 3** while its third step was still sitting on the category
  page. Every step now waits for the navigation it claims and says which one timed out.
- Waiting a fixed 2.5 seconds against `next dev`, which compiles a 60-card route on first hit: a live
  navigation looked like a dead door. The bound is now a poll, and the numbers above were taken against the
  production build.

## What is not claimed

- **No shopper panel was run.** SC-002 is stated over shoppers; this is the interaction *count*, which is
  the half of it a page can be measured against. The human half stays with band 4 and the owner.
- **The 40-second half is unmeasured**, deliberately, per the hardware rule above.
- Task A passes on a path where the first card happens to be a Xiaomi. It is not a claim that Xiaomi is
  first for every door — the department's default order puts it there today, and a data refresh can move
  it. A guard for that would be a merchandising decision, not a test.
