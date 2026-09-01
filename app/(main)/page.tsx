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
import { SectionLabel, TrustGlyph } from "@/components/home/primitives";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { AccessoryUniverse } from "@/components/home/AccessoryUniverse";
import { TrustBar, MobileQuickRoutes } from "@/components/home/TrustBar";
import { CategoryHub } from "@/components/home/CategoryHub";
import { CampaignBanner } from "@/components/home/CampaignBanner";
import { B2bSection } from "@/components/home/B2bSection";
import { OnlineServices } from "@/components/home/OnlineServices";
import { WhyHami } from "@/components/home/WhyHami";
import { StoreExperience } from "@/components/home/StoreExperience";
import { CustomerTrust, FinalConversion, MobileDock } from "@/components/home/TrustBlocks";
import { toFaDigits } from "@/lib/utils";
import type { TrustFeatureKey } from "@/lib/content/home";
import "./home.css";

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
    <section id="top" className="hero-surface" aria-labelledby="hero-title">
      <div className="container grid items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <Reveal>
          <p className="m-0 flex items-center gap-2.5 text-[11px] font-bold text-foreground/70">
            <span className="font-mono text-champagne">{toFaDigits("01")}</span>
            <i className="h-px w-8 bg-champagne/60" aria-hidden="true" />
            همراه مطمئن شما در دنیای موبایل
          </p>
          <h1 id="hero-title" className="mt-5 text-4xl font-black leading-[1.35] tracking-tight md:text-6xl md:leading-[1.3]">
            اطمینان،
            <em className="block font-black not-italic text-champagne">در هر انتخاب.</em>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-8 text-foreground/70 md:text-[15px]">
            تجربه‌ای مطمئن برای خرید و تأمین تلفن همراه؛ از انتخاب تا تحویل.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" aria-label="مسیرهای اصلی">
            <Button size="lg">
              مشاهده محصولات <ArrowLeft />
            </Button>
            <Button size="lg" variant="outline">
              شروع همکاری <ArrowUpLeft />
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2" role="list" aria-label="نشانه‌های اعتماد حامی همراه">
            {["اصالت کالا", "گارانتی رسمی", "سابقه بیست ساله"].map((item) => (
              <span key={item} role="listitem" className="flex items-center gap-1.5 text-xs text-foreground/65">
                <BadgeCheck className="size-4 text-champagne" /> {item}
              </span>
            ))}
          </div>
          <div className="mt-8 flex max-w-md items-center gap-4 border-t border-border pt-5" aria-label="مسیرهای فروش حامی همراه">
            <span className="text-[11px] text-foreground/55">فروش مستقیم و همکاری عمده</span>
            <i className="h-px flex-1 bg-champagne/30" aria-hidden="true" />
            <span className="text-[11px] text-foreground/55">انتخاب و تأمین در یک مسیر</span>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="hero-frame relative mx-auto hidden w-full max-w-md place-items-center md:grid" aria-hidden="true">
            <span className="absolute -start-5 top-8 bg-wine-ink px-3 py-2 font-mono text-[10px] tracking-[0.06em] text-champagne-light">
              FR.01 — HAMI / 2014
            </span>
            <div className="hero-glow" />
            <span className="relative font-mono text-9xl text-champagne/85">H</span>
            <div className="absolute -bottom-6 -end-6 grid size-32 place-items-center border border-champagne/60 bg-background text-center shadow-seal">
              <div>
                <span className="block text-[10px] text-foreground/60">از انتخاب تا تحویل</span>
                <b className="mt-1 block text-sm font-black text-champagne">اطمینانِ مطمئن</b>
                <i className="mx-auto mt-2 block h-0.5 w-6 bg-champagne" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <MobileQuickRoutes />
      <CategoryHub />
      <FeaturedProducts />
      <BrandShowcase />
      <CampaignBanner />
      <NewArrivals />
      <B2bSection />
      <AccessoryUniverse />
      <OnlineServices />
      <WhyHami />
      <StoreExperience />
      <CustomerTrust />
      <FinalConversion />
      <MobileDock />
    </>
  );
}

