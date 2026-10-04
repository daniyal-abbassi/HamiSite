# Category vitrine verification

**Date:** 2026-10-05
**Build:** current `Hami-v3` checkout, production build served at `http://localhost:3000`
**Scope:** functional and layout checks for the nine-panel category carousel. The owner-approved scope amendment is recorded in [`../owner-approval-2026-10-05.md`](../owner-approval-2026-10-05.md).

## Results

- `npm run build`: passed. `npm run typecheck`: passed. `git diff --check`: passed.
- Focused unit suite (`category-carousel.test.ts`, `category-departments.test.ts`): 18/18 passed.
- At 360, 390, and 1280 CSS pixels: nine department links render, no product counts appear, exactly one link has `tabindex=0`, and document width matches the viewport.
- At 360px, a touch-input browser run advanced through all nine panels, one panel per swipe. Ten vertical swipes over the carousel advanced document scroll on all ten attempts.
- Keyboard check at 360px: RTL `ArrowLeft` advances, Home and End focus the first and ninth links, one tab stop remains, and the focused card shows a 3px solid outline.
- With JavaScript disabled, all nine server-rendered links remain present with their category destinations.
- Production layout check at 360px: the category section is 696px tall at the same document offset before and after hydration. Full document height was 11,603px without JavaScript and 11,604px with JavaScript (0.009% difference). Observed CLS after hydration was 0.0034. The initial LCP element was the hero image above the category section; the category panel did not become LCP.
- Reduced-motion CSS uses the site's global 0.01ms transition floor; content remains visible and carousel movement is gesture-driven rather than automatic.
- All nine local image URLs return HTTP 200. The source measurements and owner-approved exceptions are recorded in [`../asset-audit.md`](../asset-audit.md).

## Owner-approved exceptions and historical comparison

The owner approved the current nine-panel set, waived the specified image format/dimension and luminance floors, accepted the missing cream mark and current panel content, and approved the redesign's measured page-height change. The exact scope is in [`../owner-approval-2026-10-05.md`](../owner-approval-2026-10-05.md).

Compared with commit `b50ef10`, no-JavaScript document heights at 360/390/1280px were 12,207/12,109/12,807px before and 11,603/11,497/12,246px after (−4.95/−5.05/−4.38%). The former ±2% target is superseded for this redesign; these are measured deltas, not a pass against that target. Existing browser checks verify the section is not pinned and hydration adds no spacer.

All remaining functional, routing, accessibility, label-contrast, LCP, and layout-shift checks pass as recorded above. The approval applies only to the current assets and implementation; replacements require review.
