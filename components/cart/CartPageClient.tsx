"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { CartLine } from "@/components/cart/CartLine";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { formatToman } from "@/lib/utils";

export function CartPageClient() {
  const { status } = useAuth();
  const { cart, loading, hasCart, updateItem, removeItem, clear } = useCart();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guarded(action: () => Promise<void>, itemId: number | null) {
    setBusyId(itemId);
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading" || (loading && !cart)) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!hasCart) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <ShoppingBag className="size-10 text-gold/60" />
        <h2 className="text-lg font-black">وارد حساب خود شوید</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          سبد خرید شما به حساب کاربری متصل است تا در دستگاه‌های مختلف در دسترس بماند.
        </p>
        <Link href="/login?next=/cart">
          <Button>ورود / ثبت‌نام</Button>
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <ShoppingBag className="size-10 text-gold/60" />
        <h2 className="text-lg font-black">سبد خرید شما خالی است</h2>
        <p className="text-sm text-muted-foreground">هنوز محصولی انتخاب نکرده‌اید.</p>
        <Link href="/shop">
          <Button variant="oxblood">مشاهده محصولات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="glass rounded-2xl px-5 py-2">
          <div className="divide-y divide-line">
            {cart.items.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onUpdate={(id, quantity) => void guarded(() => updateItem(id, quantity), id)}
                onRemove={(id) => void guarded(() => removeItem(id), id)}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void guarded(() => clear(), null)}
          disabled={busyId !== null}
          className="mt-4 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline disabled:opacity-50"
        >
          خالی کردن سبد خرید
        </button>
      </div>

      <aside className="glass h-fit rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-black">خلاصه سفارش</h2>
        <div className="brand-hairline my-4" />
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">تعداد کالا</dt>
            <dd className="font-mono">{cart.itemCount.toLocaleString("fa-IR")}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">جمع سبد</dt>
            <dd className="font-black text-gold">{formatToman(cart.subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-6 text-muted-foreground/70">
          هزینه ارسال و تخفیف کوپن در مرحله بعد محاسبه می‌شود.
        </p>
        <Link href="/checkout" className="mt-5 block">
          <Button className="w-full" size="lg">
            ادامه و تسویه حساب
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
      </aside>
    </div>
  );
}
