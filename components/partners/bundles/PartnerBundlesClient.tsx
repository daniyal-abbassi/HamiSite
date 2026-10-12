"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert, Sparkles, Store } from "lucide-react";
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
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-sm text-zinc-400">در حال دریافت سبدهای ویژه همکاران...</p>
      </div>
    );
  }

  // 2. Guest state (not logged in)
  if (status === "guest" || !user) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-zinc-900/80 border border-zinc-800 p-8 text-center my-12 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-5">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-black text-zinc-100 mb-2">ورود به پنل همکاران</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          مشاهده سبدهای تخفیف‌دار اختصاصی تنها برای همکاران عمده و نمایندگان حامی همراه امکان‌پذیر است.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 text-xs transition-colors"
          >
            ورود به حساب کاربری
          </Link>
          <Link
            href="/partners"
            className="w-full sm:w-auto rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-6 py-2.5 text-xs transition-colors"
          >
            درخواست همکاری عمده
          </Link>
        </div>
      </div>
    );
  }

  // 3. Logged in as regular retail customer (access forbidden)
  if (!isPartner) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-zinc-900/80 border border-red-950/80 p-8 text-center my-12 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-5">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-black text-zinc-100 mb-2">دسترسی اختصاصی همکاران</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          حساب کاربری فعلی شما عادی است. سبدهای عمده تنها برای فروشگاه‌ها و شرکت‌های همکار فعال می‌باشند.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/partners"
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 text-xs transition-colors"
          >
            ارتقای حساب به همکاری عمده
          </Link>
          <Link
            href="/shop"
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-6 py-2.5 text-xs transition-colors"
          >
            بازگشت به فروشگاه
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
            <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">
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

