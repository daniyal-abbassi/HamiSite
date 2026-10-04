# Research: Zarinpal Order Payments

**Status**: Planning research for the approved spec.

## Existing Application Flow

- `components/checkout/CheckoutClient.tsx` creates orders through `POST /api/orders`, clears the cart after order creation, then calls `POST /api/orders/[id]/pay` for cash terms. Wholesale `CREDIT_60_DAYS` orders skip gateway initiation. If payment initiation fails, checkout returns the customer to authenticated order detail for retry.
- `app/api/orders/route.ts` computes item prices, discounts, shipping and `totalAmount` server-side and persists the order; client prices do not determine the total.
- `app/api/orders/[id]/pay/route.ts` enforces user ownership and rejects completed/terminal orders. It requests a gateway authority and persists a linked `Payment` row before returning the redirect URL.
- `lib/payment/gateway.ts` chooses Zarinpal when `ZARINPAL_MERCHANT_ID` is present, otherwise chooses the mock outside production. It fails closed for missing production credentials.
- `lib/payment/zarinpal.ts` already implements API request/verify, but currently forwards the app's amount without the approved Toman-to-Rial conversion, has no sandbox selection or request timeout, and assumes valid JSON response shapes.
- `app/api/payments/callback/route.ts` verifies through the gateway, conditionally claims the payment and locks the order before applying stock/B2B status transitions. This is a strong base for idempotent settlement. The callback currently returns JSON and a repeat callback finds no initiated payment instead of mapping to the prior result.
- `app/api/payments/mock-confirm/route.ts` is development-only and redirects into the same callback route. Its production 404 behavior must remain.
- There is no payment result page. The checkout and order-detail clients expect a redirect URL unconditionally. Payment API and adapter tests already exist at `tests/api/pay.test.ts`, `tests/api/payments-callback.test.ts`, and `tests/unit/payment-zarinpal.test.ts`.

## Data and Currency

- `Order.totalAmount` and `Payment.amount` are `Decimal(12,2)` and the UI presents them with `formatToman`; they are application Toman values.
- The supplied guide says Zarinpal v4 `amount` is integer Rial and therefore Toman must be multiplied by ten; request and verify must use the same integer amount. Keep the persisted value in Toman and convert in one shared provider-boundary helper.
- The current model already has unique nullable `Payment.authority`, `Payment.transactionNumber`, `Payment.status`, `Payment.psp`, order/user relations and existing indexes. No billing table or schema migration is needed.
- A zero total can be settled locally using a completed zero-amount Payment row and a transaction that moves the order into its normal processing state. Negative totals should fail closed.

## Provider Endpoint Evidence

- The CLI-installed guide at [`docs/zarinpal-payment.md`](../../docs/zarinpal-payment.md) specifies sandbox API requests at `https://sandbox.zarinpal.com/pg/v4/payment/...`, production requests at `https://payment.zarinpal.com/pg/v4/payment/...`, sandbox StartPay at `https://sandbox.zarinpal.com/pg/StartPay/{authority}`, and production StartPay at `https://www.zarinpal.com/pg/StartPay/{authority}`.
- The existing adapter uses `https://api.zarinpal.com/pg/v4/payment/...`. The ZarinPal-Lab v4 sample also uses the `api.zarinpal.com` production host ([request example](https://github.com/ZarinPal-Lab/Zarinpal-RestAPI-Sample-php/blob/master/Request.php)). The official documentation site is [available](https://www.zarinpal.com/docs/) but renders its details client-side; a direct content read here did not expose request-host details.
- The owner approved retaining the existing `api.zarinpal.com` production v4 API host. Add the sandbox API host and explicit StartPay selection, and document the guide discrepancy for future provider confirmation.

## Decisions and Deferred Scope

- Reuse existing order/payment entities, auth, gateway interface and transition helper; no new package or database field.
- Persist the app's Toman amount and use a shared Toman-to-integer-Rial conversion on request and verification.
- Network/parse uncertainty does not mark a payment successful or failed; leave its persisted attempt initiated so the callback can retry, and return a recoverable customer state.
- A known completed/failed authority returns the corresponding idempotent result on callback replay; it is never reverified into a different order outcome.
- Payment results expose no order PII. The optional order link resolves through the existing authenticated/ownership-checked order page.
- Wholesale credit accounting stays as-is. Product delivery/shipping automation and post-purchase fulfillment are not added; existing order processing remains the success result.
- A live Zarinpal round trip remains gated on operator-provided sandbox merchant credentials and a public HTTPS callback origin.
