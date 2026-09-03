"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, List, PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, toFaDigits } from "@/lib/utils";
import { sortOptions } from "@/lib/content/shop";
import { ProductCard } from "./ProductCard";
import { ProductListRow } from "./ProductListRow";
import type { ShopMeta, ShopProduct } from "./types";

type ShopResultsProps = {
  products: ShopProduct[] | null;
  meta: ShopMeta | null;
  error: boolean;
  activeSort: string;
};

function pageWindow(page: number, totalPages: number): number[] {
  const size = 5;
  let start = Math.max(1, page - Math.floor(size / 2));
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function ShopResults({ products, meta, error, activeSort }: ShopResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [listView, setListView] = useState(false);

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;
  const page = meta?.page ?? 1;

  function goToPage(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function changeSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <div className="min-w-0 flex-1">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl glass px-4 py-3">
        <p className="text-xs text-foreground/60" aria-live="polite">
          {error ? "—" : products === null ? "در حال بارگذاری…" : `${toFaDigits(meta?.total ?? products.length)} محصول`}
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="shop-sort">مرتب‌سازی</label>
          <select
            id="shop-sort"
            value={activeSort}
            onChange={(event) => changeSort(event.target.value)}
            className="rounded-xl border border-input bg-background/40 px-2.5 py-1.5 text-[11px] font-bold"
          >
            <option value="">مرتب‌سازی: پیش‌فرض</option>
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-xl border border-line" role="group" aria-label="نوع نمایش">
            <button
              type="button"
              aria-pressed={!listView}
              aria-label="نمایش شبکه‌ای"
              onClick={() => setListView(false)}
              className={cn(
                "grid size-8 place-items-center",
                !listView ? "bg-gold/15 text-gold" : "text-foreground/50 hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              aria-pressed={listView}
              aria-label="نمایش فهرستی"
              onClick={() => setListView(true)}
              className={cn(
                "grid size-8 place-items-center border-s border-line",
                listView ? "bg-gold/15 text-gold" : "text-foreground/50 hover:text-foreground",
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl glass p-10 text-center" role="status">
          <b className="block font-extrabold">دریافت محصولات موقتاً ممکن نیست.</b>
          <p className="mt-2 text-sm text-foreground/60">اتصال خود را بررسی کنید و دوباره تلاش کنید.</p>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
            تلاش دوباره
          </Link>
        </div>
      )}

      {/* Loading */}
      {products === null && !error && (
        <div className={cn("mt-6", listView ? "space-y-4" : "grid grid-cols-2 gap-5 xl:grid-cols-3")} aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {products !== null && !error && products.length === 0 && (
        <div className="mt-6 rounded-xl glass p-12 text-center" role="status">
          <PackageSearch className="mx-auto size-10 text-gold/60" aria-hidden="true" />
          <b className="mt-4 block font-extrabold">محصولی با این فیلترها پیدا نشد.</b>
          <p className="mt-2 text-sm text-foreground/60">محدوده قیمت را تغییر دهید یا فیلترها را حذف کنید.</p>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
            حذف همه فیلترها
          </Link>
        </div>
      )}

      {/* Results + pagination */}
      {products !== null && !error && products.length > 0 && (
        <>
          {listView ? (
            <div className="mt-6 space-y-4">
              {products.map((product) => (
                <ProductListRow key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-5 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="صفحه‌بندی محصولات">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                aria-label="صفحه قبل"
                className="grid size-9 place-items-center rounded-xl border border-line text-foreground/70 transition-colors hover:border-gold/50 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
              {pageWindow(page, totalPages).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => goToPage(target)}
                  aria-current={target === page ? "page" : undefined}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl border text-xs font-bold transition-colors",
                    target === page
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-line text-foreground/70 hover:border-gold/50",
                  )}
                >
                  {toFaDigits(target)}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                aria-label="صفحه بعد"
                className="grid size-9 place-items-center rounded-xl border border-line text-foreground/70 transition-colors hover:border-gold/50 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
