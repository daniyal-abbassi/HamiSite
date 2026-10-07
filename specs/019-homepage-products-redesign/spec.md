# Feature Specification: Homepage Products Section Redesign

**Feature**: `019-homepage-products-redesign`
**Created**: 2026-10-06
**Status**: Approved by owner request — 2026-10-06
**Input**: Port the visual design from `assets/NEW-STYLE/SHOP SECTION/pixel-perfect-design-implementation/` and match `assets/NEW-STYLE/SHOP SECTION/REFERENCE.png`, using the sibling `Luxe Burgundy Flowing Waves.png` artwork; update per owner feedback for real latest products, real selectable variants, fully visible product photos, and discount labels.

## Objective

Port the supplied shop-section design into the homepage products shelf, then adapt it to owner feedback so the burgundy showroom canvas shares the Hero's ivory architectural language. The shelf is a latest-products showcase backed by real live catalog records. Variant color selection must update the chosen variant's price and cart line. Product images stay fully visible, with discount badges derived from real compare-at pricing.

## User Scenario

A shopper reaches the latest products section and sees a continuous visual transition from the Hero into an ivory-accented burgundy showroom, real recently updated products, blush cards, working favorites, selectable real color variants, and carousel navigation. Catalog facts and cart actions continue to come from the store, not the reference project's mock product data.

## Requirements

- **FR-001**: Use the burgundy-dominant generated background saved in `SHOP SECTION/ChatGPT Image Oct 6, 2026, 11_57_03 PM.png`; keep burgundy as the main canvas and use ivory showroom lighting only as perimeter accents.
- **FR-002**: Keep the RTL heading and blush cards with badges/favorites/color swatches and carousel arrow/dots. Do not show a breadcrumb, brand eyebrow, catalog count/availability copy, or filter toolbar on the homepage.
- **FR-003**: Preserve real server-rendered catalog data, product detail links, add-to-cart controls, and the `/shop` link. Do not port placeholder prices, stock claims, or fake cart state from the reference implementation.
- **FR-004**: Match the source carousel dimensions and swipe behavior at desktop and mobile without horizontal page overflow.
- **FR-005**: Keep Persian content RTL, keyboard interaction, and visible focus indication.
- **FR-006**: Keep the central canvas visually quiet behind live content and preserve the blush cards as the light contrast surface.
- **FR-007**: Make the Hero-to-products transition feel intentional: fade the Hero's final bright floor into burgundy and pick up its showroom curves in the burgundy section artwork; do not use scroll-linked color blending or forced scroll snapping.
- **FR-008**: Use a smaller decorative Persian slogan with the existing Nastaliq font, and place the “مشاهده فروشگاه” call to action after the product carousel and pagination.
- **FR-009**: Name the section and its heading “جدیدترین محصولات”; populate it with globally newest real catalog products, sorted by the catalog's recency comparator rather than a single brand or default availability order.
- **FR-010**: For products with real color variants, render accessible clickable color controls. Selecting a color selects the corresponding real variant and updates its price, comparison price/discount, image when variant-specific media exists, availability, and add-to-cart variant ID. Prefer the database image relation; when it is absent, use only an explicit `image_url` from the catalog snapshot matched by product slug and variant color/storage. Do not infer images from color labels or gallery order. Keep each product's real route and cart contract.
- **FR-011**: Show product photographs fully inside the image area with contain sizing and visual inset so the complete device/accessory remains visible.
- **FR-012**: Show a compact top-left discount badge only when the selected variant (or the product when there are no variants) has a real comparison price above its selling price. The badge amount is derived from that price pair; do not infer discounts from offer flags.
- **FR-013**: The featured card's image stage uses a clean white ground that matches the catalog photographs. Keep images uncropped with `contain` sizing and no extra inner padding that makes the photographed item appear undersized; retain a subtle, legible out-of-stock overlay.

## Commands and Verification

- Typecheck: `npm run typecheck`
- Diff hygiene: `git diff --check`
- Visual review: compare local desktop and mobile renders with `assets/NEW-STYLE/SHOP SECTION/REFERENCE.png` and its supplied implementation.

## Project Structure

- `components/home/FeaturedProducts.tsx` — section composition, catalog filtering, carousel state.
- `components/shop/ProductRail.tsx` — responsive carousel row and pagination.
- `components/shop/ProductCard.tsx` — source-matched card visuals connected to real product data and cart behavior.
- `app/(main)/home.css` — section-specific responsive styling.
- `public/store/` — source background and applicable design imagery.

## Boundaries

- Always preserve real product data and working commerce actions; the supplied app is a visual source, not a data source.
- Ask first before changing product sourcing, routes, or adding dependencies.
- Never use the full-page screenshot as a background in place of live UI.

## Success Criteria

1. The homepage products section's burgundy showroom canvas shares the Hero's ivory curves and has a deliberate visual join.
2. Breadcrumb, filter controls, “BRAND”, product count, and stock/pricing explainer are absent; the smaller Nastaliq slogan remains.
3. Heading and section semantics identify “جدیدترین محصولات”, with real globally newest items from the catalog.
4. Changing a real color swatch updates the selected variant's price and add-to-cart variant; accessible selected state is visible.
5. Every featured product image is fully visible at a natural scale on a white stage, and discounted variants display a compact top-left badge with their derived discount.
6. The “مشاهده فروشگاه” link is the final section control after cards and pagination.
7. Catalog names, prices, availability, links, and add-to-cart actions remain backed by the real store data and behavior.
8. Burgundy dominates the section background, ivory remains a perimeter highlight, and the transition from the ivory Hero feels deliberate rather than abrupt.
9. Typecheck and diff hygiene pass.
