# Implementation Plan: Card-to-Card Payment While the Gateway Is Down

**Branch**: `047-card-to-card-payment` (not created) | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/047-card-to-card-payment/spec.md`

## Summary

While an owner-controlled setting is on, `POST /api/orders/:id/pay` stops calling the gateway and tells checkout to show a new transfer page. The customer's "I have paid" tap moves the order's payment status from `INITIATED` to `SENT` (an existing value nothing uses today) and alerts the admin. The admin confirms or rejects from the order screen, which settles the order exactly the way the gateway callback does. No new payment or order status is added. The only schema change is one small additive table for the on/off setting.

Owner decisions of 2026-11-19: the switch lives in the admin dashboard, and no "awaiting verification" status is added.

## Technical Context

**Language/Version**: TypeScript, Next.js 15.5 App Router, Node 20+

**Primary Dependencies**: Prisma 5 (PostgreSQL), zod, existing `withAuth`, `lib/orders.ts` (`applyOrderStatusTransition`), `lib/telegram-bot.ts`

**Storage**: PostgreSQL. One new table `site_settings` (key, value), created with `db:push`. Existing `Payment` and `Order` columns are reused

**Testing**: Vitest API tests against the dedicated test database (CI has one); component behaviour covered through the API plus manual checks

**Target Platform**: Linux server (PM2 + Caddy on EC2). Production server has 913 MB RAM: build in a separate copy with `NODE_OPTIONS=--max-old-space-size=1536`

**Project Type**: Web application, single Next.js app

**Performance Goals**: Report endpoint is one transaction; alert is fire-and-forget

**Constraints**: One alert per order report, even under double taps (atomic claim in the database). Bank details never in the public client bundle. Settlement must reuse the same locking and stock rules as the gateway callback

**Scale/Scope**: 1 table, ~5 API routes, 1 customer page, admin toggle and two admin buttons

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Payments scope**: v1.4.0 approved the authenticated Zarinpal cash path (2026-10-04). A manual card-to-card path is a different payment path ordered by the owner on 2026-11-19. **PASS WITH NOTE**: record it in the constitution's amendment log when it ships.
- **Database authority / additive changes**: one new table, no destructive change, `db:push` only (never reset or reseed). PASS.
- **Existing money rules reused**: order lock, stock transition and terminal-state checks are reused, not re-implemented. PASS.
- **Secrets**: no secret is added to code; Telegram values live in the server env. PASS.

Post-design re-check: unchanged. PASS WITH NOTE.

## Project Structure

### Documentation (this feature)

```text
specs/047-card-to-card-payment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── card-to-card-api.md
└── tasks.md             # created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
prisma/schema.prisma                                  # + model SiteSetting
lib/site-settings.ts                                  # get/set boolean setting, fail-safe default
lib/payment/card-to-card.ts                           # bank details + the order-state helpers
lib/telegram-bot.ts                                   # + notifyAdminsPaymentReported
app/api/orders/[id]/pay/route.ts                      # manual branch
app/api/orders/[id]/manual-payment/route.ts           # GET details (owner only)
app/api/orders/[id]/manual-payment/report/route.ts    # POST "I have paid"
app/api/admin/settings/card-to-card/route.ts          # GET/PUT the switch (ADMIN)
app/api/admin/orders/[id]/payment/route.ts            # POST confirm | reject (ADMIN)
app/api/admin/orders/route.ts                         # + paymentStatus filter
app/(main)/order/[id]/transfer/page.tsx               # customer transfer page
components/checkout/CheckoutClient.tsx                # manual branch after /pay
components/order/OrderDetailClient.tsx                # manual branch + "awaiting verification"
components/admin/orders/OrderAdminDetailClient.tsx    # confirm / reject buttons
components/admin/orders/OrdersAdminClient.tsx         # "awaiting verification" filter
app/(admin)/admin/page.tsx (+ new component)          # the on/off switch card
tests/api/card-to-card.test.ts                        # new
```

**Structure Decision**: Single web application; additive routes beside the existing payment routes.

## Complexity Tracking

No constitution violations to justify.

## Open items for the owner (not blockers for planning)

1. **Admin alerts are not configured in production.** The server's env file has no `TELEGRAM_BOT_TOKEN` or `TELEGRAM_ADMIN_IDS` (checked 2026-11-18), and `notifyAdminsNewOrder` silently does nothing without them. Without these the "I have paid" tap is recorded but nobody is alerted. The owner must provide a Telegram bot and their chat ID, or choose another alert channel (see research D6).
2. **Bank details live in code** (`lib/payment/card-to-card.ts`), so changing them needs a release. Say so if they should be editable in the dashboard instead.
