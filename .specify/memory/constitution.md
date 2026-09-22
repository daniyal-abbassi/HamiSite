<!--

Sync Impact Report
==================

Version change: 1.0.0 → 1.1.0

Primary change:
- Expanded Principle IV to establish a binding premium/luxury visual direction.
- Added explicit requirements for a "million-dollar" perceived design quality:
  restrained luxury, cinematic presentation, editorial composition, premium
  technology-brand polish, intentional visual hierarchy, and exceptional
  attention to detail.
- Expanded Definition of Done so visual quality is part of completion, not
  merely type/build correctness.
- Added a visual-quality constraint requiring frontend decisions to feel
  intentionally designed rather than template-driven or generic e-commerce.
- No fixed colors, fonts, radii, spacing scales, or motion curves were made
  authoritative. The constitution governs the quality bar, not a rigid design
  system.

-->

# Hami Hamrah Shop Constitution

## Core Principles

### I. Honest Interface

The UI MUST NOT assert anything the available data cannot support: stock status,
price, discount, product imagery, specifications, contact details, or any claim of
endorsement or certification.

* An unknown or unrecognised stock state MUST render as «تماس بگیرید», never as in-stock.
* Missing data MUST stay visibly missing. It MUST NOT be filled with a plausible
  placeholder, a stock photograph, or an assumed value.
* The verified facts in `lib/content/contact.ts` are the only contact details the UI
  may render.

Rationale: this storefront carries a twenty-year in-person reputation in Mashhad. A
fabricated "in stock" or an invented address is not a cosmetic mockup defect — it is
a false statement to a customer.

### II. Persian RTL by Default

`lang="fa"` and `dir="rtl"` define the primary experience, not a translation layer
applied afterwards to an English original.

* Layout MUST use logical CSS properties (`start`/`end`, `ms`/`me`, `ps`/`pe`) rather
  than physical `left`/`right`.
* Prices and quantities MUST render with Persian numerals under the `fa-IR` locale.
* Copy MUST be Persian first. Latin lettering is acceptable as decorative or archival
  labelling, but MUST NOT be the only route to understanding a control.

### III. Static Data Seam

Shopper-visible catalog data — products, brands, categories, prices, images — MUST come
from `data/*.json` through `lib/catalog.ts`. Browsing MUST NOT require a database
connection or an API round-trip.

* `lib/catalog.ts` MUST keep its response shape compatible with the existing
  `/api/products` output, so a live source can replace the export without editing any
  consumer component.
* Auth, cart, checkout, payments, and the admin back office are out of scope for this
  revision. They MUST keep working as they are and MUST NOT be modified to unblock a
  frontend decision.
* Where an out-of-scope flow cannot complete against static data, the UI MUST render an
  honest unavailable state rather than imitate success.

Rationale: catalog ids in the export do not match database rows, so add-to-cart and
checkout are unverified against this data source. Presenting them as working would hide
a real defect inside a demo.

### IV. Design Is Open — Luxury Is the Quality Bar

Every color, layout, font, radius, spacing value, and animation currently in this
repository is a temporary draft. Frontend work MAY discard and rebuild any of it
without justification.

However, while the implementation is open, the **quality target is not**.

The Hami Hamrah storefront MUST feel like a **premium, luxury technology brand** rather
than a conventional online shop. The intended perception is a **million-dollar
digital experience**: refined, confident, cinematic, distinctive, deliberate, and
visually expensive.

This quality bar means:

* The design MUST communicate luxury through composition, typography, imagery,
  proportion, whitespace, hierarchy, motion, and interaction — not through excessive
  decoration, gradients, glow effects, or generic "luxury" styling.
* The interface SHOULD feel closer to a world-class technology or luxury brand launch
  experience than to a marketplace template.
* Visual hierarchy MUST be intentional. Primary products, campaigns, categories,
  brands, and calls to action MUST receive deliberate visual emphasis rather than
  being displayed as a uniform grid of generic cards.
* Product presentation MUST feel editorial and premium. Products SHOULD be treated as
  hero objects and brand assets, not merely database records inside repetitive cards.
* Photography, video, 3D assets, motion, depth, layering, and interactive details MAY
  be used when they materially improve the experience and support the brand narrative.
  They MUST feel controlled and purposeful rather than ornamental.
* Interactions, hover states, transitions, loading states, empty states, and responsive
  behavior MUST receive the same level of design attention as static layouts.
* The design MUST avoid the visual language of generic dashboards, template shops,
  low-cost marketplaces, or component-library demos unless a component is explicitly
  justified by the brand experience.
* Repetition MUST be controlled. Reusing components is encouraged, but the resulting
  interface MUST NOT feel visually repetitive or mechanically generated.
* Mobile MUST preserve the premium perception. Responsive behavior MUST be designed,
  not merely compressed from desktop.
* Brand presence MUST be coherent and memorable. The Hami Hamrah identity should be
  recognizable through the experience even before a user consciously reads the logo.
* Every visible element MUST earn its place. Removing an element and improving the
  composition is preferable to adding decoration for perceived complexity.
* "Premium" MUST be expressed through restraint, precision, confidence, and quality of
  execution rather than visual excess.

No existing visual decision is authoritative.

* `DESIGN.md` and `docs/design-system.md` MUST NOT be treated as overrides of this
  freedom. They are reference material, and where they assert a visual value they are
  known to disagree with the shipped code.
* The one binding visual requirement is internal consistency: a chosen treatment is
  applied uniformly across the surfaces it covers, rather than mixed with the draft it
  replaced.
* A visually impressive result is preferred over preserving an existing implementation
  when the existing implementation materially reduces the perceived quality of the
  storefront.
* Claude MUST use its own design judgment to create a cohesive premium art direction
  from the available assets rather than mechanically reproducing inspiration files.

Rationale: Hami Hamrah is not intended to look like another commodity e-commerce
storefront. The frontend is part of the brand itself. The implementation may change
freely, but the perceived level of craftsmanship must remain exceptionally high.

## Constraints

* Stack: Next.js App Router, TypeScript, Tailwind CSS.
* Everything under `docs/inspires/` is inspiration only. It MUST NOT be installed,
  built, or run, and its data layer and auth model MUST NOT be ported into this app.
  Keep it excluded from the root `tsconfig.json`.
* Prefer editing an existing component over introducing a new abstraction or a new
  dependency.
* New visual systems, components, illustrations, motion, 3D elements, or interaction
  patterns MAY be introduced when they materially improve the premium experience.
* The frontend MUST NOT settle for a generic storefront template merely because it is
  faster to implement.
* Design decisions SHOULD be evaluated against the question:
  **"Does this feel intentionally crafted for a premium technology brand, or does it
  look like a default e-commerce implementation?"**
* Reference websites, screenshots, inspiration files, libraries, and existing code are
  inputs for creative direction, NOT constraints on the final visual language.
* The final result SHOULD feel cohesive enough that individual pages appear to belong
  to the same high-end brand system.

## Definition of Done

A frontend change is complete only when all of the following hold:

* `npm run typecheck` and `npm run build` pass clean.
* The change is confirmed in a real browser. An HTML response with status 200 is not
  proof of a working page: the client chunks MUST be verified to load, otherwise React
  never hydrates and the page is inert.
* The layout holds at both mobile and desktop widths.
* The experience preserves Persian RTL correctness and does not introduce visual
  regressions caused by RTL behavior.
* The implementation does not introduce fabricated product, pricing, stock, or contact
  information.
* The resulting UI feels intentionally art-directed and premium rather than generic,
  template-driven, or merely functional.
* Major surfaces MUST demonstrate clear visual hierarchy, deliberate spacing,
  sophisticated composition, and a consistent brand language.
* Motion, interaction, responsive behavior, and component states MUST feel considered
  rather than incidental.
* The finished result MUST be judged as a complete branded experience, not a collection
  of technically correct components.
* A page that works correctly but looks ordinary, generic, unfinished, or visually
  cheap is NOT considered complete.

## Governance

This constitution outranks all other guidance for frontend work.

Where this document is silent, an agent MUST exercise its own judgment and proceed. It
MUST NOT stall waiting for a rule to be written. This document is deliberately brief,
and its silence is permission, not a gap.

Amendment procedure:

1. Edit `.specify/memory/constitution.md` and state the reason for each changed
   principle.
2. Bump the version. MAJOR removes or incompatibly redefines a principle; MINOR adds a
   principle or materially expands guidance; PATCH clarifies wording only.
3. Update **Last Amended** in the footer.
4. Obtain owner approval before committing the amended file.

Compliance review: every pull request touching frontend code is checked against
Principles I–IV. A deviation is acceptable when justified in the PR description —
except Principle I, which has no exception path.

Runtime guidance: `CLAUDE.md` stays useful for operational mechanics — dev-server and
build traps, database safety, tooling. It is subordinate to this document, and any
visual authority it claims (including describing `docs/inspires/` as a brand-design
source of truth) is superseded by Principle IV.

**Version**: 1.1.0 | **Ratified**: 2026-09-20 | **Last Amended**: 2026-09-20
