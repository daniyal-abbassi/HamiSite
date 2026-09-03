import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resolveProductImage } from "@/lib/product-images";
import { cn, formatToman } from "@/lib/utils";
import { stockLabels } from "@/lib/content/shop";
import type { ShopProduct } from "./types";

export function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl glass shadow-card transition-transform duration-slow hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-ink/40">
        <span className="absolute start-3 top-3 z-10 rounded-xl bg-ink-2/85 px-2 py-1 font-mono text-[9px] tracking-[0.08em] text-gold-lite">
          {product.specialOffer ? "SPECIAL OFFER" : "HAMI / SHOP"}
        </span>
        <Link href={`/shop/${product.slug}`} className="grid h-full place-items-center" aria-label={product.name}>
          <Image
            src={resolveProductImage(product)}
            alt={product.name}
            width={600}
            height={600}
            className="size-full object-contain p-5 transition-transform duration-slow group-hover:scale-105"
          />
        </Link>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="font-mono text-[9px] tracking-[0.1em] text-gold/80">{product.brand?.name ?? "—"}</span>
        <h3 className="mt-1.5 text-sm font-extrabold leading-6">
          <Link href={`/shop/${product.slug}`} className="hover:text-gold">
            {product.name}
          </Link>
        </h3>
        {product.mainCategory && <p className="mt-0.5 text-[11px] text-foreground/50">{product.mainCategory.name}</p>}
        <div className="mt-3 flex items-baseline gap-2">
          {product.compareAtPrice != null && product.compareAtPrice > 0 && (
            <del className="text-[11px] text-foreground/55">{formatToman(product.compareAtPrice)}</del>
          )}
          <strong className="text-sm font-black text-gold">{formatToman(product.displayPrice)}</strong>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-foreground/60">
            <i
              className={cn("size-1.5 rounded-full", product.stockType === "out_of_stock" ? "bg-destructive" : "bg-emerald-400")}
              aria-hidden="true"
            />
            {stockLabels[product.stockType] ?? "—"}
          </span>
          <Link href={`/shop/${product.slug}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:underline">
            مشاهده <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}