"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TMAHeader } from "@/components/tma/TMAHeader";
import { ProductCard, type TMAProductItem, type TMAVariant } from "@/components/tma/ProductCard";
import { VariantEditorSheet } from "@/components/tma/VariantEditorSheet";
import { useTelegram } from "@/components/tma/TelegramProvider";
import { Search, Package, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TMAProductsPage() {
  const searchParams = useSearchParams();
  const initialStockFilter = searchParams.get("stock") || "all";

  const { haptic } = useTelegram();

  const [products, setProducts] = useState<TMAProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState(initialStockFilter);

  // Sheet state
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<TMAProductItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stockFilter === "low") params.set("stock", "low");
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/tma/products?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [stockFilter, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenVariants = (p: TMAProductItem) => {
    setSelectedProductForVariants(p);
    setSheetOpen(true);
  };

  const handleVariantUpdated = (productId: number, updatedVariant: TMAVariant) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) => (v.id === updatedVariant.id ? updatedVariant : v)),
        };
      })
    );

    if (selectedProductForVariants && selectedProductForVariants.id === productId) {
      setSelectedProductForVariants((prev) =>
        prev
          ? {
              ...prev,
              variants: prev.variants.map((v) =>
                v.id === updatedVariant.id ? updatedVariant : v
              ),
            }
          : null
      );
    }
  };

  const handleProductUpdated = (productId: number, changes: Partial<TMAProductItem>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...changes } : p))
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TMAHeader title="کاتالوگ و انبار" subtitle="تنظیم سریع موجودی و قیمت" />

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جست‌وجوی کالا، بارکد یا مدل..."
            className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-400/80 transition-all"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-full text-stone-400 hover:text-stone-200 absolute left-3 top-2.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stock Filter Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.selection();
              setStockFilter("all");
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
              stockFilter === "all"
                ? "bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-xs"
                : "bg-stone-900/60 text-stone-400 border-stone-800"
            )}
          >
            همه کالاها
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setStockFilter("low");
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5",
              stockFilter === "low"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs"
                : "bg-stone-900/60 text-stone-400 border-stone-800"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>ناموجود / رو به اتمام</span>
          </button>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-stone-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/30 rounded-2xl border border-stone-800/80 p-6">
            <Package className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-200">کالایی یافت نشد</h3>
            <p className="text-xs text-stone-400 mt-1">
              با عبارت جست‌وجو یا فیلتر انتخابی کالایی یافت نشد.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onManageVariants={handleOpenVariants}
                onProductUpdated={(changes) => handleProductUpdated(product.id, changes)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Variant Editor Drawer */}
      <VariantEditorSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={selectedProductForVariants}
        onVariantUpdated={handleVariantUpdated}
      />
    </div>
  );
}

