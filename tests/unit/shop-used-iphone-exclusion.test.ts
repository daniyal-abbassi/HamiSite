import { describe, expect, it } from "vitest";
import { subtreeIds } from "@/lib/shop-query-db";

const tree = [
  { id: 1, parentId: null, slug: "موبایل" },
  { id: 28, parentId: 1, slug: "آیفون-استوک" },
  { id: 29, parentId: 28, slug: "child" },
  { id: 30, parentId: 1, slug: "other" },
];

describe("used-iPhone vitrine exclusion", () => {
  it("returns the category and everything filed below it", () => {
    expect(subtreeIds(tree, "آیفون-استوک").sort()).toEqual([28, 29]);
  });
  it("excludes nothing when the category does not exist", () => {
    expect(subtreeIds(tree, "missing")).toEqual([]);
  });
});
