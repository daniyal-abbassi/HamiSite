"use client";

import { useSection } from "../useSection";
import { apiGet } from "@/lib/api-client";
import { toFaDigits } from "@/lib/utils";
import { SectionEmpty, SectionSkeleton, SectionUnreadable } from "@/components/admin/states/SectionState";

type DashboardSnapshot = {
  totals: { products: number; categories: number; brands: number; users: number; orders: number };
  inventory: { byStockState: Record<string, number>; catalogGeneratedAt: string | null };
};
const stateLabels: Record<string, string> = { limited: "موجودی محدود", out_of_stock: "ناموجود", call: "استعلام تلفنی", unlimited: "نامحدود", unknown: "نامشخص" };
const stateSurfaces: Record<string, string> = {
  limited: "border-amber-200 bg-amber-50",
  out_of_stock: "border-rose-200 bg-rose-50",
  call: "border-sky-200 bg-sky-50",
  unlimited: "border-emerald-200 bg-emerald-50",
  unknown: "border-violet-200 bg-violet-50",
};

export function CatalogInventorySection() {
  const { state, data, onRetry } = useSection<DashboardSnapshot>(
    () => apiGet<DashboardSnapshot>("/api/admin/dashboard"),
    (snapshot) => snapshot.totals.products === 0,
  );
  if (state === "loading") return <SectionSkeleton className="h-40" />;
  if (state === "empty") return <SectionEmpty title="کاتالوگ محصولی ندارد" />;
  if (state === "unreadable") return <SectionUnreadable onRetry={onRetry} />;

  const generatedAt = data.inventory.catalogGeneratedAt ? new Date(data.inventory.catalogGeneratedAt).toLocaleDateString("fa-IR") : "نامشخص";
  return (
    <section className="rounded-2xl border border-[#e3dbd2] bg-white p-5 shadow-[0_4px_16px_rgba(47,35,30,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-sm font-black text-foreground">وضعیت کاتالوگ</h2><p className="mt-1 text-xs text-muted-foreground">اطلاعات از کاتالوگ JSON · آخرین خروجی {generatedAt}</p></div>
        <span className="rounded-xl bg-[#f4ede3] px-3 py-2 text-xl font-black text-[#8a561f]">{toFaDigits(data.totals.products)} محصول</span>
      </div>
      <div className="my-4 border-t border-[#e9e2db]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(data.inventory.byStockState).map(([key, count]) => <div key={key} className={`rounded-xl border px-3 py-2.5 ${stateSurfaces[key] ?? "border-slate-200 bg-slate-50"}`}><p className="text-[11px] font-medium text-[#554b4c]">{stateLabels[key] ?? key}</p><p className="mt-1 text-lg font-bold text-[#292326]">{toFaDigits(count)}</p></div>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[[data.totals.categories, "دسته", "bg-violet-50 text-violet-800"], [data.totals.brands, "برند", "bg-sky-50 text-sky-800"], [data.totals.orders, "سفارش", "bg-amber-50 text-amber-900"], [data.totals.users, "کاربر", "bg-emerald-50 text-emerald-800"]].map(([count, label, tone]) => <span key={String(label)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${tone}`}>{toFaDigits(Number(count))} {label}</span>)}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">منبع: کاتالوگ JSON · آخرین خروجی {generatedAt}</p>
    </section>
  );
}
