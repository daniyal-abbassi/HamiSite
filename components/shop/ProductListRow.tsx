import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resolveProductImage } from "@/lib/product-images";
import { cn, formatToman } from "@/lib/utils";
import { stockLabels } from "@/lib/content/shop";
import { compareAtOf, priceState, unitPriceOf } from "@/lib/product-identity";
import type { ShopProduct } from "./types";

export function ProductListRow({ product }: { product: ShopProduct }) {
  return (
    <article className="group flex overflow-hidden rounded-xl glass shadow-card">
      <Link
        href={`/shop/${product.slug}`}
        className="relative hidden w-40 shrink-0 bg-ink/40 md:block"
        aria-label={product.name}
      >
        <Image
          src={resolveProductImage(product)}
          alt={product.name}
          width={320}
          height={320}
          /* Fixed w-40 slot, and the row is hidden below md entirely. */
          sizes="160px"
          className="size-full object-contain p-4"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-normal text-aqua/80">{product.brand?.name ?? "—"}</span>
          {product.specialOffer && (
            <span className="rounded-xl bg-aqua/15 px-1.5 py-0.5 font-mono text-xs tracking-[0.08em] text-aqua">
              SPECIAL OFFER
            </span>
          )}
        </div>
        <h3 className="mt-1.5 text-base font-bold leading-7">
          <Link
            href={`/shop/${product.slug}`}
            /* Same hit-area inflation as the grid card title — the row title
               paints ~24px but must aim like a 44px control. */
            className="relative after:absolute after:inset-x-[-8px] after:inset-y-[-8px] after:content-[''] hover:text-aqua"
          >
            {product.name}
          </Link>
        </h3>
        {product.mainCategory && <p className="mt-0.5 text-xs text-foreground/50">{product.mainCategory.name}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-xs text-foreground/60">
            <i
              className={cn("size-1.5 rounded-full", product.stockType === "out_of_stock" ? "bg-destructive" : "bg-emerald-400")}
              aria-hidden="true"
            />
            {stockLabels[product.stockType] ?? "—"}
          </span>
          <div className="flex items-baseline gap-2">
            {(() => {
              /* `displayPrice` is 0 for call-for-price rows, so it goes through
                 `unitPriceOf` rather than straight to `formatToman` — printing
                 «۰ تومان» is exactly what FR-003 forbids. The strike gets the
                 same treatment: FR-004 allows it only above the real price. */
              const price = unitPriceOf(null, product.displayPrice);
              const compareAt = compareAtOf(price, product.compareAtPrice);
              return (
                <>
                  {compareAt != null && <del className="text-xs text-foreground/55">{formatToman(compareAt)}</del>}
                  {price === null ? (
                    <strong className="text-sm font-bold text-muted-foreground">تماس بگیرید</strong>
                  ) : (
                    <strong className="text-sm font-black text-aqua">{formatToman(price)}</strong>
                  )}
                </>
              );
            })()}
          </div>
          <Link href={`/shop/${product.slug}`} className="inline-flex items-center gap-1 text-xs font-bold text-aqua hover:underline">
            مشاهده جزئیات <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}