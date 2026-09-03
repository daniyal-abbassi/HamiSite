import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resolveProductImage } from "@/lib/product-images";
import { cn, formatToman } from "@/lib/utils";
import { stockLabels } from "@/lib/content/shop";
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
          className="size-full object-contain p-4"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.1em] text-gold/80">{product.brand?.name ?? "—"}</span>
          {product.specialOffer && (
            <span className="rounded-xl bg-gold/15 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em] text-gold">
              SPECIAL OFFER
            </span>
          )}
        </div>
        <h3 className="mt-1.5 text-sm font-extrabold leading-6">
          <Link href={`/shop/${product.slug}`} className="hover:text-gold">
            {product.name}
          </Link>
        </h3>
        {product.mainCategory && <p className="mt-0.5 text-[11px] text-foreground/50">{product.mainCategory.name}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-foreground/60">
            <i
              className={cn("size-1.5 rounded-full", product.stockType === "out_of_stock" ? "bg-destructive" : "bg-emerald-400")}
              aria-hidden="true"
            />
            {stockLabels[product.stockType] ?? "—"}
          </span>
          <div className="flex items-baseline gap-2">
            {product.compareAtPrice != null && product.compareAtPrice > 0 && (
              <del className="text-[11px] text-foreground/55">{formatToman(product.compareAtPrice)}</del>
            )}
            <strong className="text-sm font-black text-gold">{formatToman(product.displayPrice)}</strong>
          </div>
          <Link href={`/shop/${product.slug}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:underline">
            مشاهده جزئیات <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}