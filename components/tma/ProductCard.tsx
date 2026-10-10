"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatToman, toFaDigits } from "@/lib/utils";
import { useTelegram } from "./TelegramProvider";
import { Layers, Package, Check, X, AlertCircle } from "lucide-react";

export interface TMAVariant {
  id: number;
  color?: string | null;
  storage?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
}

export interface TMAProductItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  available: boolean;
  hasVariants: boolean;
  categoryName?: string | null;
  imageUrl?: string | null;
  variants: TMAVariant[];
}

interface ProductCardProps {
  product: TMAProductItem;
  onManageVariants?: (product: TMAProductItem) => void;
  onProductUpdated?: (updated: Partial<TMAProductItem>) => void;
}

export function ProductCard({
  product,
  onManageVariants,
  onProductUpdated,
}: ProductCardProps) {
  const { haptic } = useTelegram();
  const [isAvailable, setIsAvailable] = useState(product.available);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleAvailability = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    setIsToggling(true);
    haptic.impact("medium");

    try {
      const res = await fetch(`/api/tma/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: nextState }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error();
      }
      haptic.notification("success");
      onProductUpdated?.({ available: nextState });
    } catch {
      // Revert on failure
      setIsAvailable(!nextState);
      haptic.notification("error");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 space-y-3 transition-all shadow-sm">
      <div className="flex items-start gap-3">
        {/* Product Image Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-stone-950 border border-stone-800/80 overflow-hidden relative shrink-0 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <Package className="w-6 h-6 text-stone-600" />
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            {product.categoryName && (
              <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-medium">
                {product.categoryName}
              </span>
            )}
            {/* Quick Availability Switch */}
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-all ${
                isAvailable
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAvailable ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              <span>{isAvailable ? "موجود در سایت" : "ناموجود شده"}</span>
            </button>
          </div>

          <h3 className="text-xs font-bold text-stone-100 line-clamp-2 leading-relaxed">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xs font-black text-amber-300">
              {formatToman(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] line-through text-stone-500 font-mono">
                {formatToman(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions: Variants or Single Stock */}
      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
        {product.hasVariants ? (
          <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>دارای {toFaDigits(product.variants.length)} تنوع (رنگ/حافظه)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
            <Package className="w-3.5 h-3.5" />
            <span>
              موجودی انبار:{" "}
              <strong className="text-stone-200">{toFaDigits(product.stock)}</strong> عدد
            </span>
          </div>
        )}

        {product.hasVariants && onManageVariants && (
          <button
            onClick={() => {
              haptic.selection();
              onManageVariants(product);
            }}
            className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1 rounded-xl active:scale-95 transition-all"
          >
            مدیریت قیمت و موجودی
          </button>
        )}
      </div>
    </div>
  );
}

