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
    <section id="categories" className="wrap container py-20" aria-labelledby="categories-title">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow"><i /> فروشگاه</span>
            <h2 id="categories-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              دسته‌بندی <span className="grad">محصولات.</span>
            </h2>
            <p className="mt-3 text-sm text-foreground/60">هر چیزی که برای تجربه بهتر موبایل نیاز داری</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
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
                <div className="relative mt-auto w-full bg-gradient-to-t from-ink/95 via-ink/70 to-transparent p-4 pt-10">
                  <span className="font-mono text-[10px] text-gold">{category.number}</span>
                  <small className="mt-0.5 block font-mono text-[8px] tracking-[0.1em] text-foreground/50">{category.eyebrow}</small>
                  <h3 className="mt-1 text-sm font-black md:text-base">{category.title}</h3>
                  <p className="mt-0.5 hidden text-[11px] text-foreground/55 md:block">{category.detail}</p>
                  <b className="mt-2 flex items-center gap-1 text-[11px] font-bold text-gold">
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
