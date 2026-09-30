import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBanner } from "@/components/shop/ShopBanner";
import { ShopClient } from "@/components/shop/ShopClient";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
import { buildShopView } from "@/lib/shop-query";
import { shopCategoryTiles } from "@/lib/shop-category-tiles";
import "@/components/shop/shop-luxury.css";

export const metadata: Metadata = {
/* The template in app/layout.tsx appends the brand: «فروشگاه | حامی همراه». */
  title: "فروشگاه",
  description: "خرید موبایل، لوازم جانبی و محصولات دیجیتال از فروشگاه حامی همراه — آنلاین و حضوری.",
};

/**
 * The listing, read from the catalog seam on the server.
 *
 * It used to accept no `searchParams` at all: the page prerendered an empty shell
 * and `ShopClient` fetched `/api/products`, `/api/categories` and `/api/brands`
 * after hydration. That is what Constitution III forbids ("Browsing MUST NOT
 * require a database connection or an API round-trip") and it left the served
 * document — the one a crawler and a slow first connection both see — holding
 * zero products.
 *
 * The URL contract is untouched: `buildShopView` applies the same keys, the same
 * AND semantics and the same refusal on an unresolvable slug. Only the reader moved.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = buildShopView(await searchParams);

  return (
    <div className="shop-luxury">
      <ShopBanner />
      <section id="shop-catalog" className="shop-catalog" data-ground="paper" aria-label="محصولات فروشگاه">
        <div className="shop-wrap">
          {/* Kept for the client children that still read useSearchParams; the
              results themselves no longer wait on it. */}
          <DataCurrencyNote className="shop-currency-note" />
          <Suspense fallback={null}>
            <ShopClient view={view} tiles={shopCategoryTiles()} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
