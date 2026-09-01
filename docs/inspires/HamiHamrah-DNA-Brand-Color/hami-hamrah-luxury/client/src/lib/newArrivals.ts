import type { Product } from "@shared/commerce/types";

export type NewArrivalCard = {
  handle: string;
  title: string;
  brand: string;
  image: string | null;
  imageAlt: string;
  price: Product["priceRange"]["min"];
  available: boolean;
  availabilityLabel: "موجود" | "ناموجود";
};

export function toNewArrivalCard(product: Product): NewArrivalCard {
  const available = product.variants.some((variant) => variant.availableForSale);

  return {
    handle: product.handle,
    title: product.title,
    brand: product.vendor || "HAMI",
    image: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.altText || product.title,
    price: product.priceRange.min,
    available,
    availabilityLabel: available ? "موجود" : "ناموجود",
  };
}
