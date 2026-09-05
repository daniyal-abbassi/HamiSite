"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGetWithMeta } from "@/lib/api-client";
import { resolveProductImage } from "@/lib/product-images";
import { formatToman } from "@/lib/utils";
import type { AdminProductListItem } from "@/types/admin";

const PAGE_SIZE = 20;

export function ProductsAdminClient() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProductListItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [meta, setMeta] = useState<{ total: number; hasNextPage: boolean } | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (targetPage: number, q: string) => {
    setProducts(null);
    setFailed(false);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE), includeVariants: "false" });
      if (q.trim()) params.set("q", q.trim());
      const { data, meta: responseMeta } = await apiGetWithMeta<AdminProductListItem[]>(`/api/products?${params.toString()}`);
      setProducts(data);
      setMeta({
        total: Number(responseMeta?.total) || 0,
        hasNextPage: Boolean(responseMeta?.hasNextPage),
      });
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load(page, query);
  }, [load, page, query]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <form
          role="search"
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            void load(1, query);
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجوی نام یا slug…"
              aria-label="جستجوی محصول"
              className="w-64 pe-9"
            />
          </div>
          <Button type="submit" size="sm" variant="ghost">
            جستجو
          </Button>
        </form>
        <div className="flex items-center gap-3">
          {meta && <span className="font-mono text-[11px] text-muted-foreground/70">{meta.total.toLocaleString("fa-IR")} محصول</span>}
          <Button size="sm" onClick={() => router.push("/admin/products/new")}>
            <Plus className="size-4" />
            محصول جدید
          </Button>
        </div>
      </div>

      {failed ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center text-sm text-destructive">
          در بارگذاری محصولات خطایی رخ داد.
        </div>
      ) : !products ? (
        <div className="space-y-2.5">
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
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-ink-2/60 font-mono text-[10px] font-bold tracking-[0.1em] text-muted-foreground/80">
                  <th className="px-4 py-3 text-start">محصول</th>
                  <th className="hidden px-4 py-3 text-start lg:table-cell">برند</th>
                  <th className="hidden px-4 py-3 text-start md:table-cell">دسته</th>
                  <th className="px-4 py-3 text-start">وضعیت</th>
                  <th className="px-4 py-3 text-end">قیمت</th>
                  <th className="hidden px-4 py-3 text-end sm:table-cell">تخفیف‌دار</th>
                  <th className="px-4 py-3 text-end">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-foreground/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-ink/40">
                          <Image
                            src={resolveProductImage(product)}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="block truncate font-bold hover:text-gold">
                            {product.name}
                          </Link>
                          <span className="block truncate font-mono text-[10px] text-muted-foreground/70">{product.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">
                      {product.brand?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-[12px] text-muted-foreground md:table-cell">
                      {product.mainCategory?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={product.stockType} kind="stock" />
                      {product.variants.length > 0 && (
                        <span className="ms-1.5 font-mono text-[10px] text-muted-foreground/60">
                          {product.variants.length.toLocaleString("fa-IR")} واریانت
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end font-mono text-[13px] font-bold text-foreground">
                      {formatToman(product.displayPrice)}
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      {product.specialOffer ? (
                        <span className="rounded-full bg-oxblood/40 px-2.5 py-1 text-[10px] font-bold text-gold-lite">ویژه</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/admin/products/${product.id}?slug=${encodeURIComponent(product.slug)}`}
                        aria-label={`ویرایش ${product.name}`}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-gold hover:underline"
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