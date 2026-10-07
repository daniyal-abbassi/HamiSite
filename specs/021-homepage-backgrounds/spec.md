# Feature Specification: Homepage Lower Section Backgrounds

**Feature**: `021-homepage-backgrounds`
**Status**: In progress per owner request — 2026-10-07

## Objective

Give every homepage section from `#obtainable-now` through the closing `AssemblyBand` a background that suits its content and the Hami Hamrah visual identity. The current backgrounds below the discounted shelf feel inconsistent with the hero and with each other.

## Assumptions

1. The scope is the seven rendered section roots: `obtainable-now`, `categories`, `brands`, `new-arrivals`, `b2b`, `online-services`, and `store-experience` (the closing experience/trust/CTA composition).
2. Keep the existing layouts, copy, product data, and section order. Change background artwork and only the local contrast styling needed to keep content readable.
3. Use a separate horizontal, background-only image for each section. Use the user's ChatGPT download for the first section and AI Bridge Up images for the other six. Images contain no text, logos, product renders, or UI, and their focal details remain readable after narrow mobile crops.
4. Use a coherent oxblood/burgundy, champagne, and warm ivory palette, alternating dark and light sections to give the scroll a clear rhythm.

## Requirements

- Assign seven distinct wide image assets, one per section, with low-detail mobile-safe areas behind headings and content.
- Keep the product rails and category/brand art legible against their section canvases.
- Make backgrounds full-bleed, responsive, and cropped intentionally at desktop and mobile widths.
- Keep a CSS fallback ground for every image and avoid adding runtime image dependencies.
- Preserve reduced-motion behavior and all existing section content and interactions.

## Commands

- Development: `npm run dev`
- Typecheck: `npm run typecheck`
- Diff validation: `git diff --check`

## Project Structure

- `public/images/shapes/` — user-downloaded source, four newly captured AI Bridge PNG sources, and seven optimized section-specific WebP images. The two earlier AI Bridge images were optimized directly to WebP.
- `components/home/*.tsx` — homepage section roots and content.
- `app/(main)/home.css` and component-local stylesheets — section canvas and contrast rules.
- `specs/021-homepage-backgrounds/` — this specification and implementation plan.

## Code Style

Use section-ID-scoped CSS and public image paths; keep the generated source and optimized derivative in `public/images/shapes/`.

```css
#obtainable-now {
  background-color: #32020e;
  background-image: url("/images/shapes/hami-burgundy-silk.webp");
  background-position: center;
  background-size: cover;
}
```

## Verification Strategy

- Run `npm run typecheck` and `git diff --check`.
- Inspect the homepage section sequence at desktop and mobile widths, confirming no section loses contrast, image, or content.
- Confirm every referenced public image exists and has a CSS fallback.

## Boundaries

- Always preserve product and category data, section order, and interactions.
- Do not add dependencies, alter the database, or replace existing content with generated text.
- Do not commit or push.

## Success Criteria

1. All seven in-scope sections use distinct section-appropriate backgrounds from the user-supplied image and AI Bridge outputs, with contrast-safe treatments.
2. The background sequence reads as one brand system with visible dark/light pacing.
3. Headings, descriptions, controls, product cards, and artwork remain readable at desktop and mobile widths.
4. Typecheck and diff validation pass.

## External Dependency

The user generated and downloaded the first ChatGPT image to `public/images/shapes/`. AI Bridge generated the other six section images using the newly signed-in Chrome profile on CDP port 9225. For three of the four recent image requests, the local bridge timed out after the generated image appeared in ChatGPT; the images were captured from the authenticated browser and optimized successfully. All seven sections now use separate user/AI artwork.
