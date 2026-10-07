import Link from "next/link";
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
import { discountedProductsRail, featuredLatestRail, newArrivalsRail } from "@/lib/home-rails-db";
import { NewArrivals } from "@/components/home/NewArrivals";
import { DiscountedProducts } from "@/components/home/DiscountedProducts";
import { ObtainableNow } from "@/components/home/ObtainableNow";
import { AssemblyBand } from "@/components/home/AssemblyBand";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { MobileQuickRoutes } from "@/components/home/MobileQuickRoutes";
import { CategoryHub } from "@/components/home/CategoryHub";
import { B2bSection } from "@/components/home/B2bSection";
import { OnlineServices } from "@/components/home/OnlineServices";
import "./home.css";

export const metadata = pageMetadata({
  title: "فروشگاه موبایل و لوازم جانبی در مشهد",
  description: "خرید موبایل، ساعت هوشمند و لوازم جانبی از حامی همراه در مشهد؛ فروش حضوری و آنلاین، پشتیبانی خرید خرد و همکاری عمده با فروشگاه‌ها.",
  path: "/",
});


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
      <div className="wrap container homepage-hero__inner">
        <div className="homepage-hero__scene" aria-hidden="true" />

        <div className="homepage-hero__content">
          <span className="eyebrow homepage-hero__eyebrow">
            <span className="homepage-hero__eyebrow-dot" aria-hidden="true" />
            موبایل و لوازم جانبی در مشهد
          </span>

          <h1 id="hero-title" className="homepage-hero__title">
            <span className="homepage-hero__title-line">قیمت روز بازار مستقیم از</span>
            <span className="homepage-hero__title-emphasis">مشهد برای ساعت هوشمند</span>
          </h1>

          <p className="homepage-hero__description">
            برای یک دستگاه یا خرید عمده، موجودی و قیمت روز را کارشناس فروشگاه تلفنی اعلام می‌کند.
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

export default async function HomePage() {
  /*
   * Read from the catalog seam on the server. Both product rails used to fetch
   * `/api/products` after hydration, which left the served homepage holding no
   * products at all — Constitution III says browsing must not need a round-trip,
   * and `quickstart.md` §3 checks it with curl rather than by trust.
   */
  const [latestProducts, arrivals, discountedProducts] = await Promise.all([
    featuredLatestRail(),
    newArrivalsRail(),
    discountedProductsRail(),
  ]);

  return (
    <>
      <Hero />
      <FeaturedProducts products={latestProducts} />
      {discountedProducts.length > 0 && <DiscountedProducts products={discountedProducts} />}
      {/* Mobile only (`md:hidden`), and a shop entry rather than an interruption:
          a row of route chips straight into the catalogue. */}
      <MobileQuickRoutes />
      {/* A strict sellability shelf: every item here can actually be purchased. */}
      <ObtainableNow />
      <CategoryHub />
      <BrandShowcase />
      {/* CampaignBanner removed (distill): it sold no offer, product, or
          urgency — generic ad copy plus the logo in the page's most expensive
          slot. Restore it only when there is a real campaign to carry. */}
      <NewArrivals products={arrivals} />
      <OnlineServices />
      <B2bSection />
      {/* Feature 007: the store-experience, trust and closing sections are one composed band. The pin
          that was specified for it was measured and removed (notes/band-geometry-measured.md): the
          sticky shell left 54.6px of travel against a 1,600px animation range, so the scrub never advanced
          and the phone number sat at document y≈2229 — off screen, not immovable. Static is 2,184px at 360
          against the 2,961px it replaces, so the shortening criterion is met without the mechanism. */}
      <AssemblyBand />
    </>
  );
}
