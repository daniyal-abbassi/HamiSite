"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Package, ShoppingBag, Sparkles } from "lucide-react";
import { toPersianDigits } from "@/lib/serializers";
import type { PartnerBundleDTO } from "@/types/bundles";

interface PartnerBundleCardProps {
  bundle: PartnerBundleDTO;
  onAddToCart?: (bundleId: number, quantity: number) => Promise<void>;
}

export function PartnerBundleCard({ bundle, onAddToCart }: PartnerBundleCardProps) {
  const [selectedQty, setSelectedQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isSoldOut = !bundle.isAvailable || bundle.maxPurchasableUnits <= 0;
  const displayTitle = bundle.title.replace(/^پکیج\s+/, "سبد ");

  const handleAdd = async () => {
    if (!onAddToCart || isSoldOut || adding) return;
    setAdding(true);
    try {
      await onAddToCart(bundle.id, selectedQty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error("Failed to add bundle to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-zinc-900/95 border border-zinc-800/80 hover:border-amber-500/40 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-950/20">
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-zinc-950 text-xs font-black shadow-xs">
            <Sparkles size={13} className="text-amber-500" />
            <span>سبد اختصاصی همکاران</span>
          </div>

          {bundle.savingsPercent > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-xs">
              {toPersianDigits(bundle.savingsPercent)}٪ سود همکار
            </span>
          )}
        </div>

        {/* Banner image or preview of product photos */}
        {bundle.imageUrl ? (
          <div className="relative w-full h-44 mb-4 rounded-2xl overflow-hidden bg-white border border-zinc-200/90 p-1 shadow-xs">
            <Image
              src={bundle.imageUrl}
              alt={displayTitle}
              fill
              unoptimized
              className="object-cover rounded-xl group-hover:scale-102 transition-transform duration-500"
            />
          </div>
        ) : bundle.items.length > 0 ? (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-2xl bg-white border border-zinc-200/90 overflow-x-auto shadow-xs">
            {bundle.items.slice(0, 4).map((it) => (
              <div
                key={it.id}
                className="relative w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center p-1"
                title={it.productEnglishName || it.productName}
              >
                {it.imageUrl ? (
                  <Image
                    src={it.imageUrl}
                    alt={it.productEnglishName || it.productName}
                    fill
                    unoptimized
                    className="object-contain p-1"
                  />
                ) : (
                  <Package size={22} className="text-zinc-400" />
                )}
              </div>
            ))}
            {bundle.items.length > 4 && (
              <div className="flex items-center justify-center w-10 h-14 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs shrink-0">
                +{toPersianDigits(bundle.items.length - 4)}
              </div>
            )}
          </div>
        ) : null}

        {/* Title (اسم سبد) & Description */}
        <div className="mb-3">
          <span className="text-[11px] font-bold text-amber-400 block mb-1">
            نام سبد:
          </span>
          <h3 className="text-base md:text-lg font-black text-zinc-100 group-hover:text-amber-400 transition-colors leading-snug">
            {displayTitle}
          </h3>
        </div>

        {bundle.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
            {bundle.description}
          </p>
        )}

        {/* Constituent Line Items with 20% White card & Product Photos */}
        <div className="rounded-2xl bg-white text-zinc-900 border border-zinc-200/90 p-3.5 mb-5 shadow-xs space-y-2.5">
          <div className="text-[11px] font-bold text-zinc-600 flex items-center justify-between pb-1.5 border-b border-zinc-100">
            <span>محتویات سبد ({toPersianDigits(bundle.itemsCount)} قلم):</span>
            <span className="bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
              مجموع {toPersianDigits(bundle.totalUnitsCount)} عدد
            </span>
          </div>

          <ul className="space-y-2">
            {bundle.items.map((item) => {
              const foreignName = item.productEnglishName || item.productName;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2.5 py-1 text-xs border-b border-zinc-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* عکس کالا */}
                    <div className="relative w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200/90 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={foreignName}
                          fill
                          unoptimized
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <Package size={16} className="text-zinc-400" />
                      )}
                    </div>

                    {/* فقط نام خارجی کالا */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-mono font-bold text-zinc-900 text-[12px] truncate leading-tight"
                        dir="ltr"
                      >
                        {foreignName}
                      </p>
                      {item.variantName && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-200 px-1.5 py-0.2 rounded">
                          رنگ: {item.variantName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* تعداد قلم */}
                  <div className="shrink-0 flex items-center gap-1 font-mono font-bold text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-md">
                    <span>×</span>
                    <span>{toPersianDigits(item.quantity)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Pricing & Checkout Actions */}
      <div className="pt-4 border-t border-zinc-800/80 mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-zinc-400">قیمت سبد:</span>
          <div className="text-left">
            {bundle.compareAtPrice && bundle.compareAtPrice > bundle.price && (
              <div className="text-xs text-zinc-500 line-through">
                {toPersianDigits(bundle.compareAtPrice.toLocaleString())} تومان
              </div>
            )}
            <div className="text-lg font-black text-amber-400">
              {toPersianDigits(bundle.price.toLocaleString())}{" "}
              <span className="text-xs font-medium text-zinc-400">تومان</span>
            </div>
          </div>
        </div>

        {/* Stock Quota Badge */}
        <div className="flex items-center justify-between text-xs mb-4">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Package size={14} className="text-zinc-500" />
            <span>وضعیت سهمیه:</span>
          </span>
          {isSoldOut ? (
            <span className="font-bold text-red-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-900/50">
              اتمام
            </span>
          ) : (
            <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-900/50">
              {toPersianDigits(bundle.maxPurchasableUnits)} بسته باقی‌مانده
            </span>
          )}
        </div>

        {/* Quantity and Add Button */}
        <div className="flex items-center gap-2">
          {!isSoldOut && bundle.maxPurchasableUnits > 1 && (
            <div className="flex items-center bg-white border border-zinc-300 rounded-xl px-2 py-1.5 shrink-0 shadow-xs">
              <label htmlFor={`qty-${bundle.id}`} className="text-[11px] text-zinc-600 ml-1">
                تعداد:
              </label>
              <select
                id={`qty-${bundle.id}`}
                value={selectedQty}
                onChange={(e) => setSelectedQty(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-zinc-900 focus:outline-hidden cursor-pointer"
              >
                {Array.from(
                  { length: Math.min(10, bundle.maxPurchasableUnits) },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n} className="bg-white text-zinc-900">
                    {toPersianDigits(n)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            disabled={isSoldOut || adding}
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isSoldOut
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : added
                ? "bg-emerald-600 text-white"
                : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-950/30"
            }`}
          >
            {added ? (
              <>
                <Check size={16} />
                <span>به سفارش اضافه شد</span>
              </>
            ) : isSoldOut ? (
              <span>اتمام</span>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>{adding ? "در حال افزودن..." : "افزودن سبد به سفارش"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
