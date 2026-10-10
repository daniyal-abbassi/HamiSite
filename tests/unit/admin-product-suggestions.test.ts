import { describe, expect, it } from "vitest";
import { productDisplayName, rankProductSuggestions, type ProductSuggestion } from "@/lib/admin-product-suggestions";

const products: ProductSuggestion[] = [
  { id: 1, name: "گوشی آلفا", englishName: "Alpha Phone", slug: "alpha-phone" },
  { id: 2, name: "گوشی بتا", englishName: null, slug: "beta-phone" },
  { id: 3, name: "کیف آلفا", englishName: "Phone Case", slug: "alpha-case" },
];

describe("admin product suggestions", () => {
  it("shows English names first and falls back to Persian", () => {
    expect(productDisplayName(products[0])).toBe("Alpha Phone");
    expect(productDisplayName(products[1])).toBe("گوشی بتا");
    expect(rankProductSuggestions(products, "A").map((product) => product.id)).toEqual([1, 3, 2]);
  });

  it("finds folded Persian text and limits the suggestions", () => {
    expect(rankProductSuggestions(products, "آلفا", 1).map((product) => product.id)).toEqual([1]);
    expect(rankProductSuggestions(products, "   ")).toEqual([]);
  });
});
