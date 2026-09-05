"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { CartLine } from "@/components/cart/CartLine";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { formatToman } from "@/lib/utils";

/** Floating glass drawer anchored to the logical end edge (physical left under
 * RTL — the same side as the header's cart icon). Renders inside CartProvider
 * so any page can trigger it via `openDrawer()`. */
export function CartDrawer() {
  const { status } = useAuth();
  const { cart, loading, hasCart, drawerOpen, closeDrawer, updateItem, removeItem } = useCart();

  // Scroll lock + Escape-to-close while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="سبد خرید">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/80 backdrop-blur-sm"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside className="glass absolute inset-y-3 end-3 flex w-96 max-w-[92vw] animate-slide-in-start flex-col rounded-2xl p-5 text-foreground shadow-deep">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base font-black">
            <ShoppingBag className="size-5 text-gold" />
            سبد خرید
          </span>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="بستن سبد خرید"
            className="grid size-9 place-items-center rounded-full transition-colors duration-fast hover:bg-foreground/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="brand-hairline my-4" />

        {status === "loading" || (loading && !cart) ? (
          <div className="flex-1 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-20 rounded-lg" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-7 w-1/2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasCart ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="size-10 text-gold/60" />
            <p className="text-sm leading-7 text-muted-foreground">
              برای مشاهده سبد خرید ابتدا وارد حساب خود شوید.
            </p>
            <Link href="/login" onClick={closeDrawer}>
              <Button size="sm">ورود به حساب</Button>
            </Link>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="size-10 text-gold/60" />
            <p className="text-sm text-muted-foreground">سبد خرید شما خالی است.</p>
            <Link href="/shop" onClick={closeDrawer}>
              <Button size="sm" variant="oxblood">
                رفتن به فروشگاه
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-line overflow-y-auto pe-1">
              {cart.items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  onUpdate={(id, quantity) => void updateItem(id, quantity).catch(() => undefined)}
                  onRemove={(id) => void removeItem(id).catch(() => undefined)}
                />
              ))}
            </div>

            <div className="brand-hairline my-4" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">جمع کل ({cart.itemCount.toLocaleString("fa-IR")} کالا)</span>
              <strong className="text-base font-black text-gold">{formatToman(cart.subtotal)}</strong>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link href="/cart" onClick={closeDrawer}>
                <Button variant="ghost" className="w-full">
                  مشاهده سبد
                </Button>
              </Link>
              <Link href="/checkout" onClick={closeDrawer}>
                <Button className="w-full">تسویه حساب</Button>
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
