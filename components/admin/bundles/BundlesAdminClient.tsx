"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, PackagePlus, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { apiDelete, apiGetWithMeta, apiPatch } from "@/lib/api-client";
import { toPersianDigits } from "@/lib/serializers";
import { BundleFormModal } from "./BundleFormModal";
import type { PartnerBundleDTO } from "@/types/bundles";

export function BundlesAdminClient() {
  const [bundles, setBundles] = useState<PartnerBundleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<PartnerBundleDTO | null>(null);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, meta } = await apiGetWithMeta<PartnerBundleDTO[]>(
        `/api/admin/bundles?page=${page}&pageSize=15${search ? `&q=${encodeURIComponent(search)}` : ""}`
      );
      if (Array.isArray(data)) {
        setBundles(data);
        setTotal(Number(meta?.total) || data.length);
      }
    } catch (err) {
      console.error("Failed to load bundles:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchBundles();
  }, [fetchBundles]);

  const handleToggleActive = async (bundle: PartnerBundleDTO) => {
    try {
      await apiPatch(`/api/admin/bundles/${bundle.id}`, { isActive: !bundle.isActive });
      setBundles((prev) =>
        prev.map((b) => (b.id === bundle.id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      console.error("Error toggling bundle active status:", err);
    }
  };

  const handleDelete = async (bundleId: number) => {
    if (!window.confirm("آیا از حذف این سبد اطمینان دارید؟")) return;
    try {
      await apiDelete(`/api/admin/bundles/${bundleId}`);
      setBundles((prev) => prev.filter((b) => b.id !== bundleId));
    } catch (err) {
      console.error("Error deleting bundle:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute start-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="جست‌وجوی عنوان سبد..."
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 ps-10 pe-3.5 py-2 text-xs focus:border-amber-400 focus:outline-hidden text-zinc-200"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBundle(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
        >
          <PackagePlus size={16} />
          <span>ایجاد سبد جدید همکار</span>
        </button>
      </div>

      {/* Bundles Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase">
              <tr>
                <th className="py-3 px-4 font-bold">عنوان سبد</th>
                <th className="py-3 px-4 font-bold">اقلام تشکیل‌دهنده</th>
                <th className="py-3 px-4 font-bold">قیمت پکیج</th>
                <th className="py-3 px-4 font-bold">ارزش اصلی و سود</th>
                <th className="py-3 px-4 font-bold">سهمیه موجودی</th>
                <th className="py-3 px-4 font-bold text-center">وضعیت</th>
                <th className="py-3 px-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    در حال بارگذاری سبدها...
                  </td>
                </tr>
              ) : bundles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    هیچ سبدی یافت نشد.
                  </td>
                </tr>
              ) : (
                bundles.map((bundle) => (
                  <tr key={bundle.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-100">{bundle.title}</div>
                      {bundle.description && (
                        <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                          {bundle.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-zinc-300">
                      <div className="font-medium">
                        {toPersianDigits(bundle.itemsCount)} کالا ({toPersianDigits(bundle.totalUnitsCount)} عدد)
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                        {bundle.items.map((i) => `${i.productName} (×${toPersianDigits(i.quantity)})`).join("، ")}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-amber-400 tabular-nums">
                      {toPersianDigits(bundle.price.toLocaleString())} تومان
                    </td>

                    <td className="py-3 px-4 text-zinc-300 tabular-nums">
                      <div>
                        {bundle.compareAtPrice
                          ? `${toPersianDigits(bundle.compareAtPrice.toLocaleString())} تومان`
                          : "-"}
                      </div>
                      {bundle.savingsAmount > 0 && (
                        <div className="text-[11px] text-emerald-400 font-medium">
                          سود: {toPersianDigits(bundle.savingsAmount.toLocaleString())} ت ({toPersianDigits(bundle.savingsPercent)}٪)
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 tabular-nums">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        bundle.stock > 0 ? "bg-zinc-800 text-zinc-200" : "bg-red-950/60 text-red-400"
                      }`}>
                        {bundle.stock > 0 ? `${toPersianDigits(bundle.stock)} بسته` : "تکمیل ظرفیت"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(bundle)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          bundle.isActive
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/60"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {bundle.isActive ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>غیرفعال</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBundle(bundle);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="ویرایش"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(bundle.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BundleFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => void fetchBundles()}
        initialBundle={editingBundle}
      />
    </div>
  );
}

