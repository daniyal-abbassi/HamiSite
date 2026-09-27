# Quickstart: Categories Editorial Mosaic

Proves the chapter does its job on a phone, that every claim on a tile is true, and that the old presentation is
actually gone.

## Prerequisites

- Node 24, dependencies installed (`npm ci`).
- **Never run `npm test` or bare `npx vitest run`.** `tests/setup.ts` is registered under `setupFiles` in
  `vitest.config.ts:16` and calls `resetDb()` in `beforeEach`, which deletes every row of nineteen tables from
  the real `hami_site_api` database (there is no `.env.test`). Use **`npm run test:unit`**, which points at
  `vitest.frontend.config.ts` and loads no setup file. A guard now throws on the unsafe path, but the guard is a
  backstop, not the workflow.
- Exact viewports: **360**, **768**, **1280**. Resizing a desktop window is not the same measurement.
- **One Chromium at a time** on this box (7.6 GB; it has already lost agent processes to load average 33).

## 1. Start the app

The dev server is expected to be running in tmux session **`hh-dev`** on `:3000`. Check before starting your
own:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
tmux capture-pane -p -S -40 -t hh-dev | tail -5     # read it; do not restart it
```

To judge it the way a shopper will, open `http://192.168.100.19:3000` on a phone — the LAN address changes on
every reboot, so confirm it rather than reusing an old one.

## 2. The cheap guarantees (unit, no DOM, no database)

```bash
npm run test:unit
```

Expected: green, including the new assertions that **every `image` path resolves on disk** and that a tile shows
a count only where `showsCount` is true. Confirm the run reports `setup 0ms` — proof no database was touched.

## 3. M1 — all nine visible, no sideways work

At 360 px, scroll the chapter top to bottom.

**Pass**: nine distinct department tiles seen, zero horizontal gestures, and no element in the chapter with
horizontal overflow. **Fail**: any department reachable only by a swipe, a pager, or a control.

Also measure the smallest tile's width. **Pass** at ≥148 px. (Do not chase the old 164 px figure — it is
impossible inside the container's 312 px content width; see `research.md` D1.)

> **Measurement trap**: `app/globals.css:128` sets `scroll-behavior: smooth`, so a scripted `scrollTo()` samples
> a page that is still gliding. Use `behavior: "instant"`, wait two animation frames plus ~120 ms, then re-read
> the rect. And confirm React hydrated — a 200 response with unloaded client chunks will look like a chapter that
> does not render.

## 4. M2 — recognisable before reading

Show the chapter to someone who has never seen the site for five seconds. Ask which departments it sells.

**Pass**: at least six of nine named correctly from the panels alone. Record the number.

## 5. M3, M4 — presses and promises

- Press each of the nine tiles: each must land on that department's listing.
- For every tile showing a number, open its listing and compare. **Five** departments qualify today; the phone,
  charger and powerbank tiles must show **no number at all**.
- Confirm no tile is dimmed, disabled, or marked pending.

## 6. M5 — the label is text, and it is readable

```bash
grep -rn "alt=" components/home/CategoryHub.tsx        # panels are decorative while the label is adjacent text
```

Compute contrast of the label colour against the **composited** background (plate over panel), not against the
plate colour alone. **Pass** at ≥4.5:1; the current set measures 16.8:1 minimum.

Confirm no panel contains rendered glyphs — open two or three at full size and look. Any Persian-looking text in
an image is a generation defect, not a rendering one.

## 7. M6 — keyboard and screen reader

- Tab through the chapter at 1280: **nine stops**, in DOM order, each with a visible focus ring.
- Screen reader over the section: it announces a list of nine; each item announces as one link with its name
  (and its count where shown).
- Assert the words "carousel" and "slide" appear in **no** announcement, and that no
  `aria-roledescription="carousel"` survives in the source.

## 8. M7 — the old presentation is gone

```bash
ls components/home/CategoryCarousel.tsx components/home/category-carousel.css 2>&1   # must be "No such file"
grep -rn "CategoryCarousel\|category-carousel" app/ components/ lib/                # must be empty
grep -rn "embla" components/home/                                                   # only NewArrivals.tsx may remain
```

Also confirm the band-paper mount patch is gone from `app/(main)/home.css` — it existed to serve the deleted
component and becomes a stray rule the moment that component does.

## 9. M8 and the composition at each width

At 360, 768 and 1280: the hero is the phone panel, the mediums are audio and charger, the six smalls are
identical in treatment, and **no trailing row is stranded** at 1280. The light ground must look exactly as it
did before this feature — that comparison is the owner's, not a measurement.

## 10. Resilience checks

- **Scripting disabled**: reload with JavaScript off. All nine tiles must still be visible and tappable.
- **A panel fails to load**: block one image in devtools. The tile keeps its name and stays a link; the absence
  is visible rather than filled with a stand-in.
- **A department empties**: temporarily point one seed slug at a category with no products and confirm the tile
  disappears and the grid closes up. Revert it.

## 11. Definition of Done

```bash
npm run typecheck
npm run build
```

Both clean, plus every clause above. **No frame-rate or smoothness target exists for this feature** — the
chapter is static by design, which is also why it works without scripting.

## Expected result

A shopper on a phone scrolls into a quiet light chapter and sees all nine departments at once: the phone panel
large and anchoring, headphones and chargers beside it, six smaller doorways beneath, each one a photograph that
says what it is before you read the label, each one a single tap away from real products, and nothing on any of
them that the shop cannot back.
