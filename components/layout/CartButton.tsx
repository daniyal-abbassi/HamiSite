"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

/** Header cart trigger — opens the glass drawer. The badge shows the live
 * server-cart count (0/hidden for guests until they add something). */
export function CartButton() {
  const { itemCount, openDrawer } = useCart();

  const handlePrefetch = () => {
    void import("@/components/cart/CartDrawer");
  };

  return (
    <button
      type="button"
      onClick={openDrawer}
      onPointerEnter={handlePrefetch}
      onFocus={handlePrefetch}
      aria-label={itemCount > 0 ? `سبد خرید، ${itemCount.toLocaleString("fa-IR")} کالا` : "سبد خرید"}
      className="relative grid size-11 extend-touch-target shrink-0 place-items-center rounded-full text-foreground/75 transition-[transform,background-color,color] duration-100 ease-out hover:bg-foreground/10 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <ShoppingBag className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -end-0.5 -top-0.5 grid size-4.5 place-items-center rounded-full bg-aqua px-1 font-mono text-xs font-bold text-primary-foreground"
        >
          {itemCount.toLocaleString("fa-IR")}
        </span>
      )}
    </button>
  );
}
