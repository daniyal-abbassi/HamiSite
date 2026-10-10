import { foldPersian } from "@/lib/persian";

export type ProductSuggestion = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
};

export function productDisplayName(product: Pick<ProductSuggestion, "name" | "englishName">) {
  return product.englishName?.trim() || product.name;
}

export function rankProductSuggestions(products: ProductSuggestion[], query: string, limit = 8) {
  const needle = foldPersian(query.trim());
  if (!needle) return [];

  return products
    .map((product) => {
      const title = foldPersian(productDisplayName(product));
      const persian = foldPersian(product.name);
      const slug = foldPersian(product.slug);
      const score = title.startsWith(needle) ? 0
        : title.includes(needle) ? 1
          : persian.includes(needle) ? 2
            : slug.includes(needle) ? 3
              : -1;
      return { product, score };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score || productDisplayName(a.product).localeCompare(productDisplayName(b.product)) || a.product.id - b.product.id)
    .slice(0, limit)
    .map(({ product }) => product);
}
