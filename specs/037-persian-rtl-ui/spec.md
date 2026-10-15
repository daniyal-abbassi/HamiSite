# Feature Specification: Persian RTL UI Consistency

**Feature Branch**: `Hami-v3`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Apply https://farsiui.ir/skills/persian-rtl-ui to the existing Hami Hamrah interface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate a naturally right-to-left interface (Priority: P1)

As a Persian-speaking shopper or staff member, I can use pages, cards, tables, menus, and overlays whose spacing and alignment follow the reading direction at mobile and desktop widths.

**Why this priority**: Direction errors affect every journey and can hide controls or make a page appear broken.

**Independent Test**: Open a representative storefront page, admin table, partner form, and Telegram mini-app screen at narrow and wide widths. Content begins at the expected edge, controls remain visible, and no directional spacing creates horizontal overflow.

**Acceptance Scenarios**:

1. **Given** a Persian page, **When** it loads, **Then** its main reading order and alignment flow from right to left.
2. **Given** a card list or table, **When** the viewport narrows, **Then** spacing, borders, and overflow controls remain usable without reversed or clipped content.
3. **Given** a drawer, menu, or dialog, **When** it opens, **Then** its content, focus order, and opening edge remain consistent with the surrounding interface.

---

### User Story 2 - Read connected Persian text and mixed names (Priority: P1)

As a Persian reader, I can read headings, labels, and body copy without broken letter joins, while embedded Latin names and codes retain their intended order.

**Why this priority**: Letter spacing and mixed-direction punctuation directly affect legibility and product trust.

**Independent Test**: Inspect representative Persian headlines, badges, buttons, descriptions, and product names containing Latin model names or numbers. Joined letters remain connected, text is not clipped, and Latin runs do not reorder adjacent Persian punctuation.

**Acceptance Scenarios**:

1. **Given** a Persian heading or control label, **When** it renders, **Then** letter joins remain intact and line spacing is comfortable for its text role.
2. **Given** a product title containing a Latin model name or code, **When** it wraps or is copied, **Then** the code and nearby punctuation keep their intended order.
3. **Given** a long description, **When** it is shortened in a card, **Then** the visible text does not end with a broken character or obscure the item's identity.

---

### User Story 3 - Understand forward and back navigation (Priority: P1)

As a shopper or operator, I can tell which control moves forward and which returns to an earlier step because their directional cues match Persian reading flow.

**Why this priority**: Incorrect arrows reverse the meaning of pagination and purchase controls.

**Independent Test**: Follow a product-card link, a paginated list, and a back action. Forward controls indicate movement toward the left; back controls indicate movement toward the right; action icons without directional meaning retain their usual shape.

**Acceptance Scenarios**:

1. **Given** a next-page or continue control, **When** it appears, **Then** its directional cue points left.
2. **Given** a previous-page or back control, **When** it appears, **Then** its directional cue points right.
3. **Given** search, delete, cart, or status icons, **When** they appear near directional controls, **Then** their meaning is not changed by mirroring.

---

### User Story 4 - Enter Iranian contact and payment-related values predictably (Priority: P2)

As a customer or staff member, I can enter telephone numbers, passwords, verification codes, and other Latin-formatted identifiers without a jumping cursor or reversed characters, while labels and validation remain in Persian.

**Why this priority**: Direction mistakes in forms cause failed sign-in, applications, and checkout.

**Independent Test**: Enter local and international phone formats and Persian or Arabic-Indic digits into representative sign-in, registration, partner, and checkout fields. The visible cursor order is stable, accepted values normalize consistently, and error messages remain next to their fields in Persian.

**Acceptance Scenarios**:

1. **Given** a phone or password field inside a Persian form, **When** the user types or pastes, **Then** the entered characters keep their natural left-to-right order while the label remains right-to-left.
2. **Given** a valid Iranian mobile number in local or international form, **When** submitted, **Then** it is accepted under the existing account rules.
3. **Given** Persian or Arabic-Indic digits in a field that expects digits, **When** submitted, **Then** equivalent valid input is accepted without requiring an English keyboard.
4. **Given** an invalid value, **When** validation fails, **Then** the user receives a specific Persian message associated with the field.

---

### User Story 5 - Read prices, quantities, and dates in Iranian conventions (Priority: P2)

As a customer or operator, I can read monetary values, quantities, and dates in familiar Persian notation throughout shopping and administration.

**Why this priority**: Inconsistent numerals, currency order, or calendars can cause misunderstandings about totals and fulfillment dates.

**Independent Test**: Compare representative product, cart, checkout, order, and admin displays against their underlying values. Digits and grouping are Persian, «تومان» follows the amount, numeric columns remain aligned, and dates shown to users use the Iranian calendar with Persian names.

**Acceptance Scenarios**:

1. **Given** a price, **When** displayed, **Then** Persian digits and grouping are used and «تومان» follows the number.
2. **Given** a numeric table, **When** several values appear together, **Then** columns remain easy to compare and follow the table's reading direction.
3. **Given** a date shown to a user, **When** displayed, **Then** its calendar and month names are familiar to an Iranian reader.

### Edge Cases

- Latin product names, email addresses, URLs, tracking numbers, and codes may appear inside Persian sentences; their internal character order must remain intact without changing the direction of the whole paragraph.
- Some icons indicate an action rather than a direction. Only cues for forward, back, next, or previous movement should change orientation.
- A portal or overlay may render outside the page's visual hierarchy; its reading order, keyboard navigation, and placement must still match the user's context.
- Numeric input may contain Persian, Arabic-Indic, Latin, or mixed digits; equivalent values should be treated consistently, while invalid content still fails validation.
- Existing catalog values and account data must not be rewritten merely to change how they display.
- A narrow screen or zoomed text may wrap mixed-script content; controls and numbers must remain legible and operable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The primary interface MUST identify Persian as its language and use right-to-left reading order by default.
- **FR-002**: Spacing, alignment, borders, and positioning MUST follow the start and end of the reading direction across the storefront, partner, admin, and Telegram surfaces.
- **FR-003**: Components MUST avoid visible alignment that reverses or clips content when rendered right-to-left.
- **FR-004**: Lists, cards, tables, menus, and overlays MUST maintain usable gaps and reading order without relying on visual reversal of their content sequence.
- **FR-005**: Persian headings, controls, and body copy MUST preserve natural letter joining, readable line spacing, and the project's coherent Persian text style.
- **FR-006**: Cues for next, forward, and continue actions MUST point left in the Persian interface.
- **FR-007**: Cues for previous, back, and return actions MUST point right in the Persian interface.
- **FR-008**: Icons with no directional meaning MUST keep their recognizable orientation.
- **FR-009**: Phone, password, verification code, bank identifier, URL, email, and Latin product-code entry MUST keep left-to-right character order inside otherwise Persian forms.
- **FR-010**: Phone entry MUST support valid local and international Iranian mobile formats under existing account rules.
- **FR-011**: User-facing prices MUST show Persian digits and grouping with the correct currency unit after the amount.
- **FR-012**: User-facing dates in the reviewed journeys MUST use the Iranian calendar and Persian date names where a calendar date is expected.
- **FR-013**: Digit-based fields MUST accept equivalent Persian and Arabic-Indic digits without changing the numeric meaning of the submitted value.
- **FR-014**: Numeric table columns MUST remain legible and aligned for comparison in a right-to-left table.
- **FR-015**: Labels, placeholders, validation, empty states, and action text in the reviewed journeys MUST be natural Persian and remain associated with their controls.
- **FR-016**: Mixed Persian and Latin text MUST preserve the intended order of codes, names, numbers, and adjacent punctuation.
- **FR-017**: Interactive controls MUST retain visible focus, understandable labels, and usable touch targets after direction and typography changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All reviewed representative screens from the storefront, partner, admin, and Telegram surfaces have correct reading order and no direction-caused horizontal overflow at narrow and wide viewport checks.
- **SC-002**: Every reviewed Persian heading and control label keeps connected letter forms without clipping at normal and enlarged text sizes.
- **SC-003**: All reviewed next/forward and previous/back controls indicate the intended direction, and no reviewed action-only icon changes meaning.
- **SC-004**: All reviewed phone, password, code, and identifier fields keep entered characters in the intended order; valid Persian and Arabic-Indic digit examples yield the same accepted value as their Latin-digit equivalents.
- **SC-005**: Every reviewed price uses Persian digits, correct grouping, and a trailing currency unit; every reviewed calendar date uses the Iranian calendar and Persian names.
- **SC-006**: Representative sign-in, product browsing, cart or checkout, partner application, and admin navigation tasks remain completable after the changes, including by keyboard where applicable.
- **SC-007**: Review evidence identifies each screen and input tested, its viewport or text size, the expected result, the observed result, and any screen that could not be checked.

## Assumptions

- The [FarsiUI Persian RTL UI skill](https://farsiui.ir/skills/persian-rtl-ui) is the requested guidance; the current Hami interface and its existing user journeys define the surfaces to review.
- The existing premium visual direction and verified product, price, and account facts remain authoritative. This feature changes presentation and input handling where needed, without inventing content or changing stored catalog facts.
- Latin codes, URLs, emails, and similar identifiers retain their normal character order within the Persian interface.
- The review covers current storefront, partner, admin, and Telegram mini-app screens that are available in the checkout; inaccessible authenticated states are reported as unverified rather than assumed correct.
- Backend account and payment rules remain unchanged unless a separate feature explicitly authorizes a change.
