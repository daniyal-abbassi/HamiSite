import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";

/**
 * A set of product cards: a swipeable rail on a phone, the responsive grid from
 * `sm` upward.
 *
 * ## Why a rail on mobile
 *
 * The grid collapses to one column below `sm`. That is the correct thing for a
 * grid to do and the wrong thing for this content: a `.lux-card` carries a
 * full-bleed square photo, so one card is roughly 460px tall on a 390px screen
 * and six of them is most of three screens of scrolling — for a single section,
 * on a page that already measured 22 screens end to end. The shopper has to
 * scroll past the entire section to discover there is anything after it.
 *
 * A rail puts the same six products in one screen's height and makes "there is
 * more, sideways" visible instead of hidden. Cards are sized so the next one
 * peeks in at the edge, which is what tells a thumb the row scrolls at all — a
 * row of exactly-fitting cards reads as a static row.
 *
 * ## Interface
 *
 * `products` and an accessible `label`. Everything else — the breakpoint at
 * which the rail becomes a grid, the snap behaviour, the keyboard affordance —
 * is inside, so the two call sites cannot drift apart. That is the whole reason
 * this is a module rather than a copied block of classes: the same rail is
 * needed by FeaturedProducts and NewArrivals, and a third caller is likely.
 *
 * ## The keyboard affordance is not optional
 *
 * A horizontally scrollable region that is not reachable by keyboard fails
 * WCAG 2.1.1, because its content can only be reached by dragging. `tabIndex={0}`
 * with a `role`/`aria-label` makes the rail focusable so arrow keys scroll it.
 * From `sm` up the element is a grid and scrolls nowhere, so the affordance is
 * harmless there.
 */
export function ProductRail({
  products,
  label,
}: {
  products: ProductCardData[];
  /** Names the scrollable region, e.g. «جدیدترین محصولات». */
  label: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="product-rail flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-3 2xl:grid-cols-4"
    >
      {products.map((product, i) => (
        // 45% shows two cards plus a sliver of the third. One card at 82% was
        // 280x525 on a 390px screen — 72% of the width and more than half the
        // height for a single product, which reads as a poster rather than a
        // catalogue. Two-up is what a phone storefront is expected to look
        // like. `shrink-0` is what stops flex from squeezing every card into
        // one screen width, which is the usual way this pattern fails silently.
        <div key={product.id} className="w-[45%] shrink-0 snap-start sm:w-auto">
          <ProductCard product={product} index={i} />
        </div>
      ))}
    </div>
  );
}
