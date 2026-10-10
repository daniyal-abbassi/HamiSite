import type { ShopView } from "@/lib/shop-query-db";
import type { ShopTile } from "@/lib/shop-category-tiles-db";
import { CategoryTiles } from "./CategoryTiles";
import { FilterSheet } from "./FilterSheet";
import { ShopResults } from "./ShopResults";

type SearchParams = Record<string, string | string[] | undefined>;

/** Server-rendered shop composition; the filter sheet and result controls are isolated client islands. */
export function ShopClient({
  view,
  tiles,
  searchParams,
}: {
  view: Omit<ShopView, "categories">;
  tiles: ShopTile[];
  searchParams: SearchParams;
}) {
  const rawCategory = searchParams.category;
  const categorySlug = Array.isArray(rawCategory) ? rawCategory[0] ?? null : rawCategory ?? null;

  return (
    <div className="shop-client">
      <div className="shop-catalog-heading"><div><p className="shop-kicker">ویترین حامی همراه</p><h1>فروشگاه</h1></div><p>جست‌وجو کنید، مقایسه کنید، انتخاب کنید.</p></div>
      <CategoryTiles activeSlug={categorySlug} tiles={tiles} />
      <div className="shop-browse-layout mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <FilterSheet categoryFacets={view.categoryFacets} brands={view.brands} />
        <ShopResults
          cardVariant="oxblood"
          products={view.products}
          meta={view.meta}
          activeSort={view.activeSort}
          activeFilters={view.activeFilters}
          unknownFilter={view.unknownFilter}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
