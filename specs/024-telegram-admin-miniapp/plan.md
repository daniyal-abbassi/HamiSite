# Implementation Plan: 024-telegram-admin-miniapp

**Branch**: `024-telegram-admin-miniapp` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/024-telegram-admin-miniapp/spec.md`

## Summary

Build a dedicated Telegram Admin Mini App (TMA) inside the Hami Next.js 15 application at `/tma` using FarsiUI RTL design standards (`MiladJoodi/FarsiUI`), seamless Telegram WebApp SDK integration, and cryptographically verified Telegram authentication. Store administrators can monitor live sales, triage orders with one-tap status updates, toggle product/variant availability, adjust inventory stock, and edit prices with zero friction directly from mobile. Additionally, integrate Telegram Bot push alerts to dispatch notifications when new orders arrive.

## Technical Context

**Language/Version**: TypeScript 5.6+, Node.js 20+  
**Framework**: Next.js 15 (App Router, Server Components & Route Handlers), React 19  
**Primary Dependencies**:
- `@twa-dev/sdk` / Native `telegram-web-app.js` script
- `lucide-react` for icons
- FarsiUI styling patterns (Tailwind CSS, RTL-first, Vazirmatn / Estedad typography)
- `crypto` (Node.js built-in) for HMAC-SHA256 signature verification of Telegram `initData`  
**Storage**: Existing PostgreSQL via Prisma ORM (`orders`, `products`, `product_variants`, `order_items`, `users`)  
**Testing**: Vitest unit & API tests (`tests/unit/telegram-*.test.ts`)  
**Target Platform**: Telegram Mobile Client (iOS / Android) & Telegram Desktop WebApp view  
**Performance Goals**:
- Initial TMA render in < 1.5s on mobile network
- Fast optimistic UI updates for stock toggles and order status updates with Telegram Haptic feedback
- Sub-5s delivery of new order push alerts via Telegram Bot API  
**Security Constraints**:
- Cryptographic verification of all Telegram requests using bot token HMAC-SHA256
- Strict whitelist verification of Telegram user IDs against `TELEGRAM_ADMIN_IDS`
- Zero access to unverified or non-admin Telegram users

## Constitution Check

- **Principle I (Architectural Seam & Performance)**: The TMA route group (`/tma`) lives within the app shell, querying Prisma for authenticated admin operations without degrading public storefront edge-caching.
- **Principle II (Verification Evidence)**: All authorization routines, HMAC validation, and status update flows will have automated Vitest unit tests.
- **Principle III (Source of Truth)**: PostgreSQL/Prisma is the sole source of truth for orders, products, and variants.
- **Principle IV (Million-Dollar Persian Craft)**: RTL-first, Persian numerals, Toman currency formatting, and FarsiUI aesthetics tailored for Telegram mobile viewport.

## Project Structure

### Documentation (this feature)

```text
specs/024-telegram-admin-miniapp/
├── spec.md                     # Feature specification
├── plan.md                     # Implementation plan
├── checklists/
│   └── requirements.md         # Specification quality checklist
└── tasks.md                    # Actionable task list
```

### Source Code

```text
app/
├── (tma)/                      # Dedicated Telegram Mini App route group
│   ├── layout.tsx              # TMA layout with Telegram SDK script and theme sync
│   └── tma/
│       ├── page.tsx            # TMA Overview Dashboard
│       ├── orders/
│       │   ├── page.tsx        # Orders list with fast filter & search
│       │   └── [id]/page.tsx   # Order detail & fast status triage
│       └── products/
│           └── page.tsx        # Product catalog with variant quick edit & stock stepper
├── api/
│   └── tma/
│       ├── auth/route.ts       # Telegram initData validation & session issuance
│       ├── dashboard/route.ts  # TMA metrics API
│       ├── orders/
│       │   ├── route.ts        # Order list API with status filters
│       │   └── [id]/route.ts   # Order details and status patch API
│       └── products/
│           ├── route.ts        # Products list API with variants
│           └── [id]/route.ts   # Product & variant stock/price update API

components/
└── tma/
    ├── TelegramProvider.tsx    # Telegram WebApp SDK context, theme, and haptic hooks
    ├── TMAHeader.tsx           # Mobile Telegram header with sync badge & back action
    ├── TMABottomNav.tsx        # Native-feel bottom navigation tabs (داشبورد، سفارش‌ها، کالاها)
    ├── DashboardMetrics.tsx    # FarsiUI revenue, pending orders, and alerts cards
    ├── OrderCard.tsx           # Order card with status badge and total price
    ├── OrderStatusSheet.tsx    # Bottom sheet for one-tap status transitions
    ├── ProductCard.tsx         # Product card with availability toggle and variant trigger
    └── VariantEditorSheet.tsx  # Bottom sheet for editing variant price, discount, and stock

lib/
├── telegram-auth.ts            # Telegram WebApp HMAC-SHA256 signature verifier
└── telegram-bot.ts             # Telegram Bot API notification dispatcher

tests/
└── unit/
    ├── telegram-auth.test.ts   # HMAC-SHA256 validation & whitelist tests
    └── telegram-bot.test.ts    # Telegram order alert dispatcher tests
```
