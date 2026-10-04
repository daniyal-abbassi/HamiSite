# Implementation plan: Category Vitrine

**Status:** approved direction, implementation plan. The owner chose option B in `spec.md`: dark, framed panels on the existing paper band. Beads is the task tracker; `tasks.md` indexes its issues.

## Outcome

Replace the current Feature 010 masonry category chapter with the nine-department vitrine defined in `spec.md`, while preserving server-rendered working links, accessible keyboard navigation, vertical page scrolling, and existing department destinations. Counts leave the rendered experience. This plan does not change catalog eligibility or routes.

## Current state and constraints

- `CategoryHub` currently renders a server component wrapped by `CategoryArrival`, with a CSS masonry list and visible counts.
- `lib/category-departments-db.ts` supplies department data; `lib/category-departments.ts` defines the static shape/derivation and existing tests.
- Nine files are present under `public/images/categories/v3/`. Two are 1086×1448 PNGs; seven are 896×1200 JPEGs, below FR-080 and with different extensions from the drop-in convention.
- The specified transparent cream mark `public/brand/hami-mark-cream-alpha.png` is absent. Do not fabricate the mark or silently ship an opaque/low-contrast substitute. Treat it as an asset gate unless the existing mark can be converted without changing its geometry and the measured rendered size is adequate.
- `app/(main)/page.tsx` already renders `CategoryHub`; integration should preserve that position and avoid unrelated homepage changes.
- Embla is already a project dependency. Do not add a second carousel library or capture vertical wheel/touch input.

## Design and implementation choices

1. Keep `CategoryHub` a server component and server-render all nine destination anchors in reading order. The client boundary owns only carousel behavior.
2. Remove `showsCount`, `reachableCount`, count descriptions, and count DOM from the category presentation. Keep any underlying data still required by route/department derivation.
3. Implement a mobile-first, horizontal, RTL Embla strip with the CSS fallback usable without hydration. Keep the next panel visibly peeking; cap a touch flick to one or two panels; allow vertical gesture escape.
4. Preserve one keyboard tab stop with roving focus, RTL reading-order arrows, Home/End, focus-visible controls, and correct focus after resize/reinitialization. Reduced motion removes inertia/transitions.
5. Use one frame system from existing `.band-paper` tokens. Keep category panel styles in `components/home/category-carousel.css`; do not edit `home.css` for this feature.
6. Validate every final asset's dimensions, subject-band luminance, text contrast, and prohibited content. Keep the homepage LCP element unchanged and verify no added layout shift or scroll spacer.

## Delivery phases

1. **Contract and fallback:** remove count presentation and establish tests for the nine server-rendered links, names, destinations, and no-count output.
2. **Carousel behavior:** add the vitrine strip and keyboard/touch/resize/reduced-motion behavior behind the server-rendered list; preserve vertical scrolling and no-JS usability.
3. **Panels and frame:** install conforming assets, add the token-based frame/label/mark treatment, and collect per-image evidence. The cream mark is an explicit dependency.
4. **Integration and verification:** confirm homepage position and LCP, test 360/390/1280 behavior, check keyboard and no-JS output, compare scroll height and layout shift, and update graphify.

## Acceptance gates

- All requirements FR-065–FR-083 and success criteria SC-016–SC-023 in `spec.md` pass, or an explicitly owner-approved spec revision records why a criterion changed.
- Automated unit/API tests use the isolated `.env.test` target. Browser checks use the local app and do not create orders or touch production data.
- No claim of image contrast, luminance, responsiveness, or accessibility is made without recorded measurement/evidence.
- Before landing, run focused tests, `npm run typecheck`, `git diff --check`, and `graphify update .`; do not run a production build while the documented dev-server process is active.

## Risks and open dependency

The image files currently miss the specified dimensions/formats and the cream mark is missing. Image preparation may use only the supplied art without inventing content or changing product identity. If the mark cannot be faithfully derived from an existing transparent source, request the exact approved mark from the owner before calling the visual feature complete.
