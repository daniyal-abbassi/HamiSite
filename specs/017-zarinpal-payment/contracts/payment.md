# Contract: Order Payment and Zarinpal Callback

## Initiate payment

`POST /api/orders/{id}/pay`

- Requires an authenticated session and order ownership.
- Request has no body; amount and order data are loaded from the database.
- A completed or terminal order returns a conflict response.
- Cash order with positive Toman amount asks the selected provider for a payment authority, persists the authority-linked `Payment`, then returns the redirect URL.
- Production requires a merchant ID and an explicitly configured HTTPS `APP_BASE_URL`; missing configuration fails before redirecting.
- Zero total returns a successful immediate-settlement result with `free: true` and no provider redirect. The payment and order transition are atomic.
- Negative/non-finite order totals return an error and never reach the provider.

Response envelope follows `ok()`:

```json
{
  "data": {
    "redirectUrl": "https://www.zarinpal.com/pg/StartPay/A...",
    "authority": "A..."
  },
  "message": "Payment initiated"
}
```

For a zero total, `data` contains `{ "free": true, "orderId": 123 }` and no `redirectUrl`.

## Gateway request

- `POST {configured API base}/pg/v4/payment/request.json`.
- Body includes server-only `merchant_id`, positive integer `amount` in Rial, public callback URL, order description and optional existing customer metadata.
- `data.code` must be 100 and authority must be present before redirect is returned.
- Authority is persisted before any URL is returned to the browser.
- Sandbox request URL and StartPay URL follow `ZARINPAL_SANDBOX=true`; otherwise production URLs are used.

## Provider callback

`GET /api/payments/callback?Authority={authority}&Status={OK|NOK}`

- Intentionally unauthenticated so the gateway can return the browser. It resolves the payment only by authority.
- If an optional `orderId` parameter is present (development mock compatibility), it must match the order bound to the stored authority; it never chooses the order.
- `Status=NOK` marks a pending attempt/order failed using existing transitions without calling verify.
- `Status=OK` submits the stored attempt amount converted to integer Rial to the server-to-server verify API.
- Code 100 records the provider `ref_id`, completes the payment and transitions the order once.
- Code 101 is idempotent success. A callback replay for an already settled authority returns the persisted outcome without applying transitions again.
- Definite verify rejection marks failure and applies existing rollback transitions. Network/parse uncertainty leaves the attempt initiated and redirects to a recoverable error state.
- Callback responds with a redirect to `/payment/result?payment={success|failed|verify_failed|notfound|error}&orderId={persisted order id when known}`. No user/profile/payment PII is included.

## Payment result page

`GET /payment/result?payment={status}&orderId={id?}`

- `payment` is allowlisted; unknown values render a generic error state.
- Page is Persian-first, RTL, and explains success, cancellation/failure, failed verification, unknown attempt, or temporary service error.
- The page may link to `/order/{id}`; order content remains protected by existing session/ownership checks.
- A retry button may link to the existing order payment action only for a payable order.
