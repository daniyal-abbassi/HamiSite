# T005 — Access Limitations

**Status**: nothing is currently unverified. Every authenticated route was captured with an approved
account and the designated test contents; no guest was substituted for an authenticated row.

## Accounts used

Both are pre-existing seeded fixtures, not new accounts. Credentials are supplied
to the capture runners through environment variables; evidence refers to sessions by alias.

| Alias | Role | Verified |
| --- | --- | --- | --- |
| `alias-customer-A` | RETAIL | login HTTP 200, `/api/auth/me` HTTP 200, role `RETAIL` |
| `alias-partner-A` | WHOLESALE | login HTTP 200, `/api/auth/me` HTTP 200, role `WHOLESALE` |

Session establishment is verified **before** capture and the runner refuses to capture if any session
fails to verify (`exit 3`), so an expired or rejected session can never be recorded as a valid
authenticated sample.

### Session mechanism note

The session cookie (`session_token`) is set `Secure`. Chrome treats `127.0.0.1` as a secure context, so
the cookie is sent from the page context but **not** by Playwright's `ctx.request` over plain HTTP —
an early attempt to verify with `ctx.request.get("/api/auth/me")` returned 401 while the page itself was
correctly authenticated. Verification is therefore done in-page. This is a harness detail, not an app
defect, but it is recorded because it produced a 401 that could be misread as an auth failure.

## Designated test contents

Frozen before capture and recorded in `manifest.json` §routes:

* cart item 18 — product **1832** (Xiaomi Poco X7 Pro 512/12, Global), qty 1 @ 115,000,000
* cart item 19 — product **1939** (Nokia 105 2023, Iran assembly), qty 1 @ 3,500,000
* subtotal **118,500,000**

The `carts` table was empty before this, so the cart was created deliberately for the campaign rather
than reusing whatever happened to be present. The predicates assert these **exact amounts and both
product names**, so a different cart, an empty cart, or a placeholder page cannot pass as a valid
sample.

## Deliberately not used

* **A 5th account** (WHOLESALE, id 4336, created 2026-10-12, absent from `prisma/seed.ts`) exists in the
  database and is most likely the owner's own "Platform account". It was left completely untouched —
  no login attempt, no cart mutation.
* No account was created, no password changed, and no role altered.

## Payment

`/checkout` is captured through its order-review state (totals + shipping selection visible). **No
payment is initiated**: the runner never clicks a submit/pay control, and no payment row is created.
The payment gateway and its callback are outside this campaign's scope.

## Remaining limitation

None that blocks the contract. One scope note: the partner-bundle route was captured on the WHOLESALE
alias only. If bundle visibility differs per partner tier, this baseline covers the one tier that was
available as a seeded fixture; that is a coverage choice, not a missing access.
