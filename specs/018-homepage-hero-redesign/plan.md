# Implementation Plan: Homepage Hero Redesign

**Branch**: `Hami-v3` (`018-homepage-hero-redesign`) | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the existing homepage hero's separate showroom card, rotating headline, and brand strip with a full-width editorial hero built around the supplied RAW desktop and mobile artwork. Keep its copy and controls live, use the approved destinations and merchant facts, and let the composition change from an image-first stack on phones/tablets to the left-scene/right-copy arrangement on desktop. The existing fixed header and the rest of the homepage remain in place.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15 App Router, React 19
**Primary Dependencies**: Existing Tailwind CSS 3, Lucide icons, Next `Link`; no new dependencies
**Storage**: N/A
**Testing**: `npm run typecheck`, `npm run build`, and rendered local browser review at 320, 390, 768, 1024, and 1440 CSS pixels
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: Next.js storefront
**Performance Goals**: Load only the breakpoint-appropriate hero background; do not mount a second hidden artwork image
**Constraints**: Preserve the owner's RAW files, no database/API changes, no invented business claims, RTL and reduced-motion support, and the live routes `/shop` and `/partners`
**Scale/Scope**: One homepage section, its bespoke stylesheet rules, and the feature's Spec Kit records

## Constitution Check

| Principle | Status | Application to this feature |
|---|---|---|
| I. Honest Interface | Pass with content guard | Use only `trustFacts` and `storeWarranty`; do not adopt unsupported promotional wording embedded in the reference. Preserve the current copy's human-quoted price condition. |
| II. Persian RTL by Default | Pass | Keep document RTL, logical CSS, Persian copy/digits, and visible keyboard focus. |
| III. Storefront data seam | Pass | No API, catalog, database, or data-loading changes. |
| IV. Design Is Open | Pass | Treat the owner-approved references as the visual target, but build a composed responsive interface from the RAW images and live content rather than rendering the screenshot as a flat image. |

**Re-check after design**: The hero becomes one dedicated ivory/paper chapter. Its full-width boundary is explicit; the fixed background progression and following dark/paper sections stay untouched. This fits the recorded preference for distinct section canvases and avoids blending the hero image into later chapters.

## Architecture Decisions

1. **Keep the existing `Hero` function in `app/(main)/page.tsx`.** The change is local and does not need a new component boundary or dependency.
2. **Use CSS media-query background images from the existing RAW files.** This preserves the originals, gives the mobile art direction its own asset, and lets the browser fetch only the matching image. The Next build will be the verification for CSS asset resolution.
3. **Use 1024px as the two-column threshold.** The narrow composition and tall art continue through tablet widths so the headline and scene are not compressed into an unusable split; desktop targets at and above 1024px use the wide image and right-side copy.
4. **Retain the `top` anchor and page order.** Scope a zero top-padding override to `<main>` only when it directly contains the homepage hero, so the RAW artwork begins at the top viewport edge behind the existing header. Keep enough hero top padding for the fixed header controls and preserve normal top spacing on every other route.
5. **Keep a single static hero state.** The reference provides one composition; remove the rotating word and do not add inert slide indicators.
6. **Use four supported trust facts in the reference's compact benefit row.** Derive these from `trustFacts`; use `storeWarranty.label` only where the wording stays clear that it is a company warranty, not a product-specific guarantee.
7. **Remove the hero-only showroom card and brand strip from this section.** The RAW image replaces the separate second showroom picture, and the homepage still presents brands in `BrandShowcase`.
8. **Compose the mobile first screen instead of stacking a full image stage.** Shorten the mobile art-only grid row and place the live copy over the lower/right open portion of the background. Set the mobile section minimum from the art aspect ratio plus content height so the first viewport reaches the actions without scrolling past an empty image screen.

## Project Structure

```text
app/(main)/page.tsx                         # Replace Hero composition; retain Homepage section order
app/(main)/home.css                         # Hero art, canvas, desktop/mobile layout, and reduced-motion styles
assets/NEW-STYLE/RAW-DESKTOP-BG.png          # Existing source artwork (read only)
assets/NEW-STYLE/RAW-MOBILE-DISPLAY-BG.png   # Existing source artwork (read only)
specs/018-homepage-hero-redesign/            # Specification, plan, research, quickstart, and task index
```

**Structure Decision**: Reuse the existing homepage component and stylesheet; keep original image files where the owner placed them. Speckit paths are scoped to feature `018-homepage-hero-redesign`, even though `.specify/feature.json` previously pointed to feature 017.

## Task List

Tasks are tracked in Beads under `HamiSite-basic-structure-9uo`, per the repository's task-tracker instruction. Phase 3 will create one Beads task per implementation slice and write `tasks.md` as an ordered index, not as a duplicate checklist.

## Verification Checkpoints

1. **After markup and styles**: Inspect at 320, 390, 768, 1024, and 1440px. Confirm the hero art begins behind the header, mobile headline/copy/actions appear in the first viewport, the active RAW asset and focal position are correct, RTL content has no clipping/overflow, and CTA destinations work.
2. **Before completion**: Run `npm run typecheck` and `npm run build`; then inspect the real local browser render and confirm its client chunks load. Follow `CLAUDE.md`'s rule to restart a Next dev server if a build rewrites `.next` beneath it.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| CSS import resolution for the assets directory | Background may not be emitted by Next | Keep assets as relative CSS URLs and verify the production build and rendered network requests before sign-off. |
| Wide desktop art is cropped at intermediate widths | Store focal point or copy field may be lost | Use the mobile composition through 1023px; tune background position and section height at 1024/1440 after browser review. |
| Background contains generated sign text | Some letters inside the scene are imperfect | The owner confirmed the image is coordinated; keep it as artwork, and keep functional labels and copy as real HTML. |
| Four long trust facts crowd the mobile row | Copy may wrap poorly or overlap | Use compact two-column wrapping on narrow screens, then four inline items on wider screens; preserve complete Persian labels. |
| A visual fix breaks the page-ground sequence | Next chapter may blend into the hero | Keep the hero's paper canvas bounded to `#top` and do not change `PageGround` or the progression anchors. |
| Reference contains claims the source data cannot prove | The hero would mislead shoppers | Use only merchant-approved facts from `lib/content/verified-facts.ts`; keep the existing copy's live-price caveat. |

## Open Questions

- None required to begin implementation. The 1024px composition breakpoint and the four-fact row are the planned responsive decisions; the owner can still adjust them during plan review.
