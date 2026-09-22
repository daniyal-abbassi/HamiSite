"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiGetWithMeta } from "@/lib/api-client";
import { SHOP_PAGE_SIZE } from "@/lib/content/shop";
import { flattenTree, resolveFilter } from "@/lib/shop-filters";
import { CategoryTiles } from "./CategoryTiles";
import { FilterSheet } from "./FilterSheet";
import { ShopResults } from "./ShopResults";
import type { ShopBrand, ShopCategory, ShopMeta, ShopProduct } from "./types";

function normalizeMeta(meta: Record<string, unknown> | undefined): ShopMeta | null {
  if (!meta) return null;
  return {
    page: Number(meta.page) || 1,
    pageSize: Number(meta.pageSize) || SHOP_PAGE_SIZE,
    total: Number(meta.total) || 0,
    hasNextPage: Boolean(meta.hasNextPage),
  };
}

export function ShopClient({ tileSlugs }: { tileSlugs: string[] }) {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<ShopCategory[] | null>(null);
  const [brands, setBrands] = useState<ShopBrand[] | null>(null);
  const [products, setProducts] = useState<ShopProduct[] | null>(null);
  const [meta, setMeta] = useState<ShopMeta | null>(null);
  const [error, setError] = useState(false);
  const [unknownFilter, setUnknownFilter] = useState<string | null>(null);

  const categorySlug = searchParams.get("category");
  const brandSlug = searchParams.get("brand");
  const activeSort = searchParams.get("sort") ?? "";

  // Reference data (categories for slug→id resolution + tiles, brands for the sidebar).
  useEffect(() => {
    let cancelled = false;
    apiGet<ShopCategory[]>("/api/categories?tree=true")
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    apiGet<ShopBrand[]>("/api/brands")
      .then((data) => {
        if (!cancelled) setBrands(data);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Products — refetched whenever the URL query changes.
  useEffect(() => {
    // Wait for reference data when a slug filter needs resolving to an id.
    if ((categorySlug && categories === null) || (brandSlug && brands === null)) return;

    let cancelled = false;
    setProducts(null);
    setError(false);

    // An unrecognised slug used to be dropped, which left the request unfiltered and
    // showed the whole catalogue behind a link that looked like it had worked. Resolve
    // explicitly and stop instead.
    const categoryOutcome = resolveFilter(flattenTree(categories ?? []), categorySlug);
    const brandOutcome = resolveFilter(brands ?? [], brandSlug);
    const unresolved =
      categoryOutcome.status === "unknown" ? categoryOutcome.requested
      : brandOutcome.status === "unknown" ? brandOutcome.requested
      : null;

    if (unresolved !== null) {
      setUnknownFilter(unresolved);
      setMeta(null);
      setProducts([]);
      return;
    }
    setUnknownFilter(null);

    const params = new URLSearchParams({ pageSize: String(SHOP_PAGE_SIZE), includeVariants: "false" });
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    if (categoryOutcome.status === "resolved") params.set("categoryId", String(categoryOutcome.item.id));
    if (brandOutcome.status === "resolved") params.set("brandId", String(brandOutcome.item.id));
    const min = searchParams.get("min");
    if (min) params.set("minPrice", min);
    const max = searchParams.get("max");
    if (max) params.set("maxPrice", max);
    const stock = searchParams.get("stock");
    if (stock) params.set("stockType", stock);
    if (searchParams.get("special") === "1") params.set("specialOffer", "true");
    if (activeSort) params.set("sort", activeSort);
    const pageParam = searchParams.get("page");
    if (pageParam) params.set("page", pageParam);

    apiGetWithMeta<ShopProduct[]>(`/api/products?${params.toString()}`)
      .then(({ data, meta: responseMeta }) => {
        if (!cancelled) {
          setProducts(data);
          setMeta(normalizeMeta(responseMeta));
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, categories, brands, categorySlug, brandSlug, activeSort]);

  return (
    <div>
      {categories !== null && <CategoryTiles categories={categories} activeSlug={categorySlug} tileSlugs={tileSlugs} />}

      {/* FilterSheet renders the sidebar inline from lg and as a bottom sheet
          below it, so the results are the first thing a phone sees. */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <FilterSheet categories={categories ?? []} brands={brands ?? []} />
        <ShopResults products={products} meta={meta} error={error} activeSort={activeSort} unknownFilter={unknownFilter} />
      </div>
    </div>
  );
}
