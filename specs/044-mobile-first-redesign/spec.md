# Feature Specification: Mobile-First First-Screen Redesign

**Feature Branch**: `044-mobile-first-redesign`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: «برای نمای موبایل می‌خوام فرانت اند این شکلی باشه — عکس‌های خالی (پس‌زمینه) رو برات آپلود کردم؛ همچنین عکس واقعی فروشگاه؛ عکس‌های لوگو هم در دایرکتوری موجود هستند» — with the owner-approved mockup at `mockups/mobile-home-design.png`, the supplied background artwork at `mockups/background-mobile-silk.png` and `mockups/banner-silk-wide.png`, the approved real store photograph already in the project's public store imagery (`public/store/shop-ai-relight.png`), and the official logo set already under the project's brand assets.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The first screen tells the whole brand story in one view (Priority: P1)

A shopper opens the storefront on a phone (390×844). Without scrolling, they see — composed over the branded silk-wave background exactly as in the approved mockup — the deep-oxblood brand header carrying the shop's own logo and its actions, the Telegram channel strip beneath it, a hero that pairs the real store photograph with the shop name and its wholesale-and-retail proposition, two clear calls to action, and a 2×2 grid of trust facts with outlined circular icons.

**Why this priority**: This is the core of the feature. The mobile first screen is the storefront's face; today it reads as a compressed desktop layout. The owner has approved a specific composition, and everything else in this feature exists to serve it.

**Independent Test**: Can be fully tested by loading the home page at 390×844 and comparing the first screen against the approved mockup, then tapping each call to action — delivers a complete, self-contained brand first impression.

**Acceptance Scenarios**:

1. **Given** a 390×844 phone viewport, **When** the home page finishes loading, **Then** the header, channel strip, hero photograph, headline, both calls to action, and the trust-facts block are all visible without scrolling, arranged as in the approved mockup.
2. **Given** the loaded first screen, **When** the shopper taps «مشاهده محصولات», **Then** they reach the shop listing; **When** they tap «شروع همکاری», **Then** they reach the partnership page.
3. **Given** the loaded first screen, **When** the shopper taps the header's category action, **Then** the category menu opens over the content and closes again, as it does today after the 2026-10-25 repair.

---

### User Story 2 - The real shop, not a render (Priority: P2)

The hero photograph is the actual Mashhad store interior — the approved photograph the owner supplied — treated as a hero object with a deliberate rounded composition beside the headline, exactly as in the mockup, rather than the current stylized scene.

**Why this priority**: The photograph is the honesty anchor of the first screen: it shows the shopper the real shop they are invited to visit. It is second only to the overall composition because the composition can be judged with any image, but the trust effect depends on this one.

**Independent Test**: Can be fully tested by loading the page on a throttled connection and observing that the photograph's space is reserved before it appears, then verifying the loaded photograph fills its frame without distortion or cropping surprises.

**Acceptance Scenarios**:

1. **Given** a slow network, **When** the store photograph has not yet loaded, **Then** its space is fully reserved and nothing on the first screen shifts or jumps.
2. **Given** the loaded photograph, **When** the shopper views the hero, **Then** the image fills its frame at the intended rounded shape without stretching or awkward cropping.

---

### User Story 3 - The branded background carries the whole page (Priority: P3)

The owner-supplied silk-wave artwork becomes the homepage's background system: the tall mobile variant under the mobile first screen and section flow, the wide banner variant where it materially improves desktop or a section band. Content sits on it cleanly at every width.

**Why this priority**: The background is what makes the redesign feel art-directed rather than skinned-on, but it can only be fully judged once stories 1–2 exist.

**Independent Test**: Can be fully tested by scrolling the entire homepage at mobile and desktop widths and checking every section for legibility and contrast over the artwork.

**Acceptance Scenarios**:

1. **Given** the homepage at 390×844, **When** the shopper scrolls through all sections, **Then** every section remains fully legible over the background artwork, with no text overlapping text and no contrast failure.
2. **Given** the desktop width, **When** the homepage loads, **Then** the background system reads as one coherent brand surface with the content, not as a pasted wallpaper behind unrelated blocks.

---

### User Story 4 - Desktop keeps its composure (Priority: P3)

The redesign is mobile-first but must not regress desktop: at ≥1024 widths the homepage keeps a complete, premium presentation consistent with the same brand system, with the header and hero adapted — not merely compressed — for the wider canvas.

**Why this priority**: The constitution requires both widths to hold; the owner's mockup targets mobile, so desktop is a coherence constraint rather than the primary deliverable.

**Independent Test**: Can be fully tested by loading the homepage at 1280×800 and comparing against the current desktop presentation for completeness and brand consistency.

**Acceptance Scenarios**:

1. **Given** a 1280×800 desktop viewport, **When** the home page loads, **Then** the header, hero and all sections render complete, with no element clipped, collapsed, or left styled for the wrong width.
2. **Given** the desktop presentation, **When** compared with the pre-redesign state, **Then** no section has lost content or function.

### Edge Cases

- What happens on very narrow phones (360px)? The 2×2 trust-facts grid and both CTAs must hold without horizontal scrolling or clipped labels.
- How does the channel strip behave for shoppers who prefer reduced motion? Its scrolling animation must stop and the full message must remain readable.
- What happens when the shopper rotates the phone or uses a large phone (up to ~430px)? The composition must scale without dead zones or stretched artwork.
- The store photograph contains Latin shop signage (part of the photograph itself); this is not localizable text and needs no treatment.
- The channel strip is the one outbound route: it must keep opening the external Telegram channel in a new context without breaking the page behind it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mobile header MUST present the shop's official logo assets on the brand's deep-oxblood surface, with actions for search, account, category navigation, and the shopping bag; every action MUST have a touch target of at least 44×44.
- **FR-002**: The header's category action MUST keep its repaired behavior: a tap opens the category menu over the content, and it closes by outside tap or Escape.
- **FR-003**: The Telegram channel strip MUST appear directly beneath the header as a single outbound link to the shop's channel, keeping its continuous, marquee-style presentation and its masked edges.
- **FR-004**: The hero MUST present the approved real store photograph with its space fully reserved before loading.
- **FR-005**: The hero MUST present the «۲۰ سال اعتماد» marker, the shop name, and the wholesale-and-retail proposition headline in Persian, arranged per the approved mockup with its gold underline accent.
- **FR-006**: Two calls to action MUST be present in the first screen — «مشاهده محصولات» as the primary oxblood pill and «شروع همکاری» as the secondary cream pill with a gold edge — leading to the shop listing and the partnership page respectively.
- **FR-007**: The trust-facts block MUST render as a 2×2 grid of outlined circular icons with Persian labels per the mockup, and the four statements MUST come from the shop's single verified-facts source. *Resolved by owner on 2026-10-25: the mockup's labels are adopted as owner-confirmed verified facts.* The rendered four are: «۲۰ سال سابقه» (clock), «فروشگاه حضوری در مشهد» (map pin), «قیمت برد به برد» (medal; mockup spelling «قیمت برد برد» — final orthography confirmed during implementation review), and «نمایندگی رسمی» (shield check). The verified-facts source MUST gain these two owner-confirmed statements during implementation; the two existing dealership facts remain in the source for the surfaces that already render them.
- **FR-008**: The supplied silk-wave artwork MUST form the homepage's background system; content MUST remain legible over it at every supported width.
- **FR-009**: The wide silk banner variant MUST be used where it materially improves desktop or section composition; final placement is a planning decision within this feature's scope.
- **FR-010**: Persian RTL correctness MUST be preserved: logical layout properties, Persian numerals, Persian-first copy.
- **FR-011**: Nothing in the redesigned surface MAY assert unverified prices, stock states, endorsements, or contact details; contact information MUST come only from the shop's verified contact source.
- **FR-012**: The redesign MUST NOT regress desktop widths ≥1024; mobile and desktop share one brand system, each designed for its own width.

### Key Entities *(include if feature involves data)*

- **Trust facts**: the four owner-confirmed statements the first screen renders (history, physical store, price matching, official dealerships); they live in a single verified-facts content source shared across the site, extended on 2026-10-25 with two newly owner-confirmed facts.
- **Brand assets**: the official logo set (white wordmark and H mark), the approved real store photograph, and the owner-supplied silk-wave background artwork — the only imagery this feature may introduce.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 390×844, both calls to action and the trust-facts block are fully visible without scrolling — the approved first screen is complete in one view.
- **SC-002**: While the store photograph loads, the calls to action and headline do not visibly move (imperceptible layout shift).
- **SC-003**: The owner judges the delivered first screen, side-by-side with the approved mockup, as matching in composition, palette, and hierarchy.
- **SC-004**: At 360px and 430px widths there is no horizontal scrolling and no clipped or overlapping control.
- **SC-005**: At 1280×800 no section loses content or function compared with the pre-redesign desktop presentation.
- **SC-006**: Every interactive control on the first screen is operable by touch and by keyboard, with a visible focus state.

## Assumptions

- The approved mockup is art direction: it governs composition, palette, and hierarchy; exact pixel values are the implementer's judgment within the project's design-token scale.
- Homepage sections below the first screen keep their current content and behavior; they restyle only as needed to sit coherently on the background system.
- Other pages (shop listing, product detail, partnership) are out of scope; only the shared header carries the new brand surface onto them unchanged in behavior.
- The channel strip's existing behavior (external link, scrolling text, masked edges) carries over, restyled per the mockup.
- Beyond the first screen, the header keeps its current docking behavior while scrolling, restyled to the new oxblood surface, unless the owner directs otherwise.
- The wide banner variant is intended for desktop or a section band; its exact placement is decided during planning.
- No new photography or illustration is needed: the store photograph, logo set, and supplied backgrounds are the complete asset set.
