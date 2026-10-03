import { describe, expect, it } from "vitest";
import { destinationDescription, listingViewHref, type ListingView } from "@/lib/listing-view";

/**
 * The URL behind every control on a `/categories/…` or `/brands/…` page. What is worth
 * pinning is composition: a shopper who has already narrowed to «فقط قابل خرید» and then
 * sorts must not silently lose the narrowing, and the control that sets both at once must
 * produce exactly the URL the two separate presses would. Everything here is one string
 * away from being wrong in a way a shopper reads as the page forgetting them.
 */
const BASE = "/categories/" + encodeURIComponent("پاور-بانک");
const view = (over: Partial<ListingView> = {}): ListingView => ({ sort: "", obtainable: false, ...over });

describe("listingViewHref", () => {
  it("starts from the bare path when nothing is set", () => {
    expect(listingViewHref(BASE, view(), {})).toBe(BASE);
  });

  it("keeps the other control when one changes", () => {
    const narrowed = view({ obtainable: true });
    expect(listingViewHref(BASE, narrowed, { sort: "price-asc" })).toBe(`${BASE}?sort=price-asc&obtainable=1`);
  });

  it("sets both halves of the composite control in one step", () => {
    expect(listingViewHref(BASE, view(), { sort: "price-asc", obtainable: true })).toBe(
      listingViewHref(BASE, view({ obtainable: true }), { sort: "price-asc" }),
    );
  });

  it("clears only the control being released", () => {
    const both = view({ sort: "price-asc", obtainable: true });
    expect(listingViewHref(BASE, both, { sort: "" })).toBe(`${BASE}?obtainable=1`);
    expect(listingViewHref(BASE, both, { obtainable: false })).toBe(`${BASE}?sort=price-asc`);
  });

  it("is stable, so a re-render cannot churn every link on the page", () => {
    const once = listingViewHref(BASE, view({ sort: "newest" }), { obtainable: true });
    const twice = listingViewHref(BASE, view({ sort: "newest" }), { obtainable: true });
    expect(once).toBe(twice);
  });

  it("does not touch an already percent-encoded path", () => {
    expect(listingViewHref(BASE, view(), {})).not.toContain("%25");
  });
});

describe("destinationDescription", () => {
  /*
   * FR-011: a number a shopper reads is written in Persian digits. The count line got
   * this right and the sentence above it did not — the two sat centimetres apart on the
   * same page, one «۶ محصول», one «6 محصول در دستهٔ…» — which is what happens when the
   * copy is assembled inline in two route files.
   */
  it("writes the category count in Persian digits", () => {
    expect(destinationDescription({ total: 6, subCategories: 0, name: "پاور بانک", kind: "category" })).toBe("۶ محصول در دستهٔ پاور بانک.");
  });

  it("counts the subcategories in Persian digits too", () => {
    const text = destinationDescription({ total: 135, subCategories: 9, name: "موبایل و تبلت", kind: "category" });
    expect(text).toBe("۱۳۵ محصول در این دسته و ۹ زیردستهٔ آن.");
    expect(text).not.toMatch(/[0-9]/);
  });

  it("names the brand and its count without Latin digits", () => {
    const text = destinationDescription({ total: 49, name: "اپل", kind: "brand" });
    expect(text).toContain("۴۹ محصول");
    expect(text).not.toMatch(/[0-9]/);
  });
});
