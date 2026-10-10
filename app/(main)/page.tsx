import Link from "next/link";
import Image from "next/image";
import { pageMetadata } from "@/lib/seo-metadata";
import {
  ArrowLeft,
  BadgeCheck,
  House,
  PackageCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trustFacts } from "@/lib/content/verified-facts";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { additionalProductsRail, discountedProductsRail, homepageProductsRail } from "@/lib/home-rails-db";
import { AdditionalProducts } from "@/components/home/AdditionalProducts";
import { DiscountedProducts } from "@/components/home/DiscountedProducts";
import { ObtainableNow } from "@/components/home/ObtainableNow";
import { AssemblyBand } from "@/components/home/AssemblyBand";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { MobileQuickRoutes } from "@/components/home/MobileQuickRoutes";
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

const trustFactIcons: Record<(typeof trustFacts)[number]["key"], LucideIcon> = {
  history: BadgeCheck,
  store: House,
  redmi: Smartphone,
  tch: PackageCheck,
};

const trustFactShortLabels: Record<(typeof trustFacts)[number]["key"], string> = {
  history: "۲۰ سال سابقه",
  store: "فروشگاه حضوری در مشهد",
  redmi: "نمایندگی رسمی ردمی",
  tch: "نماینده رسمی تی‌سی‌اچ در منطقه",
};

function Hero() {
  return (
    <section id="top" className="band-paper homepage-hero" aria-labelledby="hero-title" data-ground="paper">
      <picture className="homepage-hero__art" aria-hidden="true">
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
      <div className="wrap container homepage-hero__inner">
        <div className="homepage-hero__scene" aria-hidden="true" />

        <div className="homepage-hero__content">
          <span className="eyebrow homepage-hero__eyebrow">
            <span className="homepage-hero__eyebrow-dot" aria-hidden="true" />
            موبایل و لوازم جانبی در مشهد
          </span>

          <h1 id="hero-title" className="homepage-hero__title">
            <span className="homepage-hero__title-line">موبایل و لوازم جانبی</span>
            <span className="homepage-hero__title-emphasis">برای هر روز شما.</span>
          </h1>

          <p className="homepage-hero__description">
            برای خرید تکی یا همکاری عمده، قیمت روز و موجودی را از کارشناس فروش حامی همراه بپرسید.
          </p>

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

          <ul className="homepage-hero__trust" aria-label="واقعیت‌های تأییدشده درباره حامی همراه">
            {trustFacts.map((fact) => {
              const Icon = trustFactIcons[fact.key];

              return (
                <li key={fact.key} className="homepage-hero__trust-item" aria-label={fact.label}>
                  <Icon aria-hidden="true" />
                  <span>{trustFactShortLabels[fact.key]}</span>
                </li>
              );
            })}
          </ul>
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

async function AdditionalProductsSection() {
  const products = await additionalProductsRail();
  return <AdditionalProducts products={products} />;
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
      {/* Mobile only (`md:hidden`), and a shop entry rather than an interruption:
          a row of route chips straight into the catalogue. */}
      <MobileQuickRoutes />
      {/* A strict sellability shelf: every item here can actually be purchased. */}
      <ObtainableNow />
      <CategoryHub />
      <BrandShowcase />
      <Suspense fallback={<HomeRailSkeleton />}>
        <AdditionalProductsSection />
      </Suspense>
      <OnlineServices />
      <B2bSection />
      <AssemblyBand />
    </>
  );
}
