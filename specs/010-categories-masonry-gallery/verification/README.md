# Verification — feature 010, categories masonry gallery

Every contract clause in [../contracts/category-masonry.md](../contracts/category-masonry.md) with the number
that settles it. Where a claim is re-runnable, the command is given; a table someone typed by hand is a claim,
a script that exits non-zero is evidence.

| Clause | Status | Measured | Evidence |
|---|---|---|---|
| **Q1** columns stagger, not a matrix | ✅ | heights 148/208/268 · 224/320/392 · 288/400/512 — exact; column ratios 1.108 / 1.000 / 1.031 | `q1-heights.md`, `masonry@{360,768,1280}.png` |
| **Q2** rhythm is a stated pattern | ✅ | 15 assertions: Latin square both directions, 3/3/3 per breakpoint, keyed by kind | `q2-rhythm.md`, `npm run test:unit tests/unit/category-masonry.test.ts` |
| **Q3** complete before scripting | ✅ | 9 `.cat-card` + 9 labels in the server HTML; **JS disabled**: 9 uneven named tiles, press navigates | `q3-no-js@360.png`, `node tools/shots/viewport.mjs --width 360 --no-js …` |
| **Q4** no name behind an interaction | ✅ | 9/9 readable at rest at 360 and 1280; `letter-spacing: normal`, `text-transform: none`; hover changes presence by nothing (opacity 1 → 1) | `interaction-probe.mjs` |
| **Q5** one press, same window, back returns | ✅ | 18/18 — nine presses landed on their own `/categories/<slug>`, nine backs returned; **1 page open** (no new window) | `interaction-probe.mjs` |
| **Q6** plays once, end state by every path | ✅ | 7/7 — min opacity 0.00 mid-wave then all 1; no replay; reduced motion 0 inline styles; **chunk blocked → 9 tiles visible, `hydrated: false`**; `#brands` top 5565/5565/5565 | `q6-q7-arrival.md`, `arrival-probe.mjs` |
| **Q7** blur bounded, label never blurred | ✅ | peak **3** layers carrying a filter (bound `ceil(0.32/0.12)`); 0 labels blurred | `arrival-probe.mjs` |
| **Q8** RTL, keyboard, screen reader | ✅ | 9 tile stops + the view-all link, DOM order; `outline-width: 3px`; `role=list`, 9 `li`, 9 links, **0** `aria-roledescription` in the chapter; 6 counts each `aria-describedby`; tile 1 at x=951 > tile 2 at x=650 (reads from the right) | `interaction-probe.mjs` |
| **Q9** ground kept, palette bounded, old machinery gone | ✅ | 7 hex literals, each with a commented reason; `CategoryCarousel.tsx`, `category-carousel.css` and the `.cat-mosaic` block absent; `cat-*` legacy classes return nothing | greps in `q9-deletions.md` below |

**Run all three probes**: `node specs/010-categories-masonry-gallery/verification/arrival-probe.mjs && node
specs/010-categories-masonry-gallery/verification/interaction-probe.mjs` — 9/9 and 13/13.
**Gates**: `npm run test:unit` → **281/281** (first fully green suite in this feature; the last red was
`categoryImageFor`, retargeted at `v3/` by T028). `npm run typecheck` clean. `npm run build` clean, 44/44 pages.

## Q9 detail

Deleted: `components/home/CategoryCarousel.tsx` (320 lines), `components/home/category-carousel.css` (246 lines),
the `.cat-mosaic` / `.cat-tile` block (was lines 689–870 of `app/(main)/home.css`), the band-paper carousel
patch, the `.cat-panel` line in a `prefers-contrast` block, and one selector from a shared `:active` list.
`tests/unit/category-mosaic.test.ts` **never existed** — qoder locked the file in 009 Phase 1 and never wrote it,
so that deletion was a no-op and is recorded as one rather than claimed as work.
`embla-carousel-react` remains in `package.json` for `NewArrivals.tsx` and is no longer reachable from
categories.

## What this feature changed that the plan got wrong

Four things, all caught by measuring rather than reasoning. Each is written into the document that carried the
error rather than quietly absorbed — see research D2, D4 and `q1-heights.md`.

1. **The rhythm table.** Planning's cyclic rotation satisfied every stated rule and left one column 420 px short
   at 1280. Replaced by a search against a simulation of the browser's auto-placement, now guarded by a test.
2. **Container padding.** `tailwind.config.ts` says 1.5rem; `app/globals.css` overrides it with a fluid value.
   Columns are 154/225/281 px, not 150/229/293 — the same arithmetic that made 009's tile floor wrong twice.
3. **The blur bound.** `ceil(duration/stagger)` counts overlapping tweens, not layers carrying a filter.
   `gsap.from()` set all nine at frame one; `immediateRender: false` brought the measured peak to three.
4. **FR-021.** The plan claimed the tonal ground has no coupling to `#categories`. It does — `categories` is the
   third anchor in `HOMEPAGE_SECTIONS`. What actually holds is that the chapter's *position in the order* is
   unchanged, verified by asserting all nine anchors present and monotonic after the height change.

## Honest limits

- **No frame-rate figure appears anywhere, and none may be added.** This machine cannot measure smoothness
  honestly in either direction. The guarantee is structural: ≤3 blurred layers, one-time, skippable, absent under
  reduced motion.
- **SC-002 (five-second recognition) and SC-008 (the owner accepts it on their own phone) are not measured here.**
  Both are a person's answer. The two mosaic variants were rejected on sight, so no clause above substitutes for
  them. To run it: `npm run dev -- -H 0.0.0.0 -p 3000`, then the `wlp3s0` address (changes every reboot; currently
  `192.168.100.19:3000`).
- **A pre-existing 401 on one resource** shows in the console at both widths, before and after this change. Not
  from this chapter, which fetches nothing.
- **Deferred, named**: `phone.png` (1.5 MB) and `audio.png` (1.2 MB) ride an unoptimized path — 2.7 MB of the
  chapter's imagery in two files. Re-encoding is a separate decision with its own visual tradeoff and must not
  ride inside a layout change the owner is reviewing (research D9).

## Environment traps hit while building this

- **`npm run build` breaks a running dev server**, every time, silently: it rewrites `.next` under it and the
  server then serves HTML referencing chunk names that no longer exist. Symptom here was `reactKeys: 0` and nine
  tiles that would not animate while the code was correct. `CLAUDE.md` documents it; the rule is restart the dev
  server after any build.
- **`npm run dev -H 0.0.0.0 -p 3000` is wrong** — npm eats the flags. It needs `npm run dev -- -H 0.0.0.0 -p 3000`.
- **A `tmux` session started with a command dies with it.** `hh-dev` was `tmux new-session -d -s hh-dev 'npm run
  dev …'`, so Ctrl-C killed the whole session, not just the server. Start it with `bash` and `send-keys` the
  command.
