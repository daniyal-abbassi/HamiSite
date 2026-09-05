/**
 * Admin dashboard types — shapes as produced by the existing API surface.
 * No backend changes; product-list uses the public /api/products endpoint
 * (available products only), product edit keeps fields the public detail
 * endpoint exposes.
 */

import type { Address, OrderDetail } from "@/types/store";

// ---------------------------------------------------------------------------
// Products (public endpoints)
// ---------------------------------------------------------------------------

export type AdminProductListItem = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  description: string | null;
  specialOffer: boolean;
  specialOfferEnd: string | null;
  available: boolean;
  stockType: string;
  brand: { id: number; name: string; slug: string } | null;
  mainCategory: { id: number; name: string; slug: string } | null;
  tags: string[];
  images: { id: number; url: string; altText: string | null; isDefault: boolean; order: number }[];
  basePrice: number;
  compareAtPrice: number | null;
  displayPrice: number;
  variants: AdminVariantListItem[];
};

export type AdminVariantListItem = {
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
  quoted: {
    quantity: number;
    paymentTerm: string;
    role: string;
    unitPrice: number;
    matchedTier: {
      id: number;
      minQuantity: number;
      maxQuantity: number | null;
      discountPercent: number | null;
      calculatedPrice: number | null;
    } | null;
  };
};

/** Product-detail shape (already typed as ProductDetail) is reused for edit;
 * a few admin-only fields are PATCH-able even though not prefilled. */
export type AdminProductDetail = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  isDigital: boolean;
  stock: number;
  // + all ProductDetail fields (see types/store.ts ProductDetail)
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** `sanitizeUser` output — same as PublicUser (types/auth.ts). Re-exported for
 * admin list ergonomics. */
export type { PublicUser as AdminUser } from "@/types/auth";

// ---------------------------------------------------------------------------
// Categories & brands (public list shapes)
// ---------------------------------------------------------------------------

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  iconUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  level: number;
  order: number;
  children?: AdminCategory[];
};

export type AdminBrand = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string | null;
  iconUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

// ---------------------------------------------------------------------------
// Create payloads (POST bodies — must match zod schemas in app/api/admin/*)
// ---------------------------------------------------------------------------

export type CreateProductInput = {
  name: string;
  slug: string;
  englishName?: string;
  description?: string;
  analysis?: string;
  mainCategoryId?: number;
  brandId?: number;
  isDigital?: boolean;
  price: number;
  compareAtPrice?: number;
  specialOffer?: boolean;
  specialOfferEnd?: string;
  costPerItem?: number;
  batchSize?: number;
  available?: boolean;
  showPrice?: boolean;
  hasVariants?: boolean;
  stock?: number;
  stockType?: "UNLIMITED" | "LIMITED" | "OUT_OF_STOCK" | "CALL";
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  guarantee?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type CreateVariantInput = {
  color?: string;
  storage?: string;
  guarantee?: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  stockType?: "UNLIMITED" | "LIMITED" | "OUT_OF_STOCK" | "CALL";
  barcode?: string;
  productIdentifier?: string;
  isDefault?: boolean;
  imageId?: number;
};

export type CreateCouponInput = {
  name: string;
  code: string;
  /** PERCENT_BASED | AMOUNT_BASED | SHIPPING_PRICE */
  type: string;
  amount?: number;
  usageLimitPerCoupon?: number;
  usageLimitPerUser?: number;
  startDate?: string;
  endDate?: string;
  maxDiscountAmount?: number;
  minCartPrice?: number;
  minSuccessfulOrderCount?: number;
  onlyFirstOrder?: boolean;
  paymentMethods?: string[];
  isActive?: boolean;
  productIds?: number[];
  categoryIds?: number[];
  brandIds?: number[];
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  imageUrl?: string;
  imageAlt?: string;
  iconUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  available?: boolean;
  categoriesMenuShow?: boolean;
  topMenuSeparateShow?: boolean;
  order?: number;
};

export type CreateBrandInput = {
  name: string;
  slug: string;
  imageUrl?: string;
  imageAlt?: string;
  iconUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive?: boolean;
  order?: number;
};

// Re-export the OrderDetail shape used by both customer and admin order pages.
export type AdminOrderDetail = OrderDetail;

export type AdminOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELED"
  | "FAILED"
  | "REVERSED";

export { type Address as AdminAddress };