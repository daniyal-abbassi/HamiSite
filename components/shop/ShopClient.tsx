"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiGetWithMeta } from "@/lib/api-client";
import { SHOP_PAGE_SIZE } from "@/lib/content/shop";
import { CategoryTiles } from "./CategoryTiles";
import { FilterSidebar } from "./FilterSidebar";
import { ShopResults } from "./ShopResults";
import type { ShopBrand, ShopCategory, ShopMeta, ShopProduct } from "./types";

function findCategory(list: ShopCategory[], slug: string): ShopCategory | undefined {
  for (const category of list) {
    if (category.slug === slug) return category;
    const child = category.children ? findCategory(category.children, slug) : undefined;
    if (child) return child;
  }
  return undefined;
}

function normalizeMeta(meta: Record<string, unknown> | undefined): ShopMeta | null {
  if (!meta) return null;
  return {
    page: Number(meta.page) || 1,
    pageSize: Number(meta.pageSize) || SHOP_PAGE_SIZE,
    total: Number(meta.total) || 0,
    hasNextPage: Boolean(meta.hasNextPage),
  };
}

export function ShopClient() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<ShopCategory[] | null>(null);
  const [brands, setBrands] = useState<ShopBrand[] | null>(null);
  const [products, setProducts] = useState<ShopProduct[] | null>(null);
  const [meta, setMeta] = useState<ShopMeta | null>(null);
  const [error, setError] = useState(false);

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

    const params = new URLSearchParams({ pageSize: String(SHOP_PAGE_SIZE), includeVariants: "false" });
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    const categoryId = categorySlug ? findCategory(categories ?? [], categorySlug)?.id : undefined;
    if (categoryId) params.set("categoryId", String(categoryId));
    const brandId = brandSlug ? (brands ?? []).find((brand) => brand.slug === brandSlug)?.id : undefined;
    if (brandId) params.set("brandId", String(brandId));
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
      {categories !== null && <CategoryTiles categories={categories} activeSlug={categorySlug} />}

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <FilterSidebar categories={categories ?? []} brands={brands ?? []} />
        <ShopResults products={products} meta={meta} error={error} activeSort={activeSort} />
      </div>
    </div>
  );
}
