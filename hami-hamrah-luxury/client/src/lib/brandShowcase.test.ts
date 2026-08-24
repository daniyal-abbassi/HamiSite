import { describe, expect, it } from "vitest";
import { brandWall, getBrandStory } from "./brandShowcase";

describe("brand showcase model", () => {
  it("maps each featured wall entry to a complete Brand Story", () => {
    const featured = brandWall.filter((brand) => brand.story);
    expect(featured).toHaveLength(3);
    expect(featured.map((brand) => getBrandStory(brand.story!).name)).toEqual(["APPLE", "SAMSUNG", "XIAOMI"]);
  });

  it("keeps non-featured brands logo-only instead of inventing a Story", () => {
    expect(brandWall.filter((brand) => !brand.story).map((brand) => brand.name)).toEqual(["NOKIA", "REALME", "TCH", "VOCAL", "NEXA", "OAK"]);
  });
});
