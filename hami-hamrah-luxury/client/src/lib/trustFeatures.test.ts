import { describe, expect, it } from "vitest";
import { trustFeatures } from "./trustFeatures";

describe("trustFeatures", () => {
  it("keeps the four approved trust signals in the intended order", () => {
    expect(trustFeatures.map((feature) => feature.key)).toEqual([
      "store",
      "wholesale",
      "assortment",
      "assurance",
    ]);
  });

  it("provides a concise title and explanatory copy for every trust signal", () => {
    trustFeatures.forEach((feature) => {
      expect(feature.title.trim().length).toBeGreaterThan(0);
      expect(feature.description.trim().length).toBeGreaterThan(0);
    });
  });
});
