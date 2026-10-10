import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { toFaDigits } from "@/lib/utils";
import { ProductCard, type CardVariant } from "./ProductCard";
import { ProductListRow } from "./ProductListRow";
import { ShopResultControls } from "./ShopResultControls";
import type { ShopMeta, ShopProduct } from "./types";

type SearchParams = Record<string, string | string[] | undefined>;

type ShopResultsProps = {
  cardVariant?: CardVariant;
  products: ShopProduct[] | null;
  meta: ShopMeta | null;
  activeSort: string;
  activeFilters?: { key: string; label: string }[];
  unknownFilter?: string | null;
  searchParams: SearchParams;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function hrefWith(params: SearchParams, key: string, value?: string): string {
  const query = new URLSearchParams();
  for (const [name, raw] of Object.entries(params)) {
    if (name === key || name === "page") continue;
    for (const item of Array.isArray(raw) ? raw : raw == null ? [] : [raw]) query.append(name, item);
  }
  if (value) query.set(key, value);
  const serialized = query.toString();
  return serialized ? `/shop?${serialized}` : "/shop";
}

export function ShopResults({
  products,
  cardVariant = "obsidian",
  meta,
  activeSort,
  unknownFilter = null,
  activeFilters = [],
  searchParams,
}: ShopResultsProps) {
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;
  const page = meta?.page ?? 1;
  const listView = first(searchParams.view) === "list";

  return (
    <div className="shop-results min-w-0 flex-1">
      {activeFilters.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="فیلترهای فعال">
          {activeFilters.map((filter) => (
            <Link
              key={`${filter.key}-${filter.label}`}
              href={hrefWith(searchParams, filter.key)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-champagne/60"
            >
              {filter.label}<span aria-hidden="true">×</span>
              <span className="sr-only">حذف فیلتر {filter.label}</span>
            </Link>
          ))}
          <Link href="/shop" className="inline-flex min-h-11 items-center text-xs font-bold text-aqua underline-offset-4 hover:underline">
            حذف همه فیلترها
          </Link>
        </div>
      )}

      <div className="shop-results-toolbar flex flex-wrap items-center justify-between gap-3 rounded-xl glass px-4 py-3">
        <p className="text-xs text-foreground/60" aria-live="polite">
          {unknownFilter ? "—" : products === null ? "در حال بارگذاری…" : `${toFaDigits(meta?.total ?? products.length)} محصول`}
        </p>
        <ShopResultControls activeSort={activeSort} listView={listView} />
      </div>

      {unknownFilter && (
        <div className="mt-6 rounded-xl glass p-12 text-center" role="status">
          <PackageSearch className="mx-auto size-10 text-aqua/60" aria-hidden="true" />
          <b className="mt-4 block font-extrabold">«{unknownFilter}» در برندها یا دسته‌بندی‌های ما پیدا نشد.</b>
          <p className="mt-2 text-sm text-foreground/60">این پیوند ممکن است قدیمی باشد؛ فهرست کامل محصولات را ببینید.</p>
          <Link href="/shop" className="mt-5 inline-flex min-h-11 items-center text-xs font-bold text-aqua hover:underline">مشاهده همه محصولات</Link>
        </div>
      )}

      {!unknownFilter && products === null && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-square animate-pulse rounded-xl bg-foreground/5" />)}
        </div>
      )}

      {!unknownFilter && products !== null && products.length === 0 && (
        <div className="mt-6 rounded-xl glass p-12 text-center" role="status">
          <PackageSearch className="mx-auto size-10 text-aqua/60" aria-hidden="true" />
          <b className="mt-4 block font-extrabold">محصولی با این فیلترها پیدا نشد.</b>
          <p className="mt-2 text-sm text-foreground/60">محدوده قیمت را تغییر دهید یا فیلترها را حذف کنید.</p>
          <Link href="/shop" className="mt-5 inline-flex min-h-11 items-center text-xs font-bold text-aqua hover:underline">حذف همه فیلترها</Link>
        </div>
      )}

      {!unknownFilter && products && products.length > 0 && (
        <>
          {listView ? (
            <div className="shop-product-list mt-6 space-y-4">{products.map((product) => <ProductListRow key={product.id} product={product} />)}</div>
          ) : (
            <div className="shop-product-grid mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant={cardVariant} frame="plinth" imageSizes="(max-width: 767px) calc((100vw - 44px) / 2), (max-width: 1023px) calc((100vw - 68px) / 2), (max-width: 1535px) calc((100vw - 356px) / 2), 350px" />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="shop-pagination mt-10 flex items-center justify-center gap-1.5" aria-label="صفحه‌بندی محصولات">
              {page > 1 && <Link href={hrefWith(searchParams, "page", String(page - 1))} aria-label="صفحه قبل" className="grid size-11 place-items-center rounded-xl border border-line">›</Link>}
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const target = start + index;
                return <Link key={target} href={hrefWith(searchParams, "page", String(target))} aria-current={target === page ? "page" : undefined} className={`grid size-11 place-items-center rounded-xl border border-line text-xs font-bold ${target === page ? "bg-aqua/15 text-aqua" : ""}`}>{toFaDigits(target)}</Link>;
              })}
              {page < totalPages && <Link href={hrefWith(searchParams, "page", String(page + 1))} aria-label="صفحه بعد" className="grid size-11 place-items-center rounded-xl border border-line">‹</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
