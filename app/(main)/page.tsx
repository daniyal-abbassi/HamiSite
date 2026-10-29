import Link from "next/link";
import Image from "next/image";
import { pageMetadata } from "@/lib/seo-metadata";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import storePhoto from "@/public/store/shop-ai-relight.png";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { discountedProductsRail, homepageProductsRail } from "@/lib/home-rails-db";
import { DiscountedProducts } from "@/components/home/DiscountedProducts";
import { AssemblyBand } from "@/components/home/AssemblyBand";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { CategoryHub } from "@/components/home/CategoryHub";
import { B2bSection } from "@/components/home/B2bSection";
import { OnlineServices } from "@/components/home/OnlineServices";
import { Suspense } from "react";
import { HomeRailSkeleton } from "@/components/home/HomeRailSkeleton";
import "./home.css";

export const metadata = pageMetadata({
  title: "فروشگاه موبایل و لوازم جانبی در مشهد",
  description: "خرید موبایل، ساعت هوشمند و لوازم جانبی از حامی همراه در مشهد؛ فروش حضوری و آنلاین، پشتیبانی خرید خرد و همکاری عمده با فروشگاه‌ها.",
  path: "/",
});

// Keep the homepage fast and statically served while refreshing catalogue-backed
// sections shortly after an import or an inventory change.
export const revalidate = 60;

/* The marquee loops by translating exactly half the track, so one half must
   always cover the widest viewport — otherwise the bar empties out on desktop
   (2 copies = 712px against a 1466px window). Six copies = 2136px covers every
   width the ticker is allowed to take, desktop pill included. */
const TICKER_TEXT_COPIES = Array.from({ length: 6 }, (_, i) => i);

function Hero() {
  return (
    <section id="top" className="band-paper homepage-hero relative" aria-labelledby="hero-title" data-ground="paper">
      <picture className="homepage-hero__art absolute inset-0 block h-full w-full" aria-hidden="true">
        <source
          media="(max-width: 1023px)"
          srcSet="/images/hero/home-mobile-640.webp 640w, /images/hero/home-mobile-960.webp 941w"
          sizes="100vw"
        />
        <Image
          src="/images/hero/home-desktop.webp"
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="homepage-hero__image"
        />
      </picture>
      <a
        href="https://t.me/HAMI_HAMRAH_ABBASI"
        target="_blank"
        rel="noopener noreferrer"
        className="hero-ticker"
        aria-label="کانال تلگرام حامی همراه؛ دریافت فهرست روزانهٔ قیمت و موجودی"
      >
        <span className="hero-ticker__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
        </span>
        <span className="hero-ticker__viewport" aria-hidden="true">
          <span className="hero-ticker__track">
            {TICKER_TEXT_COPIES.map((i) => (
              <span key={i} className="hero-ticker__copy">
                کانال تلگرام — دریافت لیست روزانهٔ قیمت و موجودی
              </span>
            ))}
          </span>
        </span>
        <ArrowLeft className="hero-ticker__arrow" aria-hidden="true" />
      </a>
      <div className="wrap container homepage-hero__inner">
        <div className="homepage-hero__scene" aria-hidden="true" />

        {/* The real shop, not a render (spec 044 US2): the approved interior
            photograph occupies the left column on phones, bleeding to the
            screen edge per the mockup. Desktop keeps its approved artwork. */}
        <figure className="homepage-hero__photo">
          <Image
            src={storePhoto}
            alt="نمای داخل فروشگاه حامی همراه در مشهد"
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 767px) 100vw, 0px"
            className="homepage-hero__photo-image"
          />
        </figure>

        <div className="homepage-hero__content">
          <span className="eyebrow homepage-hero__eyebrow">
            <span className="homepage-hero__eyebrow-dot" aria-hidden="true" />
            ۲۰ سال اعتماد
          </span>

          <h1 id="hero-title" className="homepage-hero__title">
            <span className="homepage-hero__title-line">حامی همراه،</span>
            <span className="homepage-hero__title-emphasis">
              فروش عمده و تکی
              <br />
              تلفن همراه و لوازم جانبی
            </span>
          </h1>

          <nav className="homepage-hero__actions" aria-label="مسیرهای اصلی">
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "oxblood", size: "lg" }), "homepage-hero__action homepage-hero__action--primary")}
            >
              مشاهده محصولات
              <ArrowLeft aria-hidden="true" />
            </Link>
            <Link href="/partners" className="homepage-hero__action homepage-hero__action--secondary lightbeam-cta">
              <span>شروع همکاری</span>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}

async function FeaturedProductsSection() {
  const products = await homepageProductsRail();
  return <FeaturedProducts products={products} />;
}

async function DiscountedProductsSection() {
  const products = await discountedProductsRail();
  if (products.length === 0) return null;
  return <DiscountedProducts products={products} />;
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<HomeRailSkeleton />}>
        <FeaturedProductsSection />
      </Suspense>
      <Suspense fallback={null}>
        <DiscountedProductsSection />
      </Suspense>
      <Suspense fallback={null}>
        <CategoryHub />
      </Suspense>
      <Suspense fallback={null}>
        <BrandShowcase />
      </Suspense>
      <OnlineServices />
      <B2bSection />
      <AssemblyBand />
    </>
  );
}
