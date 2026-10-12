# Contract: Admin Bundles API

**Target Endpoint Group**: `/api/admin/bundles`
**Authorization**: `withAuth(..., { roles: [Role.ADMIN] })`

---

## 1. List Bundles
- **Method**: `GET`
- **Path**: `/api/admin/bundles`
- **Query Parameters**:
  - `page`: Integer (default: 1)
  - `pageSize`: Integer (default: 20)
  - `q`: String (optional search by title)
  - `isActive`: Boolean string `"true"` | `"false"` (optional filter)
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "سبد اقتصادی شارژر و کابل همکار",
        "slug": "charger-cable-bundle-eco",
        "price": 2500000,
        "compareAtPrice": 3200000,
        "stock": 10,
        "isActive": true,
        "imageUrl": "/uploads/bundles/sample.jpg",
        "createdAt": "2026-10-12T10:00:00.000Z",
        "updatedAt": "2026-10-12T10:00:00.000Z",
        "itemsCount": 3,
        "totalUnitsCount": 12,
        "items": [
          {
            "id": 1,
            "productId": 101,
            "productName": "شارژر ۲۰ وات انکر",
            "variantId": 205,
            "variantName": "سفید",
            "quantity": 5,
            "unitPrice": 400000,
            "stock": 45
          },
          {
            "id": 2,
            "productId": 102,
            "productName": "کابل تایپ سی انکر",
            "variantId": null,
            "variantName": null,
            "quantity": 7,
            "unitPrice": 170000,
            "stock": 80
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "hasNextPage": false
    }
  }
  ```

---

## 2. Create Bundle
- **Method**: `POST`
- **Path**: `/api/admin/bundles`
- **Request Body**:
  ```json
  {
    "title": "سبد اکسسوری پاییزه",
    "description": "تخفیف ویژه همکاران عمده تا پایان هفته",
    "price": 4500000,
    "compareAtPrice": 5800000,
    "stock": 15,
    "isActive": true,
    "imageUrl": "https://example.com/banner.jpg",
    "items": [
      {
        "productId": 101,
        "variantId": 205,
        "quantity": 5
      },
      {
        "productId": 102,
        "variantId": null,
        "quantity": 10
      }
    ]
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": 2,
      "title": "سبد اکسسوری پاییزه",
      "slug": "sbd-akssoory-payyzh",
      "price": 4500000,
      "stock": 15,
      "isActive": true,
      "items": [...]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (empty title, invalid items, non-positive price/stock).
  - `403 Forbidden`: User is not ADMIN.

---

## 3. Update Bundle
- **Method**: `PUT` / `PATCH`
- **Path**: `/api/admin/bundles/[id]`
- **Request Body**: (Full or partial bundle object)
- **Response `200 OK`**: Updated bundle object.
- **Error Responses**:
  - `404 Not Found`: Bundle with ID does not exist.

---

## 4. Delete Bundle
- **Method**: `DELETE`
- **Path**: `/api/admin/bundles/[id]`
- **Response `200 OK`**: `{ "success": true }`

