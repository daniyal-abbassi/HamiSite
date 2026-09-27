# Band 007 verification harnesses

The instruments behind `../spec.md`'s Measurable Outcomes. A number with no reproducible instrument behind it
is a claim, not a measurement, and this feature's headline numbers — SC-001's length, SC-004's word parity,
SC-008's set difference — are all of the kind a screen cannot be interrogated for by eye.

Two harnesses live here, and **both are meant to fail until Phase 2 lands.** They are written red on purpose
(T007/T008 in `../tasks.md`) so that the wiring is what turns them green, rather than the harness being edited
to fit whatever the wiring happened to do. The third red test of that group, T006's ground unit test, is *not*
in this directory: it edits `tests/unit/atmosphere-progression.test.ts`, which cannot be separated from the
T014/T015/T016 anchor change and so moves inside `driver`'s commit rather than here.

```bash
npm run dev &                        # then, once it answers:
node specs/007-motion-assembly-band/verification/content-parity.mjs
node specs/007-motion-assembly-band/verification/band-length.mjs
```

- `content-parity.mjs` (T007) — SC-004 and SC-008. Loads `/` with scripting disabled and again with it
  enabled, reads `../baseline/content-before.json`, and asserts that the served HTML's words equal the
  settled DOM's words equal the band's word set, and that `band − content-before` is empty. Counting both
  sides is the point: SC-004 says "the count matches the settled page exactly", which an RSC-only reading
  cannot prove.
- `band-length.mjs` (T008) — SC-001 and the pin. At 360px it reports the band section's height, the sticky
  shell's height, `window.innerHeight`, `100svh` resolved, and whether the shell actually holds `top: 0`
  across the pin window; it asserts length ≤ 2,400px **and** pin = true. Against today's page it fails on
  both counts, which is the expected red.

Both accept `BASE_URL` (default `http://localhost:3000`) and `VIEWPORT_W` (default 360). `:3000` is the
shared dev server — see `.agent-pair/README.md` before restarting it; if you need your own, say so on the
board and point `BASE_URL` at it.

## The contract every harness here obeys

Inherited verbatim from `specs/001-premium-rtl-storefront/verification/README.md`, because the alternatives
each cost someone a bad measurement:

- **Playwright comes from `/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs`** — the copy
  that ships with pixel-bridge. This repo does not depend on Playwright, and a locally installed one drifts
  from the browser build in `~/.cache/ms-playwright`.
- **Chromium is passed explicitly as `executablePath`:**
  `/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`. Without it, Playwright launches the
  revision *its own* version expects, which on this machine is not the revision that exists on disk.
- **PNG decoding happens inside the page**, via `img.decode()` + `canvas` + `getImageData`, rather than in
  Node. It keeps the harnesses dependency-free, and the composited pixel is the only honest answer to "what
  did a shopper see" once overlays and stacking contexts are involved.
- **Redirect output to a file instead of piping through `head`.** A `SIGPIPE` kills a capture mid-run and
  leaves images from one run sitting next to a manifest from another, which reads as a passing suite over a
  corrupt baseline. `… > out.log 2>&1` rather than `… | head`.
- **No frame-rate or fps claim from this machine.** Nothing here measures smoothness, and nothing written in
  `../spec.md` should be quoted as one: the numbers this box produces are not a motion budget. What the band
  is graded on is *sequence* (does state follow scroll), which `band-length.mjs` and the `sequence-state.mjs`
  work measure without ever asserting a frame count.

## Inputs these harnesses depend on, and their current state

| Input | Written by | On disk? |
|---|---|---|
| `../baseline/content-before.json` | T005 | no — Phase 1 still open |
| `../baseline/heading-before-*.png` | T004 | no — SC-002's control images |
| `AssemblyBand` rendered at `/` | T012 | no — `app/(main)/page.tsx` still mounts the three sections |

`content-parity.mjs` checks for the band **before** it reads the baseline file, so a run today fails with
"no AssemblyBand on the page" rather than a stack trace about a missing JSON. That ordering is deliberate:
the missing baseline is a Phase 1 fact, and it must not be the error that hides the Phase 2 one.
