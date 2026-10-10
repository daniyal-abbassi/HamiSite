"use client";

import React, { useState } from "react";
import { Drawer } from "vaul";
import { useTelegram } from "./TelegramProvider";
import { formatToman, toFaDigits } from "@/lib/utils";
import { Plus, Minus, Check, X, Loader2, Save } from "lucide-react";
import { type TMAProductItem, type TMAVariant } from "./ProductCard";

interface VariantEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: TMAProductItem | null;
  onVariantUpdated: (productId: number, updatedVariant: TMAVariant) => void;
}

export function VariantEditorSheet({
  open,
  onOpenChange,
  product,
  onVariantUpdated,
}: VariantEditorSheetProps) {
  const { haptic } = useTelegram();

  // Selected variant state for detailed editing
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editCompareAtPrice, setEditCompareAtPrice] = useState<string>("");
  const [editStock, setEditStock] = useState<number>(0);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!product) return null;

  const handleSelectVariant = (v: TMAVariant) => {
    haptic.selection();
    setSelectedVariantId(v.id);
    setEditPrice(v.price ? String(v.price) : "");
    setEditCompareAtPrice(v.compareAtPrice ? String(v.compareAtPrice) : "");
    setEditStock(v.stock || 0);
    setErrorMsg(null);
  };

  const handleStockStep = async (v: TMAVariant, delta: number) => {
    haptic.impact("light");
    const nextStock = Math.max(0, (v.stock || 0) + delta);
    setSavingId(v.id);

    try {
      const res = await fetch(`/api/tma/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: v.id,
          stock: nextStock,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message);

      haptic.notification("success");
      onVariantUpdated(product.id, { ...v, stock: nextStock });
    } catch (err: any) {
      haptic.notification("error");
      setErrorMsg(err.message || "خطا در تغییر موجودی");
    } finally {
      setSavingId(null);
    }
  };

  const handleSavePrices = async (v: TMAVariant) => {
    haptic.impact("medium");
    setSavingId(v.id);
    setErrorMsg(null);

    const numPrice = Number(editPrice);
    const numCompare = editCompareAtPrice ? Number(editCompareAtPrice) : null;

    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg("قیمت وارد شده نامعتبر است");
      setSavingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/tma/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: v.id,
          price: numPrice,
          compareAtPrice: numCompare,
          stock: editStock,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message);

      haptic.notification("success");
      setSuccessId(v.id);
      setTimeout(() => setSuccessId(null), 2000);

      onVariantUpdated(product.id, {
        ...v,
        price: numPrice,
        compareAtPrice: numCompare,
        stock: editStock,
      });
      setSelectedVariantId(null);
    } catch (err: any) {
      haptic.notification("error");
      setErrorMsg(err.message || "خطا در ذخیره قیمت");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 inset-x-0 z-50 bg-[#12070A] border-t border-stone-800 rounded-t-3xl max-h-[85vh] flex flex-col focus:outline-hidden text-stone-100">
          {/* Handle */}
          <div className="w-12 h-1.5 bg-stone-700/60 rounded-full mx-auto my-3" />

          <div className="p-5 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-800/80">
              <div className="flex-1 pr-1">
                <h3 className="text-sm font-bold text-stone-100 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-amber-300 mt-0.5">مدیریت تنوع‌ها، موجودی و قیمت</p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Variants List */}
            <div className="space-y-3 pb-6">
              {product.variants.map((v) => {
                const isEditingThis = selectedVariantId === v.id;
                const isSaving = savingId === v.id;
                const isSuccess = successId === v.id;

                const variantTitle = [v.color, v.storage].filter(Boolean).join(" - ") || "تنوع پیش‌فرض";

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isEditingThis
                        ? "bg-stone-900 border-amber-400/50 shadow-lg"
                        : "bg-stone-900/60 border-stone-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-stone-100">{variantTitle}</span>
                      <span className="text-xs font-bold text-amber-300">
                        {formatToman(v.price)}
                      </span>
                    </div>

                    {/* Stock Stepper */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs">
                      <span className="text-stone-400">موجودی انبار:</span>
                      <div className="flex items-center gap-3 bg-stone-950 px-2 py-1 rounded-xl border border-stone-800">
                        <button
                          disabled={isSaving || v.stock <= 0}
                          onClick={() => handleStockStep(v, -1)}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-400 active:scale-90 transition-all disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-stone-100 min-w-6 text-center font-mono">
                          {toFaDigits(v.stock)}
                        </span>
                        <button
                          disabled={isSaving}
                          onClick={() => handleStockStep(v, 1)}
                          className="p-1 rounded-lg text-stone-400 hover:text-emerald-400 active:scale-90 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Edit Price Expand Toggle */}
                    {!isEditingThis ? (
                      <div className="mt-2.5 text-left">
                        <button
                          onClick={() => handleSelectVariant(v)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline-offset-4 hover:underline"
                        >
                          ویرایش قیمت و تخفیف
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2.5">
                        <div>
                          <label className="block text-[11px] text-stone-400 mb-1">
                            قیمت فروش (تومان):
                          </label>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono text-left focus:outline-hidden focus:border-amber-400"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-stone-400 mb-1">
                            قیمت خط‌خورده / قبل از تخفیف (اختیاری):
                          </label>
                          <input
                            type="number"
                            value={editCompareAtPrice}
                            onChange={(e) => setEditCompareAtPrice(e.target.value)}
                            placeholder="خالی برای بدون تخفیف"
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono text-left focus:outline-hidden focus:border-amber-400"
                            dir="ltr"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={isSaving}
                            onClick={() => handleSavePrices(v)}
                            className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>ذخیره تغییرات</span>
                          </button>
                          <button
                            onClick={() => setSelectedVariantId(null)}
                            className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs"
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

