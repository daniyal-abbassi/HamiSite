"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DownloadCloud, Pencil, Plus, Search } from "lucide-react";
import { Pagination } from "@/components/admin/ui/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DigikalaImportModal } from "@/components/admin/products/DigikalaImportModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiGetWithMeta } from "@/lib/api-client";
import { productDisplayName, type ProductSuggestion } from "@/lib/admin-product-suggestions";
import { resolveProductImage } from "@/lib/product-images";
import { formatToman } from "@/lib/utils";
import type { AdminProductListItem } from "@/types/admin";

const PAGE_SIZE = 20;

export function ProductsAdminClient() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProductListItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [meta, setMeta] = useState<{ total: number; hasNextPage: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const requestVersion = useRef(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (targetPage: number, q: string) => {
    const version = ++requestVersion.current;
    setProducts(null);
    setFailed(false);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (q.trim()) params.set("q", q.trim());
      const { data, meta: responseMeta } = await apiGetWithMeta<AdminProductListItem[]>(`/api/admin/products?${params.toString()}`);
      if (version !== requestVersion.current) return;
      setProducts(data);
      setMeta({
        total: Number(responseMeta?.total) || 0,
        hasNextPage: Boolean(responseMeta?.hasNextPage),
      });
    } catch {
      if (version !== requestVersion.current) return;
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load(page, submittedQuery);
    return () => {
      requestVersion.current += 1;
    };
  }, [load, page, submittedQuery]);

  useEffect(() => {
    const term = query.trim();
    if (!suggestionsOpen || !term) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void apiGet<ProductSuggestion[]>(
        `/api/admin/products/suggest?q=${encodeURIComponent(term)}`,
        { signal: controller.signal, cache: "no-store" },
      ).then((results) => {
        if (controller.signal.aborted) return;
        setSuggestions(results);
        setActiveSuggestion(results.length ? 0 : -1);
        setSuggestionsLoading(false);
      }).catch(() => {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setActiveSuggestion(-1);
        setSuggestionsLoading(false);
      });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, suggestionsOpen]);

  useEffect(() => {
    if (!suggestionsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSuggestionsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [suggestionsOpen]);

  const selectSuggestion = (product: ProductSuggestion) => {
    setSuggestionsOpen(false);
    router.push(`/admin/products/${product.id}?slug=${encodeURIComponent(product.slug)}`);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <form
          role="search"
          className="flex w-full items-center gap-2 sm:w-auto"
          onSubmit={(event) => {
            event.preventDefault();
            setSuggestionsOpen(false);
            const nextQuery = query.trim();
            if (page !== 1) setPage(1);
            if (page === 1 && nextQuery === submittedQuery) void load(1, nextQuery);
            else setSubmittedQuery(nextQuery);
          }}
        >
          <div ref={searchRef} className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                setSuggestions([]);
                setActiveSuggestion(-1);
                setSuggestionsLoading(Boolean(next.trim()));
                setSuggestionsOpen(Boolean(next.trim()));
              }}
              onFocus={() => {
                if (query.trim()) {
                  setSuggestionsLoading(true);
                  setSuggestionsOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSuggestionsOpen(false);
                  return;
                }
                if (!suggestionsOpen || !suggestions.length) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSuggestion((index) => (index + 1) % suggestions.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestion((index) => (index - 1 + suggestions.length) % suggestions.length);
                } else if (event.key === "Enter" && activeSuggestion >= 0) {
                  event.preventDefault();
                  selectSuggestion(suggestions[activeSuggestion]);
                }
              }}
              placeholder="جست‌وجوی نام یا slug…"
              aria-label="جست‌وجوی محصول"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls={suggestionsOpen ? "admin-product-suggestions" : undefined}
              aria-activedescendant={suggestionsOpen && activeSuggestion >= 0 ? `admin-product-suggestion-${suggestions[activeSuggestion]?.id}` : undefined}
              className="w-full pe-9 sm:w-64"
            />
            {suggestionsOpen && query.trim() && (
              <div
                id="admin-product-suggestions"
                role="listbox"
                aria-label="محصولات پیدا شده"
                aria-busy={suggestionsLoading}
                className="absolute start-0 top-full z-40 mt-2 w-[min(90vw,22rem)] overflow-hidden rounded-xl border border-line bg-ink-2 p-1 shadow-2xl"
              >
                {suggestionsLoading ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground" role="status">در حال جست‌وجو…</p>
                ) : suggestions.length ? suggestions.map((product, index) => (
                  <button
                    key={product.id}
                    id={`admin-product-suggestion-${product.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestion}
                    onMouseEnter={() => setActiveSuggestion(index)}
                    onClick={() => selectSuggestion(product)}
                    className="block w-full truncate rounded-lg px-3 py-2.5 text-start text-sm hover:bg-foreground/10 aria-selected:bg-foreground/10"
                    dir={product.englishName?.trim() ? "ltr" : "auto"}
                    title={productDisplayName(product)}
                  >
                    {productDisplayName(product)}
                  </button>
                )) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground" role="status">محصولی پیدا نشد.</p>
                )}
              </div>
            )}
          </div>
          <Button type="submit" size="sm" variant="ghost">
            جست‌وجو
          </Button>
        </form>
        <div className="flex items-center gap-3">
          {meta && <span className="font-mono text-[11px] text-muted-foreground/70">{meta.total.toLocaleString("fa-IR")} محصول</span>}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-primary/30 hover:border-primary/60 text-xs"
            onClick={() => setImportModalOpen(true)}
          >
            <DownloadCloud className="size-4 text-primary" />
            وارد کردن از دیجی‌کالا
          </Button>
          <Button size="sm" onClick={() => router.push("/admin/products/new")}>
            <Plus className="size-4" />
            محصول جدید
          </Button>
        </div>
      </div>

      <DigikalaImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      {failed ? (
        <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center text-sm text-destructive">
          <p>در بارگذاری محصولات خطایی رخ داد.</p>
          <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => void load(page, submittedQuery)}>
            تلاش دوباره
          </Button>
        </div>
      ) : !products ? (
        <div className="space-y-2.5" aria-busy="true" aria-label="در حال بارگذاری محصولات">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="text-sm text-muted-foreground">محصولی با این فیلتر پیدا نشد.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line bg-ink/20">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line bg-ink-2/60 font-mono text-[10px] font-bold tracking-[0.1em] text-muted-foreground/80">
                  <th className="px-4 py-3 text-start">محصول</th>
                  <th className="hidden px-4 py-3 text-start lg:table-cell">برند</th>
                  <th className="hidden px-4 py-3 text-start md:table-cell">دسته</th>
                  <th className="px-4 py-3 text-end">قیمت</th>
                  <th className="hidden px-4 py-3 text-end sm:table-cell">تخفیف‌دار</th>
                  <th className="px-4 py-3 text-end">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-foreground/[0.035]">
                    <td className="max-w-[420px] px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-line/80 bg-ink-2">
                          <Image
                            src={resolveProductImage(product)}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-contain p-1.5"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}?slug=${encodeURIComponent(product.slug)}`}
                            title={productDisplayName(product)}
                            dir={product.englishName?.trim() ? "ltr" : "auto"}
                            className="block max-w-full truncate text-start font-bold leading-6 hover:text-aqua"
                          >
                            {productDisplayName(product)}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <StatusBadge value={product.stockType} kind="stock" />
                            <Badge tone={product.variantCount > 0 ? "info" : "neutral"} size="sm">
                              {product.variantCount.toLocaleString("fa-IR")} واریانت
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden max-w-36 px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">
                      <span className="block truncate" title={product.brand?.name ?? undefined}>
                      {product.brand?.name ?? "—"}
                      </span>
                    </td>
                    <td className="hidden max-w-44 px-4 py-3 text-[12px] text-muted-foreground md:table-cell">
                      <span className="block truncate" title={product.mainCategory?.name ?? undefined}>
                      {product.mainCategory?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end font-mono text-[13px] font-bold text-foreground">
                      {formatToman(product.displayPrice)}
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      {product.specialOffer ? (
                        <span className="rounded-full bg-oxblood/40 px-2.5 py-1 text-[10px] font-bold text-aqua-lite">ویژه</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/admin/products/${product.id}?slug=${encodeURIComponent(product.slug)}`}
                        aria-label={`ویرایش ${productDisplayName(product)}`}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-aqua hover:underline"
                      >
                        <Pencil className="size-3.5" />
                        ویرایش
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={meta?.total ?? 0} hasNextPage={meta?.hasNextPage ?? false} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
