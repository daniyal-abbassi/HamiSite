import { describe, expect, it } from "vitest";
import { categoryMosaic } from "./categoryMosaic";

describe("categoryMosaic", () => {
  it("keeps mobile as the primary discovery route and services as a distinct final route", () => {
    expect(categoryMosaic[0]?.key).toBe("mobile");
    expect(categoryMosaic.at(-1)?.key).toBe("services");
    expect(categoryMosaic[0]?.layout).toBe("mobile");
    expect(categoryMosaic.at(-1)?.layout).toBe("services");
  });

  it("keeps every Mosaic destination unique, labeled and navigable", () => {
    expect(categoryMosaic).toHaveLength(8);
    expect(categoryMosaic.map((category) => category.key)).toEqual(["mobile", "audio", "charging", "power", "watch", "feature", "party", "services"]);
    expect(new Set(categoryMosaic.map((category) => category.key)).size).toBe(categoryMosaic.length);
    categoryMosaic.forEach((category) => {
      expect(category.title.trim().length).toBeGreaterThan(0);
      expect(category.href).toMatch(/^\/shop\?/);
    });
  });
});
