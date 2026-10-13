# Feature Specification: B2B Partner Bundles (سبد کالای اختصاصی همکاران)

**Feature Branch**: `025-b2b-partner-bundles`

**Created**: 2026-10-12

**Status**: Ready for Planning

**Input**: User description: "ادمین باید بتونه سبد(basket-bundle) درسته کنه. سبد چیه؟ سبد شامل چند محصوله که ادمین انتخابشون میکنه و قیمت های به صرفه تری برای همکار داره و همکار میتونه اون سبد رو بخره. از سبد نمیشه خرید انتخابی کرد - سبد تعداد محدود هست - سبد رو فقط همکار ها میتونند ببینند (فقط در پنل همکارها قابل دیدنه و نه افراد عادی) - میتونه از یک محصول چند عدد در یک سبد باشه"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Defines and Publishes a Partner Bundle (Priority: P1)

As a store administrator, I want to assemble promotional product bundles containing specified quantities of multiple products with an attractive bundled price and limited overall inventory, so that I can offer volume discounts, promote select goods, and move inventory efficiently to our wholesale partners.

**Why this priority**: Without admin bundle creation, no bundles exist for partners to view or purchase. This is the foundation of the feature.

**Independent Test**: An admin can log into the administration portal, select 2 or more products (with custom quantities per product, e.g., 5 chargers and 2 phone cases), assign a title, total bundle price, and a maximum available bundle quota (e.g., 10 bundles total), and publish it. The bundle is verified as saved and active.

**Acceptance Scenarios**:

1. **Given** an administrator in the back-office bundle management area, **When** they create a new bundle specifying a title, selecting multiple catalog products with specific item quantities (including multiple units of the same item), setting a bundle package price, and entering a total bundle stock limit, **Then** the system saves the bundle with active status and records all constituent line items.
2. **Given** an existing bundle, **When** the admin edits the bundle pricing, updates the remaining available bundle quota, or deactivates the bundle, **Then** the updated bundle state immediately reflects in the partner portal.
3. **Given** an admin attempting to create a bundle, **When** they specify zero products, zero bundle price, or zero stock quota, **Then** the system rejects creation with clear validation guidance in Persian.

---

### User Story 2 - Wholesale Partner Discovers and Views Exclusive Bundles (Priority: P1)

As an authenticated wholesale partner (همکار), I want to view exclusive, high-value product bundles inside my partner dashboard with clear visibility into bundle contents, itemized quantities, total package price, and remaining bundle count, so that I can quickly decide whether to purchase advantageous bulk deals.

**Why this priority**: Partners need transparent visibility of bundle contents and savings to make purchasing decisions. Non-partners and public visitors must not have access.

**Independent Test**: An authenticated wholesale partner navigates to the Partner Bundles section of their portal, sees all active bundles with clear breakdown of contained products, quantities, package price, and remaining stock, while an unauthenticated guest or standard retail customer navigating to the same area is blocked from seeing any bundle information.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an approved wholesale partner account, **When** they access the partner bundle showcase, **Then** they see a curated list of active bundles displaying the bundle title, package price (in Toman with Persian numerals), remaining available stock, and a complete breakdown of each product and its quantity inside the bundle.
2. **Given** an unauthenticated visitor or a regular retail customer, **When** they browse the storefront or attempt to view partner bundle URLs, **Then** they cannot view any bundle listings, bundle pricing, or bundle contents (strict access control).
3. **Given** an active bundle, **When** the partner views the bundle details, **Then** the bundle clearly displays the total savings or comparative value compared to regular wholesale/retail purchase, without allowing the partner to modify or uncheck any item inside the package.

---

### User Story 3 - All-or-Nothing Bundle Purchase and Synchronized Inventory Settlement (Priority: P1)

As a wholesale partner, I want to add an entire bundle to my cart and complete the purchase with instant online payment as a single atomic unit, so that I receive the advantageous bundle price while inventory for both the bundle and constituent products is decremented accurately.

**Why this priority**: The core business rule states that a bundle is an indivisible package ("از سبد نمیشه خرید انتخابی کرد"). The transaction integrity depends on this rule.

**Independent Test**: A partner adds a bundle to their checkout, verifies that the bundle appears as a locked composite package with all item lines intact, completes instant checkout, and both the bundle quota and constituent product base stocks decrement accordingly.

**Acceptance Scenarios**:

1. **Given** a partner viewing an available bundle, **When** they click "Add Bundle to Order", **Then** the entire bundle is placed into their wholesale order/cart as an indivisible package.
2. **Given** a bundle inside a partner's cart/order, **When** the partner reviews the items, **Then** the partner cannot delete individual products from the bundle or modify constituent item quantities; they may only remove the bundle as a whole or proceed with the complete package.
3. **Given** an active bundle with available stock, **When** the partner submits the order and completes payment via instant online gateway/cash, **Then** the bundle quota decrements by the number of bundles purchased, the base warehouse inventory of each constituent product decrements by its line multiplier, and the order record preserves the bundle identity and all constituent line items.

---

### User Story 4 - Depleted and Inactive Bundle Protection (Priority: P2)

As a store administrator and wholesale partner, I want the system to immediately prevent purchases when bundle stock is exhausted, when any constituent product's base stock is depleted, or when a bundle is deactivated, so that we never oversell limited promotional quotas.

**Why this priority**: Prevents overselling, race conditions, and customer dissatisfaction when limited stock runs out.

**Independent Test**: When a bundle with 1 remaining quota is purchased, its status transitions to "Sold Out" («اتمام» / «ناموجود»), and subsequent purchase attempts by any partner are rejected.

**Acceptance Scenarios**:

1. **Given** a bundle with zero remaining quota or where any constituent product lacks sufficient warehouse stock, **When** a partner views the bundle catalog, **Then** the bundle is clearly marked as "Sold Out" («اتمام») and the purchase button is disabled.
2. **Given** a bundle with 1 remaining stock, **When** two partners attempt to checkout concurrently, **Then** exactly one order succeeds, the second partner receives an honest out-of-stock notification, and no overselling occurs.
3. **Given** a bundle deactivated by an administrator while in a partner's active cart, **When** the partner attempts to finalize checkout, **Then** the system notifies the partner that the promotional bundle is no longer active and prevents order submission.

---

### Edge Cases

- **Constituent Product Status Changes**: If an admin deactivates or archives a constituent catalog product, the system automatically marks the bundle as unavailable or prompts the admin before publishing.
- **Constituent Stock Depletion**: If any constituent product's base inventory falls below the required quantity for a bundle unit (e.g. fewer than 5 chargers remaining), the bundle is automatically locked and displayed as out-of-stock («تکمیل ظرفیت»), even if the bundle quota counter is greater than zero.
- **Concurrent Checkouts at Last Unit**: When multiple wholesale partners submit checkout for the final available bundle at the same instant, the system serializes the stock decrement transactionally to ensure strictly zero overselling.
- **Multi-unit Purchasing**: A partner may select multiple units of the bundle in a single checkout, provided the requested quantity does not exceed the remaining bundle quota or the available base inventory of any constituent product.
- **Payment Method Restrictions**: Because bundles offer special promotional wholesale prices, checkout for orders containing partner bundles strictly permits cash/online gateway payment (پرداخت نقدی / درگاه آنلاین). Deferred wholesale credit (خرید اعتباری / چکی) is disallowed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an administrative interface allowing administrators to create, read, update, and toggle the active status of partner bundles.
- **FR-002**: Each bundle MUST include a title (نام سبد), an optional description/terms (توضیحات و شرایط), a bundled package price in Toman (قیمت بسته به تومان), and an initial available bundle stock quota (تعداد موجودی بسته).
- **FR-003**: The admin MUST be able to add multiple distinct products to a single bundle, and specify a quantity greater than or equal to 1 for each product line (e.g., 3 units of Product A, 1 unit of Product B).
- **FR-004**: The system MUST validate that a bundle contains at least two distinct items (or at least 2 total product units), has a positive price, and has a positive initial stock quota before enabling activation.
- **FR-005**: The system MUST restrict bundle visibility and discovery exclusively to authenticated users with approved wholesale/partner roles (`همکار`). Unauthenticated users and standard retail accounts MUST NOT be able to see bundles, access bundle pages, or view bundle pricing anywhere on the storefront.
- **FR-006**: In the partner portal, the system MUST display all active bundles with the bundle title, total package price, remaining available bundle stock, and an itemized list of all products included with their individual quantities and specifications.
- **FR-007**: The system MUST present bundles as all-or-nothing composite packages. Wholesale partners MUST NOT be able to pick-and-choose, substitute, or remove individual items from a bundle during browsing, cart review, or checkout.
- **FR-008**: When a partner adds a bundle to their order, the system MUST add the entire bundle as a cohesive entity that can only be purchased in full or removed in full.
- **FR-009**: The system MUST enforce limited bundle stock. When an order containing a bundle is successfully placed, the system MUST decrement the available bundle stock quota atomically.
- **FR-010**: When a bundle's available stock reaches zero, the system MUST immediately prevent any further purchases of that bundle and display its status as sold out («اتمام»).
- **FR-011**: All numbers, quantities, and prices displayed in the partner portal MUST be formatted using Persian numerals with Toman currency notation under RTL layout standards.
- **FR-012**: The system MUST enforce synchronized dual inventory deduction: when a partner completes a bundle purchase, the system MUST decrement both the bundle's remaining quota AND the base warehouse inventory of each constituent product multiplied by its quantity in the bundle. If any constituent product's base inventory is less than the required amount, the bundle MUST automatically be marked unavailable.
- **FR-013**: The system MUST allow wholesale partners to purchase multiple units of an active bundle in a single order, up to the maximum quantity supported by both the bundle quota and constituent stock levels.
- **FR-014**: The system MUST restrict bundle checkout strictly to instant cash/online gateway payment (پرداخت نقدی / درگاه آنلاین). The system MUST disallow deferred B2B credit or promissory terms for orders containing partner bundles.
- **FR-015**: Order history and administrative order inspection MUST clearly preserve the bundle information, including the bundle title, the price at which the bundle was sold, and the detailed breakdown of all constituent products and quantities delivered.

### Key Entities

- **PartnerBundle (سبد همکار)**: Represents the promotional packaged offer. Attributes include: unique identifier, title, slug, description, bundle price (تومان), original aggregate value (for discount comparison), allocated stock quota, remaining stock quota, active status, creation date, and last modified date.
- **PartnerBundleItem (اقلام سبد)**: Represents an individual product line within a bundle. Attributes include: bundle reference, catalog product reference, specified quantity of this product in the bundle (e.g., 4 units), and sort order.
- **PartnerBundleOrder (سفارش سبد)**: Represents the association between a completed wholesale order and the purchased bundle. Captures the historical snapshot of bundle title, bundle price at moment of sale, quantity of bundles purchased, and the snapshot of constituent items.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can configure and publish a complete multi-product bundle in under 90 seconds.
- **SC-002**: 100% of unauthenticated and regular retail customer requests to bundle listings or bundle details are blocked and return no bundle data.
- **SC-003**: Zero instances of cherry-picking: in 100% of bundle purchase attempts, partners can only order the bundle with its exact, unmodified set of items.
- **SC-004**: Zero overselling: under concurrent high-load purchasing scenarios, the total number of bundles sold never exceeds the administrator-defined stock quota or the constituent products' warehouse inventory.
- **SC-005**: 100% of prices, line quantities, and countdown indicators are formatted in Persian numerals and Toman according to Persian RTL standards.

## Assumptions

- **Target Audience**: The feature is intended solely for registered and verified B2B partners who log into the existing partner portal.
- **Catalog Source**: Constituent items are selected from existing active products in the store's primary catalog.
- **Pricing Strategy**: The bundle price is manually set by the administrator as a lump-sum package price, rather than a fixed percentage discount calculation, giving maximum business flexibility.
- **UI Language & Direction**: All administrative and partner-facing interfaces for this feature are built in Persian (`lang="fa"`, `dir="rtl"`).
- **Payment Method**: Orders containing partner bundles require instant settlement (نقدی / درگاه آنلاین) to protect low-margin wholesale promotions.
