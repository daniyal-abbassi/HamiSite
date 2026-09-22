"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { featuredTabs, type FeaturedTabKey } from "@/lib/content/home";
import { apiGet } from "@/lib/api-client";
import { cn, formatToman } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/home/Reveal";
import { type ProductCardData } from "@/components/shop/ProductCard";
import { ProductRail } from "@/components/shop/ProductRail";

type FeaturedProduct = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  brand: { id: number; name: string; slug: string } | null;
  mainCategory: { id: number; name: string; slug: string } | null;
  displayPrice: number;
  compareAtPrice: number | null;
  stockType: string;
};

function ProductSkeletonCard() {
  return (
    <article className="lux-card product-card card-obsidian frame-bleed">
      <div className="lux-stage block">
        <Skeleton className="aspect-[4/5] w-full rounded-b-none" />
      </div>
      <div className="lux-body">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>

        <Skeleton className="mt-2.5 h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />

        <div className="mt-auto pt-5">
          <div className="lux-stock flex items-center justify-between gap-2 text-xs font-bold tracking-[0.05em]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="hidden h-5 w-16 sm:block" />
          </div>

          <div className="lux-buy mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeaturedProducts() {
  const [tab, setTab] = useState<FeaturedTabKey>("newest");
  const [products, setProducts] = useState<FeaturedProduct[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(false);
    // The default tab must NOT duplicate NewArrivals, which fetches the same
    // bare newest-six query two sections below. «جدیدترین‌ها» here means
    // newest *special offers* — a curation, not a second copy of the feed.
    const params = new URLSearchParams({
      pageSize: "6",
      includeVariants: "false",
      specialOffer: "true",
      sort: "newest",
    });
    if (tab === "special") params.set("sort", "special");
    apiGet<FeaturedProduct[]>(`/api/products?${params}`)
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const activeBadge = featuredTabs.find((t) => t.key === tab)?.badge ?? "";
  const showSkeletons = isLoading && products === null;

  return (
    <section id="featured" className="wrap py-16 md:py-20" aria-labelledby="featured-title">
      <div className="container">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow"><i /> ویترین منتخب</span>
              <h2 id="featured-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                محصولات <span className="grad">منتخب.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                انتخابی از محبوب‌ترین و تازه‌ترین محصولات حامی همراه
              </p>
            </div>
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
              مشاهده همه محصولات <ArrowLeft className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* The field runs wider than the text column above it, so the tray reads
          as a surface the goods are laid on rather than another content box.
          `max-w` + padding rather than negative margins: a negative margin wide
          enough to matter overflows the viewport at exactly the width where the
          container stops growing, which is the horizontal-scrollbar trap this
          hero has already hit twice. */}
      <Reveal delay={80} className="mx-auto mt-10 w-full max-w-[1560px] px-3 sm:px-4">
        <div className="tray-field">
          <div className="flex justify-center sm:justify-start pb-6">
            <div className="inline-flex items-center gap-1.5 p-1 rounded-full border border-champagne/25 bg-ink/70 backdrop-blur-md shadow-card" role="tablist" aria-label="فیلتر محصولات منتخب">
              {featuredTabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "relative rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-colors duration-normal",
                      active ? "text-[#110408]" : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="featured-tab-fill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFFDF9] via-[#E5D3B3] to-[#C5A059] shadow-[0_2px_12px_rgba(229,211,179,0.35)]"
                        transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.7 }}
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {showSkeletons && !error && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-line bg-ink-3/80 p-8 text-center text-foreground" role="status">
              <b className="block font-extrabold">دریافت محصولات موقتاً ممکن نیست.</b>
              <p className="mt-2 text-sm text-muted-foreground">می‌توانید کاتالوگ کامل را ببینید یا بعداً دوباره تلاش کنید.</p>
              <div className="mt-5 flex justify-center gap-4">
                <button type="button" onClick={() => setTab(tab)} className="rounded-full bg-oxblood px-4 py-2 text-xs font-bold text-foreground">
                  تلاش دوباره
                </button>
                <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-bold text-aqua hover:underline">
                  مشاهده همه محصولات <ArrowLeft className="size-3.5" />
                </Link>
              </div>
            </div>
          )}

          {products !== null && !error && products.length === 0 && (
            <div className="rounded-2xl border border-line bg-ink-3/80 p-8 text-center text-foreground" role="status">
              <b className="block font-extrabold">محصولی برای نمایش در این انتخاب وجود ندارد.</b>
              <p className="mt-2 text-sm text-muted-foreground">محصولات جدید به‌زودی به این بخش اضافه می‌شوند.</p>
              <Link href="/shop" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-aqua hover:underline">
                مشاهده همه محصولات <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          )}

          {products !== null && !error && products.length > 0 && (
            <div>
              <ProductRail
                products={products as ProductCardData[]}
                label={featuredTabs.find((t) => t.key === tab)?.label ?? "محصولات"}
              />
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}