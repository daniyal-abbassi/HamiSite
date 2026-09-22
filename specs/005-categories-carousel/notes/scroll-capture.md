# T015 — Scroll-capture gate: **PASS**

**Run**: 2026-09-22 | **Contract**: G1, FR-016, FR-017, FR-018, I1–I5, SC-003
**Tool**: `/tmp/t015-scroll.mjs` (Playwright via `PLAYWRIGHT_PATH`, system Chrome, headless)

The gate this feature was most likely to fail. The reference it is modelled on attaches its wheel and
pointer listeners to the **document**, so a cursor crossing the section converts a shopper's vertical page
scroll into horizontal carousel movement — on a homepage measured here at **19,134px tall at 360px**, that
is not a defect you can tune around.

## Results

| Input | Gesture over the section | Page scrolled | Carousel moved | Verdict |
|---|---|---|---|---|
| Touch (iPhone 13 emulation, CDP `Input.dispatchTouchEvent`) | 12-step vertical drag starting on a panel | **+249px** | 0 panels | PASS |
| Mouse wheel (1280px) | 6 × `deltaY 120` with cursor centred on the carousel | **+720px** | 0 panels | PASS |
| Trackpad (1280px) | 6 × `deltaY 18`, small continuous deltas | **+108px** | 0 panels | PASS |
| Mouse drag **outside** the section | press-drag 700px horizontally across the header area | — | 0 panels | PASS |

Intent was never reclaimed mid-gesture in any case, and the active panel index was unchanged after every
vertical input. **The section does not take the page's scroll.**

## Why it holds, rather than merely passed

This is not the result of careful gesture arbitration — it is the result of *having no gesture arbitration
to get wrong*. Embla listens inside its own viewport node, claims only its own axis, and never calls
`preventDefault()` on a vertical scroll. Its wheel handling is a separate plugin (`embla-carousel-wheel`)
which is **not installed**, so a wheel event over the section reaches the document untouched by
construction. `touch-action: pan-y` on the viewport keeps vertical ownership with the browser
unconditionally.

The practical consequence for anyone tempted to "improve" this: adding a `window` or `document` listener in
`components/home/CategoryCarousel.tsx` reintroduces the exact failure this file exists to rule out, and it
would still pass every other check in the feature. G1 outranks them.

## One probe in the run was invalid, and is recorded as such

The script also compared `window.scrollY` traces over a fixed 1.5s programmatic scroll with the section
present versus removed, expecting agreement. It reported `maxDelta 84` (present 161, removed 245) — which
looks like a failure and is not one. The page sets `scroll-behavior: smooth`, so `scrollBy()` inside a
`requestAnimationFrame` loop queues animated scrolls that never complete, and the two traces differ mostly
by how much of the queued animation each happened to render. The probe measures its own confound.

**What it does not prove either way**: that the section costs nothing. That is contract P5 / FR-020 /
SC-009, and it belongs to **T025**, measured on a production build under CPU throttling — dev-mode frame
numbers are not comparable, and feature 004 measured a 50ms-versus-33ms gap there that vanished entirely in
production. Do not read this file as clearing T025.

## Reproducing

```bash
PLAYWRIGHT_PATH=/home/lain/tools/pixel-bridge-mcp/node_modules/playwright node /tmp/t015-scroll.mjs
```

The script is ephemeral; if it is to become part of the feature it belongs at
`specs/005-categories-carousel/tools/scroll-capture.mjs` alongside 002's `tools/` precedent, and should
drop the scroll-trace probe or rewrite it against `behavior: "instant"`.
