# Tasks: Reliable Telegram Alerts (048)

- [x] T001 [US1,US2] Switch alert text to HTML and escape customer-supplied values in `lib/telegram-bot.ts` (FR-003)
- [x] T002 [US1,US2] Single shared `sendAdminAlert`; per-admin isolation (FR-006)
- [x] T003 [US1] Retry without the button on HTTP 400 (FR-004)
- [x] T004 [US3] Log Telegram's reason + order number, never the token (FR-008); warn once if unconfigured (FR-009)
- [x] T005 Unit tests: escaping, HTML mode, button fallback + reason logged, one admin blocked, token not logged (`tests/unit/telegram-bot.test.ts`)
- [x] T006 Typecheck clean; run tests with `vitest.frontend.config.ts` only
- [ ] T007 Deploy via build-in-copy and swap; then one real test alert to the admin chat to confirm delivery (SC-001)
