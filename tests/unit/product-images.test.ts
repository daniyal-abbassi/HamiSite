import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listCategories, queryProducts } from "@/lib/catalog";
import { PRODUCT_PLACEHOLDER_IMAGE, categoryImageFor, resolveProductImage } from "@/lib/product-images";

const PLACEHOLDER = PRODUCT_PLACEHOLDER_IMAGE;

describe("resolveProductImage", () => {
  it("renders the product's own mirrored photograph", () => {
    const src = resolveProductImage({
      name: "گوشی شیائومی Poco X7 Pro",
      images: [{ url: "/images/catalog/5.jpg", isDefault: true }],
    });
    expect(src).toBe("/images/catalog/5.jpg");
  });

  it("prefers the default image when a product has several local ones", () => {
    const src = resolveProductImage({
      name: "هدفون",
      images: [
        { url: "/images/catalog/9.jpg", isDefault: false },
        { url: "/images/catalog/11.jpg", isDefault: true },
      ],
    });
    expect(src).toBe("/images/catalog/11.jpg");
  });

  /**
   * The gallery keeps its origin URLs, and the live shop's host measured 5.8-7.5s
   * per image with next/image 500-ing about as often as it succeeded. A remote URL
   * must never reach the card, so an unmirrored product takes the placeholder
   * instead of going back onto the network.
   */
  it("never renders a remote hotlink as a product's picture", () => {
    const src = resolveProductImage({
      name: "گوشی ساده",
      images: [{ url: "https://hamihamrah-shop.com/shop-resources/x/product-images/y.jpg", isDefault: true }],
    });
    expect(src).toBe(PLACEHOLDER);
  });

  it("renders the brand placeholder for a product with no photograph", () => {
    expect(resolveProductImage({ name: "محصول بدون تصویر", images: [] })).toBe(PLACEHOLDER);
    expect(resolveProductImage({ name: "محصول بدون تصویر" })).toBe(PLACEHOLDER);
  });

  /**
   * The whole point of the placeholder, and the reason the keyword fallback was
   * deleted rather than tuned: a product with no photograph used to be shown as a
   * plausible picture of some other product, chosen from its name. Constitution I
   * forbids filling missing data with a stock photograph, and no amount of rule
   * refinement makes a guess honest — only the absence of one does.
   */
  it("never resolves to the techBazar template pack", () => {
    const nameless = resolveProductImage({ name: "ساعت هوشمند گلکسی واچ 4" });
    expect(nameless).toBe(PLACEHOLDER);
    expect(nameless.startsWith("/images/products/")).toBe(false);
  });

  it("points at a file that actually exists", () => {
    expect(existsSync(join(process.cwd(), "public", PLACEHOLDER.replace(/^\//, "")))).toBe(true);
  });

  it("is deterministic for the same product", () => {
    const product = { name: "گوشی سامسونگ گلکسی A15", images: [{ url: "/images/catalog/18.jpg", isDefault: true }] };
    expect(resolveProductImage(product)).toBe(resolveProductImage(product));
  });

  /**
   * Drift guard over the real seam, and the assertion that would have caught the
   * claim — made in good faith and wrong — that no product had a local photograph.
   * 188 of 189 resolve to their own file; exactly one reaches the placeholder. A
   * new placeholder here means the mirror lost a file, and a `/images/products/`
   * path anywhere means the deleted guesswork came back.
   */
  it("resolves every catalogue product to its own photo or the placeholder", () => {
    const { data, total } = queryProducts({ page: 1, pageSize: 500 });
    /*
     * Derived from the export rather than asserted as 189. A literal total here
     * meant SC-005's "re-verifiable after a refresh without restating the totals"
     * was false in the very file that grades it: the next export would fail the
     * suite for the right reason and the fix would be to edit the number.
     */
    const exportRows = (JSON.parse(readFileSync(join(process.cwd(), "data/hami-products.json"), "utf8")) as {
      products: Array<{ id: number; name: string; primary_image?: string | null; images?: Array<{ is_default?: boolean }> }>;
    }).products;
    expect(total).toBe(exportRows.length);
    expect(data.length).toBe(exportRows.length);
    expect(exportRows.length).toBeGreaterThan(0);

    const toPlaceholder: string[] = [];
    const toTemplatePack: string[] = [];
    for (const product of data) {
      const src = resolveProductImage({ name: product.name, images: product.images });
      if (src === PLACEHOLDER) toPlaceholder.push(`${product.id} ${product.name}`);
      else if (src.startsWith("/images/products/")) toTemplatePack.push(`${product.id} ${product.name}`);
      else expect(src).toBe(`/images/catalog/${product.id}.jpg`);
    }

    expect(toTemplatePack).toEqual([]);
    /*
     * The placeholder set must equal exactly the records the export holds no image
     * for — today «اپل آیدی» (id 347, `primary_image: null`), and named nowhere in
     * this file. Two ways this fails for real reasons: the mirror loses a file, so
     * a product that does have an image starts reaching the placeholder; or the
     * mirror grows a file for the imageless record, so it silently stops showing.
     */
    const imageless = exportRows
      .filter((p) => !p.primary_image && !(p.images ?? []).some((i) => i.is_default))
      .map((p) => `${p.id} ${p.name}`)
      .sort();
    expect([...toPlaceholder].sort(), "placeholder set drifted from the imageless records").toEqual(imageless);
  });
});

describe("categoryImageFor", () => {
  it("maps known category slugs to their tile images", () => {
    expect(categoryImageFor("mobile", "موبایل")).toBe("/images/categories/phone.png");
    expect(categoryImageFor("audio", "صوتی")).toBe("/images/categories/headphone.png");
    expect(categoryImageFor("laptop", "لپ تاپ")).toBe("/images/categories/computer.png");
  });

  /**
   * There is no home or tv tile in the mapping. These two cases used to assert that
   * `categoryImageFor` returned `/images/categories/home.png` and `tv.png`, which is why
   * they failed: the expectation was stale, not the mapping. `lib/product-images.ts`
   * documents the catalogue check that dropped both keyword sets. The PNGs are still on
   * disk but unreferenced by any code path — deleting them is a separate call, so this
   * test does not assert their absence.
   */
  it("has no home or tv tile, and falls through for those keywords", () => {
    expect(categoryImageFor("home", "خانگی")).toBe("/images/categories/phone.png");
    expect(categoryImageFor("tv", "تلویزیون")).toBe("/images/categories/phone.png");
  });

  it("still has no catalogue category matching the deleted tiles", () => {
    const orphaned = listCategories().filter((category) => {
      const image = categoryImageFor(category.slug, category.name);
      return image === "/images/categories/phone.png" && /home|tv|خانگی|تلویزیون|household/i.test(`${category.slug} ${category.name}`);
    });
    expect(orphaned).toEqual([]);
  });

  /** A mapping that points at a file that is not there renders as a broken tile. */
  it("only names tile files that exist", () => {
    const seen = new Set(listCategories().map((c) => categoryImageFor(c.slug, c.name)));
    expect(seen.size).toBeGreaterThan(0);
    for (const image of seen) {
      expect(existsSync(join(process.cwd(), "public", image.replace(/^\//, "")))).toBe(true);
    }
  });

  it("falls back to the phone tile for unknown categories", () => {
    expect(categoryImageFor("mystery", "ناشناخته")).toBe("/images/categories/phone.png");
  });

  it("handles nullish input", () => {
    expect(categoryImageFor(null, null)).toBe("/images/categories/phone.png");
  });
});
