import { describe, expect, it } from "vitest";
import { extractDigikalaProductId, mapDigikalaProductToHami } from "@/lib/digikala";

describe("Digikala Helpers", () => {
  describe("extractDigikalaProductId", () => {
    it("extracts from simple numeric id", () => {
      expect(extractDigikalaProductId("16603814")).toBe(16603814);
      expect(extractDigikalaProductId(16603814)).toBe(16603814);
    });

    it("extracts from dkp prefix", () => {
      expect(extractDigikalaProductId("dkp-16603814")).toBe(16603814);
      expect(extractDigikalaProductId("DKP-12345")).toBe(12345);
    });

    it("extracts from full Digikala URL", () => {
      expect(
        extractDigikalaProductId("https://www.digikala.com/product/dkp-16603814/cover-case/")
      ).toBe(16603814);
      expect(
        extractDigikalaProductId("https://digikala.com/product/dkp-987654/")
      ).toBe(987654);
    });

    it("returns null for invalid inputs", () => {
      expect(extractDigikalaProductId("")).toBeNull();
      expect(extractDigikalaProductId("invalid-link")).toBeNull();
    });
  });

  describe("mapDigikalaProductToHami", () => {
    it("maps raw digikala product data to Hami product structure correctly", () => {
      const sampleRawProduct = {
        id: 16603814,
        title_fa: "کاور هپرو مدل MC مناسب برای سامسونگ A30",
        title_en: "Hepro MC Cover for Samsung A30",
        review: {
          description: "توضیحات نقد و بررسی محصول کاور هپرو"
        },
        brand: {
          title_fa: "هپرو",
          title_en: "Hepro"
        },
        default_variant: {
          price: {
            selling_price: 1500000,
            rrp_price: 1800000
          }
        },
        images: {
          main: {
            url: ["https://dkstatics.com/img1.jpg"]
          },
          list: [
            { url: ["https://dkstatics.com/img1.jpg"] },
            { url: ["https://dkstatics.com/img2.jpg"] }
          ]
        },
        specifications: [
          {
            title: "مشخصات کلی",
            attributes: [
              { title: "جنس", values: ["سیلیکون", "TPU"] },
              { title: "وزن", values: ["۴۰ گرم"] }
            ]
          }
        ]
      };

      const mapped = mapDigikalaProductToHami(sampleRawProduct);

      expect(mapped.name).toBe("کاور هپرو مدل MC مناسب برای سامسونگ A30");
      expect(mapped.englishName).toBe("Hepro MC Cover for Samsung A30");
      expect(mapped.brandName).toBe("هپرو");
      expect(mapped.price).toBe(150000); // Converted from Rial to Toman
      expect(mapped.compareAtPrice).toBe(180000); // Converted from Rial to Toman
      expect(mapped.images).toHaveLength(2);
      expect(mapped.images[0].isDefault).toBe(true);
      expect(mapped.specs).toEqual([
        { name: "جنس", value: "سیلیکون، TPU" },
        { name: "وزن", value: "۴۰ گرم" }
      ]);
    });
  });
});

