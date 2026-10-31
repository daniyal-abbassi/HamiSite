import type { ShopView } from "@/lib/shop-query-db";
import type { ShopTile } from "@/lib/shop-category-tiles-db";
import { CategoryTiles } from "./CategoryTiles";
import { ShopResults } from "./ShopResults";
import { ShopToolbar } from "./ShopToolbar";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Server-rendered shop composition; the toolbar and result controls are isolated client islands. */
export function ShopClient({
  view,
  tiles,
  searchParams,
}: {
  view: Omit<ShopView, "categories">;
  tiles: ShopTile[];
  searchParams: SearchParams;
}) {
  const categorySlug = first(searchParams.category) ?? null;
  const total = view.unknownFilter ? null : view.meta?.total ?? view.products?.length ?? null;

  return (
    <div className="shop-client">
      <CategoryTiles activeSlug={categorySlug} tiles={tiles} />
      <ShopToolbar
        categoryFacets={view.categoryFacets}
        brands={view.brands}
        total={total}
        activeSort={view.activeSort}
        listView={first(searchParams.view) === "list"}
      />
      <ShopResults
        cardVariant="oxblood"
        products={view.products}
        meta={view.meta}
        activeFilters={view.activeFilters}
        unknownFilter={view.unknownFilter}
        searchParams={searchParams}
      />
    </div>
  );
}
