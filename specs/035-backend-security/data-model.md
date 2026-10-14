# Data Model: Backend Security Review

This feature models audit evidence. It does **not** create a production table or migration. Existing `User`, `Session`, `Order`, `Payment`, catalog, and upload records remain governed by their current application and payment contracts.

## Protected Operation

| Field | Meaning | Validation |
| --- | --- | --- |
| `operationId` | Stable audit identifier for a route or server operation | Unique within the review |
| `entryPoint` | Route, callback, job, or server helper | Existing source path and method where applicable |
| `actorClass` | Guest, customer, staff role, provider, or internal worker | Named from existing roles or external contract; no invented principal |
| `targetType` | Account, address, order, payment, product, file, etc. | Existing record or resource type |
| `permissionRule` | Required identity, role, ownership, state, or eligibility | Traceable to contract or confirmed behavior |
| `expectedEffect` | Read, create, update, delete, external request, or state transition | Match observed code path |
| `reviewStatus` | Inspected, not applicable, or unverified | Include evidence or limitation |

One operation may cross several trust boundaries and have several test cases.

## Trust Boundary

| Field | Meaning | Validation |
| --- | --- | --- |
| `boundaryId` | Stable audit identifier | Unique within the review |
| `operationId` | Operation that receives or acts on the input | Must identify an inventoried operation |
| `inputSource` | Body, query, path, cookie, header, file, provider response, imported record, or scheduled message | State the actual source |
| `sensitiveSink` | Protected record, settlement, file path, outbound destination, log, or response | State the actual target |
| `currentControl` | Observed validation, authorization, transaction, size/timeout bound, or output restriction | Name evidence, not an assumed guarantee |
| `testAccess` | Isolated runtime, source-only, provider sandbox, or unavailable | Never imply a test ran when it did not |

## Security Finding

| Field | Meaning | Validation |
| --- | --- | --- |
| `findingId` | Stable report identifier | Unique within the review |
| `operationId` / `boundaryId` | Affected path and trust boundary | At least one must resolve to the inventory |
| `severity` | Critical, high, medium, or low | State potential harm and scope |
| `evidenceStatus` | Observed, source-only concern, or unverified | Observed requires a reproducible runtime result; source proof stays labeled as source evidence |
| `evidence` | Safe request/test description and result or source reference | Do not store live credentials, tokens, or personal data |
| `impact` | Consequence for a shopper, staff member, store funds, or data | Concrete and bounded |
| `correction` | Smallest supported fix or explicit follow-up | Preserve existing legitimate contract where possible |
| `state` | Open, corrected-pending-verification, verified, or deferred | Must agree with verification records |

A concern changes from **source-only** to **observed** only after a reproducible runtime result. A code change moves a finding to **corrected-pending-verification**; matching denied, authorized, and relevant boundary-case checks move it to **verified**. If safe testing or correction is unavailable, keep it **open** or **deferred** with the blocker and Beads follow-up. Do not mark a source-only concern verified.

## Verification Result

| Field | Meaning | Validation |
| --- | --- | --- |
| `findingId` | Finding being checked | Must exist |
| `environment` / `date` | Where and when the result was observed | Nonproduction unless separately authorized |
| `caseType` | Authorized, unauthorized, cross-account, replay, concurrent, malformed, oversized, or unavailable | Match the finding's risk |
| `expectedOutcome` / `actualOutcome` | Observable response and protected state | Record both; do not rely on response status alone |
| `recordEffect` | Whether the target or unrelated data changed | State how confirmed, or mark unverified |
| `limitations` | Missing credentials, sandbox, production behavior, or other uncertainty | Required when outcome cannot be checked |

Every corrected finding links to at least one denied-path and one authorized-path result. Payment and concurrency findings also link to replay or competing-request results when those are the reported attack path.

## Review Record

| Field | Meaning | Validation |
| --- | --- | --- |
| `guidanceSource` / `revision` | Selected skill provenance | Confirm installed files during implementation |
| `environment` / `date` | Inspected runtime and data scope | No connection secrets in report |
| `operationInventory` | All categories named by FR-002 | Each has an inspected example or evidence-based not-applicable entry |
| `findings` / `verifications` | References to the records above | No silent omissions or fabricated passes |
| `unverifiedBoundaries` | Provider, authenticated, production, or external tests not exercised | Include reason and next safe action |

The review record is saved under this feature's documentation during implementation. Beads tracks unresolved correction work; it is not used to store exploit strings or secrets.
