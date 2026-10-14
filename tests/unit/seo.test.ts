import { describe, it, expect, vi } from "vitest";
import {
  SITE_NAME,
  SITE_ORIGIN,
  formatCanonicalUrl,
  pageMetadata,
  defaultRobotsPolicy,
  noIndexMetadata,
} from "@/lib/seo-metadata";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { PLACEHOLDER_ALT, isPlaceholderImage, PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-images";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([
        { slug: "iphone-16-pro", updatedAt: new Date("2026-10-01T12:00:00Z") },
        { slug: "galaxy-s24-ultra", updatedAt: new Date("2026-10-02T15:30:00Z") },
      ]),
    },
  },
}));

vi.mock("@/lib/catalog-db", () => ({
  listCategories: vi.fn().mockResolvedValue([
    { id: 1, slug: "mobile", name: "گوشی موبایل" },
    { id: 2, slug: "empty-cat", name: "دسته‌بندی خالی" },
  ]),
  categorySubtreeCounts: vi.fn().mockResolvedValue(
    new Map([
      [1, 10],
      [2, 0],
    ])
  ),
  listBrands: vi.fn().mockResolvedValue([
    { id: 1, slug: "apple", name: "اپل" },
    { id: 2, slug: "samsung", name: "سامسونگ" },
  ]),
}));

describe("SEO Contracts & Utilities", () => {
  describe("formatCanonicalUrl", () => {
    it("generates an absolute canonical URL using SITE_ORIGIN by default", () => {
      const canonical = formatCanonicalUrl("/shop");
      expect(canonical).toBe(`${SITE_ORIGIN}/shop`);
      expect(canonical.startsWith("http")).toBe(true);
    });

    it("formats the root homepage URL correctly", () => {
      const canonical = formatCanonicalUrl("/");
      expect(canonical).toBe(`${SITE_ORIGIN}/`);
    });

    it("drops an unselected query string from a clean preferred URL", () => {
      const canonical = formatCanonicalUrl("/shop?sort=cheapest&category=smartphones&utm_source=telegram");
      expect(canonical).toBe(`${SITE_ORIGIN}/shop`);
      expect(canonical).not.toContain("?");
      expect(canonical).not.toContain("sort=");
      expect(canonical).not.toContain("utm_source");
    });

    it("retains a distinct catalog page when selected by the caller", () => {
      expect(formatCanonicalUrl("/shop?page=2#catalog", SITE_ORIGIN, true)).toBe(`${SITE_ORIGIN}/shop?page=2`);
    });

    it("strips hash fragments from canonical URLs", () => {
      const canonical = formatCanonicalUrl("/shop#catalog-section");
      expect(canonical).toBe(`${SITE_ORIGIN}/shop`);
      expect(canonical).not.toContain("#");
    });

    it("removes duplicate slashes and trailing slashes for non-root routes", () => {
      const canonical = formatCanonicalUrl("/shop//categories/phones/");
      expect(canonical).toBe(`${SITE_ORIGIN}/shop/categories/phones`);
    });

    it("handles relative paths without leading slash", () => {
      const canonical = formatCanonicalUrl("partners");
      expect(canonical).toBe(`${SITE_ORIGIN}/partners`);
    });

    it("accepts a custom origin override", () => {
      const customOrigin = "https://hamihamrah.com";
      const canonical = formatCanonicalUrl("/shop", customOrigin);
      expect(canonical).toBe("https://hamihamrah.com/shop");
    });

    it("correctly encodes Persian path slugs", () => {
      const canonical = formatCanonicalUrl("/shop/گوشی-موبایل");
      expect(canonical.startsWith(SITE_ORIGIN)).toBe(true);
      expect(decodeURIComponent(canonical)).toBe(`${SITE_ORIGIN}/shop/گوشی-موبایل`);
    });
  });

  describe("pageMetadata", () => {
    it("generates canonical link and Open Graph metadata", () => {
      const meta = pageMetadata({
        title: "گوشی موبایل",
        description: "راهنمای خرید گوشی موبایل در مشهد",
        path: "/shop?sort=newest",
      });

      expect(meta.title).toBe("گوشی موبایل");
      expect(meta.description).toBe("راهنمای خرید گوشی موبایل در مشهد");
      expect(meta.alternates?.canonical).toBe(`${SITE_ORIGIN}/shop`);
      expect(meta.openGraph?.url).toBe(`${SITE_ORIGIN}/shop`);
      expect(meta.openGraph?.siteName).toBe(SITE_NAME);
      expect(meta.openGraph?.locale).toBe("fa_IR");
    });

    it("allows custom robots override when provided", () => {
      const meta = pageMetadata({
        title: "حساب کاربری",
        description: "ناحیه کاربری مشتریان",
        path: "/account",
        robots: { index: false, follow: false },
      });

      expect(meta.robots).toEqual({ index: false, follow: false });
    });

    it("keeps a page-specific canonical and Open Graph URL for pagination", () => {
      const meta = pageMetadata({ title: "فروشگاه، صفحه ۲", description: "ادامه محصولات", path: "/shop?page=2", includeQuery: true });
      expect(meta.alternates?.canonical).toBe(`${SITE_ORIGIN}/shop?page=2`);
      expect(meta.openGraph?.url).toBe(`${SITE_ORIGIN}/shop?page=2`);
    });
  });

  describe("Meta Robots Policies", () => {
    it("provides Googlebot compliant defaultRobotsPolicy", () => {
      expect(defaultRobotsPolicy.index).toBe(true);
      expect(defaultRobotsPolicy.follow).toBe(true);
      expect(defaultRobotsPolicy.googleBot).toBeDefined();
      expect(defaultRobotsPolicy.googleBot?.index).toBe(true);
      expect(defaultRobotsPolicy.googleBot?.follow).toBe(true);
      expect(defaultRobotsPolicy.googleBot?.["max-image-preview"]).toBe("large");
      expect(defaultRobotsPolicy.googleBot?.["max-snippet"]).toBe(-1);
    });

    it("provides noIndexMetadata with index: false, follow: false", () => {
      expect(noIndexMetadata.robots).toEqual({ index: false, follow: false });
    });
  });

  describe("robots.txt crawler rules", () => {
    it("allows noindex customer pages to be crawled while excluding API and admin", () => {
      const rules = robots();
      const disallows = Array.isArray(rules.rules)
        ? rules.rules[0]?.disallow
        : rules.rules?.disallow;

      expect(disallows).toBeDefined();
      expect(disallows).toContain("/admin/");
      expect(disallows).toContain("/api/");
      expect(disallows).not.toContain("/checkout");
      expect(disallows).not.toContain("/cart");
      expect(disallows).not.toContain("/account");
    });

    it("declares absolute sitemap URL", () => {
      const rules = robots();
      expect(rules.sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
    });
  });

  describe("Dynamic Sitemap Generation", () => {
    it("generates complete sitemap with absolute canonical URLs and valid priorities", async () => {
      const items = await sitemap();
      expect(items.length).toBeGreaterThan(0);

      // Core routes
      const urls = items.map((item) => item.url);
      expect(urls).toContain(`${SITE_ORIGIN}/`);
      expect(urls).toContain(`${SITE_ORIGIN}/shop`);
      expect(urls).toContain(`${SITE_ORIGIN}/partners`);

      // Catalog products
      expect(urls).toContain(`${SITE_ORIGIN}/shop/iphone-16-pro`);
      expect(urls).toContain(`${SITE_ORIGIN}/shop/galaxy-s24-ultra`);

      // Categories and Brands
      expect(urls).toContain(`${SITE_ORIGIN}/categories/mobile`);
      // Empty category should be excluded
      expect(urls).not.toContain(`${SITE_ORIGIN}/categories/empty-cat`);
      expect(urls).toContain(`${SITE_ORIGIN}/brands/apple`);

      // Every item must have absolute url and valid priority
      for (const item of items) {
        expect(item.url.startsWith("http")).toBe(true);
        expect(item.priority).toBeGreaterThanOrEqual(0.1);
        expect(item.priority).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe("Image Alt Contracts", () => {
    it("enforces meaningful alt text for real photos and brand placeholder alt for missing photos", () => {
      expect(isPlaceholderImage(PRODUCT_PLACEHOLDER_IMAGE)).toBe(true);
      expect(PLACEHOLDER_ALT).toBeTruthy();
      expect(PLACEHOLDER_ALT).toContain("حامی همراه");

      const getAltForImage = (imageSrc: string, productName: string) => {
        return isPlaceholderImage(imageSrc) ? PLACEHOLDER_ALT : productName;
      };

      const realAlt = getAltForImage("/uploads/iphone16.jpg", "آیفون 16 پرو");
      expect(realAlt).toBe("آیفون 16 پرو");

      const placeholderAlt = getAltForImage(PRODUCT_PLACEHOLDER_IMAGE, "کابل تایپ سی");
      expect(placeholderAlt).toBe(PLACEHOLDER_ALT);
    });
  });
});
