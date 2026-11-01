import { describe, it, expect } from "vitest";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-images";
import {
  normalizePersianText,
  sanitizePersianSlug,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  generatePersianMetadata,
} from "@/lib/persian-seo";

describe("Persian SEO Utilities", () => {
  describe("normalizePersianText", () => {
    it("converts Arabic Yeh and Kaf to Persian equivalents", () => {
      const arabic = "كابل شارژر آيفون همراه با گارانتي";
      const normalized = normalizePersianText(arabic);
      expect(normalized).toBe("کابل شارژر آیفون همراه با گارانتی");
      expect(normalized).not.toContain("ك");
      expect(normalized).not.toContain("ي");
    });

    it("trims whitespace correctly", () => {
      expect(normalizePersianText("   هندزفری بلوتوثی   ")).toBe("هندزفری بلوتوثی");
    });
  });

  describe("sanitizePersianSlug", () => {
    it("converts ZWNJ (نیم‌فاصله) into a hyphen instead of raw escape sequences", () => {
      // \u200c is zero-width non-joiner
      const input = "سیم\u200cکارت ایرانسل";
      const slug = sanitizePersianSlug(input);
      expect(slug).toBe("سیم-کارت-ایرانسل");
      expect(slug).not.toContain("\u200c");
      expect(encodeURIComponent(slug)).not.toContain("%E2%80%8C");
    });

    it("replaces spaces, pipes, and underscores with single hyphens", () => {
      const input = "گوشی موبایل | مدل One Pro _ ظرفیت 128";
      const slug = sanitizePersianSlug(input);
      expect(slug).toBe("گوشی-موبایل-مدل-one-pro-ظرفیت-128");
    });

    it("deduplicates multiple consecutive hyphens and trims edges", () => {
      const input = "---پاوربانک---فست--شارژ---";
      const slug = sanitizePersianSlug(input);
      expect(slug).toBe("پاوربانک-فست-شارژ");
    });

    it("strips special symbols and invalid punctuation", () => {
      const input = "شارژر ۲۰ وات (اصل) [گارانتی دار]! @#$%^&*";
      const slug = sanitizePersianSlug(input);
      expect(slug).toBe("شارژر-۲۰-وات-اصل-گارانتی-دار");
    });
  });

  describe("JSON-LD Structured Data", () => {
    it("generates valid schema.org/Product with InStock offer", () => {
      const schema = buildProductJsonLd({
        name: "آیفون 16 پرو",
        description: "گوشی موبایل اپل با حافظه ۲۵۶ گیگابایت",
        slug: "iphone-16-pro",
        price: 85_000_000,
        inStock: true,
        brandName: "Apple",
        sku: "APL-IP16P-256",
      });

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Product");
      expect(schema.name).toBe("آیفون 16 پرو");
      expect(schema.brand).toEqual({ "@type": "Brand", name: "Apple" });

      const offers = schema.offers as Record<string, unknown>;
      expect(offers["@type"]).toBe("Offer");
      // schema.org/Offer requires an ISO 4217 code; the input price is Toman
      // (the site's display/storage unit), so the schema emits it as Rial (×10).
      expect(offers.price).toBe(850_000_000);
      expect(offers.priceCurrency).toBe("IRR");
      expect(offers.availability).toBe("https://schema.org/InStock");
    });

    it("omits an offer and image when price and product image are not verified", () => {
      const schema = buildProductJsonLd({
        name: "محصول ناموجود",
        description: "توضیحات محصول",
        slug: "out-of-stock-product",
        inStock: false,
      });

      expect(schema).not.toHaveProperty("offers");
      expect(schema).not.toHaveProperty("image");
    });

    it("does not publish a zero-price offer or generic placeholder as product imagery", () => {
      const schema = buildProductJsonLd({
        name: "محصول تلفنی", description: "تماس بگیرید", slug: "call-product", price: 0,
        images: [PRODUCT_PLACEHOLDER_IMAGE],
      });
      expect(schema).not.toHaveProperty("offers");
      expect(schema).not.toHaveProperty("image");
    });

    it("generates valid schema.org/BreadcrumbList with incremental positions", () => {
      const breadcrumbs = buildBreadcrumbJsonLd([
        { name: "صفحه اصلی", path: "/" },
        { name: "فروشگاه", path: "/shop" },
        { name: "موبایل", path: "/categories/mobile" },
      ]);

      expect(breadcrumbs["@context"]).toBe("https://schema.org");
      expect(breadcrumbs["@type"]).toBe("BreadcrumbList");

      const items = breadcrumbs.itemListElement as Array<{ position: number; name: string }>;
      expect(items).toHaveLength(3);
      expect(items[0]).toMatchObject({ position: 1, name: "صفحه اصلی" });
      expect(items[1]).toMatchObject({ position: 2, name: "فروشگاه" });
      expect(items[2]).toMatchObject({ position: 3, name: "موبایل" });
    });

    it("generates Organization schema with city and logo", () => {
      const org = buildOrganizationJsonLd();
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe("حامی همراه");
      expect(org.areaServed).toEqual({ "@type": "City", name: "مشهد" });
    });

    it("generates WebSite schema with SearchAction", () => {
      const site = buildWebSiteJsonLd();
      expect(site["@type"]).toBe("WebSite");
      expect(site.inLanguage).toBe("fa-IR");
      expect(site.potentialAction).toBeDefined();
    });
  });

  describe("Persian Page Metadata", () => {
    it("generates full Persian title with brand delimiter and fa_IR OpenGraph locale", () => {
      const meta = generatePersianMetadata({
        title: "فروشگاه لوازم جانبی",
        description: "تنوعی از برترین برندهای لوازم جانبی موبایل",
        path: "/shop",
      });

      expect(meta.title).toBe("فروشگاه لوازم جانبی");
      expect(meta.description).toBe("تنوعی از برترین برندهای لوازم جانبی موبایل");
      expect(meta.openGraph?.locale).toBe("fa_IR");
      expect(meta.openGraph?.title).toBe("فروشگاه لوازم جانبی | حامی همراه");
      const twitter = meta.twitter as { card?: string } | undefined;
      expect(twitter?.card).toBe("summary_large_image");
    });

    it("respects noIndex flag for private or missing pages", () => {
      const meta = generatePersianMetadata({
        title: "یافت نشد",
        description: "صفحه مورد نظر پیدا نشد",
        path: "/404",
        noIndex: true,
      });

      expect(meta.robots).toEqual({ index: false, follow: false });
    });
  });
});
