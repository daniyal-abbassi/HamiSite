# Contract: Cart & Checkout Bundle Integration

**Target Endpoints**:
1. `/api/cart/items` (POST, PATCH, DELETE)
2. `/api/orders` (POST)
**Authorization**: `withAuth(..., { roles: [Role.WHOLESALE, Role.AGENT, Role.ADMIN] })` for bundles

---

## 1. Add Bundle to Cart
- **Method**: `POST`
- **Path**: `/api/cart/items`
- **Request Body**:
  ```json
  {
    "bundleId": 1,
    "quantity": 2
  }
  ```
- **Validation**:
  - Exactly one of `productId` OR `bundleId` must be supplied.
  - User must be a verified partner (`Role.WHOLESALE` or `Role.AGENT`).
  - Bundle must be active and have `stock >= quantity`.
  - Constituent items in bundle must have available warehouse stock.
- **Response `200 OK`**:
  ```json
  {
    "id": 42,
    "items": [
      {
        "id": 105,
        "bundleId": 1,
        "isBundle": true,
        "bundleTitle": "سبد اقتصادی شارژر و کابل همکار",
        "quantity": 2,
        "unitPrice": 2500000,
        "totalPrice": 5000000,
        "items": [
          {
            "productName": "شارژر ۲۰ وات انکر",
            "quantity": 5,
            "totalQuantity": 10
          },
          {
            "productName": "کابل تایپ سی انکر",
            "quantity": 7,
            "totalQuantity": 14
          }
        ]
      }
    ],
    "subtotal": 5000000,
    "totalAmount": 5000000
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Non-partner user attempted to add bundle.
  - `409 Conflict`: Insufficient stock for bundle or constituent items.

---

## 2. Order Submission with Bundle
- **Method**: `POST`
- **Path**: `/api/orders`
- **Request Body**:
  ```json
  {
    "items": [
      {
        "bundleId": 1,
        "quantity": 1
      }
    ],
    "paymentTerm": "CASH",
    "paymentMethod": "zarinpal",
    "firstName": "رضا",
    "lastName": "حسینی",
    "phone": "09123456789",
    "city": "مشهد",
    "addressText": "خیابان احمدآباد، نبش عدالت ۲"
  }
  ```
- **Enforced Business Rules**:
  - If any item in `items` has `bundleId`, `paymentTerm` MUST be `"CASH"`.
  - If `paymentTerm` is `"CREDIT_60_DAYS"`, the request is rejected with `400 Bad Request` («خرید سبدهای تخفیف‌دار همکار فقط به‌صورت نقدی و پرداخت آنی امکان‌پذیر است»).
  - In the transaction:
    - Decrements `bundle.stock` by order bundle quantity.
    - Decrements each constituent product's base stock by `constituentQuantity * orderBundleQuantity`.
- **Response `200 OK`**:
  ```json
  {
    "id": 204,
    "orderNumber": "ORD-20261012-9841",
    "status": "PENDING",
    "paymentStatus": "INITIATED",
    "paymentTerm": "CASH",
    "totalAmount": 2500000,
    "items": [
      {
        "id": 512,
        "bundleId": 1,
        "productName": "سبد اقتصادی شارژر و کابل همکار",
        "quantity": 1,
        "price": 2500000,
        "lineTotal": 2500000
      }
    ]
  }
  ```

