# Contract: Category Masonry

**Surface**: `components/home/CategoryHub.tsx` + `components/home/CategoryArrival.tsx` + the `.cat-masonry` block
in `app/(main)/home.css` + `lib/category-masonry.ts`
**Spec**: [../spec.md](../spec.md) · **Decisions**: [../research.md](../research.md) · **Model**: [../data-model.md](../data-model.md)

Nine clauses, each with the evidence that settles it. The failure mode of this chapter specifically has been an
agent looking at it, liking it, and calling that verification — so every clause names either a measurement or a
test, and the two clauses that can only be judged by eye say so out loud and name the person who judges.

**"Provable"** below means a `tests/unit/category-masonry.test.ts` assertion in the node harness — no DOM, no
browser, `npm run test:unit`.

---

### Q1 — The columns stagger, and the arrangement is not a matrix

At 360, 768 and 1280 the tiles do **not** share row bottoms: measured tile heights take three distinct values per
width, and the columns end at different points.

**Evidence**: measure every tile's height at each width; assert exactly three distinct values with the ratio
L : S ≈ 1.8 : 1 (from the authored spans — base 268/148, md 392/224, xl 512/288). Then assert the tallest column
is no more than 25 % taller than the shortest, which is the difference between editorial and unfinished.
*Provable* for the tier arithmetic **and for the column balance**, which `tests/unit/category-masonry.test.ts`
now checks by simulating the browser's auto-placement; **browser-measured** for the column bottoms, and the two
agree to the pixel.

*This clause failed on the first build.* The rhythm planning drafted satisfied every other rule and measured
1.59 at 1280, because nine tiles do not divide into four columns and auto-placement is greedy. See research D2's
balance finding and `verification/q1-heights.md`.

*Fails as*: two equal rows, or one column trailing far below the others.

---

### Q2 — The rhythm is a pattern, not an accident, and size means nothing

Every department holds each tier exactly once across the three breakpoints; every breakpoint holds three tiles of
each tier; and no department's tier depends on its catalogue weight.

**Evidence**: `tests/unit/category-masonry.test.ts` reads the authored table and asserts the Latin-square
property on rows and columns, then asserts the table's keys are exactly the nine `DepartmentKind` values and that
all three breakpoints are declared for each. Separately: assert `service` is `S` at `base` and `L` at `md` — the
one-product department must not be the biggest tile everywhere, which is what ended 009's variant B. *Provable*.

---

### Q3 — The chapter is complete before any script runs

With JavaScript unavailable, all nine departments are present, named, positioned in the uneven arrangement, and
each is a working link.

**Evidence**: `curl` the homepage with no browser and assert the HTML contains nine `.cat-card` anchors with their
nine labels; then load the page in a browser **with JS disabled** and confirm the grid renders uneven tiles at
360 px and a press navigates. The arrival is the only thing lost. *Both halves required* — the HTML check alone
would pass on a JS-computed layout, which is the exact defect this clause exists to catch (FR-008).

---

### Q4 — A department's name is never behind an interaction

All nine names are visible with no hover, no focus, no press, on a phone and on a desktop.

**Evidence**: grep the new CSS block for a `:hover` / `:focus` / `[data-*]` rule that sets `opacity`,
`visibility`, `transform` or `display` on `.cat-card__label` — there must be none. Then view at 360 px and at
1280 px and read the nine names without touching anything. The supplied reference reveals the title on hover;
porting that behaviour is the failure this clause blocks.

---

### Q5 — One press, same window, back returns here

Nine presses at 360 px each land on the matching department listing; the browser's back button returns to the
chapter; no new window or tab opens.

**Evidence**: press all nine. Assert `window.open` appears in none of the new or edited files (*provable* by
grep), and that every `href` equals `` `/categories/${encodeURIComponent(slug)}` `` from the model.
*Related*: `categoryImageFor` currently still names the five pre-v3 files and must be retargeted at `v3/` for the
listings to agree with the tiles — see quickstart §5.

---

### Q6 — The arrival plays once, and its end state is reachable by every path

Once per page visit on the chapter's first appearance; nothing replays on scroll-back; reduced motion shows the
finished arrangement immediately; and a stalled or absent script leaves the composition exactly as the stylesheet
drew it.

**Evidence**: four checks. (a) Scroll in, away, back — one arrival. (b) Emulate
`prefers-reduced-motion: reduce` — no motion, nine tiles visible. (c) Load the page, block the chunk containing
`CategoryArrival`, and confirm the nine tiles are **visible and placed**, not hidden — this is the clause that
proves `gsap.from()` rather than `to()` was used, because the hidden state exists only in script memory. (d) *Provable*:
assert `MAX_CONCURRENT_BLUR === 3` and that the constants round to it, and assert the new CSS contains no
`opacity: 0` rule scoped to `.cat-card`.

---

### Q7 — Nine tiles must not cost nine simultaneous blurs, and this machine may not claim smoothness anyway

At most three tiles **carry a `filter`** at any instant; the label is never blurred; the rise itself is
compositor-only. "Carrying", not "changing between samples" — the distinction is what caught the first
implementation, where `gsap.from()` had all nine layers holding `blur(6px)` from frame one despite a stagger
that looked like it prevented it (research D4).

**Evidence**: `verification/arrival-probe.mjs` samples `getComputedStyle(art).filter` across a live arrival and
asserts the peak count of layers carrying a blur is ≤ 3, and that no `.cat-card__label` ever has one. Run it
rather than eyeballing paint flashing; it exits non-zero.

**Explicitly not in this contract**: any fps figure. The development hardware cannot measure smoothness honestly,
so no clause may assert a frame rate and no reviewer may accept one. The guarantee is structural: bounded
concurrency, one-shot, skippable, never load-bearing.

---

### Q8 — RTL, keyboard and screen reader

Nine tab stops in DOM order (= the authored department order), each with a visible focus ring; the section
announces as a list of nine items; no `aria-roledescription` claiming carousel or slide survives anywhere; the
first column paints on the right.

**Evidence**: tab through at 1280 and record stop count and order; run a screen reader and record the
announcement; screenshot at 360 px in RTL and confirm `گوشی موبایل` is in the **right** column. Assert the new CSS
contains no `left:` / `right:` / `padding-left` / `margin-right`-style physical property (*provable* by grep), and
that `grep -r "aria-roledescription" components/home/` returns nothing.

---

### Q9 — The ground, the palette and the old machinery

The chapter sits on the existing light `--paper` ground and introduces no colour token of its own. Every colour in
the new block resolves to `--paper`, `--paper-ink`, `--paper-muted`, `--paper-brand`, the inherited scrim recipe,
or a documented alpha of those. `CategoryCarousel.tsx`, `category-carousel.css`, the `.cat-mosaic` block and the
band-paper patches that existed to serve the carousel are gone.

**Evidence**: `grep` the new CSS block for hex literals — each must be one of the named exceptions with a
commented reason. Then: the four files do not exist; no import names them; `cat-mosaic`, `cat-tile`, `cat-panel`
and `cat-carousel` return nothing from `components/` or `app/(main)/home.css` (*provable*).
`embla-carousel-react` stays in `package.json` — `components/home/NewArrivals.tsx` still imports it — but it is no
longer reachable from the categories path.

---

## Non-negotiables inherited, not re-decided

- **No Persian text baked into any panel image**, and none generated: models render Persian script as gibberish
  every time. The label is overlay text so it stays sharp, selectable and correct.
- **No real-brand trade dress**, and no panel that presents a specific product as merchandise the shop sells
  (Principle I — no exception path, no exception by owner request).
- **The light ground stays.** *"the white background is so pretty, keep it"*.
- **Missing data stays visibly missing.** A failed picture leaves the tile as a named doorway and shows the gap;
  no stand-in photograph, no assumed count.
- **A tenth department must fit the table.** Adding a `kind` means adding a rhythm row; the Latin-square assertion
  will fail until it is added, which is the point.
- **The owner decides Q1's aesthetics on their own phone.** SC-008 is a person, not a measurement: the two
  rejected variants were rejected on sight, so this is accepted the same way.
