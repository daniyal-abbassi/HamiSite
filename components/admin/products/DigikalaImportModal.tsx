"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, DownloadCloud, ExternalLink, Loader2, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api-client";
import { formatToman } from "@/lib/utils";
import type { DigikalaSearchResponse, DigikalaSearchResultItem, MappedDigikalaProduct } from "@/lib/digikala";

interface DigikalaImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function DigikalaImportModal({ open, onClose }: DigikalaImportModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"search" | "direct">("search");
  
  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DigikalaSearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Direct tab state
  const [directInput, setDirectInput] = useState("");
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState("");

  // Product fetching state (when an item is selected from search or direct)
  const [fetchingDetailId, setFetchingDetailId] = useState<number | null>(null);

  const handleSearch = async (e?: React.FormEvent, page = 1) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError("");
    try {
      const data = await apiGet<DigikalaSearchResponse>(
        `/api/admin/importer/digikala/search?q=${encodeURIComponent(q)}&page=${page}`
      );
      setSearchResults(data.products || []);
      setCurrentPage(data.pager?.currentPage || 1);
      setTotalPages(data.pager?.totalPages || 1);
      if (!data.products?.length) {
        setSearchError("هیچ کالایی در دیجی‌کالا یافت نشد.");
      }
    } catch (err: any) {
      setSearchError(err?.message || "خطا در برقراری ارتباط با دیجی‌کالا");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImportProduct = async (idOrUrl: string | number) => {
    const isDirect = activeTab === "direct";
    if (isDirect) {
      setDirectLoading(true);
      setDirectError("");
    } else {
      setFetchingDetailId(Number(idOrUrl));
    }

    try {
      const product = await apiGet<MappedDigikalaProduct>(
        `/api/admin/importer/digikala/product?id=${encodeURIComponent(String(idOrUrl))}`
      );

      // Save imported product data to sessionStorage so ProductForm can populate itself
      sessionStorage.setItem("imported_digikala_product", JSON.stringify(product));

      // Close modal and navigate to new product form
      onClose();
      router.push("/admin/products/new?source=digikala");
    } catch (err: any) {
      if (isDirect) {
        setDirectError(err?.message || "خطا در دریافت اطلاعات محصول");
      } else {
        alert(err?.message || "خطا در استخراج مشخصات محصول");
      }
    } finally {
      if (isDirect) {
        setDirectLoading(false);
      } else {
        setFetchingDetailId(null);
      }
    }
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInput.trim()) return;
    void handleImportProduct(directInput.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="وارد کردن محصول از دیجی‌کالا"
      description="جست‌وجو یا درج لینک محصول برای استخراج فوری مشخصات، تصاویر و متون"
      className="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-foreground/10 pb-3 mb-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "search"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-foreground/5"
          }`}
        >
          جست‌وجو در دیجی‌کالا
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("direct")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "direct"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-foreground/5"
          }`}
        >
          ورود با لینک یا شناسه (DKP)
        </button>
      </div>

      {activeTab === "search" ? (
        <div className="space-y-4">
          <form onSubmit={(e) => void handleSearch(e, 1)} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="مثال: گوشی سامسونگ S24 یا ساعت هوشمند..."
                className="w-full pe-9"
                autoFocus
              />
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            <Button type="submit" disabled={searchLoading || !searchQuery.trim()}>
              {searchLoading ? <Loader2 className="size-4 animate-spin" /> : "جست‌وجو"}
            </Button>
          </form>

          {searchError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-center">
              {searchError}
            </div>
          )}

          {/* Results list */}
          <div className="max-h-[380px] overflow-y-auto space-y-2.5 pe-1">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-foreground/10 bg-surface/50 hover:border-primary/40 hover:bg-surface/80 transition-all"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface border border-foreground/5">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.titleFa}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground text-[10px]">
                      بدون عکس
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground line-clamp-1 leading-snug">
                    {item.titleFa}
                  </h4>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {item.price > 0 ? (
                      <span className="font-mono text-primary font-semibold">
                        {formatToman(item.price)}
                      </span>
                    ) : (
                      <span>قیمت نامشخص</span>
                    )}
                    <span className="font-mono text-[10px] opacity-60">کد: {item.id}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleImportProduct(item.id)}
                  disabled={fetchingDetailId === item.id}
                  className="shrink-0 gap-1 text-xs"
                >
                  {fetchingDetailId === item.id ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      استخراج…
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="size-3.5" />
                      انتخاب
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-foreground/10">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1 || searchLoading}
                onClick={() => void handleSearch(undefined, currentPage - 1)}
              >
                صفحه قبل
              </Button>
              <span>
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages || searchLoading}
                onClick={() => void handleSearch(undefined, currentPage + 1)}
              >
                صفحه بعد
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleDirectSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              آدرس صفحه کالا یا شناسه DKP دیجی‌کالا:
            </label>
            <Input
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value)}
              placeholder="https://www.digikala.com/product/dkp-16603814/... یا dkp-16603814"
              dir="ltr"
              className="text-left font-mono text-xs"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              لینک صفحه کالا را از نوار آدرس مرورگر کپی و در این بخش جای‌گذاری کنید.
            </p>
          </div>

          {directError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-center">
              {directError}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={directLoading || !directInput.trim()} className="gap-2">
              {directLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال استخراج اطلاعات کالا…
                </>
              ) : (
                <>
                  <DownloadCloud className="size-4" />
                  استخراج و پر کردن فرم
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

