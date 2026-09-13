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
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { ShopWindow } from "@/components/home/ShopWindow";
import { BrandTicker } from "@/components/home/BrandTicker";
import { FlipWords } from "@/components/ui/flip-words";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { AccessoryUniverse } from "@/components/home/AccessoryUniverse";
import { MobileQuickRoutes } from "@/components/home/TrustBar";
import { TrustBento } from "@/components/home/TrustBento";
import { CategoryHub } from "@/components/home/CategoryHub";
import { CampaignBanner } from "@/components/home/CampaignBanner";
import { B2bSection } from "@/components/home/B2bSection";
import { OnlineServices } from "@/components/home/OnlineServices";
import { StoreExperience } from "@/components/home/StoreExperience";
import { FinalConversion } from "@/components/home/TrustBlocks";
import type { TrustFeatureKey } from "@/lib/content/home";
import "./home.css";

/** The headline's cycling tail. Each has to complete "بهترین قیمت برای …". */
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
    <section id="top" className="relative pb-20 pt-10 md:pb-28 md:pt-20" aria-labelledby="hero-title">
      {/* Two columns. In RTL the first child lands on the right, so the copy
          sits on the reading-start side and the shop window opposite it. */}
      {/* Equal columns. The split was 1.08fr / 0.92fr, which left the copy 112px
          from the right edge while the photograph sat 187px from the left — 75px
          of asymmetry, and in RTL the tighter margin fell on the reading side,
          so the whole frame read as crooked. */}
      <div className="wrap container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="text-start">
          {/* Badge with a live dot — the reference's opening device. */}
          <span className="eyebrow">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-signal" />
            </span>
            مشهد • حامی همراه • ۲۰ سال سابقه
          </span>

          <h1
            id="hero-title"
            className="mt-6 max-w-xl text-balance text-[2rem] font-black leading-[1.35] tracking-tight md:mt-7 md:text-[2.6rem] md:leading-[1.3] xl:text-5xl"
          >
            <span className="block text-foreground/90">حامی همراه؛ بیست سال اعتماد در بازار مشهد.</span>
            {/* nowrap only from md up: below that "بهترین قیمت برای" plus the
                rotator's widest word cannot fit one line, and forcing it pushes
                the grid past the viewport and gives the page a horizontal
                scrollbar. */}
            <span className="mt-3 block md:whitespace-nowrap">
              بهترین قیمت برای{" "}
              <span className="relative inline-block">
                <FlipWords words={HERO_ROTATING_WORDS} className="grad font-extrabold" />
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
            </span>
          </h1>

          <p className="mt-6 max-w-none text-pretty text-[15px] leading-8 text-foreground/75 md:mt-8 md:text-base md:leading-9">
            از فروش حضوری در قلب بازار مشهد تا پخش عمده سراسری برای همکاران — کالای اصل با گارانتی
            رسمی و قیمتی بی‌رقیب.
          </p>
          <p className="mt-2 max-w-none text-pretty text-sm leading-7 text-muted-foreground/80 md:mt-3 md:leading-9">
            چه یک دستگاه بخواهید و چه صد دستگاه، همان قیمت منصفانه و همان
            پشتیبانی؛ از انتخاب تا تحویل، کنار شما هستیم.
          </p>

          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center" aria-label="مسیرهای اصلی">
            <Link
              href="/shop"
              className="shiny-edge inline-flex h-12 items-center gap-2 px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              مشاهده محصولات
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              href="/partners"
              className="shiny-edge inline-flex h-12 items-center gap-2 px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              شروع همکاری
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2" role="list" aria-label="نشانه‌های اعتماد حامی همراه">
            {["اصالت کالا", "گارانتی رسمی", "سابقه بیست ساله"].map((item) => (
              <span key={item} role="listitem" className="flex items-center gap-1.5 text-xs text-foreground/60">
                <BadgeCheck className="size-4 text-aqua" /> {item}
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

export default function HomePage() {
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
      <FeaturedProducts />
      <CategoryHub />
      <BrandShowcase />
      <CampaignBanner />
      <NewArrivals />
      <B2bSection />
      <AccessoryUniverse />
      <OnlineServices />
      <StoreExperience />
      <TrustBento />
      <FinalConversion />
    </>
  );
}

