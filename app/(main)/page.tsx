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
    <section id="top" className="relative py-16 md:py-24" aria-labelledby="hero-title">
      <div className="wrap container grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <span className="eyebrow">
            <i /> مشهد • حامی همراه • ۲۰ سال سابقه
          </span>
          <h1 id="hero-title" className="mt-5 text-4xl font-black leading-[1.35] tracking-tight md:text-6xl md:leading-[1.3]">
            اطمینان، <span className="grad animate-shiny bg-[length:220%_auto]">در هر انتخاب.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-8 text-foreground/70 md:text-[15px]">
            تجربه‌ای مطمئن برای خرید و تأمین تلفن همراه؛ از انتخاب تا تحویل.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" aria-label="مسیرهای اصلی">
            <Button size="lg" variant="oxblood">
              مشاهده محصولات <ArrowLeft />
            </Button>
            <Link href="/partners">
              <Button size="lg" variant="ghost">
                شروع همکاری <ArrowUpLeft />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2" role="list" aria-label="نشانه‌های اعتماد حامی همراه">
            {["اصالت کالا", "گارانتی رسمی", "سابقه بیست ساله"].map((item) => (
              <span key={item} role="listitem" className="flex items-center gap-1.5 text-xs text-foreground/65">
                <BadgeCheck className="size-4 text-gold" /> {item}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="relative mx-auto hidden h-[420px] w-full max-w-md md:block" aria-hidden="true">
            <div
              className="absolute left-1/2 top-1/2 aspect-[9/19] w-[190px] -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] rounded-[34px] border border-gold/35 shadow-deep"
              style={{ background: "linear-gradient(160deg, #7D0417, #3A010A 60%, #120407)" }}
            >
              <div className="absolute inset-[14%] rounded-3xl bg-[radial-gradient(circle_at_30%_20%,rgba(201,162,39,0.22),transparent_60%)]" />
            </div>
            <div className="glass absolute start-[2%] top-[6%] min-w-[190px] animate-bob rounded-2xl p-4">
              <b className="block text-2xl font-black text-gold-lite">۲۰ سال</b>
              <span className="text-xs text-muted-foreground/70">سابقه در بازار مشهد</span>
            </div>
            <div className="glass absolute end-0 top-[42%] min-w-[190px] animate-bob rounded-2xl p-4 [animation-delay:0.8s]">
              <b className="block text-2xl font-black text-gold-lite">TCH</b>
              <span className="text-xs text-muted-foreground/70">نمایندگی رسمی برند</span>
            </div>
            <div className="glass absolute bottom-[4%] start-[16%] min-w-[190px] animate-bob rounded-2xl p-4 [animation-delay:0.4s]">
              <b className="block text-2xl font-black text-gold-lite">Redmi</b>
              <span className="text-xs text-muted-foreground/70">همکار معتبر در مشهد</span>
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
      <WhyHami />
      <BrandShowcase />
      <CampaignBanner />
      <NewArrivals />
      <B2bSection />
      <AccessoryUniverse />
      <OnlineServices />
      <StoreExperience />
      <CustomerTrust />
      <FinalConversion />
      <MobileDock />
    </>
  );
}

