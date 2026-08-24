import type { Product } from "@shared/commerce/types";

export type FeaturedProductCard = {
  handle: string;
  title: string;
  brand: string;
  category: string;
  image: string | null;
  imageAlt: string;
  price: Product["priceRange"]["min"];
  compareAtPrice: Product["variants"][number]["compareAtPrice"];
  available: boolean;
  stockLabel: "موجود" | "ناموجود";
  hasDiscount: boolean;
  variantLabel: string | null;
  colors: string[];
};

export function toFeaturedProductCard(product: Product): FeaturedProductCard {
  const primaryVariant = product.variants[0] ?? null;
  const available = product.variants.some((variant) => variant.availableForSale);
  const colorOption = product.options.find((option) => /color|رنگ/i.test(option.name));

  return {
    handle: product.handle,
    title: product.title,
    brand: product.vendor || "HAMI",
    category: product.productType || "محصول منتخب",
    image: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.altText || product.title,
    price: product.priceRange.min,
    compareAtPrice: primaryVariant?.compareAtPrice ?? null,
    available,
    stockLabel: available ? "موجود" : "ناموجود",
    hasDiscount: Boolean(primaryVariant?.compareAtPrice),
    variantLabel: primaryVariant && primaryVariant.title !== "Default Title" ? primaryVariant.title : null,
    colors: colorOption?.values ?? [],
  };
}
