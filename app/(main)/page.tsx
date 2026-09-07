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
import { RotatingWord } from "@/components/home/RotatingWord";
import { ShopWindow } from "@/components/home/ShopWindow";
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
import { FinalConversion, MobileDock } from "@/components/home/TrustBlocks";
import { brandWall } from "@/lib/content/home";
import type { TrustFeatureKey } from "@/lib/content/home";
import "./home.css";

/** Hero credential row, in the order the brief specifies. Names are resolved
 *  against `brandWall` so this list cannot drift from the brand source. */
/** The headline's cycling tail. Each has to complete "بهترین قیمت برای …". */
const HERO_ROTATING_WORDS = ["موبایل", "لوازم جانبی", "ساعت هوشمند", "خرید عمده"] as const;

const HERO_BRANDS = ["TCH", "REALME", "APPLE", "SAMSUNG", "XIAOMI", "NOKIA"].filter((n) =>
  brandWall.some((b) => b.name === n),
);

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
    <section id="top" className="relative pb-20 pt-14 md:pb-28 md:pt-20" aria-labelledby="hero-title">
      {/* Two columns. In RTL the first child lands on the right, so the copy
          sits on the reading-start side and the shop window opposite it. */}
      <div className="wrap container grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
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
            className="mt-7 max-w-2xl text-balance text-4xl font-black leading-[1.3] tracking-tight md:text-5xl md:leading-[1.25] xl:text-6xl"
          >
            <span className="block text-foreground/90">حامی همراه؛ بیست سال اعتماد در بازار مشهد.</span>
            <span className="mt-3 block">
              بهترین قیمت برای{" "}
              <span className="relative inline-block">
                <span className="grad animate-shiny bg-[length:220%_auto]">
                  <RotatingWord words={HERO_ROTATING_WORDS} />
                </span>
                {/* Hand-drawn swash, sized to the rotator's widest word so it
                    never redraws as the word changes. */}
                <svg
                  className="absolute -bottom-2 start-0 h-3 w-full text-aqua/50"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-balance text-[15px] leading-9 text-foreground/70 md:text-base md:leading-9">
            از فروش حضوری در مشهد تا پخش عمده برای همکاران — کالای اصل با گارانتی
            رسمی، و قیمتی که کمتر جایی پیدا می‌کنید.
          </p>
          <p className="mt-3 max-w-xl text-balance text-sm leading-8 text-muted-foreground/80 md:leading-9">
            چه یک دستگاه بخواهید و چه صد دستگاه، همان قیمت منصفانه و همان
            پشتیبانی؛ از انتخاب تا تحویل، کنار شما هستیم.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center" aria-label="مسیرهای اصلی">
            <Link
              href="/shop"
              className="shiny-edge inline-flex h-12 items-center gap-2 px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              مشاهده محصولات
              <ArrowLeft className="size-4" />
            </Link>
            <Link href="/partners">
              <Button size="lg" variant="ghost" className="h-12 rounded-full px-8">
                شروع همکاری <ArrowUpLeft />
              </Button>
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

        <Reveal delay={120} className="mx-auto w-full max-w-md lg:mx-0">
          <ShopWindow />
        </Reveal>
      </div>

      {/* Outside the container on purpose: this band spans the viewport, the
          way the reference runs its logo strip edge to edge. */}
      <div className="wrap">
        {/* The credential row: the operating-history stat plus the partner
            brands, as one full-bleed band of panels separated by hairlines.
            Brand names come from `brandWall` so the list has a single source;
            they carry no per-brand claim, because the nature of each
            relationship is not established in PRODUCT.md and inventing one
            here would be exactly the drift DESIGN.md warns about. */}
        <Reveal delay={150} className="mt-14 w-full">
          <p className="mb-3 text-center font-mono text-[10px] tracking-[0.14em] text-muted-foreground/60">
            HAMI HAMRAH / BRANDS
          </p>
          <ul
            className="m-0 grid list-none grid-cols-2 gap-px border-y border-line bg-line p-0 sm:grid-cols-4 lg:grid-cols-7"
            aria-label="سابقه و برندهای همکار"
          >
            <li className="bg-card px-4 py-6 text-center">
              <b className="block text-2xl font-black text-aqua-lite">۲۰ سال</b>
              <span className="mt-1 block text-[11px] text-muted-foreground/70">سابقه در بازار مشهد</span>
            </li>
            {HERO_BRANDS.map((name) => (
              <li key={name} className="bg-card px-4 py-6 text-center">
                <b className="block font-mono text-lg font-bold tracking-wide text-foreground/90">{name}</b>
                <span className="mt-1 block text-[11px] text-muted-foreground/70">برند همکار</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBento />
      <MobileQuickRoutes />
      <CategoryHub />
      <FeaturedProducts />
      <BrandShowcase />
      <CampaignBanner />
      <NewArrivals />
      <B2bSection />
      <AccessoryUniverse />
      <OnlineServices />
      <StoreExperience />
      <FinalConversion />
      <MobileDock />
    </>
  );
}

