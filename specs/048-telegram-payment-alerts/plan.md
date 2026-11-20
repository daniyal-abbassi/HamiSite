# Implementation Plan: Reliable Telegram Alerts for Card-to-Card Payments

**Branch**: `048-telegram-payment-alerts` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

## Summary

Every admin alert is rejected by Telegram with HTTP 400 and the reason is discarded. Fix the one shared sending path so alerts are delivered whatever the customer typed, degrade to a button-less message if the button is what Telegram refuses, and log Telegram's stated reason.

## Technical Context

**Language/Version**: TypeScript, Next.js 15 App Router, Node 20 on the server
**Dependencies**: none added; plain `fetch` to the Telegram Bot API
**Storage**: N/A. No schema change, no database command (owner constraint: do not touch the production database)
**Testing**: vitest via `vitest.frontend.config.ts` (no DB setup file; the backend config truncates tables)
**Project Type**: web service; change is confined to `lib/telegram-bot.ts` plus its unit test

## Research (findings, 2026-11-21)

- Production log, 2026-11-19: both `new-order` and `payment-reported` alerts failed with HTTP 400.
- `getMe` succeeds (token valid); `getChat` succeeds for the configured admin (chat exists, so not "chat not found"); `APP_BASE_URL` is HTTPS and serves `/tma`.
- Remaining causes: (a) legacy `Markdown` parse mode rejecting a message, (b) the `web_app` button. Both are removed as failure points below, so the exact one need not be known to fix it.
- Decision: HTML parse mode with escaping of `& < >` (total, unlike Markdown escaping). Alternative rejected: no parse mode at all, which loses bold/monospace order numbers admins copy.
- Decision: on HTTP 400 resend without `reply_markup`. Alternative rejected: always omit the button, which loses the one-tap order link.
- Decision (FR-010): no new table. Orders whose report was received are `paymentStatus = SENT` and already listed in the admin orders view; the log line now carries the order number and reason, which identifies "reported, not alerted".

## Design

One private `sendAdminAlert(kind, orderNumber, text, markup, token, adminIds, fetch)` replaces the two duplicated loops. `notifyAdminsNewOrder` and `notifyAdminsPaymentReported` keep their signatures, so no route changes. Missing token/admin list logs one production warning (FR-009).

## Constitution Check

No schema, auth, payment-state or API-contract change. Alert failure still never affects the customer's report (routes already `.catch`).
