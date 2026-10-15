# Feature Specification: Refresh Persian Typography

**Feature Branch**: `Hami-v3`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "I don't like the current typography; check, install, and use the FarsiUI Persian typography guidance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read and navigate with a clearer hierarchy (Priority: P1)

As a Persian-speaking visitor, I can scan headings, descriptions, prices, and actions without struggling with tiny labels or an inconsistent visual rhythm. The typography feels crafted for Hami Hamrah's premium identity.

**Why this priority**: The owner's dissatisfaction concerns the site's overall typography. The first visible improvement must be legibility and a recognizable hierarchy on the main shopping journey.

**Independent Test**: Compare the current and refreshed home, catalog, product, cart, and checkout screens at phone and desktop widths. Read the main message and locate the primary action on each screen without zooming.

**Acceptance Scenarios**:

1. **Given** a shopper opens a core storefront screen, **When** they scan it, **Then** the page title, supporting text, price, and primary action are visually distinct and ordered by importance.
2. **Given** a shopper reads multi-line Persian copy on a narrow screen, **When** it wraps, **Then** words, dots, and marks remain intact and adjacent lines remain easy to distinguish.
3. **Given** a shopper magnifies a core storefront screen to 200%, **When** they read or use it, **Then** essential text remains visible, legible, and operable without clipped glyphs or obscured actions.

---

### User Story 2 - Understand mixed-script names, prices, and numbers (Priority: P1)

As a shopper comparing devices, I can read Persian descriptions alongside official Latin brand names, model numbers, prices, and quantities without ambiguous order or inconsistent digits.

**Why this priority**: Product comparison and purchasing depend on accurate reading of names and prices in a Persian RTL interface.

**Independent Test**: Review representative product cards, product details, cart lines, checkout totals, and numeric tables containing Persian prose, Latin model names, punctuation, long prices, and multiple quantities.

**Acceptance Scenarios**:

1. **Given** a product name contains Persian and Latin text, **When** it appears in a card or detail heading, **Then** each segment reads in the intended order and the official brand or model spelling is preserved.
2. **Given** a price or quantity is displayed to a shopper, **When** it appears beside Persian copy, **Then** it uses Persian digits and separators consistently, with the currency unit unambiguously associated with the amount.
3. **Given** several prices or metrics appear in a table or list, **When** a reader compares them, **Then** the values are aligned and distinguishable without changing their meaning.

---

### User Story 3 - Complete forms and operational tasks comfortably (Priority: P2)

As a customer, partner, or administrator, I can read labels, helper text, errors, buttons, and dense data in forms and dashboards without the typography changing character across sections.

**Why this priority**: The same brand experience must extend to functional screens, while forms and tables carry information that cannot be sacrificed for decoration.

**Independent Test**: Inspect login, registration, checkout, account, partner, admin, and Telegram mini-app examples at phone and desktop widths, including validation errors and long labels.

**Acceptance Scenarios**:

1. **Given** a form has a long Persian label or an error message, **When** it wraps, **Then** the full message and associated control remain readable and clearly connected.
2. **Given** a field contains a phone number, email address, card number, code, or other inherently left-to-right value, **When** a user reads or edits it, **Then** its character order and cursor behavior remain predictable within the Persian page.
3. **Given** a dashboard contains dense metrics or a table, **When** a user scans it, **Then** headings, row labels, and numeric values retain a consistent hierarchy and can be compared without squinting.

---

### User Story 4 - Maintain readability while fonts load or are unavailable (Priority: P3)

As a visitor on a slow connection or a device without the preferred font, I can still understand and use the page while the typeface becomes available or a fallback is shown.

**Why this priority**: A visually stronger typography system should not make the interface unstable or unreadable in ordinary loading conditions.

**Independent Test**: Review representative screens during initial font loading and with the preferred font unavailable.

**Acceptance Scenarios**:

1. **Given** the preferred font has not loaded, **When** the page first appears, **Then** Persian and Latin content remains legible and actions remain usable.
2. **Given** the preferred font appears after fallback text, **When** the page settles, **Then** the main text and controls do not shift enough to obscure content or cause an unintended action.

### Edge Cases

- Long product names with Latin model codes, punctuation, and Persian suffixes must wrap without splitting connected Persian letters or reversing the code.
- A narrow card with a long price and currency unit must keep the amount understandable rather than silently truncating it.
- Persian half-spaces in visible copy must be preserved where spelling requires them; typography changes must not create malformed joining.
- Two-line buttons, badges, and error messages must retain complete glyphs and visible labels.
- Large text and 200% zoom must not hide checkout totals, form errors, or primary actions.
- Missing preferred fonts must fall back to a Persian-capable face without making Latin identifiers visually confusing.
- Numeral presentation must distinguish currency amounts, percentages, dates, phone numbers, and technical identifiers according to their meaning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The refreshed typography MUST establish a coherent and visibly improved hierarchy for display headings, section headings, body copy, labels, captions, prices, and actions across the representative site surfaces.
- **FR-002**: The site MUST use a Persian-capable primary text face and a deliberate treatment for Latin characters that keeps mixed-script text readable. Any selected typeface MUST have usage rights appropriate for this project.
- **FR-003**: The typography MUST remain internally consistent across storefront, customer, partner, admin, and Telegram mini-app surfaces while allowing purposeful variation for display text and dense data.
- **FR-004**: Normal Persian text MUST retain natural letter joining and readable spacing; decorative styling MUST NOT impair Persian words.
- **FR-005**: Body text, supporting text, and interactive labels MUST remain readable at phone and desktop widths and at 200% zoom; no essential text may be clipped or hidden by a fixed text area.
- **FR-006**: The hierarchy MUST distinguish primary actions and prices from secondary metadata without reducing readability.
- **FR-007**: Shopper-facing prices, quantities, percentages, and other localized figures MUST follow the site's Persian numeral policy, use appropriate separators, and keep units clearly associated with values.
- **FR-008**: Numeric columns and comparable metrics MUST be visually aligned so readers can compare values reliably.
- **FR-009**: Persian sentences containing Latin brand names, model numbers, URLs, or codes MUST preserve the intended reading order and official spelling of those terms.
- **FR-010**: Text fields MUST present Persian prose in its natural direction and inherently left-to-right values in a predictable reading and editing order.
- **FR-011**: Visible Persian copy MUST preserve meaningful half-spaces and punctuation, and long strings MUST wrap or truncate without corrupting words or hiding critical meaning.
- **FR-012**: If the preferred font loads late or is unavailable, the page MUST remain legible and usable, without a disruptive shift of essential content or controls.
- **FR-013**: The refreshed typography MUST preserve the site's premium, editorial brand character and provide a clear visual improvement over the current presentation on the main shopping journey.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On home, catalog, product, cart, and checkout screens at phone and desktop widths, 100% of sampled page titles, prices, body passages, and primary actions pass a visual reading review with no clipped glyphs or obscured meaning.
- **SC-002**: At 200% zoom, all essential text and primary actions on those five storefront screens remain readable and usable without text overlap or horizontal clipping.
- **SC-003**: Across a representative sample of storefront, account, partner, admin, and Telegram mini-app screens, 100% of sampled visible Persian prices and quantities use the established numeral and unit conventions.
- **SC-004**: In a review set of at least 20 mixed Persian and Latin examples, all brand names, model identifiers, and punctuation appear in the intended reading order.
- **SC-005**: In a side-by-side review of the five core storefront screens, the owner judges at least four of the five refreshed screens clearer and more fitting for the premium Hami Hamrah brand than the current typography.
- **SC-006**: On representative screens during font loading and when the preferred font is unavailable, zero essential actions become unreadable, hidden, or displaced into another control.

## Assumptions

- The scope is a typography refresh of existing content and journeys, including customer, partner, admin, and Telegram mini-app screens. It does not change product facts, pricing data, purchase logic, or page structure beyond what legibility requires.
- Persian remains the primary language and RTL remains the default page direction. Existing official Latin product and brand names remain as written.
- No current font choice is binding. The final typeface and scale will be selected during design and planning using actual screen comparisons and verified licensing.
- The FarsiUI [Persian Typography Guide](https://farsiui.ir/skills/persian-typography) supplies review guidance; the project's constitution and established localization rules remain authoritative.
- The representative review sample includes mobile and desktop widths and real content from each relevant surface; the exact screens and examples will be selected during planning.
