import Link from "next/link";
import {
  ArrowLeft,
  BatteryCharging,
  Globe2,
  Headphones,
  Phone,
  Plug,
  Smartphone,
  Speaker,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/home/primitives";
import { Reveal } from "@/components/home/Reveal";
import { categoryMosaic } from "@/lib/content/home";

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

export function CategoryHub() {
  return (
    <section id="categories" className="container py-20" aria-labelledby="categories-title">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel index="۰۰۲">اکوسیستم محصولات و خدمات</SectionLabel>
            <h2 id="categories-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              دسته‌بندی <em className="font-black not-italic text-champagne">محصولات.</em>
            </h2>
            <p className="mt-3 text-sm text-foreground/60">هر چیزی که برای تجربه بهتر موبایل نیاز داری</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-champagne hover:underline">
            مشاهده همه <ArrowLeft className="size-4" />
          </Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="cat-grid mt-10" role="list">
          {categoryMosaic.map((category) => {
            const Icon = categoryIcons[category.icon] ?? Globe2;
            return (
              <Link key={category.key} href={category.href} className={`cat-card cat-card--${category.layout}`} role="listitem">
                <div className="cat-art" aria-hidden="true">
                  <i /><i /><i />
                  <Icon className="size-12 md:size-14" strokeWidth={1.1} />
                </div>
                <div className="relative mt-auto w-full bg-gradient-to-t from-wine-ink/95 via-wine-ink/70 to-transparent p-4 pt-10">
                  <span className="font-mono text-[10px] text-champagne">{category.number}</span>
                  <small className="mt-0.5 block font-mono text-[8px] tracking-[0.1em] text-foreground/50">{category.eyebrow}</small>
                  <h3 className="mt-1 text-sm font-black md:text-base">{category.title}</h3>
                  <p className="mt-0.5 hidden text-[11px] text-foreground/55 md:block">{category.detail}</p>
                  <b className="mt-2 flex items-center gap-1 text-[11px] font-bold text-champagne">
                    مشاهده <ArrowLeft className="size-3.5" />
                  </b>
                </div>
              </Link>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
