/**
 * Design: «آرشیو بورگوندی» — لوکس‌گرایی ویرایشی با زمینهٔ کاغذی، بورگوندی عمیق،
 * خط‌های شامپاینی و چیدمان نامتقارن برای انتقال اقتدار آرام و شفافیت حرفه‌ای.
 */
import { PointerEvent as ReactPointerEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  ChevronDown,
  Check,
  Globe2,
  Headphones,
  Heart,
  House,
  Menu,
  PackageCheck,
  Phone,
  ShieldCheck,
  Store,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { heroMedia } from "@/config/heroMedia";
import { categoryMosaic } from "@/lib/categoryMosaic";
import { brandStories, brandWall, getBrandStory, type BrandStoryKey } from "@/lib/brandShowcase";
import { b2bCtas, b2bFeatures, b2bSupplyAreas, b2bWorkflow } from "@/lib/b2bExperience";
import { getB2bPointerOffsets } from "@/lib/b2bMotion";
import { accessoryCategories, getAccessoryCategory, type AccessoryCategoryKey } from "@/lib/accessoriesUniverse";
import { getCampaignPointerOffsets, getCampaignScrollState } from "@/lib/campaignMotion";
import { featuredOnlineService, onlineServiceFaqs, onlineServices, onlineServicesCta } from "@/lib/onlineServices";
import { getOnlineServicesPointerOffsets } from "@/lib/onlineServicesMotion";
import { whyHamiCtas, whyHamiProofs, whyHamiQuote, whyHamiTrustStrip } from "@/lib/whyHamiProofs";
import { storeExperienceCtas, storeExperienceImageSlots, storeExperiencePoints, storeExperienceStatement } from "@/lib/storeExperience";
import { communityContentState, customerJourney, customerTrustCtas, customerTrustSignals } from "@/lib/customerTrust";
import { finalConversionCopy, finalConversionCtas } from "@/lib/finalConversion";
import { footerContact, footerGroups, footerMeta } from "@/lib/premiumFooter";
import { getHeroGlowOffset } from "@/lib/heroGlow";
import { getHeroScrollProgress, interpolateHeroScrollProgress } from "@/lib/heroMotion";
import { getHeroParallaxOffsets } from "@/lib/heroParallax";
import { toFeaturedProductCard } from "@/lib/featuredProducts";
import { toNewArrivalCard } from "@/lib/newArrivals";
import { trustFeatures, type TrustFeatureKey } from "@/lib/trustFeatures";
import { mobileQuickRoutes } from "@/lib/mobileExperience";
import { getMobileHeroObjectPosition, shouldRunScrollChoreography } from "@/lib/mobileRuntime";
import { trpc } from "@/lib/trpc";

const featuredTabs = [
  { key: "best-selling", label: "پرفروش‌ها", badge: "BEST SELLER" },
  { key: "newest", label: "جدیدترین‌ها", badge: "NEW" },
  { key: "hami-pick", label: "پیشنهاد حامی همراه", badge: "HAMI PICK" },
] as const;

const campaignMedia = {
  video: "/manus-storage/hami-campaign-product-loop_fdea815b.mp4",
  poster: "/manus-storage/hami-campaign-product-fallback_bcae374d.jpg",
};

const b2bFeatureIcons = [CircleDollarSign, PackageCheck, Boxes, Check] as const;
const [finalTitleLead = finalConversionCopy.title, finalTitleTail] = finalConversionCopy.title.split("، ");
const mobileHeroObjectPosition = getMobileHeroObjectPosition();

const formatProductPrice = (amount: string, currencyCode: string) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return "قیمت فروشگاه";
  if (currencyCode === "IRR") return `${Math.round(numericAmount / 10).toLocaleString("fa-IR")} تومان`;
  return new Intl.NumberFormat("fa-IR", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(numericAmount);
};

function BrandMark({ size = "default" }: { size?: "default" | "large" }) {
  return (
    <span className={`brand-mark ${size === "large" ? "brand-mark-large" : ""}`} aria-hidden="true">
      <i className="mark-orbit" />
      <img src="/manus-storage/hami-mark_6bd83e68.png" alt="" />
    </span>
  );
}

function SectionLabel({ index, children }: { index: string; children: string }) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <i />
      <p>{children}</p>
    </div>
  );
}

function TrustGlyph({ name }: { name: TrustFeatureKey }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.45, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "store") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...shared} d="M5 14.5h22v12H5zM4 9l2-4h20l2 4v4.5H4zM11 26.5v-7h10v7" /><path {...shared} d="M4 9c0 2 1.7 3.5 3.7 3.5S11.5 11 11.5 9c0 2 1.6 3.5 4.5 3.5S20.5 11 20.5 9c0 2 1.8 3.5 3.8 3.5S28 11 28 9" /></svg>;
  if (name === "wholesale") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...shared} d="m6 10 10-5 10 5-10 5zM6 10v9l10 5 10-5v-9M16 15v9M7 23l5-2.5M25 23l-5-2.5" /></svg>;
  if (name === "assortment") return <svg viewBox="0 0 32 32" aria-hidden="true"><rect {...shared} x="5" y="6" width="9" height="9" rx="1.5" /><rect {...shared} x="18" y="6" width="9" height="9" rx="1.5" /><rect {...shared} x="5" y="19" width="9" height="8" rx="1.5" /><rect {...shared} x="18" y="19" width="9" height="8" rx="1.5" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...shared} d="M16 4.5 25 8v7.2c0 5.7-3.7 10-9 12.3-5.3-2.3-9-6.6-9-12.3V8z" /><path {...shared} d="m11.7 15.8 2.8 2.9 5.9-6" /></svg>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuredTab, setFeaturedTab] = useState<(typeof featuredTabs)[number]["key"]>("best-selling");
  const [featuredFavorites, setFeaturedFavorites] = useState<Set<string>>(() => new Set());
  const [activeBrandStory, setActiveBrandStory] = useState<BrandStoryKey>("apple");
  const [activeAccessoryKey, setActiveAccessoryKey] = useState<AccessoryCategoryKey>("audio");
  const [newArrivalsCanScrollNext, setNewArrivalsCanScrollNext] = useState(false);
  const [newArrivalsRef, newArrivalsApi] = useEmblaCarousel({ align: "start", direction: "rtl", loop: false, skipSnaps: false, containScroll: "trimSnaps" });
  const heroRef = useRef<HTMLElement>(null);
  const campaignRef = useRef<HTMLElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const cursorGlowFrame = useRef<number | null>(null);
  const parallaxFrame = useRef<number | null>(null);
  const parallaxTarget = useRef({ videoX: 0, videoY: 0, atmosphereX: 0, atmosphereY: 0 });
  const parallaxCurrent = useRef({ videoX: 0, videoY: 0, atmosphereX: 0, atmosphereY: 0 });
  const scrollCameraFrame = useRef<number | null>(null);
  const scrollCameraTarget = useRef(0);
  const scrollCameraCurrent = useRef(0);
  const featuredQuery = trpc.commerce.products.list.useQuery({ first: 4, curation: featuredTab }, { staleTime: 60_000 });
  const featuredProducts = featuredQuery.data?.map(toFeaturedProductCard) ?? [];
  const newArrivalsQuery = trpc.commerce.products.list.useQuery({ first: 6, curation: "newest" }, { staleTime: 60_000 });
  const newArrivalProducts = newArrivalsQuery.data?.map(toNewArrivalCard) ?? [];
  const currentFeaturedTab = featuredTabs.find((tab) => tab.key === featuredTab) ?? featuredTabs[0];
  const currentBrandStory = getBrandStory(activeBrandStory);

  useEffect(() => {
    if (!newArrivalsApi) {
      setNewArrivalsCanScrollNext(false);
      return;
    }
    const syncNewArrivalsControls = () => setNewArrivalsCanScrollNext(newArrivalsApi.canScrollNext());
    syncNewArrivalsControls();
    newArrivalsApi.on("select", syncNewArrivalsControls).on("reInit", syncNewArrivalsControls);
    return () => {
      newArrivalsApi.off("select", syncNewArrivalsControls).off("reInit", syncNewArrivalsControls);
    };
  }, [newArrivalsApi]);

	useEffect(() => {
		const hero = heroRef.current;
		const runtime = {
			viewportWidth: window.innerWidth,
			coarsePointer: window.matchMedia("(pointer: coarse), (hover: none)").matches,
			reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		};
		if (!hero) return;
		if (!shouldRunScrollChoreography(runtime)) {
			hero.style.setProperty("--hero-scroll-progress", "0");
			return;
		}

    const writeScrollProgress = (progress: number) => {
      hero.style.setProperty("--hero-scroll-progress", progress.toFixed(3));
    };
    const advanceScrollCamera = () => {
      const next = interpolateHeroScrollProgress(scrollCameraCurrent.current, scrollCameraTarget.current, 0.08);
      scrollCameraCurrent.current = next;
      writeScrollProgress(next);
      if (Math.abs(scrollCameraTarget.current - next) > 0.001) {
        scrollCameraFrame.current = window.requestAnimationFrame(advanceScrollCamera);
      } else {
        scrollCameraCurrent.current = scrollCameraTarget.current;
        writeScrollProgress(scrollCameraCurrent.current);
        scrollCameraFrame.current = null;
      }
    };
    const updateScrollTarget = () => {
      const { top, height } = hero.getBoundingClientRect();
      scrollCameraTarget.current = getHeroScrollProgress(top, height);
      if (scrollCameraFrame.current === null) {
        scrollCameraFrame.current = window.requestAnimationFrame(advanceScrollCamera);
      }
    };

    writeScrollProgress(0);
    updateScrollTarget();
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener("resize", updateScrollTarget);
    return () => {
      window.removeEventListener("scroll", updateScrollTarget);
      window.removeEventListener("resize", updateScrollTarget);
      if (scrollCameraFrame.current !== null) window.cancelAnimationFrame(scrollCameraFrame.current);
      scrollCameraFrame.current = null;
    };
  }, []);

  const closeMenu = () => setMobileOpen(false);

  const setCursorGlow = (x: number, y: number) => {
    if (cursorGlowFrame.current) window.cancelAnimationFrame(cursorGlowFrame.current);
    cursorGlowFrame.current = window.requestAnimationFrame(() => {
      const glow = cursorGlowRef.current;
      if (!glow) return;
      glow.style.setProperty("--hero-glow-x", `${x}px`);
      glow.style.setProperty("--hero-glow-y", `${y}px`);
    });
  };

  const updateHeroParallax = () => {
    const target = parallaxTarget.current;
    const current = parallaxCurrent.current;
    current.videoX += (target.videoX - current.videoX) * 0.035;
    current.videoY += (target.videoY - current.videoY) * 0.035;
    current.atmosphereX += (target.atmosphereX - current.atmosphereX) * 0.035;
    current.atmosphereY += (target.atmosphereY - current.atmosphereY) * 0.035;

    heroVideoRef.current?.style.setProperty("--hero-video-shift-x", `${current.videoX.toFixed(2)}px`);
    heroVideoRef.current?.style.setProperty("--hero-video-shift-y", `${current.videoY.toFixed(2)}px`);
    atmosphereRef.current?.style.setProperty("--hero-atmosphere-x", `${current.atmosphereX.toFixed(2)}px`);
    atmosphereRef.current?.style.setProperty("--hero-atmosphere-y", `${current.atmosphereY.toFixed(2)}px`);

    const stillMoving =
      Math.abs(target.videoX - current.videoX) > 0.02 ||
      Math.abs(target.videoY - current.videoY) > 0.02 ||
      Math.abs(target.atmosphereX - current.atmosphereX) > 0.02 ||
      Math.abs(target.atmosphereY - current.atmosphereY) > 0.02;
    if (stillMoving) {
      parallaxFrame.current = window.requestAnimationFrame(updateHeroParallax);
    } else {
      parallaxFrame.current = null;
    }
  };

  const setHeroParallax = (next: typeof parallaxTarget.current) => {
    parallaxTarget.current = next;
    if (parallaxFrame.current === null) parallaxFrame.current = window.requestAnimationFrame(updateHeroParallax);
  };

  useEffect(() => () => {
    if (cursorGlowFrame.current) window.cancelAnimationFrame(cursorGlowFrame.current);
    if (parallaxFrame.current) window.cancelAnimationFrame(parallaxFrame.current);
  }, []);

  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || window.innerWidth <= 780 || !window.matchMedia("(pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = getHeroGlowOffset(event.clientX, event.clientY, bounds);
    setCursorGlow(offset.x, offset.y);
    setHeroParallax(getHeroParallaxOffsets(event.clientX, event.clientY, bounds));
  };

  const resetHeroCursorGlow = () => {
    setCursorGlow(0, 0);
    setHeroParallax({ videoX: 0, videoY: 0, atmosphereX: 0, atmosphereY: 0 });
  };

  const handleCampaignPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || window.innerWidth <= 780 || !window.matchMedia("(pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsets = getCampaignPointerOffsets(event.clientX, event.clientY, bounds);
    event.currentTarget.style.setProperty("--campaign-product-x", `${offsets.productX.toFixed(2)}px`);
    event.currentTarget.style.setProperty("--campaign-product-y", `${offsets.productY.toFixed(2)}px`);
    event.currentTarget.style.setProperty("--campaign-glow-x", `${offsets.glowX.toFixed(2)}px`);
    event.currentTarget.style.setProperty("--campaign-glow-y", `${offsets.glowY.toFixed(2)}px`);
  };

  const resetCampaignPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--campaign-product-x", "0px");
    event.currentTarget.style.setProperty("--campaign-product-y", "0px");
    event.currentTarget.style.setProperty("--campaign-glow-x", "0px");
    event.currentTarget.style.setProperty("--campaign-glow-y", "0px");
  };

  const handleB2bPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || window.innerWidth <= 780 || !window.matchMedia("(pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsets = getB2bPointerOffsets(event.clientX, event.clientY, bounds);
    event.currentTarget.style.setProperty("--b2b-product-x", `${offsets.productX}px`);
    event.currentTarget.style.setProperty("--b2b-product-y", `${offsets.productY}px`);
    event.currentTarget.style.setProperty("--b2b-glow-x", `${offsets.glowX}px`);
    event.currentTarget.style.setProperty("--b2b-glow-y", `${offsets.glowY}px`);
    event.currentTarget.style.setProperty("--b2b-data-opacity", `${offsets.dataOpacity}`);
  };

  const resetB2bPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--b2b-product-x", "0px");
    event.currentTarget.style.setProperty("--b2b-product-y", "0px");
    event.currentTarget.style.setProperty("--b2b-glow-x", "0px");
    event.currentTarget.style.setProperty("--b2b-glow-y", "0px");
    event.currentTarget.style.setProperty("--b2b-data-opacity", ".42");
  };

  const handleAccessoriesPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || window.innerWidth <= 780 || !window.matchMedia("(pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
    event.currentTarget.style.setProperty("--accessory-x", `${(x * 7).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--accessory-y", `${(y * 5).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--accessory-light-x", `${((x + 1) * 50).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--accessory-light-y", `${((y + 1) * 50).toFixed(1)}%`);
  };

  const resetAccessoriesPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--accessory-x", "0px");
    event.currentTarget.style.setProperty("--accessory-y", "0px");
    event.currentTarget.style.setProperty("--accessory-light-x", "50%");
    event.currentTarget.style.setProperty("--accessory-light-y", "50%");
  };

  const handleServicesPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || window.innerWidth <= 780 || !window.matchMedia("(pointer: fine)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsets = getOnlineServicesPointerOffsets(event.clientX, event.clientY, bounds);
    event.currentTarget.style.setProperty("--services-phone-x", `${offsets.phoneX}px`);
    event.currentTarget.style.setProperty("--services-phone-y", `${offsets.phoneY}px`);
    event.currentTarget.style.setProperty("--services-glow-x", `${offsets.glowX}%`);
    event.currentTarget.style.setProperty("--services-glow-y", `${offsets.glowY}%`);
  };

  const resetServicesPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--services-phone-x", "0px");
    event.currentTarget.style.setProperty("--services-phone-y", "0px");
    event.currentTarget.style.setProperty("--services-glow-x", "50%");
    event.currentTarget.style.setProperty("--services-glow-y", "50%");
  };

	useEffect(() => {
		const campaign = campaignRef.current;
		const runtime = {
			viewportWidth: window.innerWidth,
			coarsePointer: window.matchMedia("(pointer: coarse), (hover: none)").matches,
			reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		};
		if (!campaign || !shouldRunScrollChoreography(runtime)) return;
    let frame: number | null = null;
    const updateCampaignScroll = () => {
      const rect = campaign.getBoundingClientRect();
      const state = getCampaignScrollState(rect.top, rect.height, window.innerHeight);
      campaign.style.setProperty("--campaign-scroll-progress", state.progress.toFixed(3));
      campaign.style.setProperty("--campaign-scroll-y", `${state.productY.toFixed(2)}px`);
      frame = null;
    };
    const requestCampaignScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateCampaignScroll);
    };
    updateCampaignScroll();
    window.addEventListener("scroll", requestCampaignScroll, { passive: true });
    window.addEventListener("resize", requestCampaignScroll);
    return () => {
      window.removeEventListener("scroll", requestCampaignScroll);
      window.removeEventListener("resize", requestCampaignScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  const activeAccessory = getAccessoryCategory(activeAccessoryKey);

  return (
    <div className="site-shell hami-home">
      <main id="top">
        <section ref={heroRef} className="hero-section" aria-labelledby="hero-title" onPointerMove={handleHeroPointerMove} onPointerLeave={resetHeroCursorGlow}>
          <div className="hero-video-layer" aria-hidden="true">
            <video ref={heroVideoRef} className="hero-video" style={{ "--mobile-hero-object-position": mobileHeroObjectPosition } as CSSProperties} autoPlay muted loop playsInline preload="metadata" poster={heroMedia.poster}>
              <source src={heroMedia.webm} type="video/webm" />
              <source src={heroMedia.mp4} type="video/mp4" />
            </video>
            <div ref={atmosphereRef} className="hero-atmosphere" />
          </div>
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-cursor-glow" ref={cursorGlowRef} aria-hidden="true" />
          <div className="hero-film-grain" aria-hidden="true" />
          <header className="hero-floating-header" aria-label="ناوبری اصلی">
            <a className="hero-brand" href="#top" aria-label="حامی همراه — صفحهٔ اصلی">
              <img src="/manus-storage/hami-logo-lockup-official_dc321fc1.png" alt="لوگوی حامی همراه" />
              <span>H / 2014</span>
            </a>
            <nav className="hero-nav">
              <a href="/shop">فروشگاه</a>
              <a href="/partners">همکاری</a>
              <a href="#contact">تماس</a>
            </nav>
            <a className="hero-header-cta" href="/partners">شروع همکاری <ArrowUpLeft size={15} /></a>
          </header>
          <div className="hero-content">
            <div className="hero-copy">
              <p className="hero-eyebrow"><span>۰۱</span> همراه مطمئن شما در دنیای موبایل</p>
              <h1 id="hero-title">اطمینان،<br /><em>در هر انتخاب.</em></h1>
              <p>تجربه‌ای مطمئن برای خرید و تأمین تلفن همراه؛ از انتخاب تا تحویل.</p>
              <div className="hero-buttons" aria-label="مسیرهای اصلی">
                <a className="hero-primary-cta" href="/shop">مشاهده محصولات <ArrowLeft size={17} /></a>
                <a className="hero-secondary-cta" href="/partners">شروع همکاری <ArrowUpLeft size={17} /></a>
              </div>
              <div className="hero-footnotes" role="list" aria-label="نشانه‌های اعتماد حامی همراه">
                <span role="listitem"><BadgeCheck size={17} /> اصالت کالا</span>
                <span role="listitem"><BadgeCheck size={17} /> گارانتی رسمی</span>
                <span role="listitem"><BadgeCheck size={17} /> سابقه بیست ساله</span>
              </div>
              <div className="hero-proof" aria-label="مسیرهای فروش حامی همراه">
                <div className="hero-proof__inner">
                  <span>فروش مستقیم و همکاری عمده</span>
                  <i aria-hidden="true" />
                  <span>انتخاب و تأمین، در یک مسیر روشن</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="trust-bar" aria-labelledby="trust-bar-title">
          <div className="trust-bar__inner">
            <h2 id="trust-bar-title" className="sr-only">چهار دلیل برای اعتماد به حامی همراه</h2>
            <div className="trust-bar__ledger" aria-label="رکورد تصمیم‌گیری حامی همراه">
              <span>HAMI / DECISION ARCHIVE</span><i aria-hidden="true" /><p>فروش حضوری، پخش عمده و اکوسیستم موبایل</p>
            </div>
            <ul className="trust-bar__list" role="list">
              {trustFeatures.map((feature, index) => (
                <li className={`trust-feature trust-feature--${index + 1}`} data-reveal key={feature.key}>
                  <span className="trust-feature__icon"><TrustGlyph name={feature.key} /></span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <nav className="mobile-quick-routes" aria-label="مسیرهای سریع موبایل">
          {mobileQuickRoutes.map((route, index) => (
            <a href={route.href} key={route.key}><span>{String(index + 1).padStart(2, "0")}</span><b>{route.label}</b><ArrowLeft size={14} /></a>
          ))}
        </nav>

        <section id="categories" className="category-hub" aria-labelledby="category-hub-title">
          <div className="category-hub-heading">
            <div>
              <SectionLabel index="۰۰۲">اکوسیستم محصولات و خدمات</SectionLabel>
              <h2 id="category-hub-title">دسته‌بندی <em>محصولات.</em></h2>
              <p>هر چیزی که برای تجربه بهتر موبایل نیاز داری</p>
            </div>
            <a className="category-all-link" href="/shop">مشاهده همه <ArrowLeft size={17} /></a>
          </div>
          <div className="category-grid" role="list">
            {categoryMosaic.map(({ key, number, title, eyebrow, detail, href, image, layout }) => (
              <a className={`category-card category-card--${layout}`} href={href} key={key} role="listitem" data-reveal>
                {image ? <img src={image} alt="" loading="lazy" /> : <div className="category-service-art"><Globe2 size={54} strokeWidth={1.2} /><i /><i /><i /></div>}
                <div className="category-card-sheen" />
                <div className="category-card-depth" aria-hidden="true" />
                <div className="category-card-content">
                  <span className="category-number">{number}</span>
                  <small>{eyebrow}</small>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                  <b>مشاهده <ArrowLeft size={15} /></b>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="featured" className="featured-products" aria-labelledby="featured-products-title">
          <div className="featured-products__heading" data-reveal>
            <div>
              <SectionLabel index="۰۰۳">ویترین انتخاب‌های curated</SectionLabel>
              <h2 id="featured-products-title">محصولات <em>منتخب.</em></h2>
              <p>انتخابی از محبوب‌ترین و تازه‌ترین محصولات حامی همراه</p>
            </div>
            <a className="featured-products__all" href="/shop">مشاهده همه محصولات <ArrowLeft size={16} /></a>
          </div>

          <div className="featured-tabs" role="tablist" aria-label="فیلتر محصولات منتخب" data-reveal>
            {featuredTabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                role="tab"
                aria-selected={featuredTab === tab.key}
                className={featuredTab === tab.key ? "active" : ""}
                onClick={() => setFeaturedTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="featured-product-grid" aria-busy={featuredQuery.isLoading}>
            {featuredQuery.isLoading && Array.from({ length: 4 }).map((_, index) => (
              <div className="featured-product-skeleton" key={index} aria-hidden="true"><i /><b /><b /><small /></div>
            ))}

            {!featuredQuery.isLoading && featuredQuery.isError && (
              <div className="featured-products-state" role="status">
                <b>دریافت محصولات موقتاً ممکن نیست.</b>
                <p>می‌توانید کاتالوگ کامل را ببینید یا دوباره تلاش کنید.</p>
                <div><button type="button" onClick={() => featuredQuery.refetch()}>تلاش دوباره</button><a href="/shop">مشاهده همه محصولات <ArrowLeft size={15} /></a></div>
              </div>
            )}

            {!featuredQuery.isLoading && !featuredQuery.isError && featuredProducts.length === 0 && (
              <div className="featured-products-state" role="status">
                <b>محصولی برای نمایش در این انتخاب وجود ندارد.</b>
                <p>محصولات جدید به‌زودی به این بخش اضافه می‌شوند.</p>
                <a href="/shop">مشاهده همه محصولات <ArrowLeft size={15} /></a>
              </div>
            )}

            {!featuredQuery.isLoading && !featuredQuery.isError && featuredProducts.map((product, index) => {
              const favorite = featuredFavorites.has(product.handle);
              return (
                <article className="featured-product-card" data-reveal key={product.handle} style={{ "--reveal-delay": `${index * 60}ms` } as React.CSSProperties}>
                  <div className="featured-product-card__visual">
                    <span className="featured-product-card__badge">{currentFeaturedTab.badge}</span>
                    <button
                      className={favorite ? "featured-product-card__favorite active" : "featured-product-card__favorite"}
                      type="button"
                      aria-label={favorite ? `حذف ${product.title} از علاقه‌مندی‌ها` : `افزودن ${product.title} به علاقه‌مندی‌ها`}
                      aria-pressed={favorite}
                      onClick={() => setFeaturedFavorites((current) => {
                        const next = new Set(current);
                        if (next.has(product.handle)) next.delete(product.handle); else next.add(product.handle);
                        return next;
                      })}
                    ><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button>
                    <a href={`/shop/${product.handle}`} className="featured-product-card__image-link">
                      {product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" /> : <span className="featured-product-card__no-image">HAMI / PRODUCT</span>}
                    </a>
                    <div className="featured-product-card__quick-actions">
                      <a href={`/shop/${product.handle}`}>مشاهده سریع</a>
                      <a href={`/shop/${product.handle}?compare=1`}>مقایسه</a>
                    </div>
                  </div>
                  <div className="featured-product-card__body">
                    <span className="featured-product-card__brand">{product.brand}</span>
                    <h3><a href={`/shop/${product.handle}`}>{product.title}</a></h3>
                    <p>{product.variantLabel || product.category}</p>
                    <div className="featured-product-card__pricing">
                      {product.compareAtPrice && <del>{formatProductPrice(product.compareAtPrice.amount, product.compareAtPrice.currencyCode)}</del>}
                      <strong>{formatProductPrice(product.price.amount, product.price.currencyCode)}</strong>
                    </div>
                    <div className="featured-product-card__meta">
                      <span className={product.available ? "is-available" : "is-unavailable"}><i />{product.stockLabel}</span>
                      {product.colors.length > 0 && <small>تنوع رنگ</small>}
                    </div>
                    <a className="featured-product-card__cta" href={`/shop/${product.handle}`}>مشاهده محصول <ArrowLeft size={15} /></a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="brands" className="brand-showcase" aria-labelledby="brand-showcase-title">
          <div className="brand-showcase__glow" aria-hidden="true" />
          <div className="brand-showcase__header" data-reveal>
            <SectionLabel index="۰۰۴">OUR BRANDS</SectionLabel>
            <h2 id="brand-showcase-title">برندهایی که می‌شناسید.<br /><em>انتخاب‌هایی که به آن‌ها اعتماد دارید.</em></h2>
            <p>مجموعه‌ای از برندهای معتبر موبایل، تکنولوژی و لوازم جانبی، در یک تجربهٔ خرید واحد.</p>
          </div>

          <div className="brand-showcase__wall" role="list" aria-label="برندهای منتخب حامی همراه" data-reveal>
            {brandWall.map((brand) => {
              const isActive = brand.story === activeBrandStory;
              const label = brand.story ? `نمایش روایت ${brand.name}` : `${brand.name} — روایت برند به‌زودی`;
              return (
                <button
                  type="button"
                  key={brand.name}
                  className={isActive ? "brand-showcase__wordmark active" : "brand-showcase__wordmark"}
                  onClick={() => brand.story && setActiveBrandStory(brand.story)}
                  onFocus={() => brand.story && setActiveBrandStory(brand.story)}
                  aria-pressed={isActive}
                  aria-label={label}
                  title={brand.story ? undefined : "روایت این برند به‌زودی افزوده می‌شود"}
                  disabled={!brand.story}
                  role="listitem"
                >{brand.name}</button>
              );
            })}
          </div>

          <article className="brand-story" data-reveal aria-live="polite">
            <div className="brand-story__visual">
              <img src={currentBrandStory.image} alt={`فضاسازی و تصویر محصول برای ${currentBrandStory.name}`} loading="lazy" />
              <span>01 / BRAND STORY</span>
            </div>
            <div className="brand-story__copy">
              <p className="brand-story__name">{currentBrandStory.name}</p>
              <h3>{currentBrandStory.title}</h3>
              <p>{currentBrandStory.text}</p>
              <a href={currentBrandStory.href}>مشاهده محصولات {currentBrandStory.name} <ArrowLeft size={16} /></a>
            </div>
          </article>

          <div className="brand-showcase__statement" data-reveal>
            <p>یک مقصد.</p><strong>انتخاب‌های بی‌نهایت.</strong><span>حامی همراه</span>
          </div>
          <div className="brand-showcase__exit" aria-hidden="true" />
        </section>

        <section
          ref={campaignRef}
          id="campaign"
          className="campaign-banner"
          aria-labelledby="campaign-title"
          onPointerMove={handleCampaignPointerMove}
          onPointerLeave={resetCampaignPointer}
        >
          <div className="campaign-banner__media" aria-hidden="true">
            <video autoPlay muted loop playsInline preload="metadata" poster={campaignMedia.poster}>
              <source src={campaignMedia.video} type="video/mp4" />
            </video>
            <div className="campaign-banner__falloff" />
            <div className="campaign-banner__glow" />
            <div className="campaign-banner__grain" />
          </div>
          <div className="campaign-banner__content" data-reveal>
            <p className="campaign-banner__eyebrow"><span>۰۵</span> THE NEW STANDARD</p>
            <h2 id="campaign-title">انتخابی که<br /><em>بهترین می‌ماند.</em></h2>
            <p>موبایل، لوازم جانبی و خدمات دیجیتال؛ در یک تجربهٔ متفاوت و دقیق.</p>
            <a href="/shop" className="campaign-banner__cta">مشاهده محصولات <ArrowLeft size={17} /></a>
          </div>
          <div className="campaign-banner__record" aria-hidden="true"><span>HAMI / CAMPAIGN 01</span><i /> <span>08 SEC LOOP</span></div>
        </section>

        <section id="new-arrivals" className="new-arrivals" aria-labelledby="new-arrivals-title">
          <div className="new-arrivals__heading" data-reveal>
            <div>
              <SectionLabel index="۰۰۶">NEW ARRIVALS</SectionLabel>
              <h2 id="new-arrivals-title">تازه <em>رسیده‌اند.</em></h2>
              <p>جدیدترین محصولاتی که به مجموعه حامی همراه اضافه شده‌اند.</p>
            </div>
            <div className="new-arrivals__heading-actions">
              <a href="/shop">مشاهده همه <ArrowLeft size={16} /></a>
              <button type="button" className="new-arrivals__next" onClick={() => newArrivalsApi?.scrollNext()} aria-label="نمایش محصولات جدید بعدی" disabled={!newArrivalsApi || !newArrivalsCanScrollNext}>
                <ArrowLeft size={19} />
              </button>
            </div>
          </div>

          <div className="new-arrivals__rail" ref={newArrivalsRef} aria-busy={newArrivalsQuery.isLoading} aria-label="ریل محصولات تازه‌وارد" aria-roledescription="carousel" data-reveal>
            <div className="new-arrivals__track">
              {newArrivalsQuery.isLoading && Array.from({ length: 4 }).map((_, index) => (
                <div className="new-arrivals__skeleton" key={index} aria-hidden="true"><i /><b /><b /><small /></div>
              ))}

              {!newArrivalsQuery.isLoading && newArrivalsQuery.isError && (
                <div className="new-arrivals__state" role="status">
                  <b>دریافت تازه‌واردها موقتاً ممکن نیست.</b>
                  <p>می‌توانید کاتالوگ کامل را ببینید یا دوباره تلاش کنید.</p>
                  <div><button type="button" onClick={() => newArrivalsQuery.refetch()}>تلاش دوباره</button><a href="/shop">مشاهده همه محصولات <ArrowLeft size={15} /></a></div>
                </div>
              )}

              {!newArrivalsQuery.isLoading && !newArrivalsQuery.isError && newArrivalProducts.length === 0 && (
                <div className="new-arrivals__state" role="status">
                  <b>چیز تازه‌ای برای نمایش نداریم.</b>
                  <p>اما موجودی فروشگاه همچنان در حال به‌روزرسانی است.</p>
                  <a href="/shop">مشاهده همه محصولات <ArrowLeft size={15} /></a>
                </div>
              )}

              {!newArrivalsQuery.isLoading && !newArrivalsQuery.isError && newArrivalProducts.map((product) => {
                const favorite = featuredFavorites.has(product.handle);
                return (
                  <article className="new-arrivals__card" key={product.handle}>
                    <div className="new-arrivals__visual">
                      <span className="new-arrivals__badge">NEW</span>
                      <button
                        className={favorite ? "new-arrivals__favorite active" : "new-arrivals__favorite"}
                        type="button"
                        aria-label={favorite ? `حذف ${product.title} از علاقه‌مندی‌ها` : `افزودن ${product.title} به علاقه‌مندی‌ها`}
                        aria-pressed={favorite}
                        onClick={() => setFeaturedFavorites((current) => {
                          const next = new Set(current);
                          if (next.has(product.handle)) next.delete(product.handle); else next.add(product.handle);
                          return next;
                        })}
                      ><Heart size={16} fill={favorite ? "currentColor" : "none"} /></button>
                      <a href={`/shop/${product.handle}`} className="new-arrivals__image-link">
                        {product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" /> : <span>HAMI / NEW</span>}
                      </a>
                    </div>
                    <div className="new-arrivals__body">
                      <span>{product.brand}</span>
                      <h3><a href={`/shop/${product.handle}`}>{product.title}</a></h3>
                      <strong>{formatProductPrice(product.price.amount, product.price.currencyCode)}</strong>
                      <small className={product.available ? "is-available" : "is-unavailable"}><i />{product.availabilityLabel}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <a className="new-arrivals__all" href="/shop">مشاهده همه محصولات جدید <ArrowLeft size={16} /></a>
        </section>

        <section id="b2b" className="b2b-experience" aria-labelledby="b2b-title" onPointerMove={handleB2bPointerMove} onPointerLeave={resetB2bPointer}>
          <div className="b2b-experience__atmosphere" aria-hidden="true" />
          <div className="b2b-experience__inner">
            <div className="b2b-experience__copy" data-reveal>
              <SectionLabel index="۰۰۷">FOR BUSINESS</SectionLabel>
              <h2 id="b2b-title">فروش حرفه‌ای،<br /><em>برای حرفه‌ای‌ها.</em></h2>
              <p>مسیر همکاری برای دریافت دسترسی قیمت، اطلاع از موجودی و سفارش عمده.</p>
              <ul className="b2b-experience__features" role="list" aria-label="مزیت‌های همکاری با حامی همراه">
                {b2bFeatures.map((feature, index) => {
                  const Icon = b2bFeatureIcons[index];
                  return <li key={feature.title}><span aria-hidden="true"><Icon size={16} strokeWidth={1.45} /></span><div><b>{feature.title}</b><small>{feature.description}</small></div></li>;
                })}
              </ul>
              <div className="b2b-experience__actions" aria-label="مسیرهای همکاری">
                {b2bCtas.map((cta) => <a key={cta.href} className={`b2b-experience__cta b2b-experience__cta--${cta.kind}`} href={cta.href}>{cta.label} <ArrowLeft size={16} /></a>)}
              </div>
            </div>

            <div className="b2b-experience__visual" data-reveal="scale" aria-label="فضای دیجیتال تأمین حامی همراه">
              <div className="b2b-experience__visual-glow" aria-hidden="true" />
              <div className="b2b-experience__visual-grid" aria-hidden="true" />
              <img src="/manus-storage/hami-b2b-digital-supply-room_3e627a73.jpg" alt="فضای بصری انتزاعی برای مسیر تأمین و همکاری حامی همراه" loading="lazy" />
              <div className="b2b-experience__data" aria-hidden="true"><span>MULTI-BRAND</span><span>WHOLESALE ROUTE</span><span>PARTNER FLOW</span></div>
              <span className="b2b-experience__visual-label" aria-hidden="true">HAMI / SUPPLY ROOM</span>
              <i className="b2b-experience__sweep" aria-hidden="true" />
            </div>
          </div>

          <div className="b2b-experience__workflow" data-reveal>
            <ol aria-label="فرآیند شروع همکاری">
              {b2bWorkflow.map((step) => <li key={step.index}><span>{step.index}</span><div><b>{step.title}</b><p>{step.description}</p></div></li>)}
            </ol>
          </div>
          <div className="b2b-experience__supply-areas" aria-label="حوزه‌های تأمین"><span>WHOLESALE</span>{b2bSupplyAreas.map((area) => <b key={area}>{area}</b>)}</div>
        </section>

        <section id="accessories" className="accessories-universe" aria-labelledby="accessories-title" data-active={activeAccessory.key} onPointerMove={handleAccessoriesPointerMove} onPointerLeave={resetAccessoriesPointer}>
          <div className="accessories-universe__texture" aria-hidden="true" />
          <header className="accessories-universe__header" data-reveal>
            <SectionLabel index="۰۰۸">ACCESSORIES</SectionLabel>
            <div>
              <h2 id="accessories-title">دنیای <em>لوازم جانبی.</em></h2>
              <p>Everything around your device.</p>
            </div>
          </header>

          <div className="accessories-universe__scene" data-reveal="scale" aria-label="ترکیب هنری لوازم جانبی موبایل">
            <div className="accessories-universe__light" aria-hidden="true" />
            <div className="accessories-universe__focus" aria-hidden="true" />
            <img src="/manus-storage/hami-accessories-universe-main_e718a969.jpg" alt="ترکیب هنری هدفون بی‌سیم، پاوربانک، آداپتور، ساعت هوشمند، کابل و اسپیکر برای نمایش تنوع لوازم جانبی" loading="lazy" />
            <div className="accessories-universe__scene-meta" aria-hidden="true"><span>CURATED / {activeAccessory.label}</span><i /><b>{activeAccessory.detail}</b></div>
            <div className="accessories-universe__scene-index" aria-hidden="true"><span>HAMI / ACCESSORY UNIVERSE</span><b>{activeAccessory.index}</b></div>
          </div>

          <div className="accessories-universe__navigation" data-reveal>
            <p>یک جهان را انتخاب کنید.</p>
            <ul role="list" aria-label="دسته‌بندی‌های لوازم جانبی">
              {accessoryCategories.map((category) => {
                const isActive = category.key === activeAccessoryKey;
                return <li key={category.key} className={isActive ? "is-active" : ""}>
                  <button type="button" onClick={() => setActiveAccessoryKey(category.key)} onMouseEnter={() => setActiveAccessoryKey(category.key)} aria-pressed={isActive} aria-label={`نمایش تمرکز بصری دسته ${category.title}`}>
                    <span>{category.index}</span><b>{category.label}</b><small>{category.detail}</small>
                  </button>
                  <a href={category.href} aria-label={`مشاهدهٔ دسته ${category.title}`}><ArrowLeft size={16} /></a>
                </li>;
              })}
            </ul>
          </div>

          <div className="accessories-universe__footer" data-reveal>
            <p>برای کامل‌کردن تجربهٔ هر دستگاه، انتخابی دقیق‌تر داشته باشید.</p>
            <a href="/shop">مشاهده همه لوازم جانبی <ArrowLeft size={17} /></a>
          </div>
          <div className="accessories-universe__transition" aria-hidden="true" />
        </section>

        <section id="online-services" className="online-services" aria-labelledby="online-services-title" onPointerMove={handleServicesPointerMove} onPointerLeave={resetServicesPointer}>
          <div className="online-services__orb" aria-hidden="true" />
          <div className="online-services__grid" aria-hidden="true" />
          <div className="online-services__inner">
            <header className="online-services__heading" data-reveal>
              <SectionLabel index="۰۰۹">ONLINE SERVICES</SectionLabel>
              <h2 id="online-services-title" aria-label="بیشتر از یک فروشگاه"><span>بیشتر</span><span>از</span><span>یک</span><em>فروشگاه.</em></h2>
              <p>خدمات دیجیتال حامی همراه، برای نیازهایی که در جعبه گوشی جا نمی‌شوند.</p>
              <a className="online-services__catalogue-link" href={onlineServicesCta.href}>{onlineServicesCta.label} <ArrowLeft size={16} /></a>
            </header>

            <div className="online-services__visual" data-reveal="scale" aria-label="نمایش مفهومی خدمات دیجیتال حامی همراه">
              <div className="online-services__visual-light" aria-hidden="true" />
              <img src="/manus-storage/hami-online-services-digital-object_3eed676e.jpg" alt="یک تلفن generic در فضای دیجیتال انتزاعی برای نمایش خدمات آنلاین" loading="lazy" />
              <span className="online-services__visual-index" aria-hidden="true">HAMI / DIGITAL OBJECT</span>
              <div className="online-services__visual-nodes" aria-hidden="true"><i /><i /><i /></div>
            </div>

            <article className="online-services__featured" data-reveal>
              <div className="online-services__featured-top"><span>{featuredOnlineService.index}</span><small>{featuredOnlineService.status}</small></div>
              <p>{featuredOnlineService.label}</p>
              <h3>{featuredOnlineService.title}</h3>
              <div className="online-services__featured-rule" aria-hidden="true" />
              <p className="online-services__description">{featuredOnlineService.description}</p>
              <a className="online-services__primary" href={featuredOnlineService.href}>دریافت این خدمت <ArrowLeft size={17} /></a>
              <small className="online-services__trust"><ShieldCheck size={14} />{featuredOnlineService.trustCopy}</small>
            </article>
          </div>

          <div className="online-services__list" data-reveal>
            <div className="online-services__list-heading"><span>DIGITAL SERVICES</span><p>خدمات فعال بر اساس فهرست فعلی</p></div>
            <ul role="list" aria-label="خدمات آنلاین فعال">
              {onlineServices.map((service) => <li key={service.key}><span>{service.index}</span><div><b>{service.label}</b><small>{service.description}</small></div><a href={service.href} aria-label={`دریافت خدمت ${service.title}`}><ArrowLeft size={16} /></a></li>)}
            </ul>
          </div>

          <div className="online-services__faq" data-reveal>
            <p>سؤال‌های کوتاه</p>
            <div>{onlineServiceFaqs.map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={16} /></summary><p>{faq.answer}</p></details>)}</div>
          </div>
        </section>

        <section id="why-hami" className="why-hami" aria-labelledby="why-hami-title">
          <header className="why-hami__header" data-reveal>
            <SectionLabel index="۰۱۰">WHY HAMI HAMRAH</SectionLabel>
            <div>
              <h2 id="why-hami-title">فقط یک <em>فروشگاه</em> نیستیم.</h2>
              <p>تجربه‌ای که از انتخاب محصول شروع می‌شود و به خرید مطمئن و همکاری بلندمدت می‌رسد.</p>
            </div>
          </header>

          <div className="why-hami__proof-grid" aria-label="شواهد تجربه حامی همراه">
            {whyHamiProofs.map((proof, index) => (
              <article className={`why-hami__proof why-hami__proof--${proof.key}`} key={proof.key} data-reveal style={{ "--reveal-delay": `${index * 65}ms` } as React.CSSProperties}>
                <div className="why-hami__media" aria-hidden="true">
                  {proof.media === "store-photo-pending" && <div className="why-hami__store-frame"><div className="why-hami__store-architecture"><i /><i /><i /></div><span>PHYSICAL PRESENCE</span><b>تصویر واقعی فروشگاه<br />در انتظار افزودن</b><small>HAMI / STORE FRAME</small></div>}
                  {proof.media === "product-composition" && <div className="why-hami__product-composition"><i /><i /><i /><span>CURATED<br />PRODUCTS</span></div>}
                  {proof.media === "brand-composition" && <div className="why-hami__brand-composition">{brandWall.slice(0, 5).map((brand) => <b key={brand.name}>{brand.name}</b>)}<span>MULTI / BRAND</span></div>}
                  {proof.media === "b2b-route" && <div className="why-hami__b2b-composition"><div><span>PARTNER</span><i /><b>ROUTE</b></div><small>REGISTER <em /> VERIFY <em /> ORDER</small></div>}
                </div>
                <div className="why-hami__proof-copy">
                  <span>{proof.eyebrow}</span>
                  <h3>{proof.title}</h3>
                  <p>{proof.description}</p>
                  <small>{proof.mediaNote}</small>
                  <a href={proof.href}>{proof.cta} <ArrowLeft size={15} /></a>
                </div>
              </article>
            ))}
          </div>

          <blockquote className="why-hami__quote" data-reveal><p>{whyHamiQuote}</p></blockquote>
          <div className="why-hami__signature" data-reveal="fade" aria-label="امضای خدمات حامی همراه">{whyHamiTrustStrip.map((item, index) => <span key={item}>{index > 0 && <i aria-hidden="true" />}{item}</span>)}</div>
          <footer className="why-hami__footer" data-reveal>
            <p>یک برند، برای انتخاب حضوری و آنلاین.</p>
            <div>{whyHamiCtas.map((cta) => <a key={cta.href} className={`why-hami__cta why-hami__cta--${cta.kind}`} href={cta.href}>{cta.label} <ArrowLeft size={17} /></a>)}</div>
          </footer>
        </section>

        <section id="store-experience" className="store-experience" aria-labelledby="store-experience-title">
          <header className="store-experience__header" data-reveal>
            <SectionLabel index="۰۱۱">VISIT OUR STORE</SectionLabel>
            <h2 id="store-experience-title">خرید را <em>لمس کنید.</em></h2>
            <p>از انتخاب محصول تا دریافت مشاوره، حامی همراه در کنار شماست.</p>
          </header>

          <div className="store-experience__wide-slot" data-reveal="scale" aria-label={`جایگاه عکس واقعی: ${storeExperienceImageSlots[0].label}`}>
            <div className="store-experience__showroom" aria-hidden="true"><i /><i /><i /><span /></div>
            <div className="store-experience__wide-slot-copy"><span>REAL PHOTO SLOT / WIDE STORE</span><b>{storeExperienceImageSlots[0].label}</b><small>{storeExperienceImageSlots[0].intendedUse}</small></div>
            <div className="store-experience__light-sweep" aria-hidden="true" />
          </div>

          <div className="store-experience__points" data-reveal aria-label="اجزای تجربه خرید حضوری">
            {storeExperiencePoints.map((point, index) => {
              const Icon = [Smartphone, Headphones, ShieldCheck][index];
              return <article key={point.index}><span>{point.index}</span><Icon size={19} strokeWidth={1.45} aria-hidden="true" /><h3>{point.title}</h3><p>{point.description}</p></article>;
            })}
          </div>

          <div className="store-experience__moments" data-reveal aria-label="جایگاه تصاویر تجربه حضوری">
            {storeExperienceImageSlots.slice(1).map((slot) => <div className={`store-experience__moment store-experience__moment--${slot.key}`} key={slot.key}><div aria-hidden="true"><i /><i /><span /></div><p>REAL PHOTO SLOT</p><b>{slot.label}</b><small>{slot.intendedUse}</small></div>)}
          </div>

          <div className="store-experience__visit" data-reveal>
            <div><span>HAMI / ONLINE + OFFLINE</span><h3>{storeExperienceStatement}</h3><p>برای اطلاعات حضور فروشگاهی یا گفت‌وگو با ما، از مسیرهای زیر استفاده کنید.</p></div>
            <div className="store-experience__actions">{storeExperienceCtas.map((cta) => <a key={cta.href} className={`store-experience__cta store-experience__cta--${cta.kind}`} href={cta.href}>{cta.label} <ArrowLeft size={17} /></a>)}</div>
          </div>
        </section>

        <section id="customer-trust" className="customer-trust" aria-labelledby="customer-trust-title">
          <header className="customer-trust__header" data-reveal>
            <SectionLabel index="۰۱۲">CUSTOMER TRUST</SectionLabel>
            <h2 id="customer-trust-title">اعتماد، با <em>واقعیت</em> ساخته می‌شود.</h2>
            <p>تجربه‌ها و محتوای مشتریان فقط پس از تأیید منبع و دریافت اجازه، در این فضا منتشر می‌شوند.</p>
          </header>

          <div className="customer-trust__mosaic" data-reveal aria-label="فضای شفاف اعتماد مشتری">
            <article className="customer-trust__community">
              <span>VERIFIED COMMUNITY / PENDING</span>
              <BadgeCheck size={28} strokeWidth={1.45} aria-hidden="true" />
              <h3>جای تجربه‌های واقعی مشتریان</h3>
              <p>{communityContentState.message}</p>
              <small>{communityContentState.helper}</small>
            </article>
            <article className="customer-trust__journey">
              <span>CUSTOMER JOURNEY</span>
              <h3>ارتباط بعد از خرید تمام نمی‌شود.</h3>
              <ol>{customerJourney.map((step, index) => <li key={step}><b>0{index + 1}</b><i aria-hidden="true" />{step}</li>)}</ol>
            </article>
            <article className="customer-trust__social-slot" aria-label="جایگاه محتوای اجتماعی پس از تأیید منبع">
              <div aria-hidden="true"><i /><i /><i /></div>
              <span>SOCIAL CONTENT / AWAITING VERIFIED SOURCE</span>
              <p>گالری و پیوند اجتماعی پس از تأیید حساب رسمی و دریافت محتوای مجاز فعال می‌شود.</p>
            </article>
          </div>

          <div className="customer-trust__signals" data-reveal="fade" aria-label="مسیرهای اعتماد حامی همراه">
            {customerTrustSignals.map((signal, index) => <span key={signal.label}>{index > 0 && <i aria-hidden="true" />}{signal.href.startsWith("#") || signal.href.startsWith("/") ? <a href={signal.href}>{signal.label}</a> : signal.label}</span>)}
          </div>

          <footer className="customer-trust__footer" data-reveal>
            <p>برای شروع انتخاب، مسیر فروشگاه در دسترس است.</p>
            {customerTrustCtas.map((cta) => <a key={cta.href} href={cta.href}>{cta.label} <ArrowLeft size={17} /></a>)}
          </footer>
        </section>

        <section id="final-conversion" className="final-conversion" aria-labelledby="final-conversion-title">
          <div className="final-conversion__glow" aria-hidden="true" />
          <div className="final-conversion__beam" aria-hidden="true" />
          <div className="final-conversion__objects" aria-hidden="true"><i /><i /><i /><span /></div>
          <div className="final-conversion__content" data-reveal>
            <span>{finalConversionCopy.eyebrow}</span>
            <h2 id="final-conversion-title">{finalTitleLead}،{finalTitleTail && <><br />{finalTitleTail}</>}</h2>
            <p>{finalConversionCopy.subtitle}</p>
            <div className="final-conversion__actions">
              {finalConversionCtas.filter((cta) => cta.kind === "primary").map((cta) => <a key={cta.href} className="final-conversion__primary" href={cta.href}>{cta.label} <ArrowLeft size={18} /></a>)}
              <div className="final-conversion__secondary-links">{finalConversionCtas.filter((cta) => cta.kind === "secondary").map((cta) => <a key={cta.href} href={cta.href}>{cta.label} <ArrowLeft size={14} /></a>)}</div>
            </div>
          </div>
        </section>
      </main>

      <nav className="mobile-shop-dock" aria-label="ناوبری سریع فروشگاه">
        <a className="dock-active" href="#top"><House size={17} /><span>خانه</span></a>
        <a href="/shop"><Store size={17} /><span>فروشگاه</span></a>
        <a href="/partners"><UserRound size={17} /><span>همکاری</span></a>
        <a href="#contact"><Phone size={17} /><span>تماس</span></a>
      </nav>

      <footer id="footer" className="site-footer premium-footer" aria-label="پاورقی حامی همراه">
        <div className="premium-footer__inner">
          <section className="premium-footer__signature" aria-labelledby="footer-brand-title">
            <a href="#top" className="premium-footer__brand">
              <BrandMark size="large" />
              <span>HAMI HAMRAH / SIGNATURE</span>
              <h2 id="footer-brand-title">حامی همراه</h2>
              <i aria-hidden="true" />
              <p>{footerMeta.tagline}</p>
            </a>
          </section>

          <div className="premium-footer__desktop-grid" aria-label="مسیرهای سریع حامی همراه">
            {footerGroups.map((group) => <nav key={group.label} className="premium-footer__group" aria-label={group.label}><h3>{group.label}</h3><ul>{group.links.map((link) => <li key={link.href}><a href={link.href}>{link.label}<ArrowLeft size={13} aria-hidden="true" /></a></li>)}</ul></nav>)}
          </div>

          <div className="premium-footer__mobile-accordion" aria-label="مسیرهای سریع موبایل">
            {footerGroups.map((group) => <details key={group.label}><summary>{group.label}<ChevronDown size={17} aria-hidden="true" /></summary><ul>{group.links.map((link) => <li key={link.href}><a href={link.href}>{link.label}<ArrowLeft size={13} aria-hidden="true" /></a></li>)}</ul></details>)}
          </div>

          <section id="contact" className="premium-footer__contact" aria-labelledby="footer-contact-title">
            <div><span>CONTACT / HAMI HAMRAH</span><h3 id="footer-contact-title">برای انتخاب یا همکاری، در دسترسیم.</h3></div>
            <a href={footerContact.phoneHref} className="premium-footer__phone"><Phone size={17} aria-hidden="true" /><span>{footerContact.phoneLabel}</span></a>
            <p>اطلاعات حضور فروشگاهی و پیوندهای رسمی شبکه‌های اجتماعی، پس از تأیید منبع افزوده می‌شوند.</p>
          </section>

          <div className="premium-footer__brand-line"><span>{footerMeta.line}</span></div>
          <div className="premium-footer__bottom"><span>{footerMeta.copyright}</span><span>حریم خصوصی و شرایط، پس از تکمیل اطلاعات حقوقی منتشر می‌شوند.</span></div>
        </div>
      </footer>
    </div>
  );
}
