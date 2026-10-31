import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBanner } from "@/components/shop/ShopBanner";
import { ShopClient } from "@/components/shop/ShopClient";
import { ShopHeroSearch, ShopHeroSearchFallback } from "@/components/shop/ShopHeroSearch";
import { ShopLoading } from "@/components/shop/ShopLoading";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
import { catalogGeneratedAt } from "@/lib/catalog-db";
import { buildShopView } from "@/lib/shop-query-db";
import { shopCategoryTiles } from "@/lib/shop-category-tiles-db";
import { pageMetadata } from "@/lib/seo-metadata";
import "@/components/shop/shop-luxury.css";

const shopDescription = "خرید موبایل، لوازم جانبی و محصولات دیجیتال از حامی همراه در مشهد؛ فهرست محصولات و دسته‌بندی‌های فروشگاه را ببینید و برای قیمت روز تماس بگیرید.";

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  // The catalog parser accepts pages 1–10,000. Keep the parameters that change
  // the product set, and retain sort only when pagination changes membership.
  const distinctPage = page > 1 && page <= 10_000;
  const preferredParams = new URLSearchParams();
  for (const key of ["category", "brand"] as const) {
    const value = params[key];
    if (typeof value === "string" && value.trim()) preferredParams.set(key, value.trim());
  }
  if (distinctPage) preferredParams.set("page", String(page));
  const sort = params.sort;
  if (distinctPage && typeof sort === "string" && sort.trim()) preferredParams.set("sort", sort.trim());
  const query = preferredParams.toString();
  const path = query ? `/shop?${query}` : "/shop";
  const dynamicFilter = ["category", "brand", "q", "stock", "min", "max", "special"].some((key) => params[key] !== undefined);
  return pageMetadata({
    title: distinctPage ? `فروشگاه، صفحه ${page}` : "فروشگاه",
    description: shopDescription,
    path,
    includeQuery: Boolean(query),
    ...(dynamicFilter ? { robots: { index: false, follow: true } } : {}),
  });
}

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
async function ShopData({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [view, tiles, generatedAt] = await Promise.all([
    buildShopView(params),
    shopCategoryTiles(),
    catalogGeneratedAt(),
  ]);
  const clientView = {
    categoryFacets: view.categoryFacets,
    brands: view.brands,
    products: view.products,
    meta: view.meta,
    activeSort: view.activeSort,
    activeFilters: view.activeFilters,
    unknownFilter: view.unknownFilter,
  };

  return (
    <>
      <DataCurrencyNote generatedAt={generatedAt} className="shop-currency-note" />
      <ShopClient view={clientView} tiles={tiles} searchParams={params} />
    </>
  );
}

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="shop-luxury">
      <header className="shop-hero" data-ground="wine">
        <div className="shop-wrap">
          <ShopBanner />
          <p className="shop-kicker">ویترین حامی همراه</p>
          <h1>فروشگاه</h1>
          <p className="shop-hero__lead">موبایل، ساعت هوشمند، هدفون و لوازم جانبی؛ جست‌وجو کنید، مقایسه کنید، انتخاب کنید.</p>
          <Suspense fallback={<ShopHeroSearchFallback />}>
            <ShopHeroSearch />
          </Suspense>
        </div>
      </header>
      <section id="shop-catalog" className="shop-catalog" data-ground="paper" aria-label="محصولات فروشگاه">
        <div className="shop-wrap">
          <Suspense fallback={<ShopLoading />}>
            <ShopData searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
