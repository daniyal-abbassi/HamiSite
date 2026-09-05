"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

/** Header cart trigger — opens the glass drawer. The badge shows the live
 * server-cart count (0/hidden for guests until they add something). */
export function CartButton() {
  const { itemCount, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={itemCount > 0 ? `سبد خرید، ${itemCount.toLocaleString("fa-IR")} کالا` : "سبد خرید"}
      className="relative grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground"
    >
      <ShoppingBag className="size-[18px]" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 font-mono text-[10px] font-bold text-primary-foreground"
        >
          {itemCount.toLocaleString("fa-IR")}
        </span>
      )}
    </button>
  );
}
