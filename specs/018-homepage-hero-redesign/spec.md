# Feature Specification: Homepage Hero Redesign

**Feature**: `018-homepage-hero-redesign` (tracked on the existing `Hami-v3` checkout)
**Created**: 2026-10-06
**Status**: Approved by owner — 2026-10-06
**Input**: User request: use the RAW hero backgrounds and match the desktop and mobile reference images in code.

## Objective

Redesign the storefront homepage hero so its desktop and mobile compositions closely follow the owner-provided reference images. Use `assets/NEW-STYLE/RAW-DESKTOP-BG.png` and `assets/NEW-STYLE/RAW-MOBILE-DISPLAY-BG.png` as the responsive artwork, with live HTML text, links, and trust information layered into the design. Success means the actual page—not a mockup image—has the same light, spacious, oxblood-and-champagne visual direction and the same prominent store scene, headline, actions, and service benefits at both viewport classes.

### Owner feedback follow-up — 2026-10-06

The first local review showed a blank oxblood strip between the navigation and hero art, and the mobile first screen showed almost no live hero content. The hero must begin at the top viewport edge behind the existing fixed navigation, with no separate top color band. On mobile, move the live headline, support copy, and actions up over the open lower/right area of the RAW composition so visitors see the hero message without scrolling past an almost full screen of empty showroom art.

## User Scenarios & Testing

### User Story 1 — A composed desktop introduction (Priority: P1)

A desktop visitor lands on the homepage and sees the store scene on the left and Persian hero copy on the right, with the existing site navigation above it. The hero feels like the desktop reference and offers working paths to the shop and wholesale partnership.

**Independent Test**: Open the homepage at 1440×900 and compare its first screen with `DESKTOP-REFERENCE-STYLE.png`; verify both hero links navigate to `/shop` and `/partners`.

**Acceptance Scenarios**:

1. **Given** a desktop viewport at or above 1024px, **When** the homepage loads, **Then** the RAW desktop artwork fills the hero canvas, the store is framed on the left, and the hero copy is on the right.
2. **Given** the hero is visible, **When** the visitor activates either call to action, **Then** the existing shop or partnership route opens.
3. **Given** the homepage is viewed at 1440×900, **When** compared with the supplied desktop reference, **Then** the hierarchy, alignment, spacing, colors, and major elements read as the same composition.

### User Story 2 — A purpose-built mobile introduction (Priority: P1)

A phone visitor sees the showroom and hero message together in the first screen: the headline, supporting copy, and clear actions sit over the open lower/right area of the RAW composition, followed by compact trust benefits. Text remains legible and no desktop composition is squeezed into the phone width.

**Independent Test**: Open the homepage at 390×844 and compare its visible hero flow with `MOBILE-DISPLAY-REFERENCE-STYLE.png`; verify there is no horizontal overflow and both actions remain usable.

**Acceptance Scenarios**:

1. **Given** a viewport below 768px, **When** the homepage loads, **Then** it uses the RAW mobile artwork and overlays the live copy in the open portion of the composition instead of reserving almost a full image-height above it.
2. **Given** the first mobile viewport, **When** the visitor lands on the page, **Then** the headline, supporting copy, and both calls to action are visible without scrolling past an image-only screen.
3. **Given** the mobile hero, **When** the visitor reads or activates its controls, **Then** Persian RTL text, both working calls to action, and the four verified benefits remain visible in a clear vertical layout.
4. **Given** a viewport from 320px to 767px, **When** the hero renders, **Then** text and controls fit without horizontal scrolling, clipping, or overlap.

## Requirements

### Functional Requirements

- **FR-001**: The homepage hero MUST use the supplied RAW desktop and mobile images as its responsive background artwork; the reference screenshots MUST NOT be used as page backgrounds.
- **FR-002**: The desktop composition MUST place the store scene to the left and hero content to the right, matching the supplied desktop reference.
- **FR-003**: The mobile composition MUST put the store scene before the hero copy and reflow content for narrow screens, matching the supplied mobile reference.
- **FR-004**: Headline, supporting copy, actions, and benefits MUST be live, selectable, accessible content rather than text baked into an image.
- **FR-005**: The calls to action MUST retain the working `/shop` and `/partners` destinations.
- **FR-006**: The hero MUST use right-to-left Persian layout and existing project typography and brand tokens.
- **FR-007**: The global site header, homepage sections following the hero, verified business facts, and their route behavior MUST continue to work.
- **FR-008**: Decorative background images MUST not add redundant announcements to screen readers; meaningful text and controls MUST have accessible names and keyboard focus.
- **FR-009**: The layout MUST avoid horizontal overflow and preserve readable contrast at widths 320px, 390px, 768px, 1024px, and 1440px.
- **FR-010**: On the homepage, the hero background MUST begin at the top viewport edge behind the existing fixed navigation; there MUST NOT be a separate empty oxblood band above the artwork.
- **FR-011**: At mobile widths, the headline, supporting copy, and both actions MUST appear in the initial viewport over the open portion of the RAW mobile art; the copy MUST NOT be pushed below an almost full-height image-only stage.
- **FR-012**: The homepage hero and visible navbar “شروع همکاری” links MUST share an abstract metallic-gold surface and rotating gold light-beam border with dark readable text, retain their `/partners` destination, and stop the animation for users who prefer reduced motion.

### Edge Cases

- At 320px, long Persian words and CTA labels must wrap or fit without clipping.
- With reduced motion enabled, no hero text or control may depend on animation to become visible or usable.
- If an image cannot load, the existing page background and foreground contrast must still leave the live copy readable.
- The RAW mobile and desktop images have different aspect ratios; breakpoint switching must not stretch either asset.

## Technical Context

- **Tech Stack**: Next.js 15 App Router, React, TypeScript, Tailwind CSS, project CSS in `app/(main)/home.css`.
- **Commands**: `npm run dev` for local review; `npm run typecheck` for type validation. `npm run build` rewrites `.next` and requires restarting any running Next server afterward (per `CLAUDE.md`).
- **Project Structure**: Hero markup is in `app/(main)/page.tsx`; homepage styles are in `app/(main)/home.css`; original artwork is in `assets/NEW-STYLE/`.
- **Code Style**: Keep Persian UI RTL, use the project's font and semantic color tokens, use logical CSS properties, and preserve links as Next `Link` components.
- **Testing Strategy**: Review the rendered homepage locally at the listed desktop and mobile widths, check action destinations and overflow, then run `npm run typecheck`. Do not add tests for this visual-only change unless requested.
- **Boundaries**: Always preserve the owner-provided RAW source files and existing route/data behavior. Ask first before adding dependencies or changing app-wide navigation. Never change payment, database, or unrelated homepage sections as part of this hero redesign.

## Success Criteria

- **SC-001**: At 1440×900, the live hero visibly matches the desktop reference's light canvas, left-side shop scene, right-side copy, CTA pair, and trust row.
- **SC-002**: At 390×844, the live hero visibly matches the mobile reference's image-first sequence and compact, readable RTL content flow.
- **SC-003**: At 320px, 390px, 768px, 1024px, and 1440px, there is no horizontal overflow, clipped copy, or overlapping control.
- **SC-004**: Both hero destinations still work, and the existing site header and sections below the hero render normally.
- **SC-005**: `npm run typecheck` passes.
- **SC-006**: At desktop and mobile widths, the artwork visibly continues behind the top navigation with the empty top band removed.
- **SC-007**: At 390×844, the first viewport includes the headline, supporting copy, and both hero actions.

## Assumptions and Open Questions

- The existing global header remains in place; its current implementation supplies the site's desktop and mobile navigation.
- Reference text and service-benefit labels may be implemented as live content. Any claim that cannot be supported by current verified facts should retain the existing verified wording.
- The reference shows pagination dots but supplies only one hero composition. This draft assumes a single hero state and excludes inert, nonfunctional pagination controls.
- The transition point between mobile and desktop compositions may follow existing project breakpoints unless local rendering shows a better fit.
