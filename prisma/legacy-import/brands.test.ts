import { describe, it, expect } from "vitest";
import { deriveBrandSlug, mapLegacyBrand } from "./brands";
import type { LegacyBrand } from "./types";

describe("deriveBrandSlug", () => {
  it("lowercases and dashes an ASCII name", () => {
    expect(deriveBrandSlug("COMTEL", 40, new Set())).toBe("comtel");
  });

  it("dashes spaces and pipes in a mixed name", () => {
    expect(deriveBrandSlug("اوآک | OAK", 39, new Set())).toBe("اوآک-oak");
  });

  it("appends the legacy id on collision", () => {
    const existing = new Set(["comtel"]);
    expect(deriveBrandSlug("COMTEL", 41, existing)).toBe("comtel-41");
  });
});

describe("mapLegacyBrand", () => {
  const raw: LegacyBrand = {
    id: 40,
    name: "COMTEL",
    image_url: null,
    image_alt: "",
    seo_title: null,
    seo_description: null,
  };

  it("maps direct fields with the given slug", () => {
    expect(mapLegacyBrand(raw, "comtel")).toEqual({
      name: "COMTEL",
      slug: "comtel",
      imageUrl: null,
      imageAlt: "",
      iconUrl: null,
      seoTitle: null,
      seoDescription: null,
      isActive: true,
      order: 0,
    });
  });
});
