# Discovery — SC-002 interaction counts (T061)

**Feature**: `specs/001-premium-rtl-storefront` | **Criterion**: SC-002 — "at least 9 of 10 shoppers
complete a concrete finding task — reaching a product that matches a stated requirement — in **three
interactions or fewer** and under forty seconds." | **Date**: 2026-09-23

**Counting rule, stated so it can be argued with.** One interaction = one deliberate input: a tap, or one
search submission (the keystrokes inside a query are not counted separately). Scrolling to see what the
page already renders is not counted. Reaching the *product page* for the match counts as the final
interaction; having the matching product identifiable on screen is reported separately, because that is
where the two readings of SC-002 differ.

**Instrument.** Headless Chromium at **390×840** driven against `next dev`
(`verification/t061-walk.mjs`, `verification/verify-band2.mjs`), plus the served HTML read without a
browser (`verification/department-first-card.mjs`), which is what settled task A: the door's destination
serves 60 products and its **first card is a Xiaomi**, so the third tap lands on a match rather than on a
lucky scroll position. Re-running a path through the browser was not trusted for that step — the carousel
re-orders its DOM when a panel is centred, so a locator can resolve to a different panel between the two
presses, and a measurement of the wrong element is worse than no measurement. No timing claim is made: the
"under forty seconds" half of SC-002 cannot be measured on the owner's hardware and is deliberately left
unmeasured rather than estimated (the same rule that keeps any frame-rate figure out of these notes).

---

## Task A — "a Xiaomi phone": **met**

| # | Interaction | Result |
|---|---|---|
| 1 | press «گوشی موبایل» on the homepage carousel | centres the panel (005 FR-010), no navigation |
| 2 | press it again | `/categories/موبایل-و-تبلت` |
| 3 | tap the first card | it **is** a Xiaomi — «گوشی موبایل شیائومی مدل Poco X7 Pro…» |

Confirmed against the served HTML of that destination: 60 products, 120 product links, the first card's
name beginning «گوشی موبایل شیائومی». **3 interactions.**

The shorter path is also measured: **2 interactions** — one search submission for «گوشی شیائومی» then one
tap. This is the path the fold in `lib/persian.ts` (T049) made usable; before it, `موبايل` returned 0 of
133.

## Task B — "the cheapest power bank that is actually available": **not met**

| # | Interaction | Result |
|---|---|---|
| 1–2 | press «پاوربانک» twice from the homepage | `/categories/پاور-بانک` — 6 products |
| 3 | tap «فقط قابل خرید» | 1 record (`?obtainable=1`) |
| 4 | tap «ارزان‌ترین» | «پاوربانک کامتل ظرفیت 20000 …», ۳٬۲۰۰٬۰۰۰ → **۲٬۸۰۰٬۰۰۰ تومان**, «موجود محدود» |
| 5 | tap it | the product page |

From `/shop` instead of the homepage the door is a tile, so it is **4** interactions to the product page
and **3** to have the answer on screen. Both readings are recorded because the criterion does not say
which it means.

**What band 2 changed here.** Before it, this task was not drivable at all: «موجود» filtered on
`stock=unlimited`, which matched **0** records, and `?brand=&category=` returned 0, so "actually available"
had no control and the cheapest-available answer had no page to appear on. The two controls that exist now
(`?obtainable=1`, `?sort=price-asc` on a destination) are what make the task *answerable*; they do not yet
make it a three-interaction task from the homepage.

**The gap, and what would close it.** Two interactions are spent on the carousel's centre-then-navigate
rule (005 FR-010), and one more on each control the shopper must apply by hand. Ranked by cost to close:

1. **Settle T059.** If panel presses navigate on the first press, task B is 4 and task A is 2. This is the
   owner's cross-feature call, not this band's (`notes/band2-decisions.md` §4).
2. **Let a destination carry an "available now" door.** The tile row and the sidebar already know which
   departments are wholly obtainable; a pre-applied `?obtainable=1` on that one control would make task B
   3 interactions from the homepage without inventing any data.
3. **Curate the rail, not the metric.** A homepage «قابل خرید» shelf would answer the common form of this
   task in 1 interaction. It is the honest fix and the largest one; it is also what FR-028's "counted,
   non-empty selection" is pointing at.

No option was taken here. Deep-linking a pre-sorted, pre-filtered URL just to make a number green would be
the same move as a stock badge that lies about availability, which is the class of defect band 0 exists to
remove.

## What is not claimed

- **No shopper panel was run.** SC-002 is stated over shoppers; this is the interaction *count*, which is
  the half of it a page can be measured against. The human half stays with band 4 and the owner.
- **The 40-second half is unmeasured**, deliberately, per the hardware rule above.
- Task A passes on a path where the first card happens to be a Xiaomi. It is not a claim that Xiaomi is
  first for every door — the department's default order puts it there today, and a data refresh can move
  it. A guard for that would be a merchandising decision, not a test.
