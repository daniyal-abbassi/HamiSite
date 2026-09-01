"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { featuredTabs, type FeaturedTabKey } from "@/lib/content/home";
import { apiGet, firstProductImage } from "@/lib/api-client";
import { cn, formatToman } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/home/Reveal";

type ProductCard = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  brand: { id: number; name: string; slug: string } | null;
  mainCategory: { id: number; name: string; slug: string } | null;
  displayPrice: number;
  compareAtPrice: number | null;
  images: unknown;
  stockType: string;
};

const stockLabels: Record<string, string> = {
  unlimited: "موجود",
  limited: "موجود محدود",
  out_of_stock: "ناموجود",
  call: "تماس بگیرید",
};

export function FeaturedProducts() {
  const [tab, setTab] = useState<FeaturedTabKey>("newest");
  const [products, setProducts] = useState<ProductCard[] | null>(null);
  const [error, setError] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError(false);
    const params = new URLSearchParams({ pageSize: "4", includeVariants: "false" });
    if (tab === "special") params.set("specialOffer", "true");
    apiGet<ProductCard[]>(`/api/products?${params}`)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const activeBadge = featuredTabs.find((t) => t.key === tab)?.badge ?? "";

  const toggleFavorite = (id: number) =>
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section id="featured" className="container py-20" aria-labelledby="featured-title">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel index="۰۰۳">ویترین انتخاب‌های curated</SectionLabel>
            <h2 id="featured-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              محصولات <em className="font-black not-italic text-champagne">منتخب.</em>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-foreground/60">
              انتخابی از محبوب‌ترین و تازه‌ترین محصولات حامی همراه
            </p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-champagne hover:underline">
            مشاهده همه محصولات <ArrowLeft className="size-4" />
          </Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10 flex gap-2 border-b border-border" role="tablist" aria-label="فیلتر محصولات منتخب">
          {featuredTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative px-4 pb-3 text-sm font-bold transition-colors",
                tab === t.key ? "text-champagne" : "text-foreground/50 hover:text-foreground/80",
              )}
            >
              {t.label}
              {tab === t.key && <i className="absolute inset-x-0 bottom-0 h-0.5 bg-champagne" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </Reveal>

      {products === null && !error && (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-10 rounded-sm border border-border bg-card p-8 text-center" role="status">
          <b className="block font-extrabold">دریافت محصولات موقتاً ممکن نیست.</b>
          <p className="mt-2 text-sm text-foreground/60">می‌توانید کاتالوگ کامل را ببینید یا بعداً دوباره تلاش کنید.</p>
          <div className="mt-5 flex justify-center gap-4">
            <button type="button" onClick={() => setTab(tab)} className="rounded-sm bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              تلاش دوباره
            </button>
            <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-bold text-champagne hover:underline">
              مشاهده همه محصولات <ArrowLeft className="size-3.5" />
            </Link>
          </div>
        </div>
      )}

      {products !== null && !error && products.length === 0 && (
        <div className="mt-10 rounded-sm border border-border bg-card p-8 text-center" role="status">
          <b className="block font-extrabold">محصولی برای نمایش در این انتخاب وجود ندارد.</b>
          <p className="mt-2 text-sm text-foreground/60">محصولات جدید به‌زودی به این بخش اضافه می‌شوند.</p>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-champagne hover:underline">
            مشاهده همه محصولات <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      )}

      {products !== null && !error && products.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((product) => {
            const favorite = favorites.has(product.id);
            const image = firstProductImage(product.images);
            return (
              <article key={product.id} className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card shadow-card transition-transform duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden bg-wine-dark/40">
                  <span className="absolute start-3 top-3 z-10 rounded-sm bg-wine-ink/85 px-2 py-1 font-mono text-[9px] tracking-[0.08em] text-champagne-light">
                    {activeBadge}
                  </span>
                  <button
                    type="button"
                    aria-label={favorite ? `حذف ${product.name} از علاقه‌مندی‌ها` : `افزودن ${product.name} به علاقه‌مندی‌ها`}
                    aria-pressed={favorite}
                    onClick={() => toggleFavorite(product.id)}
                    className={cn(
                      "absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-sm border border-champagne/40 bg-wine-ink/70 transition-colors",
                      favorite ? "text-champagne" : "text-foreground/60 hover:text-champagne",
                    )}
                  >
                    <Heart className="size-4" fill={favorite ? "currentColor" : "none"} />
                  </button>
                  <Link href={`/shop/${product.slug}`} className="grid h-full place-items-center" aria-label={product.name}>
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- legacy-import URLs; swap to next/image in the shop phase
                      <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-mono text-[10px] tracking-[0.14em] text-champagne/50">HAMI / PRODUCT</span>
                    )}
                  </Link>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="font-mono text-[9px] tracking-[0.1em] text-champagne/80">{product.brand?.name ?? "—"}</span>
                  <h3 className="mt-1.5 text-sm font-extrabold leading-6">
                    <Link href={`/shop/${product.slug}`} className="hover:text-champagne">{product.name}</Link>
                  </h3>
                  {product.mainCategory && <p className="mt-0.5 text-[11px] text-foreground/50">{product.mainCategory.name}</p>}
                  <div className="mt-3 flex items-baseline gap-2">
                    {product.compareAtPrice != null && product.compareAtPrice > 0 && (
                      <del className="text-[11px] text-foreground/40">{formatToman(product.compareAtPrice)}</del>
                    )}
                    <strong className="text-sm font-black text-champagne">{formatToman(product.displayPrice)}</strong>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-foreground/60">
                      <i className={cn("size-1.5 rounded-full", product.stockType === "out_of_stock" ? "bg-destructive" : "bg-emerald-400")} aria-hidden="true" />
                      {stockLabels[product.stockType] ?? "—"}
                    </span>
                    <Link href={`/shop/${product.slug}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-champagne hover:underline">
                      مشاهده <ArrowLeft className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <i />
      <p>{children}</p>
    </div>
  );
}
