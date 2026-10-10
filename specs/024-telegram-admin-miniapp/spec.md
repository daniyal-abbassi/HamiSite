# Feature Specification: 024-telegram-admin-miniapp

**Feature Branch**: `024-telegram-admin-miniapp`

**Created**: 2026-10-11

**Status**: Ready for Planning

**Input**: User description: "یک مینی اپ تلگرام (فارسی زیبا با استفاده ی کامل و دقیق از https://github.com/MiladJoodi/FarsiUI) برای مدریت آسان تر داشبورد و کالاها - مدریت سفارش ها و... برام درست کن"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Telegram Admin Dashboard & Fast Order Triage (Priority: P1)

As a store administrator, I want to open a Telegram Mini App directly inside my Telegram client so that I can see store sales stats, monitor new orders, and immediately update order statuses with a single tap while on the go.

**Why this priority**: Fast reaction to new customer orders and quick order status triage from mobile is the primary daily operational pain point for store owners. Telegram provides instant notifications and mobile ubiquity.

**Independent Test**: Can be tested independently by launching the Mini App via Telegram WebApp link, viewing the live dashboard metrics (daily revenue, pending orders), and transitioning an order from "در حال پردازش" to "ارسال شد" with immediate persistence in the database.

**Acceptance Scenarios**:

1. **Given** an authorized admin (matching `TELEGRAM_ADMIN_IDS`) opens the Telegram Mini App inside Telegram, **When** the app loads, **Then** it authenticates seamlessly via HMAC-SHA256 validated `initData` and displays high-level dashboard cards (Today's Sales in Toman, Pending Orders count, Out-of-Stock alerts) styled with FarsiUI RTL components and Persian digits.
2. **Given** an admin viewing the orders list, **When** they filter by "در انتظار بررسی" and tap an order, **Then** a FarsiUI bottom sheet opens showing customer details, items, address, and quick status update buttons.
3. **Given** an admin changing an order status, **When** they tap "ارسال شد", **Then** Telegram HapticFeedback triggers, the status is persisted via API, and the list updates instantly.

---

### User Story 2 - Rapid Product & Variant Inventory & Price Adjustments (Priority: P2)

As a store administrator, I want to search catalog products in the Mini App and quickly toggle availability, adjust inventory stock, or change prices at both product and variant levels (color, storage, options) without opening the full desktop admin panel.

**Why this priority**: Suppliers and stock changes happen continuously throughout the day; store admins need a lightweight way to mark products or specific variants out of stock or update prices instantly to avoid selling unavailable goods.

**Independent Test**: Can be tested by searching for a product name or SKU in the Mini App catalog tab, expanding its variants list, toggling a specific variant availability or updating its stock number, and verifying on the public storefront that the variant reflected the change immediately.

**Acceptance Scenarios**:

1. **Given** an admin navigating to the "محصولات" tab in the Mini App, **When** they type a search term in the FarsiUI search input, **Then** products match in real-time with image thumbnail, title, price range, and current stock status.
2. **Given** a product card with multiple variants, **When** the admin taps the product, **Then** a bottom sheet displays all variants (color badges, storage, stock count, price) with direct inline toggles and stock steppers.
3. **Given** an admin tapping "ویرایش سریع قیمت/موجودی", **When** they modify the price or stock quantity of a variant and submit, **Then** the updated values are validated and saved immediately.

---

### User Story 3 - Telegram Push Alerts for New Orders (Priority: P3)

As a store administrator, I want the Telegram bot to proactively send me a push notification message when a customer places a new order, with an inline button to jump straight to that order in the Mini App.

**Why this priority**: Eliminates the need to constantly refresh or check the dashboard; the admin receives instant alerts on their phone and can process orders within seconds of placement.

**Independent Test**: Can be tested by simulating a completed checkout order and verifying that an alert message is dispatched to the Telegram admin chat containing customer name, total price, and an inline WebApp button that opens the order detail sheet.

**Acceptance Scenarios**:

1. **Given** a customer successfully submits an order on the Hami storefront, **When** the payment/order is created, **Then** the Telegram bot dispatches an alert message to all configured `TELEGRAM_ADMIN_IDS`.
2. **Given** the admin receives the new order message in Telegram, **When** they click "مشاهده و مدیریت سفارش", **Then** the Mini App opens directly to that order's detail sheet.

---

### User Story 4 - Telegram Native Polish & FarsiUI Design System Integration (Priority: P4)

As a store administrator, I want the Mini App to feel like a first-class native Telegram application with full RTL layout, Telegram theme synchronization (light/dark mode matching Telegram app), Telegram MainButton integration, and FarsiUI aesthetics.

**Why this priority**: Elevates the user experience from a generic mobile web page into an intentional, luxury-grade, frictionless native Telegram Mini App.

**Independent Test**: Can be tested by switching Telegram theme from light to dark, observing that colors and card tokens seamlessly adapt, and checking that the Telegram native BackButton and MainButton respond properly to navigation stacks.

**Acceptance Scenarios**:

1. **Given** the user toggles Telegram between dark and light themes, **When** the Mini App is open, **Then** background canvas, surface cards, and typography colors automatically adapt to match Telegram theme parameters (`themeParams`).
2. **Given** the user is viewing a detail sheet or nested page, **When** they press the native Telegram top-left BackButton, **Then** the app navigates back cleanly within the client history.

---

### Edge Cases

- **Unauthorized Telegram user**: When an unauthorized user attempts to open the Mini App URL, the app rejects access, logs the attempt, and displays a friendly Persian access-denied message without exposing internal store metrics.
- **Offline or poor cellular connection**: Network failures during an order status update or price change show an informative Persian retry toast without leaving the UI in an inconsistent state.
- **Large catalog rendering on mobile**: Product search and infinite scrolling use virtualization or small paginated chunks to avoid lagging on low-end mobile devices.
- **Telegram WebApp SDK unavailable**: If opened in an external desktop browser without Telegram context for development/debugging, the app gracefully offers a development mock mode or admin credential login fallback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated Next.js App Router route group (`/tma` or `/telegram-admin`) optimized for mobile viewports and Telegram WebApp container.
- **FR-002**: System MUST validate Telegram `initData` cryptographically using HMAC-SHA256 with the bot token (`TELEGRAM_BOT_TOKEN`) to verify request authenticity and prevent spoofing.
- **FR-003**: System MUST verify the authenticated Telegram user ID against an administrator whitelist (`TELEGRAM_ADMIN_IDS`) specified in environment variables/settings, granting zero-friction instant access to approved Telegram IDs and denying all others.
- **FR-004**: System MUST render all interfaces using an RTL-first FarsiUI layout (`dir="rtl"`) with Vazirmatn / Estedad typography and Persian numbers formatting.
- **FR-005**: System MUST display an Admin Overview Dashboard containing today's order count, total revenue in Toman, orders requiring attention, and low-stock alerts.
- **FR-006**: System MUST provide an Orders List with status filtering (در انتظار پرداخت، در حال پردازش، ارسال شده، تحویل شده، لغو شده) and customer name/phone search.
- **FR-007**: System MUST provide Order Detail view showing recipient name, phone, shipping address, ordered items, variants, unit prices, and payment gateway reference.
- **FR-008**: System MUST allow one-tap order status updates with immediate feedback and Telegram haptic feedback integration.
- **FR-009**: System MUST provide a Product Catalog management view with keyword search, brand/category filtering, and status badges.
- **FR-010**: System MUST enable fast toggle of product and variant availability (موجود / ناموجود) and stock quantity adjustments from mobile cards and bottom sheets.
- **FR-011**: System MUST enable quick price and compareAtPrice editing at both product and variant level with Iranian currency formatting (تومان).
- **FR-012**: System MUST synchronize theme variables with Telegram client parameters (`themeParams`), supporting both dark and light Telegram modes.
- **FR-013**: System MUST bind Telegram WebApp native UI controls (BackButton for navigation stacks, MainButton for primary action confirmations).
- **FR-014**: System MUST trigger native HapticFeedback (success, warning, light impact) upon user actions.
- **FR-015**: System MUST operate against existing PostgreSQL database and Prisma models (`orders`, `products`, `product_variants`, `users`) without requiring duplicate schemas.
- **FR-016**: System MUST send instant Telegram Bot alert messages to authorized admin user IDs upon new order creation with an inline button directing straight to the order in the Mini App.

### Key Entities *(include if feature involves data)*

- **TelegramAdminSession**: Represents a validated Telegram session, linking Telegram user metadata (id, first_name, username) with an authenticated Hami Admin User record.
- **DashboardSummary**: Aggregated real-time metrics including daily takings, order status distribution, and out-of-stock items count.
- **QuickOrderAction**: Represents an atomic status transition on an Order (e.g., pending -> processing, processing -> shipped) with audit tracking.
- **QuickProductInventoryUpdate**: Represents immediate modifications to a Product or ProductVariant price, availability, or stock level.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Initial loading time of the Telegram Mini App inside Telegram is under 1.5 seconds on a standard 4G mobile connection.
- **SC-002**: Store administrators can locate an order and update its status in under 10 seconds (fewer than 3 taps).
- **SC-003**: Store administrators can update a product or variant's price or availability in under 15 seconds.
- **SC-004**: 100% of user-facing strings, dates, and numerals render in proper Persian RTL formatting without English UI remnants.
- **SC-005**: Zero unauthorized requests can access order or product management APIs through spoofed Telegram headers.
- **SC-006**: 100% of newly created storefront orders trigger an immediate Telegram alert to authorized admin IDs within 5 seconds.

## Assumptions

- Telegram Bot token is configured via environment variable (`TELEGRAM_BOT_TOKEN`).
- Telegram admin user IDs are configured via environment variable (`TELEGRAM_ADMIN_IDS`).
- Existing Next.js API endpoints or dedicated `/api/tma/*` endpoints will be leveraged for secure authenticated communications.
- The Mini App will run over HTTPS as required by Telegram WebApp specifications.
- FarsiUI styling principles and components (cards, dialogs, sheets, buttons, badges) will be integrated directly into the project's Tailwind CSS setup.
