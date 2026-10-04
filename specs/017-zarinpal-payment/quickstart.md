# Quickstart: Zarinpal Checkout

## Local development

1. Keep `ZARINPAL_MERCHANT_ID` empty to use the development-only mock confirmation flow.
2. Run `npm run dev` and place a cash order; the mock returns through `/api/payments/callback` and should land on `/payment/result`.
3. Test a wholesale 60-day credit order separately; it should not invoke a payment gateway.
4. A zero-total order should be settled locally and land on the successful result page without contacting the mock or Zarinpal.

## Sandbox configuration

1. Obtain a Zarinpal sandbox merchant ID from the [sandbox portal](https://sandbox.zarinpal.com/).
2. Put secrets only in a developer-local ignored env file; never commit them:

```env
ZARINPAL_MERCHANT_ID=<sandbox-merchant-id>
ZARINPAL_SANDBOX=true
APP_BASE_URL=https://<public-tunnel-or-test-host>
```

3. Make sure the public URL is reachable from a browser after returning from Zarinpal and that its `/api/payments/callback` path is routed to this app.
4. Use only Zarinpal's sandbox-issued test cards. Confirm a successful payment stores a provider reference and completes the payment/order; cancel a payment and confirm no success state; reload/replay a callback and confirm no duplicate transition.
5. Never use a production merchant ID or card for local feature verification.

## Production readiness

- Configure the real `ZARINPAL_MERCHANT_ID` and a public HTTPS `APP_BASE_URL` in the deployment secret manager.
- Set `ZARINPAL_SANDBOX=false`. The owner approved the existing `https://api.zarinpal.com/pg/v4/payment` production API host; production StartPay uses `https://www.zarinpal.com/pg/StartPay`. The installed guide names a different production API host, so confirm the merchant account can use the approved host during deployment verification.
- Check the callback works through the deployment proxy and preserves `Authority` and `Status` query parameters.
- Confirm logs do not contain merchant credentials, full card data or other sensitive payment metadata.
- Configure `.env.test` with a database schema isolated from `.env` before any payment API test run; do not use `db:reset`, `db:fresh`, or blind seed commands.

## Validation commands

```bash
npm run typecheck
npm run test:unit -- tests/unit/payment-zarinpal.test.ts tests/unit/payment-mock.test.ts
npm test -- tests/api/pay.test.ts tests/api/payments-callback.test.ts
npm run build
```

Run the API test command only after verifying `.env.test` targets the isolated schema. Stop any Next process before `npm run build` because it rewrites `.next`; restart the server afterward before browser checks.
