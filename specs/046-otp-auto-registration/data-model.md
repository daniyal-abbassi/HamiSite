# Data Model: Automatic Registration

No schema change. All fields already exist on `User`.

## User (created by this feature)

| Field | Value on auto-registration |
|-------|----------------------------|
| `phoneNumber` | canonical E.164 number from the verified challenge (unique) |
| `phoneVerified` / `phoneVerifiedAt` | `true` / database time of verification |
| `username` | `"m"` + the digits of `phoneNumber` (unique) |
| `passwordHash` | hash of 48 random bytes; unusable as a password |
| `role` | `RETAIL` |
| `isActive` | `true` (default) |
| `firstName`, `lastName`, `email`, `city`, `nationalNumber` | empty |
| `businessVerified`, `shopName`, `businessLicenseNumber` | defaults (not verified, empty) |
| `creationMethod` | `"otp-auto"` |

## OtpCode (existing)
Unchanged. For LOGIN challenges, `userId` stays null when the number had no account at request time; verify resolves the user afterwards.

## State transition
`no user` --(valid code, LOGIN challenge)--> `RETAIL user, phone verified, session created`
Invalid, expired, locked or reused code: no user, no session.

## Invariants
- At most one `User` per `phoneNumber` (database unique index).
- A session is created only in the same transaction that consumed a valid code.
