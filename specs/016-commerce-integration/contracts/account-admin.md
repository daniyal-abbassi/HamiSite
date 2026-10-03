# Account and Admin Contracts

**Feature**: `specs/016-commerce-integration`
**Date**: 2026-10-04

## Customer Account

Reuse the existing same-origin, httpOnly session model and endpoints pinned in `docs/api/auth.md`:

- `POST /api/auth/register` and `POST /api/auth/login` establish the session.
- `GET /api/auth/me` returns the sanitized current user and refreshes the session.
- `PATCH /api/auth/me` updates only `firstName`, `lastName`, `city`, `email` and `receiveNewsletters`, preserving the contract's omitted/null/value semantics.
- `POST /api/auth/change-password` changes the password and revokes other sessions while retaining the current session.
- `POST /api/auth/logout` revokes only the current session.

The new `/account` UI uses these existing contracts; this feature does not add OTP, forgot-password or cross-origin auth.

## Admin

- All admin list/detail/mutation routes remain under `/api/admin/*` and use the current session plus `Role.ADMIN` authorization.
- The UI continues to consume success/error envelopes via `lib/api-client.ts`.
- Product, category, brand, media metadata and dashboard inventory endpoints must read/write PostgreSQL after cutover; coupons, user administration, order administration and reporting remain on their existing database-backed behavior.
- Product/variant option and image references returned to admin forms must be serializable and suitable for round-trip edits without loss of data.

## Ownership Boundary

This contract covers public catalog reads, customer identity/profile management and admin record management. It excludes customer cart mutations, checkout, order submission, payment and customer order history/detail.
