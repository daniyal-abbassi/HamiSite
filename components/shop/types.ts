export type ShopCategory = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children?: ShopCategory[];
  /**
   * Products reachable at or below this category, resolved server-side. FR-028 asks
   * for entry points "with meaningful grouping and counts", and an entry point with
   * no number next to it is the undifferentiated list the requirement names.
   */
  productCount?: number;
};

export type ShopBrand = {
  id: number;
  name: string;
  slug: string;
  /** Same reason as on the category. */
  productCount?: number;
};

export type ShopProduct = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  specialOffer: boolean;
  brand: { id: number; name: string; slug: string } | null;
  mainCategory: { id: number; name: string; slug: string } | null;
  displayPrice: number;
  compareAtPrice: number | null;
  stockType: string;
  /**
   * `p.stock.purchasable` in the export — the merchant's own word on whether they
   * can sell it today. `stockType` says how the shelf looks; this says whether a
   * cart control is honest. 16 records are "limited" with this false.
   */
  available: boolean;
};

export type ShopMeta = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};
