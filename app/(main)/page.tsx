import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toFaDigits } from "@/lib/utils";

/**
 * Home — placeholder shell pending the full «آرشیو بورگوندی» section port.
 * Sections will be ported one-by-one from
 * docs/inspires/HamiHamrah-DNA-Brand-Color/hami-hamrah-luxury/pages/Home.tsx
 * and wired to the REST API (/api/products, /api/categories, /api/brands).
 */
export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container grid items-center gap-10 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <div className="animate-fade-up">
            <div className="section-label">
              <span>{toFaDigits("01")}</span>
              <i />
              <p>فروشگاه رسمی حامی همراه</p>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[1.35] tracking-tight md:text-5xl md:leading-[1.35]">
              موبایل و اکسسوری اورجینال،
              <span className="block text-champagne">با اقتدارِ آرام.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-8 text-foreground/70">
              از پرفروش‌ترین گوشی‌ها تا ساعت هوشمند و پاوربانک — با ضمانت اصالت،
              قیمت شفاف و پشتیبانی تخصصی. خرید عمده برای همکاران نیز پذیرفته می‌شود.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg">
                ورود به فروشگاه
                <ChevronLeft />
              </Button>
              <Button size="lg" variant="outline">
                همکاری عمده (B2B)
              </Button>
            </div>
          </div>

          <div className="relative hidden md:block" aria-hidden="true">
            <div className="relative grid aspect-square place-items-center rounded-sm border border-champagne/25 bg-wine-dark/60 shadow-seal">
              <div className="absolute -start-5 top-8 bg-wine-ink px-3 py-2 font-mono text-[10px] tracking-[0.06em] text-champagne-light">
                EST. 2024 — TEHRAN
              </div>
              <span className="font-mono text-8xl text-champagne/80">H</span>
              <div className="absolute -bottom-6 -end-6 grid size-32 place-items-center border border-champagne/60 bg-background text-center shadow-seal">
                <div>
                  <span className="block text-[10px] text-foreground/60">ضمانت اصالت</span>
                  <b className="mt-1 block text-sm font-black text-champagne">۱۰۰٪ اورجینال</b>
                  <i className="mx-auto mt-2 block h-0.5 w-6 bg-champagne" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-wine-dark/40">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {[
            { title: "ارسال سریع", desc: "به سراسر کشور" },
            { title: "پرداخت امن", desc: "درگاه معتبر بانکی" },
            { title: "قیمت عمده", desc: "ویژه همکاران B2B" },
            { title: "پشتیبانی واقعی", desc: "پاسخگوی تخصصی" },
          ].map((item) => (
            <div key={item.title} className="text-center md:text-start">
              <b className="block text-sm font-extrabold text-champagne">{item.title}</b>
              <span className="mt-1 block text-xs text-foreground/60">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Coming-next placeholder */}
      <section className="container py-16 text-center">
        <p className="m-0 font-mono text-[10px] tracking-[0.08em] text-champagne">
          UNDER CONSTRUCTION
        </p>
        <h2 className="mt-3 text-2xl font-black">
          بخش‌های «پرفروش‌ها»، «دسته‌بندی‌ها» و «برندها» در حال اتصال به API هستند
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-foreground/60">
          این بخش پس از اتصال به <code className="font-mono text-champagne">/api/products</code> و{" "}
          <code className="font-mono text-champagne">/api/categories</code> تکمیل می‌شود.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-champagne hover:underline"
        >
          مشاهده فروشگاه
          <ChevronLeft className="size-4" />
        </Link>
      </section>
    </>
  );
}
