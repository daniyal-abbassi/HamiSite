# Motion Coherence: Brands Rows with the Rest of the Homepage

Written against [contracts/brand-row-behaviour.md](../contracts/brand-row-behaviour.md) C22–C26 and
FR-021, during Phase 6 (User Story 4). This is the record of what the section chose and what it left
for the other two features to honour.

## The choice, made once

| | |
|---|---|
| Duration | **220ms** — the `normal` step of the existing scale in `tailwind.config.ts` (`instant 100 / fast 150 / normal 220 / slow 300`) |
| Easing | **`cubic-bezier(0.2, 0.7, 0.3, 1)`** — the page's signature curve, also the `DEFAULT` of `transitionTimingFunction` |
| Properties | `background-color`, `border-color`, `color`, `opacity`, `transform`. No layout property transitions anywhere in the section |
| Mechanism | CSS transitions driven by React state. No GSAP, no `motion`, no per-row loop (research.md D3) |

**One of these was got, not designed in.** The rows were first written with `ease-out`, which is not
the curve this page uses — `.reveal`, `tray-card-in`, `word-swap` and the product-card transform all
run the pinned `cubic-bezier(0.2, 0.7, 0.3, 1)`. Six declarations were corrected to match. The
duration was on-scale from the start but expressed as a literal rather than a token; `tailwind.config.ts`
states that arbitrary durations outside the scale are not allowed, and 220ms is exactly `normal`.

## C22 — one duration scale, one easing family

Met inside the section. **Not met page-wide**, and the remainder is not this feature's to change:

- `app/(main)/home.css` lines 175 and 193, the category tiles: `transform 100ms ease-out`. The
  duration is on-scale (`instant`) but the curve is not. That surface is feature 005's, and 005's
  spec has the same C22 obligation — recorded here so it is 005's to close, not silently inherited.
- The hero atmosphere (`noir-drift` 90s/140s, `edge-spin` 8s) belongs to feature 002's region and is
  out of scope for a duration scale; it is decoration, not interaction.

## C23 — one emphasis rule

Exactly one element holds emphasis, and it releases the same way every time: the same control, a
press outside the list, the section scrolling out of view, `Escape`, or navigating away. Feature 005's
carousel inherits this rule by `004/FR-032` ↔ `005/FR-038`.

## C24 — one interaction contract

A press on a selectable destination always navigates, first press, no interception. Verified in the
browser for the rows, including the case that matters: with one row already emphasised, pressing
another row's link still navigates on that first press.

**This is the clause 005 owes in return.** Its carousel's active panel must navigate on first press
too. 005's spec was written before this decision was taken, so it is the most likely of the five to be
missed.

## C25 — one visibility rule

Nothing animates off screen. Two mechanisms, both measured:

- An `IntersectionObserver` on the list releases emphasis at threshold 0, so emphasis cannot be held
  unseen. Verified: scrolled to the top of the page, the section is off screen, running animations in
  `.brand-rows` = 0 and holders = 0.
- All motion in the section is a transition on a state change, so there is nothing to run while the
  shopper is not looking. At rest, in view: 0 running animations. Mid-transition: every running
  animation belongs to the one emphasised row, none to a sibling.

One travelling element per region: **the brands region now has none.** See below.

## C26 — one reduced-motion behaviour

`prefers-reduced-motion: reduce` collapses the section's transitions and stops the chevron rotating,
on top of the page-wide floor in `globals.css`. Verified with an emulated reduced-motion context: the
snapshot of ordinals, labels, mark markup, hrefs and story text is **byte-identical** to the
full-motion run, the story still becomes visible on activation, and the chevron's computed `transform`
is `none`. Emphasis is a state change, not travel.

**Deviation from T041's instruction, deliberate.** The task pointed at the `Reveal.tsx` guard pattern,
which is a JS `matchMedia` check. `Reveal` needs JS because it must decide whether to *hide* content
before the observer runs; a two-state transition does not, and a CSS media query gets the same result
with no script, no flash of hidden content, and no work on the main thread. The ticker's loop was
already paused this way.

## FR-021 — the hero band, and Q3 = C executed

Question 3 was resolved **C: adopt the rows here and rework the existing band into something
non-moving**, so that the page keeps one travelling element per region and the twenty-year claim stays
pinned and readable.

**This was not done until Phase 6.** `BrandTicker` was still running `animation: brand-ticker 42s
linear infinite` — a seamless loop with a doubled mark list, a `min-w-[100vw]` guard against the blank
sweep, an edge mask and a hover/focus pause. It is now static:

- The keyframes, the track, the pause rule and the mask are deleted from `globals.css`, along with the
  two reduced-motion overrides that existed only to stop them.
- The mark list is rendered once, so it is exposed as a real labelled list with each brand's Persian
  name attached, replacing an `aria-hidden` strip plus a screen-reader-only duplicate underneath it.
- The `dir="ltr"` placement hack — which existed only because an RTL overflow box parked the track at
  −1645px and marched the marks out of frame — is gone with the thing that needed it.
- The band's colour is untouched: RAL 3004 with cream marks, pinned rather than left to the chapter
  tokens, because a palette move once dropped it to 1.21:1.

Measured after the change: 6 marks, list labelled `برندهای همکار`, **0 running animations** in the
band at both 360px and 1280px.

The trap to avoid when revisiting this: the version before the loop was a grid of seven equal boxes
each captioned «برند همکار», and it read as a specification table. The static band stays off that rock
by having no boxes, no captions and no dividers between the marks.

## FR-032 ↔ 005/FR-038 — the reciprocal obligation (T046)

Clarification Q2 on both sides answered the same question the same way: **two widgets, one motion
language.** `004/FR-032` and `005/FR-038` are that answer restated twice, and they bind in both
directions. Feature 005 is **not built** — `components/home/CategoryHub.tsx` is still the static mosaic
— so what can be settled here is 004's half, plus the exact values 005 has to match.

| Behaviour | 004's commitment, met and measured | What 005 must do |
|---|---|---|
| **C22** one duration scale, one easing family | 220ms (`normal` in `tailwind.config.ts`) and `cubic-bezier(0.2, 0.7, 0.3, 1)`, applied to all seven declarations in `.brand-rows` | Pick from the same token scale and use the same curve. Not free to invent a third easing |
| **C23** one emphasis rule | Exactly one row holds emphasis; released by the same control, a press outside, scroll-away, `Escape`, and navigation | Its carousel's active panel obeys the same five release paths, one holder at a time |
| **C24** one interaction contract | A press on a row navigates on the first press, verified including the press-while-another-row-is-emphasised case | **Its active panel must navigate on first press too.** This is the clause 005 owes in return |
| **C25** one visibility rule | Nothing animates off screen; `IntersectionObserver` releases emphasis at threshold 0; zero running animations measured at rest | At most one travelling element per page region, and nothing animating unseen |
| **C26** one reduced-motion behaviour | Content byte-identical under `reduce`; emphasis is a state change, not travel | Identical content under `reduce`, same mechanism |

**C24 is the one most likely to be missed**, for the reason the spec already states: 005's spec was
written before 004's Question 2 was resolved as **C**, so 005's own text may still describe a
tap-to-focus-then-tap-to-enter carousel. If it does, that is 004's answer overriding it, not a
contradiction to be re-litigated — `005` line 420 already concedes that "004 is now settled … so those
answers constrain here rather than the reverse".

**One thing 004 changed on 005's behalf, and it is not in either spec.** The hero `BrandTicker` band is
now static (FR-021 / Q3 = C, executed in Phase 6). That removes the page's only other travelling
element, which makes C25's "one travelling element per region" satisfiable for 005's carousel rather
than already violated before it starts.

## Open items this phase leaves to the owner

- **T053** — no homepage tile can honestly say "همه گوشی‌ها": 134 `kind: "phone"` products live only in
  brand-shaped categories, `موبایل` (id 80) reaches 8, and the parent `موبایل-و-تبلت` (id 3) has 0 direct
  products because `queryProducts` matches `categoryId` exactly with no subtree walk. Closing it needs a
  `kind` filter or a subtree walk in `lib/catalog.ts` and `app/api/products/route.ts`, both frozen by
  Principle III. **Decision needed, not code.**
- **Two unreferenced assets** — `public/images/categories/home.png` and `tv.png` (~290 KB). No code path
  names them; `lib/product-images.ts` documents why the mapping excludes them. Deleting is the owner's
  call, so the test suite asserts the mapping rather than the files' absence.
- **`npm test` truncates the development database.** `package.json` runs `dotenv -e .env.test -- vitest
  run`, `.env.test` does not exist, so `DATABASE_URL` falls through to `.env` → `hami_site_api`, and
  `tests/setup.ts` calls `resetDb()` in a global `beforeEach`, which `deleteMany()`s all 19 tables —
  including for the pure unit tests, which never touch a database. `hami_site_api` currently holds 0 rows
  in every table, so nothing was lost, but the harness will empty any database it is pointed at. T050 was
  therefore satisfied with `npx vitest run tests/unit` plus `npm run typecheck`, not bare `npm test`.

## What cannot be closed yet

**US4 scenario 7 — "one choreography rather than three competing ones" — is not verifiable today**,
because feature 002's scroll-driven ground is not implemented and feature 003's product motion is a
separate surface that has not been reconciled. What 004 has done is state its values once, here, so
that when 002 lands the comparison is a diff rather than an argument. The commitment is: 220ms, the
signature curve, transform/opacity/colour only, nothing off screen, nothing looping, and a press that
always navigates.
