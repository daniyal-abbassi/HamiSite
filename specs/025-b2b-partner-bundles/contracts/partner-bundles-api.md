# Contract: Partner Bundles Showcase API

**Target Endpoint Group**: `/api/partners/bundles`
**Authorization**: `withAuth(..., { roles: [Role.WHOLESALE, Role.AGENT, Role.ADMIN] })`

---

## 1. List Available Partner Bundles
- **Method**: `GET`
- **Path**: `/api/partners/bundles`
- **Description**: Returns all active bundles visible to the authenticated partner. Excludes deactivated bundles.
- **Query Parameters**:
  - `page`: Integer (default: 1)
  - `pageSize`: Integer (default: 12)
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "سبد اقتصادی شارژر و کابل همکار",
        "slug": "charger-cable-bundle-eco",
        "description": "پکیج شامل ۵ شارژر و ۷ کابل تایپ‌سی انکر با قیمت رقابتی برای فروشگاه‌های همکار",
        "price": 2500000,
        "compareAtPrice": 3200000,
        "savingsAmount": 700000,
        "savingsPercent": 22,
        "stock": 10,
        "isAvailable": true,
        "imageUrl": "/uploads/bundles/sample.jpg",
        "items": [
          {
            "id": 1,
            "productId": 101,
            "productName": "شارژر ۲۰ وات انکر",
            "variantId": 205,
            "variantName": "سفید",
            "quantity": 5,
            "unitPrice": 400000,
            "thumbnailUrl": "/images/products/anker-20w.jpg"
          },
          {
            "id": 2,
            "productId": 102,
            "productName": "کابل تایپ سی انکر",
            "variantId": null,
            "variantName": null,
            "quantity": 7,
            "unitPrice": 170000,
            "thumbnailUrl": "/images/products/anker-cable.jpg"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "total": 1,
      "hasNextPage": false
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request (guest).
  - `403 Forbidden`: Authenticated user does not possess `WHOLESALE`, `AGENT`, or `ADMIN` role.

---

## 2. Get Single Partner Bundle Details
- **Method**: `GET`
- **Path**: `/api/partners/bundles/[slug]`
- **Description**: Detailed bundle view with full breakdown of items.
- **Response `200 OK`**: Single bundle object as above.
- **Error Responses**:
  - `404 Not Found`: Bundle not found or inactive.
  - `403 Forbidden`: Non-partner access blocked.

