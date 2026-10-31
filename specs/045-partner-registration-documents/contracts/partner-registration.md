# Contract: Partner Registration

## `POST /api/auth/register/partner` (new)

**Requires**: a same-origin request, and the `registration_proof` cookie from a REGISTER mobile verification.

**Body**: `multipart/form-data`

| Field | Type | When |
|---|---|---|
| `entityType` | `INDIVIDUAL` or `LEGAL` | always |
| `fullName`, `nationalCode`, `shopName`, `shopAddress` | text | always |
| `postalCode`, `shopPhone` | text | INDIVIDUAL |
| `companyName`, `companyAddress`, `legalNationalId`, `economicCode` | text | LEGAL |
| `leaseDocument` | file | always |
| `businessLicense` | file | INDIVIDUAL |
| `registrationNotice` | file | LEGAL |

A `mobile` field, if sent, is ignored. The verified number is used.

**Success**: `200`, using the standard envelope. It sets the session cookie and clears the proof cookie.

```json
{
  "success": true,
  "data": {
    "user": "PublicUser, with role RETAIL",
    "application": { "id": 1, "entityType": "INDIVIDUAL", "status": "PENDING" }
  }
}
```

**Errors**

| Status | Code | Meaning | Side effects |
|---|---|---|---|
| 400 | `MALFORMED_JSON` | Body is not multipart | None |
| 400 | `VALIDATION_FAILED` | `details.fieldErrors` for text; `details.field` for a document | None |
| 401 | `REGISTRATION_PROOF_REQUIRED` | Proof is missing, expired or used | None |
| 403 | `FORBIDDEN` | Cross-origin request | None |
| 409 | `CONFLICT` | This mobile already has an application | None; proof stays valid |
| 409 | `DUPLICATE_ACCOUNT` | This mobile already has an account | None; proof stays valid |

Stored files are removed on any failure after they are written.

## `POST /api/auth/register` (changed)

- `role` accepts only `RETAIL`. `WHOLESALE`, `AGENT` and `ADMIN` return `400 VALIDATION_FAILED`.
- `shopName`, `businessLicenseNumber` and `agentId` are removed.
- Everything else is unchanged. `docs/api/auth.md` MUST be updated in the same change.

## `POST /api/partners` (unchanged)

Same fields, responses and anonymous access. Only its internals move to the shared parser.

## Registration form

- «همکار عمده» shows the حقیقی/حقوقی choice, then that type's fields and documents.
- The form sends `multipart/form-data` to the new endpoint.
- On success it shows an under-review confirmation, and does not imply wholesale access.
- Field errors from `details.fieldErrors` and `details.field` appear on their fields.
