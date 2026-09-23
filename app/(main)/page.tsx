import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  BatteryCharging,
  ChevronDown,
  Globe2,
  Headphones,
  House,
  PackageCheck,
  Phone,
  Plug,
  ShieldCheck,
  Smartphone,
  Speaker,
  Store,
  UserRound,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/Reveal";
import { storeWarranty } from "@/lib/content/verified-facts";
import { ShopWindow } from "@/components/home/ShopWindow";
import { BrandTicker } from "@/components/home/BrandTicker";
import { FlipWords } from "@/components/ui/flip-words";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { featuredOfferRail, featuredSpecialRail, newArrivalsRail } from "@/lib/home-rails";
import { NewArrivals } from "@/components/home/NewArrivals";
import { ObtainableNow } from "@/components/home/ObtainableNow";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { AccessoryUniverse } from "@/components/home/AccessoryUniverse";
import { MobileQuickRoutes } from "@/components/home/MobileQuickRoutes";
import { TrustBento } from "@/components/home/TrustBento";
import { CategoryHub } from "@/components/home/CategoryHub";
import { B2bSection } from "@/components/home/B2bSection";
import { OnlineServices } from "@/components/home/OnlineServices";
import { StoreExperience } from "@/components/home/StoreExperience";
import { FinalConversion } from "@/components/home/TrustBlocks";
import type { TrustFeatureKey } from "@/lib/content/home";
import "./home.css";

/** The headline's cycling tail. Each has to complete «قیمت روزِ بازار، مستقیم از مشهد برای …». */
const HERO_ROTATING_WORDS = ["موبایل", "لوازم جانبی", "ساعت هوشمند", "خرید عمده"] as const;


const categoryIcons: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  headphones: Headphones,
  plug: Plug,
  battery: BatteryCharging,
  watch: Watch,
  phone: Phone,
  speaker: Speaker,
  globe: Globe2,
};

function Hero() {
  return (
    <section id="top" className="relative pb-12 pt-6 md:pb-24 md:pt-14" aria-labelledby="hero-title">
      {/* Two columns. In RTL the first child lands on the right, so the copy
          sits on the reading-start side and the shop window opposite it. */}
      {/* Equal columns. The split was 1.08fr / 0.92fr, which left the copy 112px
          from the right edge while the photograph sat 187px from the left — 75px
          of asymmetry, and in RTL the tighter margin fell on the reading side,
          so the whole frame read as crooked. */}
      <div className="wrap container grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/*
         * T075 / T085 — the hero recomposed at 360 first, after the strip.
         *
         * The old order put a 271px, seven-line headline above everything, then two
         * paragraphs, then the actions, and the trust row landed at y=774–838 on a
         * 360×800 screen: cut in half by the fold, with the first merchandise at
         * y=2016. FR-014 asks for positioning, one trust signal and one obvious next
         * action *without scrolling*, on the owner's own target width — so the
         * headline now carries the price position alone, the twenty-year claim moved
         * into the lead where it reads as sense, and the stack lands inside the first
         * viewport: eyebrow 120, h1 167, lead 309, actions 429, trust row 501–540, the
         * shop window beginning at 572. All of that is above the fold at 360×800.
         * What is not is the merchandise — first product card at y=1640, down from
         * 2016 — which is why T085 stays open on the stock half of the promise while
         * the trust half is met.
         *
         * `tracking-normal` is not a style tweak: `tracking-tight` on Persian pulls
         * the joining strokes apart (FR-057), and it was applied to the one line
         * nobody misreads.
         */}
        <Reveal className="text-start">
          <span className="eyebrow">
            <span className="relative inline-flex size-2 rounded-full bg-signal" aria-hidden="true" />
            مشهد • ۲۰ سال سابقه
          </span>

          <h1
            id="hero-title"
            className="mt-4 max-w-xl text-balance text-[1.85rem] font-black leading-[1.42] tracking-normal md:mt-5 md:text-[2.5rem] md:leading-[1.32] xl:text-5xl"
          >
            قیمت روزِ بازار، مستقیم از <span className="emphasis">مشهد</span> برای{" "}
            <span className="relative inline-block">
              <FlipWords words={HERO_ROTATING_WORDS} className="emphasis font-extrabold" />
              {/* Hand-drawn swash, sized to the rotator's widest word so it
                  never redraws as the word changes. */}
              <svg
                className="absolute -bottom-2 start-0 h-3 w-full text-champagne/60"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h1>

          {/*
           * The warranty clause came out of this sentence: it is the first item of the
           * trust row twelve pixels below, and saying it twice in one screen is how a
           * line stops reading as fact and starts reading as pitch. What is left is the
           * one thing no card on the page can state — that a person quotes the price.
           */}
          <p className="mt-4 max-w-[46ch] text-pretty text-[15px] leading-8 text-foreground/75 md:mt-6 md:text-base md:leading-9">
            حامی همراه؛ بیست سال اعتماد در بازار مشهد. برای یک دستگاه یا خرید عمده، موجودی و قیمت روز را
            کارشناس فروشگاه تلفنی اعلام می‌کند.
          </p>

          <div className="mt-6 flex flex-row items-stretch gap-3 sm:mt-8" aria-label="مسیرهای اصلی">
            <Link href="/shop" className={cn(buttonVariants({ variant: "oxblood", size: "default" }), "flex-1 sm:flex-none")}>
              مشاهده محصولات
            </Link>
            <Link
              href="/partners"
              className="cta-quiet inline-flex h-12 shrink-0 items-center gap-2 px-5 text-[14px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95 sm:px-8 sm:text-[15px]"
            >
              شروع همکاری
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          {/* FR-006 admits four trust facts and no others. «اصالت کالا» was a
              fifth with nothing behind it, so the row reads straight from the
              verified list instead of a per-component array. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5" role="list" aria-label="نشانه‌های اعتماد حامی همراه">
            {[storeWarranty.label, "بیست سال سابقه در بازار مشهد", "فروشگاه حضوری در مشهد"].map((item) => (
              <span key={item} role="listitem" className="flex items-center gap-1.5 text-[11px] text-foreground/60">
                <BadgeCheck className="size-3.5 shrink-0 text-aqua" /> {item}
              </span>
            ))}
          </div>
        </Reveal>

        {/* `lg:mx-0` aligned the window to its column's START, which in RTL is the
            column's right edge — so it drifted inward as the column grew and the
            left margin never matched the copy's right margin. `lg:ms-auto`
            pushes it to the outer edge instead, so both sides of the hero land
            on the container's own padding. */}
        <Reveal delay={120} className="mx-auto w-full max-w-md lg:ms-auto lg:me-0">
          <ShopWindow />
        </Reveal>
      </div>

      {/* Outside the container on purpose: this band spans the viewport, the
          way the reference runs its logo strip edge to edge. */}
      <div className="wrap">
        {/* The credential band: the operating-history claim plus the partner
            logos, running as one full-bleed ticker. The marks carry no
            per-brand caption, because the nature of each relationship is not
            established in PRODUCT.md and inventing one here would be exactly
            the drift DESIGN.md warns about. */}
        <Reveal delay={150} className="mt-14 w-full">
          <p className="mb-3 text-center font-mono text-xs tracking-[0.14em] text-muted-foreground/60">
            HAMI HAMRAH / BRANDS
          </p>
          <BrandTicker />
        </Reveal>
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
  const featuredTabs = [
    { key: "newest" as const, label: "جدیدترین‌ها", products: featuredOfferRail() },
    { key: "special" as const, label: "پیشنهاد ویژه", products: featuredSpecialRail() },
  ];
  const arrivals = newArrivalsRail();

  return (
    <>
      <Hero />
      {/* Mobile only (`md:hidden`), and a shop entry rather than an interruption:
          a row of route chips straight into the catalogue. On desktop it does
          not render, so the hero hands over directly to the products. */}
      <MobileQuickRoutes />
      {/* Goods first. The page used to open on "چرا حامی همراه" — the argument
          for trusting the shop — before showing a single product. That order
          asks a visitor to be persuaded before they have seen anything worth
          being persuaded about. Real stock with real prices comes first now,
          and the trust case moves to where it is actually needed: immediately
          before the final call to buy. */}
      {/* First, and deliberately ahead of the two curated rails: with the export's
          current figures this is the only shelf on the site that can say «you can buy
          this today» and be held to it. FeaturedProducts and NewArrivals both lead with
          records the shop cannot sell. */}
      <ObtainableNow />
      <FeaturedProducts tabs={featuredTabs} />
      <CategoryHub />
      <BrandShowcase />
      {/* CampaignBanner removed (distill): it sold no offer, product, or
          urgency — generic ad copy plus the logo in the page's most expensive
          slot. Restore it only when there is a real campaign to carry. */}
      <NewArrivals products={arrivals} />
      <B2bSection />
      <AccessoryUniverse />
      <OnlineServices />
      <StoreExperience />
      <TrustBento />
      <FinalConversion />
    </>
  );
}

