import { describe, expect, it } from "vitest";
import { additionalProductsRail } from "@/lib/home-rails";
import { queryProducts } from "@/lib/catalog";

describe("additionalProductsRail", () => {
  it("continues the catalog shelf without repeating its first twelve products", () => {
    const firstShelf = queryProducts({ sort: "newest", page: 1, pageSize: 12 }).data;
    const allNewest = queryProducts({ sort: "newest", page: 1, pageSize: 1_000 }).data;
    const expectedContinuation = allNewest.slice(12, 18);
    const additionalProducts = additionalProductsRail();
    const firstShelfIds = new Set(firstShelf.map(({ id }) => id));

    expect(additionalProducts.map(({ id }) => id)).toEqual(expectedContinuation.map(({ id }) => id));
    expect(additionalProducts.every(({ id }) => !firstShelfIds.has(id))).toBe(true);
    expect(allNewest.map(({ createdAt }) => createdAt)).toEqual(
      [...allNewest.map(({ createdAt }) => createdAt)].sort((a, b) => (b ?? "").localeCompare(a ?? "")),
    );
  });
});
