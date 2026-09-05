/**
 * Frontend store types — mirror the serialized API shapes exactly.
 * Source of truth per shape:
 *  - Cart/CartItem  → lib/cart.ts `serializeCart`
 *  - ProductDetail  → app/api/products/[slug]/route.ts response
 *  - OrderSummary   → lib/orders.ts `serializeOrderSummary`
 *  - OrderDetail    → app/api/orders/[id]/route.ts response
 *  - Address        → prisma Address row as returned by /api/addresses
 * All Decimal fields arrive as numbers; all DateTime fields as ISO strings.
 */

export type CartItemImage = { url: string; altText: string | null };

export type CartItem = {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  currentUnitPrice: number;
  priceChanged: boolean;
  lineTotal: number;
  product: {
    id: number;
    name: string;
    slug: string;
    available: boolean;
    stockType: string;
    image: CartItemImage | null;
  };
  variant: {
    id: number;
    color: string | null;
    storage: string | null;
    price: number | null;
    stock: number;
    stockType: string;
  } | null;
};

export type Cart = {
  id: number | null;
  userId: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  updatedAt: string | null;
};

export type PriceTierMatch = {
  id: number;
  minQuantity: number;
  maxQuantity: number | null;
  discountPercent: number | null;
  calculatedPrice: number | null;
};

export type ProductVariantDetail = {
  id: number;
  color: string | null;
  storage: string | null;
  guarantee: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  stockType: string;
  barcode: string | null;
  productIdentifier: string | null;
  isDefault: boolean;
  /** Unit price for the requested quantity/paymentTerm — already tier-resolved. */
  unitPrice: number;
  matchedTier: PriceTierMatch | null;
};

export type ProductDetail = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  description: string | null;
  analysis: string | null;
  isDigital: boolean;
  specialOffer: boolean;
  specialOfferEnd: string | null;
  stockType: string;
  stock: number;
  brand: { id: number; name: string; slug: string } | null;
  mainCategory: { id: number; name: string; slug: string } | null;
  otherCategories: { id: number; name: string; slug: string }[];
  tags: string[];
  images: { id: number; url: string; altText: string | null; isDefault: boolean; order: number }[];
  variants: ProductVariantDetail[];
  createdAt: string;
  updatedAt: string;
};

export type Address = {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  province: string | null;
  city: string;
  address: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderPaymentView = {
  id: number;
  transactionNumber: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
};

export type OrderSummaryItem = {
  id: number;
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  price: number;
  discountAmount: number;
  lineTotal: number;
};

export type OrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  customer: { id: number; username: string; role: string; phoneNumber: string };
  shipping: { methodName: string | null; shippingPrice: number; trackingCode: string | null };
  totals: { subtotal: number; discountAmount: number; taxAmount: number; totalAmount: number };
  createdAt: string;
  updatedAt: string;
  items: OrderSummaryItem[];
  payments: OrderPaymentView[];
};

export type OrderDetail = OrderSummary & {
  agent: { id: number; username: string; role: string } | null;
  address: Address | null;
  coupon: { id: number; code: string; name: string | null; type: string } | null;
  customerNote: string | null;
};

export type CouponValidation = {
  valid: boolean;
  reason?: string;
  coupon: { id: number | null; code: string; name: string | null; type: string } | null;
  discountAmount: number;
};

/** POST /api/orders response */
export type OrderCreationResult = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentTerm: string;
  customer: { id: number; username: string; role: string };
  coupon: { id: number; code: string; name: string | null; type: string } | null;
  totals: { subtotal: number; shippingPrice: number; discountAmount: number; totalAmount: number };
  items: { id: number; productId: number; variantId: number | null; productName: string; variantName: string | null; quantity: number; price: number; lineTotal: number }[];
  createdAt: string;
};

/** POST /api/orders/[id]/pay response */
export type PaymentInitiation = { redirectUrl: string; authority: string };
