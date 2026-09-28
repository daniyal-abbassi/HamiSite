# 012-SURF-B — worker status (opencode)

**Worker**: opencode (tmux `hh-opencode`) · **Date**: 2026-09-28 · **Suite**: typecheck clean,
`npm run test:unit` 25 files / 340 tests / `setup 0ms` (DB-safe path held).

## Finished task IDs

- **T031** [US3] — `components/shop/CategoryTiles.tsx` wired to the shared marker. **Done + verified.**
- **T033** [US3] — `components/shop/ProductGallery.tsx` wired. **Done + verified**, including the FR-045
  wrapped-group corner trip (Job 5).
- **T034** [US3] — `components/shop/ProductDetail.tsx` variant chips wired. **Done + verified** on a
  product that really carries three option groups (347 «اپل-آیدی»: دامنه/سرور/نوع), including FR-033
  (one marker animating at a time) and the corner path on the wrapping نوع group.
- **T032** [US3] — `components/shop/ShopResults.tsx` pagination. **Wired + verified before the file was
  reassigned** to the other session mid-task (their backlog adds an entrance motion to the same
  component). The working tree carries the wiring; the FR-046 decision and the `maxTravelPx`
  recommendation are in `q-fr046-pagination.md`. No further edits were made after the handover.

## Evidence

- `verification/surf-b-interaction.json` — **56/56 checks pass** at 1280 px and 360 px
  (`verification/verify-surfaces.mjs`, run against the live dev server). Per surface: one marker and no
  second indicator; a trusted `page.mouse.click` moves the selection; the flight is sampled with
  `requestAnimationFrame` inside the page; the marker rests inside its group and its slot; accessible
  names and `aria-current` / `aria-pressed` are identical to the pre-wiring capture
  (`a11y-before.json`); with scripting blocked the current item is still marked and the marker paints
  nothing.
- `verification/a11y-before.json` / `a11y-after.json` — the before/after capture
  (`verification/capture-surfaces.mjs`). Geometry is pixel-identical to before on all four surfaces
  (tiles 112×148 @ 360 / 195×145 @ 1280, 22 px radius, 12 px gap, nowrap; pagination 39 px buttons on
  one 44 px line @ 360, 44 px @ 1280; gallery 4-per-row @ 360 and 8-per-row @ 1280; chips 8 px gap).
- Screenshots: `surf-b-{tiles,gallery,chips,pagination}-{1280,360}.png` (+ `-nojs` for the tiles).

## Findings worth carrying forward

1. **The shared CSS module is unlayered; Tailwind v3 utilities are layered.** A plain utility always
   loses to the module's `gap: 4px`, `min-width: 0`, `justify-content: center`, `white-space: nowrap`
   and `border-radius: 999px`. Every surface that needed its own geometry used Tailwind's **v3 prefix**
   important form (`!gap-3`, `!min-w-28`, `!rounded-xl`, …). The v4 suffix form (`min-w-28!`) generates
   **no CSS** in this project and silently loses — that was a real bug mid-task, caught by measuring the
   rendered tiles.
2. **A wrapping flex row whose items must shrink needs `!flex-nowrap !min-w-0`.** The module sets
   `flex-wrap: wrap`; a row that is also a flex *item* of a tighter container wraps its items instead of
   shrinking them (the pagination spilled onto a second line until this was added).
3. **The gallery counter could not stay inside the marker's row** — the component renders exactly its
   items and has no children slot. It now sits on its own line after the thumb grid. The one deliberate
   layout change on that surface; the counter text itself is unchanged.
4. **The tiles' active `border-aqua` is gone** (the marker is the one indication, matching the dock), and
   the active tile announces `aria-current="true"` — the value the pre-marker markup rendered
   (`aria-current={active || undefined}`), kept byte-identical per SC-010 rather than "improved" to
   `"page"`.
5. **The dev server on :3000 died mid-session** (pane returned to a shell prompt; not killed by me). A
   private `:3015` was used per the brief, then killed when a second dev server appeared on :3000 — two
   dev servers sharing `.next` is the documented corruption trap. Verification finished against the
   restored :3000.

## Not done here (other workers' tasks, listed so the handoff is honest)

- T029/T030 (pills, featured tabs) — owned by the qoder session; T030 is blocked on the frozen component
  lacking per-item `id`/`tabIndex`/`aria-controls` (their report is on the board).
- T035–T040 (cross-cutting verifications) — not mine.
- The `Header.tsx` typecheck error qoder flagged was **fixed on its own** while this session ran; the
  full typecheck is clean as of this writing.
