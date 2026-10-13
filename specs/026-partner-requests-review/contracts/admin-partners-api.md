# Contract: Admin Partner Applications API

**Feature**: `026-partner-requests-review`  
**Base URL**: `/api/admin/partners`  
**Authentication**: Required (Cookie-based session with `role === Role.ADMIN`)

---

## 1. List Applications

`GET /api/admin/partners`

### Query Parameters
- `page` (optional, default `1`): Page number (integer >= 1).
- `limit` (optional, default `20`): Page size (integer between 1 and 50).
- `status` (optional): `PENDING` | `APPROVED` | `REJECTED` | `ALL`.
- `entityType` (optional): `INDIVIDUAL` | `LEGAL`.
- `search` (optional): Filter text matching `fullName`, `mobile`, `nationalCode`, `shopName`, `companyName`.

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "entityType": "INDIVIDUAL",
        "status": "PENDING",
        "fullName": "رضا رضایی",
        "mobile": "+989361234567",
        "nationalCode": "0012345679",
        "shopName": "فروشگاه موبایل رضایی",
        "shopAddress": "مشهد، خیابان احمدآباد، مجتمع ورسیج، پلاک ۱۲",
        "postalCode": "9173512345",
        "shopPhone": "05138401234",
        "hasLeaseDocument": true,
        "hasBusinessLicense": true,
        "hasRegistrationNotice": false,
        "notes": null,
        "reviewedBy": null,
        "reviewedAt": null,
        "createdAt": "2026-10-12T22:03:57.218Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "counts": {
      "pending": 1,
      "approved": 0,
      "rejected": 0,
      "total": 1
    }
  }
}
```

---

## 2. Get Single Application Detail

`GET /api/admin/partners/[id]`

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entityType": "INDIVIDUAL",
    "status": "PENDING",
    "fullName": "رضا رضایی",
    "mobile": "+989361234567",
    "nationalCode": "0012345679",
    "shopName": "فروشگاه موبایل رضایی",
    "shopAddress": "مشهد، خیابان احمدآباد، مجتمع ورسیج، پلاک ۱۲",
    "postalCode": "9173512345",
    "shopPhone": "05138401234",
    "companyName": null,
    "companyAddress": null,
    "legalNationalId": null,
    "economicCode": null,
    "documents": {
      "leaseDocument": "/api/admin/partners/1/documents/leaseDocument",
      "businessLicense": "/api/admin/partners/1/documents/businessLicense",
      "registrationNotice": null
    },
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0 ...",
    "notes": null,
    "reviewer": null,
    "reviewedAt": null,
    "createdAt": "2026-10-12T22:03:57.218Z",
    "updatedAt": "2026-10-12T22:03:57.218Z"
  }
}
```

### Error Responses
- `401 Unauthorized`: Not logged in.
- `403 Forbidden`: User is not an admin.
- `404 Not Found`: Application ID does not exist.

---

## 3. Review Decision (Approve / Reject)

`POST /api/admin/partners/[id]/decision`

### Request Body
```json
{
  "action": "APPROVE", // or "REJECT"
  "note": "مدارک بررسی و احراز هویت شد." // Required if action === "REJECT"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "APPROVED",
    "reviewedAt": "2026-10-13T01:45:00.000Z",
    "userElevated": {
      "userId": 4336,
      "phoneNumber": "+989361234567",
      "role": "WHOLESALE",
      "shopName": "فروشگاه موبایل رضایی"
    }
  },
  "message": "درخواست با موفقیت تأیید و حساب کاربری همکار فعال شد."
}
```

### Error Responses
- `400 Bad Request`: Validation failure (e.g. missing rejection note).
- `409 Conflict`: Application has already been decided (`APPROVED` or `REJECTED`).

---

## 4. Secure Document Stream

`GET /api/admin/partners/[id]/documents/[docType]`

- `docType`: `leaseDocument` | `businessLicense` | `registrationNotice`
- **Headers Returned**:
  - `Content-Type`: `image/jpeg` | `image/png` | `image/webp` | `application/pdf`
  - `Content-Disposition`: `inline; filename="leaseDocument.png"`
  - `Cache-Control`: `private, no-cache`

