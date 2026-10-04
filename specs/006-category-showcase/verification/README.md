# Category vitrine verification

**Date:** 2026-10-05
**Build:** current `Hami-v3` checkout, production build served at `http://localhost:3000`
**Scope:** functional and layout checks for the nine-panel category carousel. Asset approval remains a separate hard gate.

## Results

- `npm run build`: passed. `npm run typecheck`: passed. `git diff --check`: passed.
- Focused unit suite (`category-carousel.test.ts`, `category-departments.test.ts`): 18/18 passed.
- At 360, 390, and 1280 CSS pixels: nine department links render, no product counts appear, exactly one link has `tabindex=0`, and document width matches the viewport.
- At 360px, a touch-input browser run advanced through all nine panels, one panel per swipe. Ten vertical swipes over the carousel advanced document scroll on all ten attempts.
- Keyboard check at 360px: RTL `ArrowLeft` advances, Home and End focus the first and ninth links, one tab stop remains, and the focused card shows a 3px solid outline.
- With JavaScript disabled, all nine server-rendered links remain present with their category destinations.
- Production layout check at 360px: the category section is 696px tall at the same document offset before and after hydration. Full document height was 11,603px without JavaScript and 11,604px with JavaScript (0.009% difference). Observed CLS after hydration was 0.0034. The initial LCP element was the hero image above the category section; the category panel did not become LCP.
- Reduced-motion CSS uses the site's global 0.01ms transition floor; content remains visible and carousel movement is gesture-driven rather than automatic.
- All nine local image URLs return HTTP 200. This does not imply that the supplied sources satisfy the visual asset floors.

## Remaining acceptance blockers

- `HamiSite-basic-structure-hvr.3.3` remains blocked. The 2026-10-04 [`asset-audit.md`](../asset-audit.md) records that seven supplied images are below the required 1086×1448 PNG floor, four images fail the subject-band luminance floor, and `public/brand/hami-mark-cream-alpha.png` is missing. No upscaling, recoloring, or substitute mark was used.
- The panel-by-panel trade-dress review (SC-021) still needs an owner/reviewer pass. Label contrast (SC-018) is covered by the measurements in `asset-audit.md`.
- `HamiSite-basic-structure-hvr.3.4` cannot close until the asset task is resolved. Homepage integration remains in its existing position. The current run verifies no JavaScript-induced spacer or meaningful height change; no pre-change total-page-height capture exists, so no historical ±2% comparison is claimed.

## Resume criteria

Supply nine owner-approved 3:4 PNG panels at least 1086×1448 that meet FR-081 and FR-083, plus the transparent cream Hami mark at the specified resolution, or approve a written revision to those requirements. Then complete `.3.3`, perform the independent trade-dress review, and rerun `.3.4`'s responsive, accessibility, LCP, layout-shift, and scroll-height gates.
