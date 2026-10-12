"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { resolveProductImage } from "@/lib/product-images";
import { cn, formatToman } from "@/lib/utils";
import type { CartItem } from "@/types/store";

type CartLineProps = {
  item: CartItem;
  busy?: boolean;
  onUpdate: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
};

function variantLabel(item: CartItem): string {
  return [item.variant?.storage, item.variant?.color].filter(Boolean).join(" — ");
}

function maxQuantityFor(item: CartItem): number | null {
  if (item.isBundle) return null;
  const stockType = item.variant?.stockType ?? item.product?.stockType;
  if (stockType !== "limited") return null;
  return item.variant?.stock ?? null;
}

export function CartLine({ item, busy = false, onUpdate, onRemove }: CartLineProps) {
  const maxQty = maxQuantityFor(item);

  // Bundle Item Render
  if (item.isBundle) {
    return (
      <div className={cn("flex flex-col gap-2 py-4 border-b border-line/40 last:border-b-0", busy && "pointer-events-none opacity-60")}>
        <div className="flex gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            {item.product?.image?.url ? (
              <Image
                src={item.product.image.url}
                alt={item.bundleTitle || "سبد همکار"}
                fill
                sizes="64px"
                className="object-cover p-1"
              />
            ) : (
              <Sparkles className="size-6 text-amber-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 mb-0.5">
                  <Sparkles size={11} />
                  <span>سبد اختصاصی همکار</span>
                </div>
                <h3 className="truncate text-sm font-extrabold text-foreground">
                  {item.bundleTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`حذف ${item.bundleTitle} از سبد`}
                className="grid size-9 shrink-0 place-items-center rounded-full text-foreground/50 transition-colors duration-fast hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Breakdown of constituent items */}
        {item.bundleItems && item.bundleItems.length > 0 && (
          <div className="rounded-xl bg-ink/40 border border-line/40 p-2.5 text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-[11px] text-foreground/90">محتویات سبد (غیرقابل تفکیک):</p>
            <ul className="space-y-0.5">
              {item.bundleItems.map((bi) => (
                <li key={`${bi.productId}-${bi.variantId ?? "base"}`} className="flex items-center justify-between text-[11px]">
                  <span className="truncate pr-1">• {bi.productName}</span>
                  <span className="font-bold text-amber-300/90 shrink-0">
                    ×{bi.totalQuantity.toLocaleString("fa-IR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing and whole bundle quantity */}
        <div className="mt-1 flex items-center justify-between gap-2 pt-1">
          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-ink/40 p-1">
            <button
              type="button"
              aria-label="کاهش تعداد سبد"
              disabled={busy || item.quantity <= 1}
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              className="grid size-7 place-items-center rounded-full text-foreground/70 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-7 text-center font-mono text-sm font-bold" aria-live="polite">
              {item.quantity.toLocaleString("fa-IR")}
            </span>
            <button
              type="button"
              aria-label="افزایش تعداد سبد"
              disabled={busy}
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              className="grid size-7 place-items-center rounded-full text-foreground/70 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <strong className="text-sm font-black text-amber-400">{formatToman(item.lineTotal)}</strong>
        </div>
      </div>
    );
  }

  // Standard Product Item Render
  return (
    <div className={cn("flex gap-3 py-4", busy && "pointer-events-none opacity-60")}>
      <Link
        href={`/shop/${item.product?.slug ?? ""}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink/40"
        aria-label={item.product?.name ?? "محصول"}
      >
        <Image
          src={resolveProductImage({
            name: item.product?.name ?? "",
            images: item.product?.image ? [item.product.image] : [],
          })}
          alt={item.product?.name ?? ""}
          fill
          sizes="80px"
          className="object-contain p-1.5"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold">
              <Link href={`/shop/${item.product?.slug ?? ""}`} className="hover:text-aqua">
                {item.product?.name}
              </Link>
            </h3>
            {variantLabel(item) && (
              <p className="mt-0.5 font-mono text-xs tracking-normal text-muted-foreground/70">
                {variantLabel(item)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`حذف ${item.product?.name} از سبد`}
            className="grid size-11 shrink-0 place-items-center rounded-full text-foreground/50 transition-colors duration-fast hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {item.priceChanged && (
          <p className="mt-1.5 text-xs text-aqua">
            قیمت به‌روزرسانی شده — اکنون {formatToman(item.currentUnitPrice)} است.
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-ink/40 p-1">
            <button
              type="button"
              aria-label="کاهش تعداد"
              disabled={busy || item.quantity <= 1}
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              className="grid size-7 place-items-center rounded-full text-foreground/70 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-7 text-center font-mono text-sm" aria-live="polite">
              {item.quantity.toLocaleString("fa-IR")}
            </span>
            <button
              type="button"
              aria-label="افزایش تعداد"
              disabled={busy || (maxQty !== null && item.quantity >= maxQty)}
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              className="grid size-7 place-items-center rounded-full text-foreground/70 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <strong className="text-sm font-black text-aqua">{formatToman(item.lineTotal)}</strong>
        </div>
      </div>
    </div>
  );
}
