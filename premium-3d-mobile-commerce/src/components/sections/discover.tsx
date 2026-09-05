"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProductView, BrandView, CategoryView, GalleryView } from "@/lib/catalog";
import { discount } from "@/lib/catalog";
import { toFa } from "@/lib/format";
import { Reveal, Countdown, ProductCard, SectionHead, Parallax } from "@/components/ui/primitives";
import { DealsBanner, StoreBanner } from "@/components/three/dynamic";
import { journey } from "@/components/three/journey-state";

/* ================================ HERO ================================ */

const TRUST = [
  { t: "ضمانت اصالت کالا", d: "رجیستر شده و پلمب" },
  { t: "۷ روز مهلت تست", d: "بازگشت بدون قید و شرط" },
  { t: "قیمت رقابتی روز", d: "به‌روزرسانی لحظه‌ای" },
  { t: "همکاری عمده", d: "قیمت ویژه همکاران" },
];

export function Hero() {
  return (
    <section data-world="hero" className="section-frame relative flex min-h-[100svh] flex-col justify-end px-4 pb-28 pt-28 md:px-8 md:pb-16 md:pt-32">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid items-end gap-10 md:grid-cols-[1fr_0.85fr]">
          <div className="flex flex-col gap-6 md:min-h-[46vh] md:justify-end md:pb-2">
            <Reveal className="flex items-center gap-3">
              <span className="eyebrow">فروشگاه تخصصی موبایل</span>
              <span className="h-px w-16 bg-gradient-to-l from-champagne/60 to-transparent" />
            </Reveal>
            <Reveal delay={1}>
              <h1 className="text-balance text-[2.5rem] font-black leading-[1.15] text-ivory md:text-6xl md:leading-[1.12] lg:text-7xl">
                حامیِ <span className="gold-text">انتخابِ درست</span>
                <br />
                برای گوشی بعدی شما
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="max-w-xl text-balance text-sm leading-7 text-ivory-dim md:text-lg md:leading-9">
                آیفون، سامسونگ، شیائومی و لوازم جانبی اورجینال؛ با قیمت شفاف، مقایسه دقیق و مشاوره‌ای که به شما کمک می‌کند
                درست انتخاب کنید — نه فقط بخرید.
              </p>
            </Reveal>
            <Reveal delay={3} className="flex flex-wrap items-center gap-3">
              <Link href="/shop" className="btn-gold relative overflow-hidden shimmer">
                ورود به فروشگاه
              </Link>
              <a href="#deals" className="btn-ghost">
                پیشنهادهای شگفت‌انگیز
                <span className="pulse-ring relative h-2 w-2 rounded-full bg-oxblood-glow" />
              </a>
            </Reveal>
            <Reveal delay={3} className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {TRUST.map((t) => (
                <div key={t.t} className="glass rounded-2xl p-3.5 md:p-4">
                  <p className="text-sm font-bold text-ivory md:text-[14px]">{t.t}</p>
                  <p className="mt-1 text-[11px] text-ivory-dim md:text-xs">{t.d}</p>
                </div>
              ))}
            </Reveal>
          </div>
          {/* desktop stage for the 3D flagship */}
          <div aria-hidden className="hidden min-h-[60vh] md:block" />
        </div>
        <div className="mt-10 flex items-center justify-center gap-3 text-[11px] tracking-[0.3em] text-ivory-dim/70 md:mt-14">
          <span className="h-8 w-px bg-gradient-to-b from-champagne/0 via-champagne/70 to-champagne/0" />
          اسکرول کنید
        </div>
      </div>
    </section>
  );
}

/* ================================ DEALS =============================== */

const URGENCY = [
  { k: "۰۱", t: "فرصت محدود", d: "تا پایان شمارش معکوس" },
  { k: "۰۲", t: "تخفیف ویژه", d: "پایین‌تر از قیمت بازار" },
  { k: "۰۳", t: "اقدام سریع", d: "موجودی محدود است" },
];

export function Deals({ deals }: { deals: ProductView[] }) {
  const soonest = useMemo(() => {
    const ends = deals.map((d) => d.dealEndsAt).filter(Boolean) as string[];
    return ends.sort()[0] ?? null;
  }, [deals]);
  const maxPct = deals.reduce((m, d) => Math.max(m, discount(d)), 0);

  return (
    <section id="deals" data-world="deals" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHead index="۰۱" eyebrow="پیشنهادهای شگفت‌انگیز" title="تخفیف‌های محدود؛ قبل از تمام‌شدن زمان" desc="هر روز چند محصول منتخب با تخفیف واقعی و موجودی محدود. قیمت قبل و بعد را ببینید، مقایسه کنید و سریع تصمیم بگیرید." />
          <Reveal delay={1} className="glass-strong flex items-center gap-4 rounded-2xl p-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-ivory-dim">نزدیک‌ترین پایان تخفیف</span>
              <span className="text-sm font-bold text-ivory">تا {toFa(maxPct)}٪ تخفیف فعال</span>
            </div>
            <Countdown target={soonest} />
          </Reveal>
        </div>

        {/* 3D promotional banner */}
        <Reveal className="relative mt-10 overflow-hidden rounded-[28px] border border-oxblood-glow/25" delay={1}>
          <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9]">
            <DealsBanner />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-2 rounded-full border border-oxblood-glow/40 bg-oxblood-deep/60 px-3 py-1 text-xs font-bold text-ivory backdrop-blur">
                  <span className="pulse-ring relative h-2 w-2 rounded-full bg-oxblood-glow" />
                  پیشنهاد امروز
                </span>
                <h3 className="mt-3 text-2xl font-black leading-tight text-ivory md:text-4xl">
                  تا <span className="gold-text">{toFa(maxPct)}٪</span> تخفیف روی پرچمدارها
                </h3>
                <p className="mt-2 text-sm leading-7 text-ivory-dim">آیفون، گلکسی و شیائومی با قیمت ویژه امروز؛ تعداد محدود و فقط تا پایان شمارش معکوس.</p>
              </div>
              <div className="pointer-events-auto flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {URGENCY.map((u) => (
                    <div key={u.k} className="glass-strong rounded-xl px-2.5 py-2 text-center">
                      <div className="text-[10px] text-champagne">{u.k}</div>
                      <div className="text-xs font-bold text-ivory">{u.t}</div>
                      <div className="hidden text-[10px] text-ivory-dim sm:block">{u.d}</div>
                    </div>
                  ))}
                </div>
                <a href="#deals-list" className="btn-primary">
                  مشاهده همه تخفیف‌ها
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* deals list */}
        <div id="deals-list" className="mt-8 scroll-mt-28">
          <div className="no-scrollbar snap-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-4">
            {deals.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p} variant="deal" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== NEW PRODUCTS ========================== */

const UNVEIL_STEPS = ["جدید", "رونمایی", "پریمیوم", "آخرین فناوری"];

export function NewProducts({ newest }: { newest: ProductView[] }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (journey.world === "new") {
        const s = Math.min(3, Math.floor(journey.progress * 4.2));
        setStep((prev) => (prev === s ? prev : s));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section id="new" data-world="new" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead index="۰۲" eyebrow="جدیدترین محصولات" title="تازه از پرده بیرون آمده‌اند" desc="جدیدترین آیفون‌ها، گلکسی‌ها و شیائومی‌ها را همان هفته عرضه در حامی همراه ببینید؛ با گارانتی معتبر و قیمت روز." />
        {/* unveil stage: the 3D phone rises and turns here */}
        <div className="relative mt-6 flex min-h-[58svh] flex-col items-center justify-end pb-6 md:min-h-[64vh]">
          <div className="flex items-center gap-2">
            {UNVEIL_STEPS.map((s, i) => (
              <span key={s} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-500 ${i === step ? "border-champagne bg-champagne text-graphite" : i < step ? "border-champagne/40 text-champagne" : "border-ivory/10 text-ivory-dim/70"}`}>
                {s}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-ivory-dim">اسکرول کنید تا محصول از پشت به رو بچرخد</p>
        </div>
        <div id="new-list" className="scroll-mt-28">
          <div className="no-scrollbar snap-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-4">
            {newest.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================ STORE =============================== */

export function Store({ products, brands, categories }: { products: ProductView[]; brands: BrandView[]; categories: CategoryView[] }) {
  const featured = useMemo(() => {
    const flags = products.filter((p) => p.isFlagship);
    const rest = products.filter((p) => !p.isFlagship);
    return [...flags, ...rest].slice(0, 8);
  }, [products]);
  const count = (fn: (p: ProductView) => boolean) => products.filter(fn).length;
  return (
    <section id="store" data-world="store" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead index="۰۳" eyebrow="فروشگاه" title="نمایشگاه دیجیتال حامی همراه" desc="همه برندها، همه دسته‌ها؛ از پرچمدارها تا لوازم جانبی. با موجودی واقعی، قیمت روز و امکان مقایسه." />

        {/* large 3D store banner */}
        <Reveal className="relative mt-10 overflow-hidden rounded-[28px] border border-champagne/20" delay={1}>
          <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/8]">
            <StoreBanner />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite/90 via-transparent to-graphite/20" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 md:p-8">
              <span className="eyebrow">شوروم آنلاین</span>
              <span className="rounded-full border border-ivory/10 bg-graphite/60 px-3 py-1 text-xs text-ivory-dim backdrop-blur">{toFa(products.length)} محصول موجود</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-8">
              <div>
                <h3 className="text-2xl font-black text-ivory md:text-4xl">وارد فروشگاه شوید</h3>
                <p className="mt-2 max-w-md text-sm leading-7 text-ivory-dim">مثل قدم‌زدن در شعبه فیزیکی؛ اما با فیلتر، مقایسه و قیمت لحظه‌ای.</p>
              </div>
              <Link href="/shop" className="btn-gold pointer-events-auto">
                ورود به فروشگاه کامل
              </Link>
            </div>
          </div>
        </Reveal>

        {/* brands */}
        <Reveal className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-ivory">برندها</h3>
            <span className="text-xs text-ivory-dim">همه برندها با گارانتی معتبر</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
            {brands.map((b) => (
              <Link key={b.id} href={`/shop?brand=${b.slug}`} className="glass group flex min-h-[96px] flex-col justify-between rounded-2xl p-4 active:scale-[0.98]">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-ivory">{b.nameFa}</span>
                  <span className="text-[10px] tracking-[0.2em] text-champagne/80">{b.nameEn.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-ivory-dim">{b.tagline}</span>
                  <span className="text-[11px] text-champagne">{toFa(count((p) => p.brandSlug === b.slug))} کالا</span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* categories */}
        <Reveal className="mt-8" delay={1}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-ivory">دسته‌بندی‌ها</h3>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="chip">
                {c.nameFa}
                <span className="text-[10px] text-champagne/80">{toFa(count((p) => p.categorySlug === c.slug))}</span>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* product discovery */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-ivory">منتخب فروشگاه</h3>
            <Link href="/shop" className="text-sm font-bold text-champagne">
              مشاهده همه ←
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =============================== GALLERY ============================== */

export function Gallery({ images }: { images: GalleryView[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [lead, ...rest] = images;
  return (
    <section id="gallery" data-world="gallery" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead index="۰۴" eyebrow="گالری فروشگاه فیزیکی" title="یک فروشگاه واقعی، پشت هر سفارش" desc="حامی همراه فقط یک وب‌سایت نیست؛ شعبه فیزیکی ما جایی است که می‌توانید گوشی را لمس کنید، مشاوره بگیرید و با اطمینان بخرید." />

        {lead && (
          <Reveal className="relative mt-10 overflow-hidden rounded-[28px]" delay={1}>
            <button onClick={() => setActive(0)} className="block w-full text-right" aria-label={lead.title}>
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
                <Parallax speed={0.08} className="absolute inset-[-8%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.src} alt={lead.title} className="ken-burns h-full w-full object-cover" />
                </Parallax>
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                  <span className="eyebrow">شعبه مرکزی</span>
                  <h3 className="mt-2 text-2xl font-black text-ivory md:text-4xl">{lead.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-ivory-dim">{lead.caption}</p>
                </div>
              </div>
            </button>
          </Reveal>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {rest.map((img, i) => (
            <Reveal key={img.id} delay={(i % 3) as 0 | 1 | 2} className={`${i === 0 || i === 3 ? "md:col-span-2" : ""}`}>
              <button onClick={() => setActive(i + 1)} className="group relative block aspect-square w-full overflow-hidden rounded-[22px] text-right md:aspect-[4/3]" aria-label={img.title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-5">
                  <h4 className="text-sm font-bold text-ivory md:text-base">{img.title}</h4>
                  <p className="mt-1 hidden text-xs leading-6 text-ivory-dim md:block">{img.caption}</p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 grid gap-3 md:grid-cols-3" delay={1}>
          {[
            { t: "حضور فیزیکی", d: "شعبه مرکزی با سالن نمایش پرچمدارها و میز مشاوره تخصصی." },
            { t: "اعتماد", d: "فاکتور رسمی، رجیستری، فعال‌سازی گارانتی و تست کامل در محل." },
            { t: "تجربه پریمیوم", d: "تحویل حضوری یا ارسال ویژه؛ همان کیفیت خدمات، هر جا که هستید." },
          ].map((x) => (
            <div key={x.t} className="glass rounded-2xl p-5">
              <h4 className="font-black text-ivory">{x.t}</h4>
              <p className="mt-2 text-sm leading-7 text-ivory-dim">{x.d}</p>
            </div>
          ))}
        </Reveal>
      </div>

      {/* lightbox */}
      {active !== null && images[active] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/95 p-4 backdrop-blur-xl" onClick={() => setActive(null)} role="dialog">
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[active].src} alt={images[active].title} className="max-h-[70svh] w-full rounded-2xl object-contain" />
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h4 className="font-black text-ivory">{images[active].title}</h4>
                <p className="mt-1 text-sm text-ivory-dim">{images[active].caption}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActive((active + images.length - 1) % images.length)} className="btn-ghost !min-h-[44px] px-4" aria-label="قبلی">
                  →
                </button>
                <button onClick={() => setActive((active + 1) % images.length)} className="btn-ghost !min-h-[44px] px-4" aria-label="بعدی">
                  ←
                </button>
                <button onClick={() => setActive(null)} className="btn-ghost !min-h-[44px] px-4">
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
