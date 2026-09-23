"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { featuredTabs, type FeaturedTabKey } from "@/lib/content/home";
import type { RailProduct } from "@/lib/home-rails";
import { cn, formatToman } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/home/Reveal";
import { type ProductCardData } from "@/components/shop/ProductCard";
import { ProductRail } from "@/components/shop/ProductRail";

/** One tab and the records already resolved for it, from the seam on the server. */
export type FeaturedRailTab = { key: FeaturedTabKey; label: string; products: RailProduct[] };

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
          <div className="lux-stock flex items-center justify-between gap-2 text-xs font-bold tracking-normal">
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

/*
 * Both rails arrive already resolved. This section used to fetch `/api/products`
 * on mount and again on every tab change, so the served homepage held no products
 * at all — the round-trip Constitution III forbids for browsing. What is left here
 * is the tab, which is genuinely client state.
 *
 * The default tab deliberately does not duplicate NewArrivals, which shows the
 * bare six-record feed two sections below: «جدیدترین‌ها» here means newest *special
 * offers*, a curation rather than a second copy of the feed.
 */
export function FeaturedProducts({ tabs }: { tabs: FeaturedRailTab[] }) {
  const [tab, setTab] = useState<FeaturedTabKey>(tabs[0]?.key ?? "newest");
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  const products = active?.products ?? [];
  const activeBadge = active?.label ? featuredTabs.find((t) => t.key === tab)?.badge ?? "" : "";

  return (
    <section id="featured" className="wrap py-16 md:py-20" aria-labelledby="featured-title">
      <div className="container">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow"><i /> ویترین منتخب</span>
              <h2 id="featured-title" className="mt-4 text-3xl font-black tracking-normal md:text-4xl">
                محصولات <span className="emphasis">منتخب.</span>
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
            <div className="inline-flex items-center gap-1.5 p-1 rounded-full border border-champagne/25 bg-ink shadow-card" role="tablist" aria-label="فیلتر محصولات منتخب">
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

          {products.length === 0 && (
            <div className="rounded-2xl border border-line bg-ink-3/80 p-8 text-center text-foreground" role="status">
              <b className="block font-extrabold">محصولی برای نمایش در این انتخاب وجود ندارد.</b>
              <p className="mt-2 text-sm text-muted-foreground">محصولات جدید به‌زودی به این بخش اضافه می‌شوند.</p>
              <Link href="/shop" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-aqua hover:underline">
                مشاهده همه محصولات <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          )}

          {products.length > 0 && (
            <div>
              <ProductRail products={products as unknown as ProductCardData[]} label={active?.label ?? "محصولات"} />
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}