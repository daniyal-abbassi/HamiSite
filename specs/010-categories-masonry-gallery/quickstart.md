# Quickstart: Categories Masonry Gallery

**Feature**: 010 | Proves: [contracts/category-masonry.md](./contracts/category-masonry.md) Q1–Q9

## Prerequisites

- Node 24, dependencies installed (`gsap@3.15.0` is already in `node_modules`; **nothing to install for this
  feature**).
- Nine panels present in `public/images/categories/v3/` — `phone.png`, `audio.png`, `charger.jpg`,
  `smartwatch.jpg`, `powerbank.jpg`, `computer-accessory.jpg`, `sim-card.jpg`, `car-charger.jpg`, `service.jpg`.
  Verified present on 2026-09-26.
- The ownership gate in plan.md cleared first: `app/(main)/home.css` and
  `tests/unit/category-mosaic.test.ts` have live claimants (qoder for 009, hermes for 008). Nothing below is
  reachable until those are released on the board.

## 1. Run the tests

```bash
npm run test:unit tests/unit/category-masonry.test.ts tests/unit/category-departments.test.ts
```

**Never bare `npm test` or bare `npx vitest run`.** `npm test` points at `.env.test`, which does not exist, and
`tests/setup.ts` sits in that config's `setupFiles` — a single-file run under it truncates 19 tables in the real
`hami_site_test`→`hami_site_api` database. `test:unit` uses `vitest.frontend.config.ts`, which has no
`setupFiles`. Expect `setup 0ms` in the output; anything else means the wrong config ran.

Expected: Q2 (Latin square), Q6(d) (`MAX_CONCURRENT_BLUR === 3`), Q9 (no physical properties, no deleted class
names, no `window.open`, no new hex tokens) and the on-disk `image` assertion all green.

```bash
npm run typecheck
```

## 2. Serve, and look at it at three widths

```bash
tmux send-keys -t hh-dev "npm run dev -H 0.0.0.0 -p 3000" Enter   # -H, not --host
```

The dev server lives in tmux `hh-dev`, not in a backgrounded Bash task — background shell tasks get reaped and the
server dies with exit 0, which looks like a broken feature.

Three widths, one section, each screenshotted at the chapter and not at the page top:

```bash
node tools/shots/viewport.mjs --width 360  --out specs/010-categories-masonry-gallery/verification/masonry@360.png
node tools/shots/viewport.mjs --width 768  --out specs/010-categories-masonry-gallery/verification/masonry@768.png
node tools/shots/viewport.mjs --width 1280 --out specs/010-categories-masonry-gallery/verification/masonry@1280.png
```

`tools/shots/viewport.mjs` does not exist yet — it is a setup task, promoted from the throwaway
`.scratch/shot.mjs` already used for 009's previews. Its shape is fixed by two constraints: `browser-use` cannot
resize a viewport, so the width has to come from the Playwright already installed for pixel-bridge
(`/home/lain/tools/pixel-bridge-mcp/node_modules/playwright` + the cached chromium executable path, read from
argv rather than hardcoded), and it must **scroll with `behavior: "instant"`** — `app/globals.css:128` sets
`scroll-behavior: smooth`, so a default `scrollTo` animates and the probe measures mid-scroll.

**Q1** — read every `.cat-card` bounding height at each width. Expect three distinct values per the authored
spans (base 148/208/268, md 224/320/392, xl 288/400/512, ±1 px) and column bottoms differing by ≤ 25 %.

**Q3, first half** — no browser needed:

```bash
curl -s localhost:3000 | grep -c 'class="cat-card"'      # expect 9
curl -s localhost:3000 | grep -o 'cat-card__label">[^<]*' # expect the nine Persian names
```

## 3. Prove the layout is not computed by JavaScript (Q3, Q6c)

This is the clause the supplied reference would fail, and it needs two separate checks — the HTML alone passes on
a JS-laid-out section whose script happens to have run.

1. **JS disabled**: Chrome devtools → Settings → Debugger → JavaScript enabled (uncheck). Reload, scroll the
   chapter. Nine uneven, named, tappable tiles. *Then* press one and confirm it navigates.
2. **Chunk blocked**: devtools Network → block the request whose URL contains `CategoryArrival`. Reload. The
   chapter must look **finished**, not blank and not half-faded. A section that renders empty here is using
   `gsap.to()` from a CSS-hidden state — the defect FR-011 exists to prevent.

## 4. The arrival (Q6, Q7)

- Scroll to the chapter from the page top: tiles rise and resolve in a staggered wave. Record the count — it
  plays **once**; scroll away and back and nothing replays.
- `getBoundingClientRect` check for **SC-007 / FR-022**: capture the `y` of `#brands` (the next section) before,
  during and after the arrival. All three must be identical — tile heights come from tracks, so nothing moves.
- **Q6b**: emulate `prefers-reduced-motion: reduce`, reload, scroll in. Nine tiles present, sharp, placed, no
  motion, and no blur anywhere.
- **Q7**: devtools → Performance → toggle "Paint flashing" and watch one arrival. Only three tiles at most should
  flash as blurring layers, and the label plate must not be among them.
  **Do not report an fps number.** This machine cannot measure smoothness honestly; if asked, the answer is the
  bounded concurrency above, not a frame rate.
- **FR-024 / fast scroll**: scroll hard to the chapter immediately on load. The arrival should be *playing or
  finished*, never "waiting to happen behind you".

## 5. Navigation, labels and honesty (Q4, Q5, and the existing red test)

- Hover one tile at 1280 → the image scales inward. Press-and-hold at 360 → the same response. Read all nine
  names with **no interaction at all** on both.
- Press all nine at 360 px; each must land on `/categories/<its slug>` in the **same tab**, and Back must return
  to the chapter.
- Count check: exactly **six** tiles carry a number (audio ۱۹, smartwatch ۷, computer ۵, sim ۳, car-charger ۳,
  service ۱). The phone, charger and powerbank tiles carry none — their route and their kind disagree (135 vs
  134, 12 vs 10, 6 vs 7), so any figure would be wrong. Compare each visible number against the listing it
  opens; they must match.
- **The known red test**: `tests/unit/product-images.test.ts > categoryImageFor > only names tile files that
  exist` fails today because the five pre-v3 PNGs were deleted by the owner. Retarget `categoryImageFor` at
  `public/images/categories/v3/` in the same pass — the tiles and the listings must name the same files, or Q5 is
  true on the homepage and false one click later.

## 6. RTL, keyboard, screen reader (Q8, Q2)

- Tab through at 1280: **nine stops plus one** for «مشاهده همه محصولات», in the authored department order, each
  with a visible ring. (Today the carousel exposes exactly **one** panel per visit via roving `tabIndex=-1` — this
  is an improvement, and the arrow-key RTL sign-mapping bug class of 005's K1–K3 is deleted rather than fixed.)
- Screen reader (VoiceOver / NVDA / `chrome-devtools` a11y pane): the region announces as a **list of nine
  items**; each link announces its name, and six announce a count. The words *carousel*, *slide*, *slideshow* must
  not appear.
- Screenshot at 360 px: `گوشی موبایل` occupies the **right** column. Then in the console:
  `getComputedStyle(document.querySelector('.cat-masonry')).direction` → `"rtl"`.
- Rotate the phone (or resize 360 → 1280 mid-page): the tier pattern must **change phase**, not scale up — a
  department that is tall at 360 is short at 1280 (Q2). If the arrangement merely grows, the breakpoint tiers were
  not applied and one department has become permanently the biggest tile.

## 7. Judge it (SC-008)

Open it on the owner's own phone over LAN (`npm run dev -H 0.0.0.0`, then the `wlp3s0` address — it changes every
reboot; currently `192.168.100.19:3000`). SC-002 at the same time: five seconds, then name the departments from
the pictures alone; six of nine is the bar.

The two mosaic variants were rejected on sight, so this is accepted the same way. No measurement substitutes for
that answer, and no Q clause passing means the owner wants it.

## 8. Definition of done

```bash
npm run test:unit && npm run typecheck && npm run build
```

All three clean, plus sections 2–7 recorded under `specs/010-categories-masonry-gallery/verification/`, plus the
four deletions verified absent (Q9), plus the tonal sequence re-checked after the height change — and **it is
coupled**: `categories` is the third entry in `HOMEPAGE_SECTIONS` (`lib/atmosphere/progression.ts:45`), so the
scroll ground measures this chapter's position. The plan first claimed FR-021 "holds by absence of coupling" and
that was wrong. What actually holds is that `<CategoryHub />` stays mounted at `app/(main)/page.tsx:210`, so the
anchor *order* is unchanged and the ground simply follows the new height; verified by asserting all nine anchors
present and monotonically ordered after the change.

**Deferred, named so it is not lost** (research D9): `phone.png` (1.5 MB) and `audio.png` (1.2 MB) are the
heaviest images in the chapter on an unoptimized path. Re-encoding is a separate decision with its own visual
tradeoff; it must not ride inside a layout change the owner is already reviewing.
