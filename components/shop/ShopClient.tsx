"use client";

import { useSearchParams } from "next/navigation";
import type { ShopView } from "@/lib/shop-query-db";
import type { ShopTile } from "@/lib/shop-category-tiles-db";
import { CategoryTiles } from "./CategoryTiles";
import { FilterSheet } from "./FilterSheet";
import { ShopResults } from "./ShopResults";

/**
 * The listing's client half — presentation and URL writes only.
 *
 * This component used to own the data: two effects fetching the reference lists on
 * mount and the products on every query change, with the served document holding
 * none of it. `buildShopView` on the server does that now, so what is left here is
 * the part that genuinely has to run in the browser — reading the active category
 * for the tiles, and pushing new search params when a filter changes.
 */
export function ShopClient({ view, tiles }: { view: ShopView; tiles: ShopTile[] }) {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  return (
    <div className="shop-client">
      <CategoryTiles activeSlug={categorySlug} tiles={tiles} />

      {/* FilterSheet renders the sidebar inline from lg and as a bottom sheet
          below it, so the results are the first thing a phone sees. */}
      <div className="shop-catalog-heading"><div><p className="shop-kicker">ویترین حامی همراه</p><h2>برای انتخاب بعدی شما.</h2></div><p>جست‌وجو کنید، مقایسه کنید، انتخاب کنید.</p></div>
      <div className="shop-browse-layout mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <FilterSheet categoryFacets={view.categoryFacets} brands={view.brands} />
        <ShopResults
          cardVariant="oxblood"
          products={view.products}
          meta={view.meta}
          activeSort={view.activeSort}
          activeFilters={view.activeFilters}
          unknownFilter={view.unknownFilter}
        />
      </div>
    </div>
  );
}
