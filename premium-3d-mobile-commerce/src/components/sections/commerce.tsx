"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ProductView, BrandView, CategoryView } from "@/lib/catalog";
import { toFa } from "@/lib/format";
import { Reveal, ProductCard, SectionHead, Logo } from "@/components/ui/primitives";
import { PartnerBanner, ChargeBanner, AudioBanner, CameraBanner } from "@/components/three/dynamic";
import { journey, type ExploreKey } from "@/components/three/journey-state";

/* ============================== PARTNERSHIP =========================== */

const BENEFITS = [
  { t: "قیمت پلکانی عمده", d: "هرچه حجم خرید بالاتر، قیمت بهتر؛ لیست قیمت اختصاصی همکاران." },
  { t: "تأمین پایدار", d: "دسترسی اولویت‌دار به موجودی پرچمدارها و کالاهای کمیاب." },
  { t: "تسویه منعطف", d: "شرایط پرداخت متناسب با گردش مالی فروشگاه شما." },
  { t: "پشتیبانی اختصاصی", d: "کارشناس فروش ثابت، پیگیری گارانتی و خدمات پس از فروش." },
];

const TERMS = ["داشتن جواز کسب یا فروشگاه فعال (حضوری یا آنلاین)", "حداقل خرید ماهانه ۵۰ میلیون تومان", "ارسال مدارک هویتی و شغلی برای احراز", "تعهد به فروش با قیمت مصوب همکاری"];

const BIZ = ["فروشگاه موبایل", "فروشگاه آنلاین", "تعمیرگاه / خدمات", "سازمان و شرکت", "سایر"];
const VOL = ["۵۰ تا ۱۰۰ میلیون", "۱۰۰ تا ۳۰۰ میلیون", "۳۰۰ میلیون تا ۱ میلیارد", "بیش از ۱ میلیارد"];

export function Partnership() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/partnership", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "خطا");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "ارسال ناموفق بود");
    }
  }

  const field = "min-h-[48px] w-full rounded-xl border border-ivory/10 bg-white/[0.04] px-4 text-sm text-ivory placeholder:text-ivory-dim/60 focus:border-champagne/60 focus:outline-none";

  return (
    <section id="partner" data-world="partner" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead index="۰۵" eyebrow="همکاری با حامی همراه" title="با هم بزرگ‌تر بفروشیم" desc="اگر فروشگاه موبایل، کسب‌وکار آنلاین یا سازمان هستید، با خرید عمده از حامی همراه به قیمت رقابتی، تأمین پایدار و پشتیبانی اختصاصی دسترسی پیدا کنید." />

        {/* 3D partnership banner */}
        <Reveal className="relative mt-10 overflow-hidden rounded-[28px] border border-champagne/25" delay={1}>
          <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/8]">
            <PartnerBanner />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite/90 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-8">
              <div>
                <span className="eyebrow">اتصال → همکاری → رشد</span>
                <h3 className="mt-2 text-2xl font-black text-ivory md:text-4xl">شبکه همکاران حامی همراه</h3>
                <p className="mt-2 max-w-md text-sm leading-7 text-ivory-dim">بیش از ۱۲۰ فروشگاه در سراسر کشور از طریق حامی همراه تأمین می‌شوند.</p>
              </div>
              <a href="#partner-form" className="btn-primary pointer-events-auto">
                درخواست همکاری
              </a>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <Reveal>
              <h3 className="text-lg font-black text-ivory">مزایای همکاری</h3>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {BENEFITS.map((b, i) => (
                  <div key={b.t} className="glass rounded-2xl p-4">
                    <div className="text-[11px] font-black text-champagne">{toFa(i + 1).padStart(2, "۰")}</div>
                    <h4 className="mt-1 font-bold text-ivory">{b.t}</h4>
                    <p className="mt-1.5 text-xs leading-6 text-ivory-dim">{b.d}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={1}>
              <h3 className="text-lg font-black text-ivory">شرایط همکاری</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {TERMS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm leading-7 text-ivory-dim">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal id="partner-form" className="glass-strong scroll-mt-28 rounded-[26px] p-5 md:p-7" delay={1}>
            {status === "done" ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-champagne to-gold text-graphite">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h4 className="mt-5 text-xl font-black text-ivory">درخواست شما ثبت شد</h4>
                <p className="mt-2 max-w-sm text-sm leading-7 text-ivory-dim">کارشناس واحد همکاران حامی همراه حداکثر تا ۲۴ ساعت کاری با شما تماس می‌گیرد.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <h3 className="text-xl font-black text-ivory">فرم درخواست همکاری</h3>
                <p className="text-xs leading-6 text-ivory-dim">اطلاعات کسب‌وکار خود را وارد کنید تا لیست قیمت همکاران برای شما ارسال شود.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="businessName" required placeholder="نام فروشگاه / شرکت" className={field} />
                  <input name="contactName" required placeholder="نام و نام خانوادگی" className={field} />
                  <input name="phone" required inputMode="tel" placeholder="شماره تماس" className={field} dir="ltr" style={{ textAlign: "right" }} />
                  <input name="city" required placeholder="شهر" className={field} />
                  <select name="businessType" required className={field} defaultValue="">
                    <option value="" disabled>
                      نوع کسب‌وکار
                    </option>
                    {BIZ.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <select name="monthlyVolume" required className={field} defaultValue="">
                    <option value="" disabled>
                      حجم خرید ماهانه (تومان)
                    </option>
                    {VOL.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea name="message" rows={3} placeholder="توضیحات (برندها و محصولات مورد نیاز)" className={`${field} py-3`} />
                {error && <p className="text-xs text-oxblood-glow">{error}</p>}
                <button type="submit" disabled={status === "sending"} className="btn-primary mt-1 w-full disabled:opacity-60">
                  {status === "sending" ? "در حال ارسال…" : "ثبت درخواست همکاری"}
                </button>
                <p className="text-center text-[11px] text-ivory-dim">با ثبت درخواست، شرایط همکاری حامی همراه را می‌پذیرید.</p>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* =============================== EXPLORER ============================= */

const CONCEPT: Record<ExploreKey, { t: string; d: string }> = {
  all: { t: "همه محصولات", d: "سه پرچمدار، سه دنیا؛ با فیلتر برند یا دسته شروع کنید." },
  apple: { t: "دنیای اپل", d: "دقت ماشین‌کاری، سیستم دوربین و نمایشگر؛ نمای نزدیک از پشت دستگاه." },
  samsung: { t: "دنیای سامسونگ", d: "نمایشگر روشن و بزرگ، فناوری پیشرو و طراحی صاف پرچمدارها." },
  xiaomi: { t: "اکوسیستم شیائومی", d: "گوشی در مرکز، ساعت و هندزفری و شارژر در مدار؛ همه‌چیز به هم متصل." },
  accessory: { t: "لوازم جانبی", d: "شارژ، صدا، پوشیدنی و اتصال؛ مکمل‌های ضروری گوشی شما." },
  flagship: { t: "پرچمدارها", d: "بهترین‌های هر برند کنار هم برای مقایسه مستقیم." },
  midrange: { t: "میان‌رده‌ها", d: "بهترین ارزش خرید؛ دو گزینه محبوب رو در رو." },
  earbuds: { t: "هندزفری بی‌سیم", d: "کیس باز می‌شود، صدا شروع می‌شود؛ حذف نویز و کیفیت صدا." },
  wearable: { t: "ساعت هوشمند", d: "سلامت، ورزش و اعلان‌ها روی مچ شما." },
  charging: { t: "شارژ و انرژی", d: "شارژ سریع، پاوربانک و پایه‌های بی‌سیم؛ انرژی در جریان." },
};

export function Explorer({ products, brands, categories }: { products: ProductView[]; brands: BrandView[]; categories: CategoryView[] }) {
  const [brand, setBrand] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const key: ExploreKey = useMemo(() => {
    if (brand && cat) {
      if (cat === "flagship" || cat === "midrange") return brand as ExploreKey;
      return cat as ExploreKey;
    }
    if (brand) return brand === "accessories" ? "accessory" : (brand as ExploreKey);
    if (cat) return cat as ExploreKey;
    return "all";
  }, [brand, cat]);

  useEffect(() => {
    journey.explore = key;
  }, [key]);

  const list = useMemo(() => products.filter((p) => (!brand || p.brandSlug === brand) && (!cat || p.categorySlug === cat)), [products, brand, cat]);
  const shopHref = `/shop?${[brand ? `brand=${brand}` : "", cat ? `category=${cat}` : ""].filter(Boolean).join("&")}`;
  const concept = CONCEPT[key];

  return (
    <section id="explore" data-world="explore" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead index="۰۶" eyebrow="محصولات" title="کشف بر اساس برند و دسته‌بندی" desc="برند یا دسته را انتخاب کنید؛ دنیای سه‌بعدی و فهرست محصولات هم‌زمان با انتخاب شما تغییر می‌کند." />

        <div className="sticky top-[76px] z-20 mt-8 flex flex-col gap-2 py-2">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            <button className="chip" data-active={brand === null} onClick={() => setBrand(null)}>
              همه برندها
            </button>
            {brands.map((b) => (
              <button key={b.id} className="chip" data-active={brand === b.slug} onClick={() => setBrand(brand === b.slug ? null : b.slug)}>
                {b.nameFa}
              </button>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            <button className="chip" data-active={cat === null} onClick={() => setCat(null)}>
              همه دسته‌ها
            </button>
            {categories.map((c) => (
              <button key={c.id} className="chip" data-active={cat === c.slug} onClick={() => setCat(cat === c.slug ? null : c.slug)}>
                {c.nameFa}
              </button>
            ))}
          </div>
        </div>

        {/* 3D stage: the journey world morphs here according to selection */}
        <div className="relative mt-4 flex min-h-[46svh] items-end md:min-h-[54vh]">
          <div key={key} className="glass reveal in max-w-sm rounded-2xl p-4">
            <span className="eyebrow">مفهوم سه‌بعدی</span>
            <h3 className="mt-1 text-lg font-black text-ivory">{concept.t}</h3>
            <p className="mt-1 text-xs leading-6 text-ivory-dim">{concept.d}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-ivory-dim">
            <span className="font-bold text-ivory">{toFa(list.length)}</span> محصول پیدا شد
          </p>
          <Link href={shopHref} className="text-sm font-bold text-champagne">
            مشاهده در فروشگاه ←
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {list.slice(0, 8).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        {list.length === 0 && (
          <div className="glass mt-3 rounded-2xl p-8 text-center text-sm text-ivory-dim">
            برای این ترکیب محصولی موجود نیست؛ فیلتر را تغییر دهید.
          </div>
        )}
        {list.length > 8 && (
          <div className="mt-5 flex justify-center">
            <Link href={shopHref} className="btn-ghost">
              مشاهده {toFa(list.length - 8)} محصول دیگر
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* =============================== CREATIVE ============================= */

const CREATIVE = [
  {
    Banner: ChargeBanner,
    eyebrow: "کمپین انرژی",
    title: "شارژ سریع، روزِ بلند",
    desc: "شارژرهای ۴۵ تا ۱۲۰ وات، پاوربانک‌ها و پایه‌های مگ‌سیف؛ انرژی همیشه در جریان.",
    cta: "دیدن شارژرها",
    href: "/shop?category=charging",
    tone: "from-[#3a2a12]/80",
  },
  {
    Banner: AudioBanner,
    eyebrow: "داستان صدا",
    title: "سکوتِ خالص، صدای کامل",
    desc: "هندزفری‌های بی‌سیم با حذف نویز فعال؛ از ایرپادز پرو تا سونی XM5.",
    cta: "دیدن هندزفری‌ها",
    href: "/shop?category=earbuds",
    tone: "from-[#2a0a0f]/80",
  },
  {
    Banner: CameraBanner,
    eyebrow: "فناوری جدید",
    title: "شب را روشن ببین",
    desc: "دوربین‌های پرچمدار با سنسور بزرگ و لنز پریسکوپی؛ عکاسی شب در سطح حرفه‌ای.",
    cta: "پرچمدارهای دوربین",
    href: "/shop?category=flagship",
    tone: "from-[#0f1424]/80",
  },
];

export function Creative() {
  return (
    <section id="creative" data-world="creative" className="section-frame relative px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead index="۰۷" eyebrow="کشف چیزی غیرمنتظره" title="سه داستان، سه دنیای سه‌بعدی" desc="کمپین‌های خلاقانه حامی همراه؛ هر بنر یک تجربه تعاملی مستقل با مفهوم خودش." align="center" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {CREATIVE.map((c, i) => (
            <Reveal key={c.title} delay={i as 0 | 1 | 2} className="relative overflow-hidden rounded-[26px] border border-ivory/10">
              <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5]">
                <c.Banner />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${c.tone} via-transparent to-transparent`} />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="eyebrow">{c.eyebrow}</span>
                  <h3 className="mt-2 text-2xl font-black text-ivory">{c.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-ivory-dim">{c.desc}</p>
                  <Link href={c.href} className="btn-ghost pointer-events-auto mt-4 !min-h-[44px]">
                    {c.cta}
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================ FOOTER ============================== */

export function Footer() {
  return (
    <footer id="footer" data-world="footer" className="section-frame relative px-4 pb-28 pt-16 md:px-8 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="gold-line mb-10" />
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4 md:col-span-2">
            <Logo />
            <p className="max-w-md text-sm leading-7 text-ivory-dim">فروشگاه تخصصی موبایل حامی همراه؛ عرضه‌کننده آیفون، سامسونگ، شیائومی و لوازم جانبی اورجینال با ضمانت اصالت، قیمت رقابتی و امکان همکاری عمده.</p>
          </div>
          <div>
            <h4 className="font-black text-ivory">دسترسی سریع</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-ivory-dim">
              <li>
                <Link href="/shop">فروشگاه</Link>
              </li>
              <li>
                <a href="#deals">پیشنهادهای شگفت‌انگیز</a>
              </li>
              <li>
                <a href="#partner">همکاری عمده</a>
              </li>
              <li>
                <a href="#gallery">گالری فروشگاه</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-ivory">شعبه مرکزی</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-7 text-ivory-dim">
              <li>تهران، خیابان ولیعصر، پاساژ همراه، طبقه اول</li>
              <li>همه‌روزه ۱۰ تا ۲۱</li>
              <li dir="ltr" className="text-right">
                ۰۲۱-۰۰۰۰۰۰۰۰
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ivory/10 pt-6 text-[11px] text-ivory-dim md:flex-row">
          <span>© {toFa(1404)} حامی همراه — همه حقوق محفوظ است.</span>
          <span className="tracking-[0.25em] text-champagne/70">HAMI HAMRAH · PREMIUM MOBILE</span>
        </div>
      </div>
    </footer>
  );
}
