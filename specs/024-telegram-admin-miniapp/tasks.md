# Tasks: 024-telegram-admin-miniapp

**Feature**: 024-telegram-admin-miniapp  
**Status**: Ready for Implementation  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Telegram SDK integration, and mobile FarsiUI styling baseline.

- [X] T001 Configure Telegram environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_IDS`) in `.env` and environment schema
- [X] T002 [P] Install `@twa-dev/sdk` (or configure Telegram WebApp client script loader) in `package.json`
- [X] T003 [P] Setup TMA route group shell and layout with Telegram script and viewport meta in `app/(tma)/layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core security, cryptographic HMAC authentication, and Telegram client context that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Implement Telegram `initData` cryptographic HMAC-SHA256 signature verification in `lib/telegram-auth.ts`
- [X] T005 [P] Write unit tests for Telegram HMAC signature verification and admin whitelist in `tests/unit/telegram-auth.test.ts`
- [X] T006 Implement Telegram authentication route handler at `app/api/tma/auth/route.ts` returning authenticated admin session
- [X] T007 [P] Implement Telegram client context provider (`components/tma/TelegramProvider.tsx`) with SDK initialization, theme sync, and haptics
- [X] T008 [P] Build FarsiUI Mobile Bottom Navigation (`components/tma/TMABottomNav.tsx`) with Persian tabs (داشبورد، سفارش‌ها، محصولات)

**Checkpoint**: Foundation ready - Telegram authentication and shell structure operational.

---

## Phase 3: User Story 1 - Telegram Admin Dashboard & Fast Order Triage (Priority: P1) 🎯 MVP

**Goal**: Store admin can open the Mini App, view today's revenue and pending orders, and change order status with a single tap.

**Independent Test**: Launch `/tma`, view live sales cards, tap an order, change status to "در حال پردازش" or "ارسال شد", and verify instant persistence in PostgreSQL.

### Tests for User Story 1

- [X] T009 [P] [US1] Unit test for TMA dashboard metrics aggregation logic in `tests/unit/tma-dashboard.test.ts`
- [X] T010 [P] [US1] Unit test for TMA order status transition validation in `tests/unit/tma-orders.test.ts`

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement TMA Dashboard Metrics API in `app/api/tma/dashboard/route.ts` (sales, pending orders, alerts)
- [X] T012 [P] [US1] Implement TMA Orders List API with status filtering and customer search in `app/api/tma/orders/route.ts`
- [X] T013 [US1] Implement TMA Order Details & Status Patch API in `app/api/tma/orders/[id]/route.ts`
- [X] T014 [P] [US1] Build FarsiUI Dashboard Cards (`components/tma/DashboardMetrics.tsx`) with Persian digits and Toman formatting
- [X] T015 [US1] Build TMA Overview Dashboard Page (`app/(tma)/tma/page.tsx`) with live metric cards and recent order shortcuts
- [X] T016 [P] [US1] Build FarsiUI Order Card (`components/tma/OrderCard.tsx`) and Status Badge (`components/tma/OrderStatusBadge.tsx`)
- [X] T017 [US1] Build Orders Management Page (`app/(tma)/tma/orders/page.tsx`) with status chips and search bar
- [X] T018 [US1] Build Order Detail & Quick Status Sheet (`components/tma/OrderStatusSheet.tsx` & `app/(tma)/tma/orders/[id]/page.tsx`) with one-tap status actions and haptic triggers

**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable on mobile.

---

## Phase 4: User Story 2 - Rapid Product & Variant Inventory & Price Adjustments (Priority: P2)

**Goal**: Store admin can search products and variants, toggle stock availability, adjust quantities, and edit prices on the go.

**Independent Test**: Search product in `/tma/products`, expand variants, change variant stock or price, and verify changes on the public store.

### Tests for User Story 2

- [X] T019 [P] [US2] Unit test for product and variant quick update validation in `tests/unit/tma-products.test.ts`

### Implementation for User Story 2

- [X] T020 [P] [US2] Implement TMA Products & Variants API with keyword search and category filters in `app/api/tma/products/route.ts`
- [X] T021 [US2] Implement TMA Product and Variant Quick Update API (stock, availability, prices) in `app/api/tma/products/[id]/route.ts`
- [X] T022 [P] [US2] Build FarsiUI Product Card (`components/tma/ProductCard.tsx`) with image thumbnail, price, and instant availability toggle
- [X] T023 [US2] Build Variant Quick Editor Sheet (`components/tma/VariantEditorSheet.tsx`) with color badges, stock stepper, and price inputs
- [X] T024 [US2] Build TMA Product Catalog Page (`app/(tma)/tma/products/page.tsx`) with live search and category chips

**Checkpoint**: User Story 2 is functional and integrates with User Story 1.

---

## Phase 5: User Story 3 - Telegram Push Alerts for New Orders (Priority: P3)

**Goal**: Telegram bot automatically sends instant notification messages to admins when orders are placed, with a direct button to the Mini App order sheet.

**Independent Test**: Simulate order placement, check Telegram bot sends message with inline WebApp button, and tapping button opens the order in Mini App.

### Implementation for User Story 3

- [X] T025 [P] [US3] Implement Telegram Bot notification dispatcher in `lib/telegram-bot.ts`
- [X] T026 [P] [US3] Write unit test for Telegram bot alert formatting and API calls in `tests/unit/telegram-bot.test.ts`
- [X] T027 [US3] Hook Telegram bot notification dispatch into storefront checkout and payment callback handlers in `app/api/payments/callback/route.ts` and `app/api/orders/route.ts`

**Checkpoint**: Real-time push alerts dispatch to admins upon new order placement.

---

## Phase 6: User Story 4 - Telegram Native Polish & FarsiUI Design System Integration (Priority: P4)

**Goal**: Full native Telegram integration with BackButton navigation history, Telegram theme parameter sync, and haptic feedback.

**Independent Test**: Navigate deep into order details, press Telegram native BackButton, and verify proper back navigation without exiting the app.

### Implementation for User Story 4

- [X] T028 [P] [US4] Bind Telegram native BackButton to router history stack in `components/tma/TelegramProvider.tsx`
- [X] T029 [US4] Bind Telegram native MainButton for primary action confirmations (e.g., saving variant edits)
- [X] T030 [US4] Synchronize Telegram client `themeParams` (background, surface, text, button colors) with FarsiUI theme variables
- [X] T031 [US4] Implement Telegram HapticFeedback hooks (impact, notification, selection) across all interactive elements

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, unauthorized fallbacks, type checking, and documentation.

- [X] T032 [P] Build friendly Persian Access Denied view (`components/tma/AccessDenied.tsx`) for non-whitelisted Telegram users
- [X] T033 [P] Add desktop development mock switcher for testing outside Telegram client in `components/tma/TelegramProvider.tsx`
- [X] T034 Run full TypeScript compilation check (`npm run typecheck`) and resolve any type discrepancies
- [X] T035 Run automated test suite (`npm run test:unit`) to verify all unit tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; BLOCKS all user stories.
- **Phase 3 (User Story 1 - MVP)**: Depends on Phase 2; provides complete usable MVP.
- **Phase 4 (User Story 2)**: Depends on Phase 2; can proceed in parallel or after Phase 3.
- **Phase 5 (User Story 3)**: Depends on Phase 2 and bot token setup.
- **Phase 6 (User Story 4)**: Polish layer across UI components.
- **Phase 7 (Final Polish)**: Runs after desired user stories are complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1 - Dashboard & Order Triage).
3. Validate on Telegram client: admin can view sales stats and update order status.

### Incremental Delivery
- Increment 1: Foundation + Live Dashboard + Order Triage (MVP).
- Increment 2: Product & Variant Stock/Price Quick Editor.
- Increment 3: Automated Telegram Bot Order Push Alerts.
- Increment 4: Native Theme Sync & Haptic Polish.

