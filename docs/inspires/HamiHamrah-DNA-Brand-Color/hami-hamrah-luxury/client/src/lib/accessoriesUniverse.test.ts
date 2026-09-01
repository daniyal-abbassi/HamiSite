import { describe, expect, it } from "vitest";
import { accessoryCategories, getAccessoryCategory } from "./accessoriesUniverse";

describe("Accessories Universe categories", () => {
  it("maps the curated accessory worlds to existing shop category routes", () => {
    expect(accessoryCategories.map((category) => category.href)).toEqual([
      "/shop?category=audio",
      "/shop?category=power-bank",
      "/shop?category=charger",
      "/shop?category=smartwatch",
      "/shop?category=speaker",
    ]);
  });

  it("returns a selected category without catalog, price, stock, or product claims", () => {
    const audio = getAccessoryCategory("audio");
    expect(audio).toMatchObject({ key: "audio", label: "AUDIO", href: "/shop?category=audio" });
    expect(Object.keys(audio)).not.toEqual(expect.arrayContaining(["price", "stock", "products", "inventory"]));
  });
});
