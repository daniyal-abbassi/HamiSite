"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiGet, apiPost } from "@/lib/api-client";
import { PartnerBundleCard } from "./PartnerBundleCard";
import type { PartnerBundleDTO } from "@/types/bundles";

export function PartnerBundlesClient() {
  const { user, status } = useAuth();
  const { addBundle } = useCart();
  const [bundles, setBundles] = useState<PartnerBundleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPartner =
    status === "authenticated" &&
    user &&
    (user.role === "WHOLESALE" || user.role === "AGENT" || user.role === "ADMIN");

  useEffect(() => {
    if (!isPartner) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    apiGet<PartnerBundleDTO[] | { data: PartnerBundleDTO[] }>("/api/partners/bundles")
      .then((res) => {
        if (active && res) {
          const list = Array.isArray(res)
            ? res
            : Array.isArray((res as { data?: PartnerBundleDTO[] }).data)
            ? (res as { data: PartnerBundleDTO[] }).data!
            : [];
          setBundles(list);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : "خطا در دریافت اطلاعات سبدهای همکار";
          setError(msg);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isPartner]);

  const handleAddToCart = async (bundleId: number, quantity: number) => {
    await addBundle(bundleId, quantity);
  };

  // 1. Loading state
  if (status === "loading" || (isPartner && loading)) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4" aria-busy="true" aria-label="در حال دریافت سبدهای ویژه همکاران">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  // 2. Guest state (not logged in)
  if (status === "guest" || !user) {
    return (
      <div className="glass mx-auto my-12 flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <Lock className="size-10 text-aqua/60" />
        <h2 className="text-lg font-black">ورود به پنل همکاران</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          مشاهده سبدهای تخفیف‌دار اختصاصی تنها برای همکاران عمده و نمایندگان حامی همراه امکان‌پذیر است.
        </p>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row">
          <Link href={`/login?next=${encodeURIComponent("/partners/bundles")}`}>
            <Button variant="oxblood" className="w-full">ورود به حساب کاربری</Button>
          </Link>
          <Link href="/partners">
            <Button variant="ghost" className="w-full">درخواست همکاری عمده</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Logged in as regular retail customer (access forbidden)
  if (!isPartner) {
    return (
      <div className="glass mx-auto my-12 flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <ShieldAlert className="size-10 text-aqua/60" />
        <h2 className="text-lg font-black">دسترسی اختصاصی همکاران</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          حساب کاربری فعلی شما عادی است. سبدهای عمده تنها برای فروشگاه‌ها و شرکت‌های همکار فعال می‌باشند.
        </p>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row">
          <Link href="/partners">
            <Button variant="oxblood" className="w-full">ارتقای حساب به همکاری عمده</Button>
          </Link>
          <Link href="/shop">
            <Button variant="ghost" className="w-full">بازگشت به فروشگاه</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 4. Partner view with bundles
  return (
    <div className="space-y-8">
      {/* Intro Header (20% White Design) */}
      <div className="rounded-3xl bg-white text-zinc-950 border border-zinc-200/90 p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-950 text-amber-400 text-xs font-black mb-3 shadow-xs">
              <Store size={14} />
              <span>سبدهای عمده‌فروشی حامی همراه</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-950">
              سبدهای اختصاصی همکاران
            </h1>
            <p className="mt-2 text-sm text-zinc-600 max-w-2xl leading-relaxed font-medium">
              بسته‌های ترکیبی با قیمت‌های دست‌اول و حاشیه سود ویژه برای همکاران گرامی بازار موبایل. سبدها به‌صورت کامل و غیرقابل تفکیک عرضه می‌شوند.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <span>شرایط همکاری</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl bg-red-950/60 border border-red-800/80 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Empty state */}
      {bundles.length === 0 && !error ? (
        <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/60 p-12 text-center">
          <Sparkles className="mx-auto text-amber-400/60 mb-3" size={36} />
          <h3 className="text-base font-bold text-zinc-200 mb-1">در حال حاضر سبد فعالی وجود ندارد</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            سبدهای جدید به زودی توسط مدیریت حامی همراه برای همکاران منتشر خواهند شد.
          </p>
        </div>
      ) : (
        /* Bundles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <PartnerBundleCard
              key={bundle.id}
              bundle={bundle}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

