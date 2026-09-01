"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft } from "lucide-react";
import { apiGet, firstProductImage } from "@/lib/api-client";
import { formatToman } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/home/Reveal";

type ProductCard = {
  id: number;
  name: string;
  slug: string;
  brand: { name: string } | null;
  displayPrice: number;
  images: unknown;
};

export function NewArrivals() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", direction: "rtl", containScroll: "trimSnaps" });
  const [canNext, setCanNext] = useState(false);
  const [products, setProducts] = useState<ProductCard[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<ProductCard[]>("/api/products?pageSize=6&includeVariants=false")
      .then((data) => !cancelled && setProducts(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(() => {
    if (emblaApi) setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section id="new-arrivals" className="container py-20" aria-labelledby="new-arrivals-title">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel index="۰۰۶">NEW ARRIVALS</SectionLabel>
            <h2 id="new-arrivals-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              تازه <em className="font-black not-italic text-champagne">رسیده‌اند.</em>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-foreground/60">
              جدیدترین محصولاتی که به مجموعه حامی همراه اضافه شده‌اند.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-champagne hover:underline">
              مشاهده همه <ArrowLeft className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="نمایش محصولات جدید بعدی"
              disabled={!emblaApi || !canNext}
              className="grid size-10 place-items-center rounded-sm border border-champagne/50 text-champagne transition-colors hover:bg-champagne/10 disabled:opacity-40"
            >
              <ArrowLeft className="size-4" />
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        {error ? (
          <div className="mt-10 rounded-sm border border-border bg-card p-8 text-center" role="status">
            <b className="block font-extrabold">دریافت تازه‌واردها موقتاً ممکن نیست.</b>
            <Link href="/shop" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-champagne hover:underline">
              مشاهده همه محصولات <ArrowLeft className="size-3.5" />
            </Link>
          </div>
        ) : (
          <NewArrivalsRail products={products} emblaRef={emblaRef} />
        )}
      </Reveal>
    </section>
  );
}

type RailProps = {
  products: ProductCard[] | null;
  emblaRef: (node: HTMLElement | null) => void;
};

function NewArrivalsRail({ products, emblaRef }: RailProps) {
  return (
    <div ref={emblaRef} className="mt-10 overflow-hidden" aria-busy={products === null} aria-label="ریل محصولات تازه‌وارد" aria-roledescription="carousel">
      <div className="flex touch-pan-y gap-5">
        {products === null &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_42%] lg:flex-[0_0_28%]">
              <div className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        {products !== null && products.length === 0 && (
          <div className="w-full rounded-sm border border-border bg-card p-8 text-center" role="status">
            <b className="block font-extrabold">چیز تازه‌ای برای نمایش نداریم.</b>
            <p className="mt-2 text-sm text-foreground/60">اما موجودی فروشگاه همچنان در حال به‌روزرسانی است.</p>
          </div>
        )}
        {products !== null && products.length > 0 && products.map((product) => <ArrivalCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}

function ArrivalCard({ product }: { product: ProductCard }) {
  const image = firstProductImage(product.images);
  return (
    <article className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_42%] lg:flex-[0_0_28%]">
      <div className="group overflow-hidden rounded-sm border border-border bg-card shadow-card transition-transform duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/5] overflow-hidden bg-wine-dark/40">
          <span className="absolute start-3 top-3 z-10 rounded-sm bg-champagne px-2 py-1 font-mono text-[9px] font-bold tracking-[0.08em] text-wine-ink">
            NEW
          </span>
          <Link href={`/shop/${product.slug}`} className="grid h-full place-items-center" aria-label={product.name}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- legacy-import URLs; swap to next/image in the shop phase
              <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-[10px] tracking-[0.14em] text-champagne/50">HAMI / NEW</span>
            )}
          </Link>
        </div>
        <div className="p-4">
          <span className="font-mono text-[9px] tracking-[0.1em] text-champagne/80">{product.brand?.name ?? "—"}</span>
          <h3 className="mt-1 text-sm font-extrabold leading-6">
            <Link href={`/shop/${product.slug}`} className="hover:text-champagne">{product.name}</Link>
          </h3>
          <strong className="mt-2 block text-sm font-black text-champagne">{formatToman(product.displayPrice)}</strong>
        </div>
      </div>
    </article>
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

