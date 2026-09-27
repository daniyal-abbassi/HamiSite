# Upstream attribution — the travelling marker

**Project**: `liquid-taffy` — https://github.com/arknow91/liquid-taffy
**Commit taken from**: `4bcf4005f857c371bf53d60b2cee14abcecedf6a` (2026-08-20)
**Licence**: MIT, Copyright (c) 2026 arknow91 (full text below, as required by the licence itself and by FR-060)

## Why the source is vendored rather than installed

`liquid-taffy` describes itself as a reference implementation, not a package, and its
`package.json` agrees: `"private": true`, no `main`, no `exports`, and `dev`/`build`/`preview`
as its only scripts — all of them Vite. It cannot be installed as a dependency
(`npm install github:arknow91/liquid-taffy` produces nothing usable), so the source comes in
and the licence comes with it. That is also why **no dependency was added**: `gsap`, `react` and
`react-dom` are already in this project's `package.json` (FR-035).

## Files taken

| Upstream | Here | State |
|---|---|---|
| `src/components/PillTabs/PillTabs.tsx` | `components/liquid/LiquidSelection.tsx` | the marker and its trip; re-authored around it (see below) |
| `src/components/PillTabs/PillTabs.module.css` | `components/liquid/liquid-selection.module.css` | the shape; all eight colour/type properties re-pointed at this storefront's tokens |
| `src/components/liquid/motion.ts` | `components/liquid/motion.ts` | `prefersReducedMotion()`, plus the tween literals that upstream wrote inline |

Kept deliberately, because upstream's comments say each one is a defect it worked around
(FR-068):

1. `gsap.killTweensOf(marker)` before starting a trip — without it, a second click inside the
   ~620ms flight leaves two timelines alive and both writing `width` every frame, and width is
   layout, so a flurry of clicks piles up synchronous reflows.
2. The early return when a re-run lands on the same slot — without it, a parent re-render makes
   the marker bounce in place under the pointer.
3. Reading "is this the first paint" off the element rather than a ref — StrictMode's throwaway
   mount reverts the inline styles the first `set` wrote, so an armed ref would leave the real
   mount animating a marker that is back to zero width. Ours is a `data-ls-placed` attribute on
   the row rather than upstream's `pill.style.width === ""`, because our marker can arrive with
   a width already written by the server; same rule, same place.

## Files NOT taken (FR-042, FR-066)

`src/components/liquid/` as a whole was examined and almost all of it left behind:

- **`goo.ts`** — the blur-and-threshold metaball filter. **`PillTabs` uses no filter at all**; its
  liquidity is entirely scale, skew and elastic on a solid element. Nothing here imports it and
  nothing here may add one (FR-030).
- **`sfx.ts`** — procedurally synthesised click sounds. Not ported, on any interaction (FR-042).
  It was one import and one call site upstream, so it is deleted, and `theme.ts` went with it —
  `useLiquidTheme()` existed only to tell the sound which frame it was in.
- `hues.ts`, `seam.ts`, `select.ts`, `springs.ts`, `squircle.ts`, `stretch.ts`, `dropdown.module.css`
- **`LiquidMenu/`** (anchored and morphing dropdowns), **`LiquidAdd/`** (speed dial),
  **`LiquidMorph/`**, **`SelectionBurst/`** (the burst on pick), **`IconMorph.tsx`**,
  **`RowHover.tsx`** — the switch/menu/morph/burst/hover-row family. None of it is in scope.
- `InteractionStage/`, `ThemeStage/` — upstream's own demo surfaces. No demo page ships in this app.

## What is ours, not upstream's

Everything the port had to become, in `LiquidSelection.tsx`: links as well as buttons and the
`announce`/`groupRole`/`itemRole` semantics that keep each surface's existing ARIA state intact
(FR-062, FR-047); equal-width slots and inset markers for an icon-over-label bar (FR-064, FR-065);
the `frame.clientLeft`/`clientTop` correction, which upstream never needed because its row had no
border; the server-computed first frame via `parkStyle` (FR-067); press deformation on the marker
itself, where upstream only scaled the label (FR-012); the `corner` and `arrive` plans for wrapped
groups and long distances (FR-045, FR-046); the page-wide one-trip-at-a-time registry (FR-033) and
the will-change hint that exists only mid-flight (FR-034); and the palette, in the CSS module.

The slot arithmetic lives in `selection-geometry.ts`, a file with no DOM in it, so it can be tested
by `tests/unit/liquid-selection.test.ts` — which is also the only way any of it is verifiable in CI
on this project, since `tests/unit` runs in a node environment.

## Licence text, retained verbatim

```
MIT License

Copyright (c) 2026 arknow91

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
