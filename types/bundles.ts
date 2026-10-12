export interface PartnerBundleItemDTO {
  id: number;
  productId: number;
  productName: string;
  productEnglishName?: string | null;
  productSlug?: string;
  variantId: number | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number | null;
  stock: number;
  imageUrl?: string | null;
}

export interface PartnerBundleDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  savingsAmount: number;
  savingsPercent: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
  totalUnitsCount: number;
  isAvailable: boolean;
  maxPurchasableUnits: number;
  items: PartnerBundleItemDTO[];
}

export interface CreateBundleItemInput {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface CreateBundleInput {
  title: string;
  slug?: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isActive?: boolean;
  imageUrl?: string | null;
  items: CreateBundleItemInput[];
}

export interface UpdateBundleInput extends Partial<CreateBundleInput> {}

