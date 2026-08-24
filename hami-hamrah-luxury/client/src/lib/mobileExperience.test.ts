import { describe, expect, it } from "vitest";
import { mobileQuickRoutes, resolveMobileRailWidth } from "./mobileExperience";

describe("mobile experience contract", () => {
  it("exposes only verified commerce, discovery, partner, and contact routes", () => {
    expect(mobileQuickRoutes).toEqual([
      { key: "shop", label: "فروشگاه", href: "/shop" },
      { key: "categories", label: "دسته‌بندی‌ها", href: "#categories" },
      { key: "partners", label: "همکاری", href: "#b2b" },
      { key: "contact", label: "تماس", href: "#contact" },
    ]);
  });

  it("keeps the primary mobile rails large enough for one decisive product at each target width", () => {
    expect(resolveMobileRailWidth(360)).toBe(292);
    expect(resolveMobileRailWidth(390)).toBe(316);
    expect(resolveMobileRailWidth(414)).toBe(336);
  });
});
