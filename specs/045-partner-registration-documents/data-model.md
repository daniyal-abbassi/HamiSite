# Data Model: Partner Registration with Business Documents

No schema change. `db:push` is not needed.

## Records written by partner registration

| Record | Fields set | Notes |
|---|---|---|
| `User` | `username` generated, random unusable `passwordHash`, `role = RETAIL`, `firstName` and `lastName` split from the full name, `phoneNumber` from the proof, `phoneVerified = true`, `phoneVerifiedAt`, `nationalNumber`, `shopName`, `creationMethod = "otp"` | `businessVerified` stays false |
| `PartnerApplication` | `entityType`, `status = PENDING`, identity and shop fields, business-type fields, stored document names, `ipAddress`, `userAgent` | `mobile` is unique and normalized |
| `RegistrationProof` | `consumedAt` | Consumed only inside the commit transaction |
| `Session` | Standard session | Sets the session cookie |

## Linking

`User` and `PartnerApplication` have no foreign key. They are linked by mobile number, as approval already does.

## State transitions

```text
Application: PENDING -> APPROVED  (account role becomes WHOLESALE, businessVerified = true)
             PENDING -> REJECTED  (account stays RETAIL)

Account:     RETAIL -> WHOLESALE  only through executeApplicationDecision
```

## Validation

Identical to `/api/partners`, from the shared parser:

| Business type | Required text | Required documents |
|---|---|---|
| Both | full name, national code, shop name, shop address | lease document |
| INDIVIDUAL | postal code, shop phone | business licence |
| LEGAL | company name and address, legal national ID, economic code | registration notice |

Documents: JPG, PNG, WebP or PDF, at most 10 MB each, not empty.

## Storage

Files go to `data/uploads/partner-documents/` under random names, and only the filename is stored. Files written during a failed attempt are removed.
