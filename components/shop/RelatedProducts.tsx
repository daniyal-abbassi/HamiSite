import { relatedProducts } from "@/lib/catalog";
import { ProductRail } from "@/components/shop/ProductRail";

/**
 * FR-035: the rail must rest on a real relationship, not on "an arbitrary sample of
 * the catalog presented as a recommendation". The predicate lives in the seam —
 * `relatedProducts()` takes same-brand first, then same-category, and ranks each
 * group obtainable → offer → recency — so this component's only job is to stay out
 * of the way when the answer is empty. A product page with no related section reads
 * as a shop that knows the catalogue; one with a filler row of six random phones
 * reads as a template, and FR-005 forbids the frame without the content.
 */
export function RelatedProducts({ productId }: { productId: number }) {
  const items = relatedProducts(productId);
  if (items.length === 0) return null;

  return (
    <section className="mt-12 pb-24 md:pb-0" aria-labelledby="related-title">
      <h2 id="related-title" className="text-base font-black text-foreground">
        محصولات مرتبط
      </h2>
      <div className="brand-hairline my-3.5" />
      <ProductRail products={items.map((r) => r.product)} label="محصولات مرتبط با این محصول" />
    </section>
  );
}
