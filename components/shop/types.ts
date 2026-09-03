export type ShopCategory = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children?: ShopCategory[];
};

export type ShopBrand = {
  id: number;
  name: string;
  slug: string;
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
};

export type ShopMeta = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};
