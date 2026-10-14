# Contract: Backend Security Review and Compatibility

This is an audit and verification contract. It adds **no new public endpoint**. Existing responses remain governed by `docs/api/auth.md`, `specs/016-commerce-integration/contracts/account-admin.md`, and `specs/017-zarinpal-payment/contracts/payment.md` unless an observed vulnerability justifies a separately documented correction.

## Inventory and evidence contract

For each category below, the implementation report must list at least one current entry point and its actor, target, untrusted input, sensitive sink, existing control, evidence source, and test status, or an evidence-based not-applicable result:

1. Registration, login, session, profile, and password changes.
2. Customer addresses, cart, orders, and other record-ownership paths.
3. Admin page and API role gates, staff mutations, and protected documents.
4. Server-derived catalog prices, discounts, checkout, and order transitions.
5. Provider payment initiation, callback, replay, and concurrent settlement.
6. Uploads, file retrieval, catalog import, and external or provider requests.
7. Authentication abuse, expensive request bounds, error output, and sensitive logs.
8. Telegram mini-app authentication and other present external assertions or workers.

A finding record follows [data-model.md](../data-model.md). It must name a location, severity, evidence status, impact, proposed correction, safe verification, and current state. `observed` means the behavior was reproduced in an isolated environment. Complete source-level proof is valuable, but remains labeled as source evidence until runtime verification; a suspicious pattern likewise remains a source-only concern. No production attack traffic or live secret is required.

## Protected-operation verification contract

For a corrected account, object, or role boundary:

| Case | Expected behavior |
| --- | --- |
| Valid actor and owned/allowed target | Existing legitimate read or mutation succeeds with its documented response shape |
| No session or inactive account | No protected data or mutation; existing authentication failure semantics |
| Other customer or lesser role | No protected data or mutation; denial does not expose the target record |
| Unexpected identity, role, owner, price, or status field | Server rejects or ignores the claim according to the existing route contract; protected state follows trusted records |
| Malformed, oversized, or high-cost request | Bounded rejection without protected state change or secret disclosure |

The test must observe both response and persisted state when a mutation is involved. Do not rewrite a route merely because an equivalent existing control uses a different internal shape.

## Payment and external-boundary verification contract

- `POST /api/orders/{id}/pay` retains session and order ownership, server-derived total, cash/credit distinction, zero-total handling, and the response behavior in the payment contract.
- `GET /api/payments/callback` remains accessible for the provider, resolves a persisted authority, verifies successful provider results server-side, and applies each payment and order transition at most once. Callback `orderId` does not choose the target order. A generic inbound HMAC requirement is not assumed for this provider.
- A repeated, uncertain, invalid, or competing callback leaves order, payment, stock, and credit state consistent with the existing payment contract. Record what can only be tested with a provider sandbox as unverified until that environment is available.
- Uploads and external requests are tested against the precise file/destination policy of their route, including size, contents, redirects, private storage, and protected retrieval when applicable. A helper or admin role check alone is insufficient evidence for all cases.
- Existing API success/failure envelopes and stable error codes in `docs/api/auth.md` remain compatible, except for an explicitly documented, security-required change with matching authorized and denied regression checks.

## Report and handoff contract

The implementation report must include provenance and installed-file verification, inspected environment/date, inventory, finding table, correction diff references, repeat-check results, and unverified conditions. For each confirmed critical or high finding, either record a verified correction or an owner-visible Beads follow-up with the blocker. A complete report does not imply that production deployment, provider behavior, or every possible attack was tested.
