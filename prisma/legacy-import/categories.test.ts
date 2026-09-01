import { describe, it, expect } from "vitest";
import { mapLegacyCategory } from "./categories";
import type { LegacyCategory } from "./types";

const raw: LegacyCategory = {
  id: 79,
  name: "گوشی موبایل",
  slug: "گوشی-موبایل",
  description: null,
  parent_id: null,
  image_url: null,
  icon_url: null,
  image_alt: null,
  available: true,
  categories_menu_show: true,
  top_menu_separate_show: false,
  order: 0,
  level: 0,
  seo_title: null,
  seo_description: null,
};

describe("mapLegacyCategory", () => {
  it("maps direct fields and applies the resolved parent id", () => {
    const mapped = mapLegacyCategory(raw, 5);

    expect(mapped).toEqual({
      name: "گوشی موبایل",
      slug: "گوشی-موبایل",
      description: null,
      parentId: 5,
      imageUrl: null,
      iconUrl: null,
      imageAlt: null,
      available: true,
      categoriesMenuShow: true,
      topMenuSeparateShow: false,
      order: 0,
      level: 0,
      seoTitle: null,
      seoDescription: null,
    });
  });

  it("maps a null parent id through unchanged", () => {
    const mapped = mapLegacyCategory(raw, null);
    expect(mapped.parentId).toBeNull();
  });
});
