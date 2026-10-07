# Feature Specification: Homepage Discounted Products

**Feature**: `020-homepage-discounted-products`
**Status**: Approved by owner request — 2026-10-07
**Input**: Integrate the owner-supplied `assets/NEW-STYLE/محصولات تخفیف دار/pixel-perfect-design-implementation (1)/` section into the existing homepage.

## Objective

Rebuild the homepage discount section to match the supplied `DealsSection.tsx` composition closely: a compact centered luxury panel with ambient glows and sparkles, a split campaign header, one large featured deal, and a two-column grid of horizontal compact deals. Keep product facts and purchase actions connected to the live store.

## Requirements

- Match the supplied section's hierarchy and proportions: outer 1280px inset section, rounded burgundy glass panel, thin gold border, ambient upper-right/bottom-left glows and positioned sparkles, header copy and right-side campaign summary, 12-column featured-plus-supporting grid, vertical feature card, and horizontal 38%-image supporting cards.
- Match the source's gold/burgundy labels, badges, large featured price/CTA, compact prices and circular cart controls, hover lift, and responsive breakpoints. Use the supplied silk image as the panel art, with a dark burgundy overlay.
- Render only products/variants with a real positive `compareAtPrice` above the current price and that are currently purchasable.
- For products with variants, choose a real discounted, purchasable variant as the initial selection; keep normal color/variant selection and exact variant cart behavior.
- Use catalog product images and product detail routes. Do not use mock deals, sample product photos/prices, simulated countdowns, sold/remaining counts, perks, limited-time claims, or fake cart state from the Vite reference. Replace the unsupported countdown area with real section summary metrics, and replace the fake sold-stock bar with a bar derived from each real discount.
- Keep the section useful when there are no qualifying discounts: omit the section instead of inventing offers.
- Place it immediately after the newest-products shelf. Keep the layout responsive and honor reduced-motion preferences.

## Success Criteria

1. The homepage section visibly matches the supplied panel, header, featured card, compact-card, badge, and CTA composition at desktop and mobile widths.
2. Every shown item has a real positive price reduction and is currently purchasable; variant-level items start on a purchasable discounted variant.
3. Product links, color selection, displayed price/discount, and add-to-cart variant use the live product records.
4. Mock deadlines, limited-time claims, sold/remaining counts, perks, image, price, and cart data are absent.
5. Typecheck and `git diff --check` pass; graphify is updated.

## Verification

- `npm run typecheck`
- `git diff --check`
- Review the local homepage at desktop and mobile widths.

## Boundaries

- Always use the database catalog for commerce facts and use the supplied files for visual reference.
- Do not change database schema, product pricing, or add dependencies.
- Do not commit or push.
