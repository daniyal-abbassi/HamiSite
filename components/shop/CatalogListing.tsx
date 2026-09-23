import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
import { sortOptions } from "@/lib/content/shop";
import { isFilteredView, listingViewHref, type ListingView } from "@/lib/listing-view";
import { cn, toFaDigits } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";

/**
 * A dedicated destination for one brand or one category.
 *
 * FR-029 asks for "a dedicated place, not only through a filter", and until this
 * file there was no such place: every brand and category link in the repo, the
 * homepage rows and the carousel included, was a `/shop?` query string onto the
 * general listing. That is also why three vocabularies could grow up claiming the
 * same department — a query string has no room to say what it contains.
 *
 * A destination does: it carries its own title, its honest count, and the same
 * price-currency disclosure the listing shows. What it still does not carry is the
 * filter panel — narrowing *inside* one brand is a different product decision and
 * nothing in the spec asks for it. Ordering and obtainability, though, are not
 * narrowing: they are what T061 found missing, since «the cheapest power bank that
 * is actually available» took seven taps through `/shop` and could not be answered
 * here at all. Two controls, both plain links, so the page stays server-rendered
 * and a URL still describes the whole view.
 */
export function CatalogListing({
  eyebrow,
  title,
  description,
  total,
  shownTotal,
  products,
  breadcrumb,
  basePath,
  view,
  obtainableCount,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Everything the destination covers, before any control is applied. */
  total: number;
  /** What is on screen after them, which is the number the grid must match. */
  shownTotal: number;
  products: CatalogProduct[];
  breadcrumb: { label: string; href: string }[];
  basePath: string;
  view: ListingView;
  /** How many of this destination's records can actually be sold today. */
  obtainableCount: number;
}) {
  const viewHref = (next: Partial<ListingView>) => listingViewHref(basePath, view, next);
  return (
    <div className="container py-10">
      <nav aria-label="مسیر صفحه" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/70">
        <Link href="/" className="transition-colors hover:text-aqua">خانه</Link>
        {breadcrumb.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            <Link href={crumb.href} className="transition-colors hover:text-aqua">
              {crumb.label}
            </Link>
          </span>
        ))}
        <span aria-hidden="true">/</span>
        <span className="text-foreground/85">{title}</span>
      </nav>

      <header className="mb-8">
        <div className="section-label">
          <span>{eyebrow}</span>
          <i />
          <p>{title}</p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-normal text-foreground md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
        <p className="mt-3 text-xs text-foreground/60" aria-live="polite">
          {shownTotal === total
            ? `${toFaDigits(total)} محصول`
            : `${toFaDigits(shownTotal)} محصول از ${toFaDigits(total)}`}
        </p>
        <DataCurrencyNote className="mt-2 text-xs" />
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5" role="group" aria-label="وضعیت موجودی">
          <Link
            href={viewHref({ obtainable: false })}
            aria-pressed={!view.obtainable}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
              !view.obtainable ? "border-champagne/60 text-champagne" : "border-line text-foreground/70 hover:border-champagne/40",
            )}
          >
            همه
          </Link>
          <Link
            href={viewHref({ obtainable: true })}
            aria-pressed={view.obtainable}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
              view.obtainable ? "border-champagne/60 text-champagne" : "border-line text-foreground/70 hover:border-champagne/40",
            )}
          >
            فقط قابل خرید
          </Link>

          {/*
           * The shortcut, and the reason it is here rather than two more taps: T061
           * measured «the cheapest power bank that is actually available» at four
           * interactions even after both controls worked. This one is three, and its URL
           * is byte-identical to pressing them in turn (`listingViewHref`), so there is
           * no second, divergent way to mean the same thing. Only offered where the
           * destination has something to obtain — a chip onto an empty list is a door
           * that lies.
           */}
          {obtainableCount > 0 && (
            <Link
              href={
                view.sort === "price-asc" && view.obtainable
                  ? viewHref({ sort: "", obtainable: false })
                  : viewHref({ sort: "price-asc", obtainable: true })
              }
              aria-pressed={view.sort === "price-asc" && view.obtainable}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                view.sort === "price-asc" && view.obtainable
                  ? "border-aqua text-aqua"
                  : "border-line text-foreground/70 hover:border-aqua/40",
              )}
            >
              ارزان‌ترینِ قابل خرید
              <span className="ms-1.5 font-mono text-[10px] opacity-60">{toFaDigits(obtainableCount)}</span>
            </Link>
          )}

          {isFilteredView(view) && (
            <Link href={viewHref({ sort: "", obtainable: false })} className="px-1 text-xs font-bold text-muted-foreground underline-offset-4 hover:underline">
              پاک کردن
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="مرتب‌سازی">
          {sortOptions.map((option) => (
            <Link
              key={option.key}
              href={viewHref({ sort: view.sort === option.key ? "" : option.key })}
              aria-pressed={view.sort === option.key}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                view.sort === option.key ? "border-aqua text-aqua" : "border-line text-foreground/70 hover:border-aqua/40",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-line bg-ink-3/80 p-8 text-center">
          <b className="block text-sm font-bold text-foreground">
            {view.obtainable ? "در این بخش در حال حاضر محصول قابل خریدی وجود ندارد." : "در این بخش محصولی برای نمایش وجود ندارد."}
          </b>
          <p className="mt-2 text-xs text-muted-foreground">
            {toFaDigits(total)} محصول این بخش است؛ نمایش فعلی {toFaDigits(shownTotal)} مورد را نشان می‌دهد.
          </p>
          <Link href={basePath} className="mt-4 inline-block text-xs font-bold text-aqua hover:underline">
            نمایش همهٔ این بخش
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full border border-champagne/25 px-5 py-2.5 text-xs font-bold text-foreground/80 transition-colors hover:border-champagne/60"
        >
          همه محصولات فروشگاه
        </Link>
      </div>
    </div>
  );
}
