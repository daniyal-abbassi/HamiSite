# Quickstart: Validating Partner Registration

## Prerequisites

- Dev server running on port 3000.
- SMS in its development mode, or responses mocked in Playwright.
- API tests only against the isolated schema in `.env.test`. Never bare `npm test`; its setup deletes data from the database it points at.

## Automated checks

```bash
npm run typecheck
```

```bash
npm run test:unit
```

```bash
npx playwright test e2e/uiverify-auth-otp.spec.ts
```

The Playwright file writes verification screenshots under `specs/043-smsir-otp-login/`, so review `git status` after running it.

## Manual scenarios

| # | Do | Expect |
|---|---|---|
| 1 | Open `/register`, choose «همکار عمده», then حقیقی | The individual fields and two uploads appear |
| 2 | Switch to حقوقی | Company fields and the registration notice appear; shared values remain |
| 3 | Attach a `.txt` file or one over 10 MB | A Persian error on that field |
| 4 | Complete and submit | Signed in, with an under-review confirmation |
| 5 | Open `/admin/partners` | The application and its documents are visible |
| 6 | As the partner, view prices and `/partners/bundles` | Customer prices, no bundle access |
| 7 | Approve the application | The same account gains wholesale access; no duplicate user |
| 8 | Repeat with a mobile that already applied | Clear message; nothing new is stored |
| 9 | Send `POST /api/auth/register` with `role: "WHOLESALE"` | `400 VALIDATION_FAILED` |
| 10 | Submit `/partners` anonymously | Works as before |
| 11 | Choose «خریدار» | The short form, with no uploads |

Compare the file count in `data/uploads/partner-documents/` before and after failed attempts in scenarios 3 and 8; it must not change.
