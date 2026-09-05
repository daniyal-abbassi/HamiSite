/** Pure catalog types & helpers — safe to import from client components. */

export type ProductView = {
  id: number;
  slug: string;
  name: string;
  price: number;
  dealPrice: number | null;
  dealEndsAt: string | null;
  image: string;
  color: string;
  storage: string | null;
  badge: string | null;
  isNew: boolean;
  isFlagship: boolean;
  stock: number;
  rating: number;
  specs: Record<string, string>;
  description: string;
  brandSlug: string;
  brandName: string;
  brandWorld: string;
  categorySlug: string;
  categoryName: string;
  categoryWorld: string;
};

export type BrandView = {
  id: number;
  slug: string;
  nameFa: string;
  nameEn: string;
  tagline: string;
  world: string;
  sort: number;
};

export type CategoryView = {
  id: number;
  slug: string;
  nameFa: string;
  world: string;
  sort: number;
};

export type GalleryView = {
  id: number;
  src: string;
  title: string;
  caption: string;
  aspect: string;
  sort: number;
};

export function discount(p: { price: number; dealPrice: number | null }) {
  if (!p.dealPrice) return 0;
  return Math.round((1 - p.dealPrice / p.price) * 100);
}
