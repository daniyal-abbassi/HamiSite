"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
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

/** Max quantity the server will accept for this line. Only variant rows carry
 * a stock count in the cart payload; for product-level lines the cap is
 * unknown client-side and the API enforces it with a 409 anyway. */
function maxQuantityFor(item: CartItem): number | null {
  const stockType = item.variant?.stockType ?? item.product.stockType;
  if (stockType !== "limited") return null;
  return item.variant?.stock ?? null;
}

export function CartLine({ item, busy = false, onUpdate, onRemove }: CartLineProps) {
  const maxQty = maxQuantityFor(item);

  return (
    <div className={cn("flex gap-3 py-4", busy && "pointer-events-none opacity-60")}>
      <Link
        href={`/shop/${item.product.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink/40"
        aria-label={item.product.name}
      >
        <Image
          src={resolveProductImage({ name: item.product.name })}
          alt={item.product.name}
          fill
          sizes="80px"
          className="object-contain p-1.5"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold">
              <Link href={`/shop/${item.product.slug}`} className="hover:text-gold">
                {item.product.name}
              </Link>
            </h3>
            {variantLabel(item) && (
              <p className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground/70">
                {variantLabel(item)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`حذف ${item.product.name} از سبد`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-foreground/50 transition-colors duration-fast hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {item.priceChanged && (
          <p className="mt-1.5 text-[11px] text-gold">
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
              className="grid size-7 place-items-center rounded-full text-foreground/70 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40"
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
              className="grid size-7 place-items-center rounded-full text-foreground/70 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <strong className="text-sm font-black text-gold">{formatToman(item.lineTotal)}</strong>
        </div>
      </div>
    </div>
  );
}
