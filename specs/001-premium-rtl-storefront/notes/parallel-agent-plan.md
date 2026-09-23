# Parallel-agent brief — Hami Hamrah, band 3 (design contrast + interaction states)

**Written**: 2026-09-23, by the agent currently driving this repo. Amended 2026-09-24 for the third agent.
**Audience**: the agents working in this same checkout at the same time.
**Read this whole file before editing anything.** The coordination rules in §4 are the reason three agents can
work here without destroying each other's output.

**If you are the research agent: §4.4 and `research/README.md` are your sections. You do not own source
files and none of the tasks below are yours to implement — your job is §12.**

---

## 1. What this project is

`Hami Hamrah` (حامی همراه) is a real 20-year mobile-phone shop and wholesaler in Mashhad, Iran. This repo is
its Next.js storefront, being redesigned through a Spec Kit pipeline (`specs/001-premium-rtl-storefront/` is
the active feature). The interface is **Persian and RTL**, and the owner is the merchant's decision-maker —
they read every claim on the page and they care about it looking expensive.

Three things are simultaneously true and you have to hold all three:

- It must look **luxury**, not merely clean. That is Constitution IV and it is not optional.
- Nothing on the page may **assert something the business cannot stand behind**. That is Constitution I, it
  outranks the other three, and there is no exception path for it.
- **The phone is the primary device.** The owner's standing instruction is "ALWAYS MOBILE FIRST" — design at
  360px, treat 1280px as the enhancement. A change that looks right only on a desktop is a failed change.

## 2. The owner's brief, in their words, with dates

These are quotes, not paraphrases. They are the actual instruction; §6 turns the last two into work.

| When | Quote | What it means for you |
|---|---|---|
| 2026-09-23 | *"هیچی نبایپ کنسل یا بلاک بشه"* — nothing may be skipped, cancelled or blocked | Decide open questions yourself and write the decision down. Do not stop and ask. |
| 2026-09-23 | *"i u encounter any questions, just answare it with your gut and proceed"* | Same. A recorded guess beats a stalled task. |
| 2026-09-23 | *"costing dependency doesn't matter, quality is the priority"* | Do not reject a tool because it adds weight. Reject it on merit. |
| 2026-09-23 | *"عکس فروشگاه رو برگردون حتما"* — bring the store photo back, definitely | Done. The hero has the shop's photograph again. Do not remove it. |
| 2026-09-23 | *"use the AI polished shop image"* | Done. The frame is the rendered/idealised version, chosen by the owner over a provenance objection. The caption and `alt` still describe only what is true. |
| 2026-09-23 | *"No - i don't want it to be white!! but i dont want the entire background atmosphere to be the same color all along"* | The ground was made to travel. See §6 — this has since moved again. |
| **2026-09-24** | *"the background shifting and transform is not my taste - is wayyy too boring - **use white somewhere**"* | **This is your headline task (§6).** The dark-tonal tour is not enough for them. They now want real light against the dark. |

The last row reverses the middle one, and that is allowed: it is their shop and their eye. Do not re-litigate
it in code comments or in a report. Build the contrast.

## 3. Non-negotiables

**Never do these:**

1. **Do not edit `data/`, `app/api/`, or `prisma/`.** Constitution III freezes the backend for this whole
   redesign phase. Catalog reads go through the seam at `lib/catalog.ts` over `data/hami-products.json`. If a
   task seems to require a data change, it does not — find the presentation-side fix and record it.
2. **Never run bare `npm test`.** `tests/setup.ts` truncates 19 tables and there is no `.env.test`. Run a
   targeted file instead: `npx vitest run tests/unit/<file>.test.ts`, or `npx vitest run tests/unit`.
   (The owner has said the dev database being wiped does not matter — but there is no reason to do it on
   purpose, and a full run is slower.)
3. **Do not push.** Commits yes, `git push` no. The owner said so explicitly on 2026-09-24. The driving
   agent pushes when the owner asks.
4. **Do not touch band 4 (`specs/001-premium-rtl-storefront/tasks.md` Phase 6, T098–T104) or fill any
   human-panel box.** Those tasks are closed-unmeasured by owner decision and an empty checkbox is
   information; a ticked one is a fabrication.
5. **Never generate AI product imagery** or present a rendered thing as merchandise. Principle I. (The hero
   *interior* render is the owner's explicit exception and it is captioned as a view of the shop, never as
   proof of stock, price or certification.)
6. **Do not use this machine's performance as a judgement.** The owner's PC is too weak to benchmark fps and
   they have withdrawn that class of verdict. Never report "it feels smooth/janky here".
7. **Do not install, build or run anything under `docs/inspires/`.** It is vendored reference material.
8. **Do not delete `CLAUDE.md`.**
9. **Do not open `~/.pixel-bridge/profiles/*`, commit it, or drive that browser through a login/CAPTCHA.**
10. **Do not re-add the removed claims**: the street address (until the merchant supplies it),
    `MASHHAD FLAGSHIP`, `SHOWROOM`, «فضای واقعی مجموعه», and any warranty/certification language that is not
    in `lib/content/verified-facts.ts`.

**Always do these:**

- Measure before and after. "It looks better" is not evidence. The instruments are in §5.
- Mobile first: check 360×800 **before** 1280×900, at every change.
- Persian typography rules: no `letter-spacing` on Persian text (FR-057 — tracking pulls the joining strokes
  apart); ZWNJ in «جستجو», «می‌کند» etc. (FR-058); Persian digits U+06F0–06F9 in interface-authored strings
  (FR-011), using `toFaDigits` / `formatToman` from `lib/persian.ts`. Merchant-authored product text renders
  **exactly as written** — never convert it.
- Write a decision note when you decide something (§10).

## 4. Coordination: how two agents share this checkout

The driving agent (me) owns the **atmosphere and the hero**. You own **section-level contrast and component
states**. The line is drawn by file, and it is hard.

### 4.1 Files I am actively holding — do not edit these

```
app/(main)/page.tsx                    the hero composition, section order, fold
components/home/ShopWindow.tsx         the shop photograph panel
components/atmosphere/PageGround.tsx   the scroll ground layer
components/atmosphere/page-ground.css  its opacity/compositing
lib/atmosphere/progression.ts          the six-stop tone tour
tests/unit/atmosphere-progression.test.ts
app/globals.css                        ONLY these regions: the `:root` token block (lines ~75-135),
                                       the `body` canvas rule (~136-150), and the `@media (pointer: coarse)`
                                       touch-target block at the end of the file
specs/002-scroll-atmosphere/**
```

If a task of yours genuinely needs one of these changed, **stop and write the requirement into
`notes/parallel-agent-requests.md`** (create it) as "I need X in file Y because Z", then do the best
available version without it. Do not edit the file anyway.

### 4.2 Files that are yours

```
app/(main)/home.css                    section-level styling for the homepage chapters
components/home/SectionHead.tsx        section headers
components/home/CategoryCarousel.tsx   the categories chapter
components/home/FeaturedProducts.tsx   tabs + skeletons
components/home/NewArrivals.tsx        skeleton count
components/home/BrandRows.tsx, BrandShowcase.tsx
components/home/AccessoryUniverse.tsx, OnlineServices.tsx, B2bSection.tsx,
components/home/StoreExperience.tsx, TrustBento.tsx, WhyHamiProofs.tsx, FinalConversion.tsx
components/shop/ProductCard.tsx        numerals on the card
components/shop/FilterSidebar.tsx      numeral inputs
components/shop/ShopBanner.tsx         ordinals
components/layout/CartButton.tsx       badge reflow
components/shop/AddToCartButton.tsx    swallowed errors
components/ui/button.tsx               focus/pressed/disabled
components/partners/PartnerForm.tsx    ordinals
tests/unit/  (new files only — do not edit atmosphere-progression or persian-typography)
specs/001-premium-rtl-storefront/notes/parallel-agent-*.md
```

`app/globals.css` is **shared**: append-only for you, and only at the end of the file, inside a clearly
labelled block (see §6.4). Never reformat or re-order existing lines — a whole-file rewrite by two agents is
how one of us loses work.

### 4.3 The lock discipline

Before your first edit in a round:

```bash
git status --short                    # must be clean, or you are in someone's uncommitted work
git log --oneline -5                  # note the head you started from
```

Then work in **small commits, one task each**, and re-run `git status --short` before every commit so you
see exactly what you are staging. Never `git add -A` or `git add .` here — `.scratch/`, `jev.txt`,
`.qoder/settings.local.json` and `specs/006-category-showcase/` are other people's untracked files.

If `git status` shows a modified file you did not touch, **leave it alone and stage around it by path**.

### 4.4 The channel: `.agent-pair/`

A live coordination folder exists at the repo root — **read `.agent-pair/README.md` and `.agent-pair/BOARD.md`
before your next edit.** It is git-ignored, so `git status` will never show it to you; you find it because
this section says so. Four rules there, in short: claim a file by writing `locks/<path>.lock` before you edit
it, never edit someone else's locked file (post a `REQUEST` instead), overwrite `HEARTBEAT-<you>.md` every
~5 minutes, and remember that `git status` will list files you did not touch — those are your partner's, so
**never** `git restore`, `git checkout --`, `git stash` or `git add -A` in this checkout.

The driver agent posts first. Say hello back, and post `DONE` with your measured numbers when a task lands.

### 4.5 Reporting

Every task you finish gets: the code change, a measurement before/after, a line in
`notes/parallel-agent-findings.md` (append, do not restructure), and its checkbox ticked in `tasks.md` by
ID. If you could not verify something, say so in the note — an honest "unverified" is worth more than a
confident claim, and the owner reads these.

## 5. Environment facts you need

- **Dev server**: already running on `http://localhost:3000`. Do not start a second one on 3000. If you need
  a clean build, `npm run build && npm run start` on another port, or `BASE_URL=http://localhost:3200 …` for
  the verification scripts. First hit on a cold route takes 5–15s on this machine; that is compile, not the
  page.
- **Screenshots / measurement**: Playwright is not a dependency of this repo. Use the one that is installed:

  ```js
  import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
  const exe = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
  await chromium.launch({ executablePath: exe });   // headless-shell is NOT installed; pass executablePath
  ```

  `browser-use` cannot resize the viewport — drive exact widths with the snippet above.
- **Reusable probes** (read them before writing your own; they already solve the traps):
  - `specs/001-premium-rtl-storefront/verification/capture-baseline.mjs --tag <name>` — 12 surfaces × 2
    widths, writes `baseline/manifest-<name>.json` + crops. Reports doc height, mounted sections, decoration
    counts (`shinyEdge`, `gradText`, `backdropElements`…), rendered Persian `letter-spacing`, fold positions.
    **Do not pipe it through `head`** — SIGPIPE kills it mid-run and leaves PNGs from one run and a manifest
    from another. Redirect to a file and read the tail.
  - `specs/001-premium-rtl-storefront/verification/ground-travel.mjs` — samples **painted gutter pixels**
    down the homepage and reports the ground's real travel. Use this pattern whenever a visual claim matters:
    computed styles told us the ground was fine while the composited pixel was not.
  - `verification/sc002-interactions.mjs`, `panel-press-navigates.mjs` — press-contract walkers.
- **`next/image` caches by URL, not by content.** If you replace a file under `public/` keeping its name, the
  dev server keeps serving the old optimised derivative from `.next/cache/images`. This bit the hero
  photograph: the file on disk was verified new (channel means 80/45/33) while the browser still painted the
  old one (123/112/109). Either delete `.next/cache/images` or bump the filename — bumping is better, because
  real browsers cache the optimised URL too.
- **Contrast math**: `luminanceOf()` and `contrastOn()` are exported from `lib/atmosphere/progression.ts`.
  Use them; do not eyeball contrast and do not add a colour library.
- **Catalog reality**: 189 products, **5 purchasable**, 21 `limited`, 162 `out_of_stock`, 6 `call`. Product
  images are local JPEGs with no alpha. Slugs are Persian. Any "empty section" you see may be correct.
- **Type check**: `npx tsc --noEmit`. Unit suite: `npx vitest run tests/unit` (currently 221 tests / 22
  files passing — do not land a change that reduces that).

## 6. TASK T-P1 — light chapters: real contrast against the dark ground

**This is the owner's live complaint and it is the highest-value work in the repo right now.**

The homepage is one continuous dark surface. A six-stop tone tour was built and the owner's verdict was
*"wayyy too boring"*. Amplitude in the dark is not enough — what they asked for, twice, by naming
`palatemcp.com`, is **light bands**. Measured on that reference: its `body` never changes (`rgb(30,17,17)`
throughout); what changes is that each `<section>` paints its own opaque colour — `#0B0B0D` hero → `#F7F5EE`
ivory → `#E2553D` persimmon → `#1A1512` espresso → `#E9E2D2` oat — with the text inverting inside each band.
That is the device. It is not a theme and it does not make the site white.

### 6.1 The engineering insight that makes this cheap

The palette is RGB-triplet custom properties consumed as `rgb(var(--x) / <alpha-value>)`. Confirmed in the
compiled output, not inferred from the config — `.next/static/css/app/layout.css` emits:

```css
.text-foreground\/75 { color: rgb(var(--foreground) / 0.75); }
```

There are ~140 `text-foreground/NN` usages and 24 `bg-ink-2` usages across the components. **You do not have
to touch any of them.** Override the variables on the band's wrapper element and every descendant utility
recomputes:

```css
.band-paper {
  /* the chapter's own ground */
  background-color: #f4f1ea;
  /* and everything alpha'd inherits an inverted foreground for free */
  --foreground: 17 4 8;          /* #110408 — the brand's own edge-ink */
  --muted-foreground: 74 62 60;
  --card: 255 255 255;
  --card-foreground: 17 4 8;
  --border: 17 4 8;              /* hairlines become ink at their existing alpha (config pins 0.15) */
  --input: 17 4 8;
  --ring: 100 2 17;              /* focus ring goes oxblood, not champagne */
}
```

Two cautions from the probe that established the above: read the **computed** colour of a descendant before
and after adding the override, and expect it to change — if it does not, that utility is hardcoded and is
part of §6.2's list. And do not assume a section's `id` element wraps the section's content: `#categories`
turned out to contain no `text-foreground/…`, no `border-…` and no `text-champagne` descendants at all, so
it is an anchor, not the band. Find the real wrapper before you write the rule.

### 6.2 What does NOT flip, and is where the bugs will be

These are hardcoded and must be handled per-case inside the band. Grep for each before you start, list what
you find in your note, and fix by override inside `.band-paper` (scoped rule), not by editing 20 components:

- `text-champagne`, `text-aqua`, `text-gold` — all three resolve to `#E5D3B3`, which on `#f4f1ea` measures
  **1.30:1**. Invisible. Inside a paper band these must become `var(--oxblood)` `#640211`, which measures
  **11.94:1** on the same ground. Oxblood on ivory is the classic pairing here and `--accent` already is
  oxblood, so this is the brand's own palette, not an invention. For reference the ink on paper numbers:
  `#110408` → 17.82:1, and `--muted-foreground` at 70% alpha → about 9:1.
- `.glass`, `.glass-smoked`, `bg-ink`, `bg-ink-2/90`, `shadow-monolith`, `shadow-card` — dark surfaces. Cards
  inside a paper chapter need a paper treatment (white card, ink hairline, a real but shallow shadow).
- `radial-gradient`/`linear-gradient` washes with `rgba(255,255,255,…)`.
- `next/image` product photos: they are opaque JPEGs on a dark ground; on paper they may need a border so a
  white box doesn't dissolve into the band.
- Anything with an inline `style` — CSS variables will not save it.

### 6.3 Scope — two chapters, not five

Pick **two** and do them properly:

1. **The categories chapter** (`components/home/CategoryCarousel.tsx`, section id `categories`) — it is early
   in the page, it is a grid of images, and light makes it read like a display case.
2. **The online-services or accessories chapter** (`OnlineServices.tsx` / `AccessoryUniverse.tsx`) — one
   light chapter mid-page is the difference between "a dark page" and "a page with rooms".

Do **not** make the hero, the shop-window panel, or the closing CTA light. The page must open dark (that is
the brand's shopfront at night) and close dark (the CTA sits on the deepest ground tone). The light is in
between, and the sequence must be deliberate: dark → **paper** → dark → **paper** → dark.

### 6.4 How to land it

- Put the band styles in `app/(main)/home.css` if they are homepage-section-scoped, or in a new
  `app/(main)/bands.css` imported from `app/globals.css`'s last line — **append only**, one labelled block:

  ```css
  /* ---------------------------------------------------------------------
     T-P1 — light chapters (§6 of notes/parallel-agent-plan.md). Owned by
     the second agent. Everything in this block is scoped to .band-paper.
     --------------------------------------------------------------------- */
  ```
- Wrap the section: `<section id="categories" className="band-paper …">`. Keep the existing `id` — the
  ground's anchors and `HOMEPAGE_SECTIONS` in `lib/atmosphere/progression.ts` depend on section order and
  ids, and that file is mine.
- Section headers (`components/home/SectionHead.tsx`) need a paper variant. Add a prop or a scoped CSS rule;
  do not restyle the dark variant.

### 6.5 Acceptance — all of it measured, in this order

1. **Contrast**: for every text token actually used inside each band, `contrastOn(text, bandGround) ≥ 4.5`
   for body text and `≥ 3.0` for large text and non-text UI. Write a throwaway script using the exported
   helpers and paste the numbers into your note. `#E5D3B3` champagne on `#f4f1ea` **must not survive this
   check** — if it appears, you missed an override.
2. **No white-on-white images**: screenshot both bands at 360 and 1280 and look at them. Report what you saw.
3. **The dark chapters still travel**: run `verification/ground-travel.mjs`. It will report fewer positions
   where the ground reaches the gutter (the bands are opaque, that is expected) — record the new number, and
   confirm the *dark* positions between bands still show distinct tones.
4. **No overflow regression**: `capture-baseline.mjs --tag paper` and diff `horizontalOverflow` and
   `docHeight` against `manifest-after.json`.
5. `npx tsc --noEmit` clean; `npx vitest run tests/unit` still 221 passing.
6. Decoration counts stay 0 (`shinyEdge`, `gradText`, `backdropElements`). A paper band is a colour change,
   not an excuse to add glass, glow or gradient text.

## 7. TASK T-P2 — the async-state jumps (T094)

FR-046. Four named defects, all in files you own:

1. `components/home/FeaturedProducts.tsx` — skeletons are gated on `isLoading && products === null`, so a tab
   switch keeps the previous tab's cards with no busy affordance and then swaps them, jumping the section.
   Show the skeleton whenever a fetch is in flight for a *different* key than what is on screen.
2. `components/home/NewArrivals.tsx` — reserves 4 skeletons against a 6-item result. Match the real count.
3. `components/layout/CartButton.tsx:19` — the badge renders only when `itemCount > 0`, so the header reflows
   on the first add. Reserve the space always; hide the *number*, not the box.
4. `components/shop/AddToCartButton.tsx:63-65` — every non-auth failure is swallowed silently. The user must
   see that nothing happened, in Persian, and the button must return to its idle state.

**Acceptance**: drive it in the browser. Switch tabs on a throttled network and confirm no stale-card flash
and no layout shift (measure the section's height across the transition with `getBoundingClientRect` before
and after). Add one item to an empty cart and assert the header's height and the position of its neighbours
do not move. Force a failing add (bad payload via `page.evaluate`) and assert an error is visible in the
accessibility tree, not just coloured.

## 8. TASK T-P3 — the tabs are not tabs (T095)

`components/home/FeaturedProducts.tsx` has `role="tablist"`/`role="tab"` with no `aria-controls`, no
`tabpanel`, and no arrow-key handling — two stops that behave as buttons. Either finish the pattern (correct
`aria-controls` → matching `id` on the panel, `role="tabpanel"`, `tabIndex` roving, ArrowRight/ArrowLeft
moving selection **in RTL-aware directions**, Home/End, and the panel labelled by its tab) or drop the roles
and use plain buttons. **Prefer finishing it.** Screen-reader semantics are a Constitution IV quality claim
here, not a checkbox.

Note: the carousel in `components/home/CategoryCarousel.tsx` must not gain a click handler — calling Embla's
`scrollTo()` inside a press makes it treat the gesture as a drag and swallows navigation. That was measured
the hard way.

**Acceptance**: keyboard-only walkthrough recorded in the browser — Tab into the list, Arrow keys move
selection and change the panel, Enter/space are not required, focus never lands on a hidden panel. Report the
`aria-*` attributes you produced by reading them off the DOM, not off your source.

## 9. TASK T-P4 — the numerals (T078) and T-P5 — the states (T092)

**T092 (state treatments)**: `components/ui/button.tsx` declares no `focus-visible` of its own and leans on
the zero-specificity `:where()` global at `app/globals.css` (~line 165); `summary` is missing from that
selector list, so the homepage FAQ controls lose the brand ring; hand-rolled pills have no pressed state; and
`disabled:pointer-events-none` silences a disabled control so the user cannot even ask why it is disabled —
give it a reason instead (`aria-describedby`, a tooltip or an inline clause). Add `summary` to the global
selector list **only** — that one line is the exception to §4.1's globals.css restriction.

**T078 (20 authored Latin-digit sites)**: worst is `−{off}٪` in `components/shop/ProductCard.tsx` — a raw
number beside a Persian-digit price on the same card. Then the ordinals in `components/shop/ShopBanner.tsx`,
`components/partners/PartnerForm.tsx`, and the number inputs in `components/shop/FilterSidebar.tsx`. Use
`toFaDigits` / `formatToman` from `lib/persian.ts`; do not invent a new layer. **Merchant-authored product
text is exempt and must render exactly as written** — `512` inside a Persian product name stays `512`
(owner decision 6, `notes/owner-decisions.md`).

**Acceptance for both**: `npx vitest run tests/unit/persian-typography.test.ts` stays green (it scans source
for these defects), plus a browser pass at 360 reading the rendered text of each surface.

## 10. When you have to decide something

Decide it, then append to `notes/parallel-agent-decisions.md`:

```markdown
## <date> — <one-line title>
**Chosen:** …
**Rejected:** … (and why it was reasonable)
**Verified by:** <the command and the number it produced>
```

That format exists because the next agent to read this repo needs your reasoning, not your conclusion.

## 11. Suggested order

`T-P1` (light chapters) → `T-P2` (async jumps) → `T-P3` (tabs) → `T-P4` (numerals) → `T-P5` (states).

T-P1 first because it is the owner's live complaint and because it will teach you the token system, which
the rest of the list depends on. Commit after each. Do not push.
