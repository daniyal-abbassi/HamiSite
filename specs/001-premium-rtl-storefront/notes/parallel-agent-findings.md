# Parallel-agent findings — second agent

Append-only, per `parallel-agent-plan.md` §4.4. Each task gets its code change, its measurements, and an
honest note about anything not verified.

---

## T-P1 — light chapters (2026-09-24)

**Files touched:** `app/(main)/home.css` (one labelled `T-P1` block appended), `components/home/CategoryHub.tsx`,
`components/home/OnlineServices.tsx`, `components/home/CategoryCarousel.tsx` (comment-only fix, below).
`app/globals.css` was **not** touched — the block went to `home.css` instead, so the shared-file risk in §4.2
never came up.

Two opaque paper chapters now sit inside the dark tour, sequenced dark → **paper** → dark → **paper** → dark:
`#categories` (an inset ivory panel, which it already was in shape — it only had the wrong value in it) and
`#online-services` (full-bleed, replacing the `band-soft` darkening gradient). The hero, the shop-window panel
and the closing CTA are untouched and the page still opens and closes dark, as §6.3 requires.

The mechanism is the one §6.1 predicted: `.band-paper` overrides the RGB-triplet variables, so every
`text-foreground/NN`, `bg-card`, `border-line` and `rgb(var(--x) / α)` usage inside the subtree inverts with no
component edits. What that cannot reach is the **literal-hex** brand colours — `aqua`, `champagne`, `gold`,
`ink`, `oxblood` are pinned as hex in `tailwind.config.ts` ("literal hex so opacity modifiers just work"), so
`text-aqua` compiles to `#E5D3B3` and no variable moves it. Those are handled by scoped `[class*=…]` rules,
using the same idiom as the touch-target block at the end of `app/globals.css`.

### Measured: the `#categories` chapter, 40 → 31 text nodes

A source comment was being **rendered as visible text on the live page**. In `CategoryCarousel.tsx` the block
inside `<li>` opened with `/*` in child position rather than `{/*`, so React painted it as a string — nine
copies, one per department panel, raw English on a Persian storefront. The audit caught it only because it
scores every rendered text node: it appeared in the pair table as
`17.82  16px/400  «/* * Every panel is a destin»`. It passed the contrast gate and was still a defect, which
is worth saying out loud about this verification setup. Fixed by wrapping it; text nodes in the chapter fell
from 40 to 31.

**Consequence for the driving agent:** this changed the document height — homepage 16,547px → 16,065px at 360
and 13,430px → 13,020px at 1280. `manifest-paper.json` attributes the whole delta to one section:
`#categories` measured **1251px → 769px** at 360 (−482) and **1219px → 809px** at 1280 (−410), and every other
section's height is unchanged. So the paper bands add no height and the comment removal accounts for the
document exactly. Which also means `ground-travel.mjs`'s gutter count is **not comparable** to the 8/13
recorded in `notes/findings.md`: its thirteen sample positions are fractions of a document 482px shorter. It
now reports 9/13 and the run still PASSes (13 of 13 distinct authored tones, legs summing to 3.4× the endpoint
distance). Two of the thirteen positions now show `#f2efe8` in the gutter, which is the paper band being
measured as though it were the ground — the probe's ΔE legs are partly inflated by my chapters. That is the
driving agent's file and its test, so it is flagged rather than fixed.

### Measured: contrast, every text token actually rendered in each band

`.scratch/paper-audit.mjs` walks the text nodes of each band, reads `getComputedStyle` colour and font, walks
the ancestor chain to composite the **real painted ground** underneath (a card's white over the band's ivory
over the page), applies the element's own alpha, and scores it with `contrastOn()` imported from
`lib/atmosphere/progression.ts`. 360×800:

| ratio | need | px/weight | rendered | text |
|---|---|---|---|---|
| 5.83 | 4.5 | 12/400 | `rgba(17,4,8,.62)` → `#6b6366` on `#ffffff` | APPLE ID |
| 6.21 | 4.5 | 13/400 | `rgba(17,4,8,.65)` → `#605757` on `#f4f1ea` | حسابی برای استفاده از برخی س… |
| 6.90 | 4.5 | 12.8/400 | `rgba(74,62,60,.9)` → `#5b504d` on `#f4f1ea` | ۱۹ / گوشی موبایل (counts) |
| 7.31 | 4.5 | 16.8/700 | `rgba(74,62,60,.92)` → `#584c4a` on `#f4f1ea` | هدفون و ایرپاد |
| 8.52 | 4.5 | 12–14/400 | `rgba(17,4,8,.72)` → `#544a4d` on `#ffffff` | ONLINE SERVICE, description |
| 9.10 | 4.5 | 15–16/400 | `#4a3e3c` on `#f4f1ea` | both chapter descriptions |
| 11.32 | 4.5 | 12/700 | `#f4eadb` on `#640211` | دریافت این خدمت (CTA) |
| 11.94 | 4.5 | 12–14/400–700 | `#640211` on `#f4f1ea` | kicker, links, SHORT FAQ |
| 13.47 | 4.5 | 12/400 | `#640211` on `#ffffff` | ۰۱ |
| 17.82 | 3–4.5 | 14–38/700–900 | `#110408` on `#f4f1ea` / `#ffffff` | both headings, FAQ summaries |

**Zero failures** across 21 distinct rendered pairs in the two bands. Champagne does not appear anywhere.

### Measured: the negative control, because a gate that cannot fail is not a gate

The first run of this audit silently dropped the alpha channel — its regex had three capture groups and read a
fourth that never existed, so every `rgba(…, 0.65)` was scored as opaque ink. That overstated the whole table
(the 5.83 row read 20.1) and the fix was to composite honestly. To prove the corrected checker can actually
reject, `--control` strips `band-paper` and re-audits the same DOM:

```
### CONTROL RUN — band-paper removed ###
#categories      FAILURES (8):  1.30 «دسته‌بندی محصولات» · 1.04 «برای هر سبک،» · 1.30 «یک انتخاب.»
                                 1.84 «دسته‌ای را انتخاب کن…» · 1.04 «گوشی موبایل» · 1.74 «هدفون و ایرپاد»
                                 2.40 «۱۹» · 1.66 (status label)
#online-services FAILURES (9):  1.04 «بیشتر از یک فروشگاه.» · 1.30 «مشاهده خدمات آنلاین» · 1.30 «۰۱»
                                 1.03 «ONLINE SERVICE» · 1.04 «Apple ID» · 2.31 (description) …
```

`#E5D3B3` on `#f4f1ea` measures **1.30:1**, exactly as §6.2 predicted, and does not survive. §6.5.1 satisfied
with evidence in both directions.

### Measured: no overflow, no new decoration

`capture-baseline.mjs --tag paper`, against `manifest-after.json` (captured 21:21 on 2026-09-23, i.e. before
the driving agent's last three commits — so surfaces other than `home` moved under me and are not mine:
`checkout` −568, `orders` +124, `cart` −42/−70).

| surface | before | after | delta | overflow |
|---|---|---|---|---|
| home @360 | 16,547 | **16,065** | −482 | no |
| home @1280 | 13,430 | **13,020** | −410 | no |

`horizontalOverflow` is absent (i.e. false) on **all twelve surfaces at both widths**. Homepage decoration
counts are byte-identical before and after — `shinyEdge: 0`, `gradText: 0`, `backdropElements: 0`,
`starfield: 0`, `ping: 0`, `textStroke: 0`, and the two pre-existing counts (`beam: 1`, `glow: 1`) unchanged.
§6.5.6 holds: the bands are a colour change, not an excuse to add glass, glow or gradient text.
`persianTracked.count` is **0** on both widths (FR-057), and the letter-spacing sweep inside both bands
reported `normal` for every heading, paragraph, label and link.

### Seen, not computed: the screenshots

§6.5.2 asked for a look, and the look is where the plan's premise needed one addition. The token flip passed
every gate and the chapter still looked wrong at 360: nine dark-lacquer badges on ivory read as holes cut in
the page — which is exactly what 005's **FR-039** said when this surface was moved off cream, and it is an
objection about the *artwork* that no amount of foreground fixing answers. Two changes were needed on top of
the tokens:

- **The depth cue inverted with the ground.** `.cat-panel__art::after` veils receding panels with `#0b0204` —
  on a dark page, away means darker. On paper that is the wrong sign, so inside the band it veils toward
  `var(--paper)`: recession becomes haze. Same `--d`, same curve, so the arc is still an arc.
- **A white mount.** 6px of white around each panel plus an ink hairline and a shallow drop. This is what makes
  a dark object on paper read as *displayed* rather than *missing*, and at 1280 the chapter finally looks like
  the display case §6.3 asked for.

`#online-services` needed no such rescue — a white card on ivory is already the right sign, and it is the
stronger of the two chapters. No white-on-white image: the categories artwork is dark on light, and the mount
carries the edge.

### Not verified

- **The FAQ block below the card at 360** appeared as empty paper in the element screenshot although the audit
  read its text nodes as rendered. Most likely `Reveal`'s below-fold opacity (T096, unchecked, and `Reveal.tsx`
  is not mine). Recorded as unverified rather than chased.
- **The mount at other widths.** Measured and looked at 360 and 1280 only. 768 and the `md` boundary were not
  captured.
- **The `prefers-contrast: more` block that already existed** for `.category-catalogue` (`--catalogue-muted:
  #21181a`, a 2px ink panel border) was written for the dark section. On paper those values still read as
  darkening, so they are correct by accident rather than by test — no forced-contrast capture was taken.

---

## T-P2 — the async-state jumps (T094) (2026-09-24)

**Files touched:** `components/shop/AddToCartButton.tsx` (the fix), `components/home/FeaturedProducts.tsx`
and `components/home/NewArrivals.tsx` (dead loading/error code removed), `components/home/OnlineServices.tsx`
(the `#online-services` desktop void, answered under T-P1's review — see below). `components/layout/CartButton.tsx`
was measured and **not** changed.

Three of §7's four named defects do not exist in the current tree, and the fourth was understated. The full
audit — including the measurement that killed each claim — is in
`notes/parallel-agent-decisions.md` under "T-P2: three of the four named defects are not defects". Short
version: items 1 and 2 describe a loading model that band 1 removed, so their skeleton branches are
unreachable code rather than wrong code; item 3's badge is `position: absolute` and mounting it moved the
header by exactly nothing at both widths.

**What shipped instead:** a failed add now says why. `role="alert"`, Persian, keyed on the API's `error.code`
rather than echoing its English `message`, held 4s, and the control returns to idle pressable. Card height is
invariant across the whole failure: 392.06px at 360, 567.6px at 1280.

**Two things this surfaced that are bigger than T-P2:**

1. **The house error idiom fails AA on white.** `text-destructive` (`#E4573F`) on `#ffffff` measures
   **3.66:1**, and its `bg-destructive/10` wash measures **1.13:1** against the same ground. That pattern is
   in twelve files — `CheckoutClient`, `ProductDetail`, `CartPageClient`, `OrderDetailClient`, `LoginForm`,
   `RegisterForm`, `PartnerForm` and six admin clients. Most of them sit on the dark canvas where #E4573F is
   fine; the ones inside `.product-card` (which sets `--background: 255 255 255`) are not. I did not touch
   them — this is a palette question, not a cart question.
2. **A `role="alert"` assertion is not the same as a visible one.** My first version of this fix used
   `sr-only` plus an icon swap and passed every check §7 asked for, including "visible in the accessibility
   tree". It was still wrong, because the only live caller passes `iconOnly` and a sighted shopper would have
   received no words at all. The screenshot is what caught it. Worth remembering for the T-P3 keyboard
   walkthrough: read the tree *and* look at the page.

**`#online-services` at 1280, from the driver's T-P1 review.** Fixed by moving the FAQ into the heading's
column so the card's height is answered by content instead of air — 665px → 583px band, document 13,020 →
12,938 at 1280, no overflow, and the contrast audit re-run clean afterwards (31 and 17 text nodes, zero
failures). Rejected a second service card: `featuredOnlineService` is one record, and inventing a second to
even out a grid spends Constitution I's budget, not mine.

**Not verified.** The labelled (non-`iconOnly`) branch of `AddToCartButton` — the «افزودن»/«موفق نشد» text
path — has no caller today, so it is unexercised by the browser pass above. It is the component's documented
default and I left it intact rather than narrowing a shared API under someone else's feet.

---

## T-P3 — the tab semantics (T095) (2026-09-24)

**Files touched:** `components/home/FeaturedProducts.tsx`.

The pattern is finished rather than dropped, as §8 preferred: `role="tablist"` now owns `ArrowLeft` /
`ArrowRight` / `Home` / `End`, each tab has an `id` and an `aria-controls`, both tabs control **one**
`role="tabpanel"` that is `aria-labelledby` the selected tab, the tabindex roves, and selection follows focus
because the rails are already resolved on the server and there is no fetch left to defer.

**`ArrowLeft` advances.** RTL, so reading forward runs left — the same rule feature 005 ships for the
categories carousel (FR-028, contract K2). Two RTL surfaces on one page disagreeing about which arrow means
"next" is worse than either convention on its own.

**One panel, not two.** A tab whose `aria-controls` points at a node that is not rendered is the same broken
reference as one with no id, so the empty-state block and the rail both live inside the panel.

Everything below was read off the DOM after each keypress, not off the source — and the first run of the probe
passed all of it while pressing nothing, because it blurred the tab and then "Tabbed" from a heading that
focuses nothing. `focusedId` was `""` for every step and the assertions still held. That is the exact failure
mode §8's "read it off the DOM" instruction invites, and it is worth carrying into T-P5.

| key | focused | aria-selected | tabindex roving | panel labelledby → resolves |
|---|---|---|---|---|
| focus entry | `featured-tab-newest` | newest=true | 0 / −1 | newest ✓ |
| ArrowLeft | `featured-tab-special` | special=true | −1 / 0 | special ✓ |
| ArrowLeft | `featured-tab-newest` | newest=true | 0 / −1 | newest ✓ |
| ArrowRight | `featured-tab-special` | special=true | −1 / 0 | special ✓ |
| End | `featured-tab-special` | special=true | −1 / 0 | special ✓ |
| Home | `featured-tab-newest` | newest=true | 0 / −1 | newest ✓ |

Tab stops in the tablist: **1**. `aria-controls` resolves on both tabs. Panel `tabindex=0`, and tabbing out of
the list lands on `#featured-panel` with a computed `outline: 2px solid rgb(229,211,179)` while
`:focus-visible` matches. Focus never lands in a hidden panel.

**I removed an `outline-none` I had just written.** The panel is focusable and my first pass suppressed its
ring, which is a worse accessibility outcome than the unlabelled panel T095 started from. The global
`:where(a, button, input, select, textarea, summary):focus-visible` rule does not cover `div`s, so the ring
has to be declared on the element.

### The defect under the defect: the two tabs cannot show different products

**The panel's content does not change.** Both tabs render the same six records, in the same order — verified
by reading the six `article` headings from `#featured-panel` on each tab and comparing them: identical.

The reason is arithmetic, not a bug in the component. `lib/home-rails.ts:31-40` builds both rails with
`specialOffer: true` and differs only in `sort`:

- `newest` → `updated_at` descending (`lib/catalog.ts:324`).
- `special` → offer-flag descending, **then** `updated_at` descending (`lib/catalog.ts:327-331`).

Every record in the set already has `special_offer === true`, so the comparator's first key is always `0` and
it falls through to the second — which is `newest`. The two sorts are provably the same function on this
input.

So the section advertises a distinction it cannot deliver, which is FR-047's actual complaint and a
Constitution I question, not an ARIA one. **I did not fix it**, because both available fixes leave this lane:

1. Give `special` a comparator that is not offer-then-recency — discount depth is what «پیشنهاد ویژه» promises
   a shopper. That edits `lib/catalog.ts`, which also drives `/shop?sort=special` and
   `contracts/shop-url.md`. Seam and contract, not mine to spend.
2. Drop the tablist and show one rail. The repo has done exactly this before — CampaignBanner was removed
   because "it sold no offer" while occupying the page's most expensive slot.

T-P3's a11y work is shipped regardless: a keyboard user can now operate the control that is on the page, and
if the resolution is to delete it, that costs one commit. It is not worth leaving the control unoperable while
the curation question is settled.

**Not verified.** The `Home`/`End`/wrap behaviour on a tablist of exactly two is weak evidence — every
"advance" here is also "the other one". A three-tab list would test the arithmetic; `featuredTabs` has two.

---

## T-P4 — the numerals (T078), and four more leaked comments (2026-09-24)

**Files touched:** `components/home/MobileQuickRoutes.tsx` (the one live numeral defect),
`components/home/StoreExperience.tsx`, `components/shop/ProductDetail.tsx`,
`components/shop/FilterSidebar.tsx` (rendered source comments), `tests/unit/jsx-child-comment.test.ts` (new).

### The count in the brief was stale; the method was wrong anyway

§9 says "20 authored Latin-digit sites". Static grep for `[0-9]` in a Tailwind codebase is noise — every
`size-11`, `mt-2.5` and `rgba(229, 211, 179, 0.08)` matches. So the scan was done on the **rendered** text
instead: walk every text node on `/`, `/shop`, `/partners`, `/cart`, `/login`, `/register` at 360, keep the ones
containing an ASCII digit, and cross-check each against the strings in `data/hami-products.json` so a merchant's
own product name can be told from something the site authored (owner decision 6 exempts the former, absolutely).

What is actually left on screen, after the fixes below:

| rendered | verdict |
|---|---|
| `OP18S`, `TCH Boom Trap L30`, `Compact 2045` | merchant-authored product names — exempt, must render exactly as written |
| `همکاری عمده (B2B)`, `خریدار (B2C)` | Latin-script abbreviations, not numerals. «ب۲ب» would be wrong. Exempt by nature, recorded so nobody "fixes" it |

Every site §9 named by line number is already folded or gone: `ProductCard`'s `−{off}٪` is fixed **and
test-enforced** (`persian-typography.test.ts:147-151` asserts `toFaDigits(off)` is present and the raw form is
not); `TrustBar.tsx` no longer exists; `lib/content/home.ts`'s ordinal fields are guarded by the
`index|number|ordinal` rule at `persian-typography.test.ts:128-145`; `ShopBanner` reads `"SHOP / ۰۳"`;
`PartnerForm` and `FilterSidebar`'s brand counts both go through `toFaDigits`.

**One real defect remained**, and it was not on §9's list: `MobileQuickRoutes.tsx:16` rendered
`String(index + 1).padStart(2, "0")` — «01 02 03 04» in Latin, on the same page that shows «۰۱» for the B2B
steps and «۰۱» for the accessory categories. That is precisely the mixed-column case SC-007 is about. Now
`toFaDigits(...)`, verified in the browser: `["۰۱","۰۲","۰۳","۰۴"]`.

Note for the brief: §9 says to use `toFaDigits` from `lib/persian.ts`. There is no such export — it is
`lib/utils.ts:24`, and that is what `CategoryCarousel` already imports. Followed the code.

### Four source comments were being rendered to shoppers

The one in `CategoryCarousel` that T-P1 turned up was not the only one. The same shape — `/*` in JSX **child**
position instead of `{/*` — was found in three more files, all of them live on screen:

- `StoreExperience.tsx:25` — the note explaining that the AI-lit store photograph was removed under FR-006,
  printed under the heading it is about.
- `ProductDetail.tsx:259` — on the **product page**, in the stock/warranty badge row, explaining that the
  «ضمانت اصالت ۱۰۰٪» badge was removed for asserting an unmeasured percentage. The explanation of a retracted
  claim was standing in the claim's place.
- `FilterSidebar.tsx:131` — inside the brand chip container on `/shop`, as a flex item among the brands.

All four are fixed. A new test holds the line: `tests/unit/jsx-child-comment.test.ts` scans every `.tsx` in
`components/` and `app/` for a block comment whose previous non-blank line closes a tag — child position — and
it carries a control case that runs the exact leaked text through the same detector, so the gate is known to be
able to fail. `223 passed / 23 files`, up from 221/22.

**Why this belongs in the suite and not in a review comment:** every one of these passed the accessibility
check. The `CategoryCarousel` leak measured 17.82:1 — ink on paper, perfectly legible. Nothing in the toolchain
objected to a page printing its own source code until something asked what the text *says*.

### Deliberately not changed: the price range inputs

`FilterSidebar`'s min/max fields are `type="number"`, so a typed price renders in Latin digits inside a Persian
RTL form. §9 lists them; owner decision 6 (recorded at T079) scopes SC-007 to **interface-authored** strings, and
a value the shopper typed is not authored by the interface. Folding it properly means a text input plus digit
normalisation on submit while the URL params stay Latin for the API — a real change, and a policy call, not a
fold. Flagged rather than decided.
