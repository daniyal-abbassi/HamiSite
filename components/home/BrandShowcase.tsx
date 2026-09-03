"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { brandStories, brandWall, type BrandStoryKey } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/Reveal";

/** Brand wordmark wall + story card. Reference used photos — missing, so the
 * visual side is a branded placeholder frame. */
export function BrandShowcase() {
  const [active, setActive] = useState<BrandStoryKey>("apple");
  const story = brandStories.find((s) => s.key === active) ?? brandStories[0];

  return (
    <section id="brands" className="wrap relative overflow-hidden py-20" aria-labelledby="brands-title">
      <div className="pointer-events-none absolute -top-40 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="container relative">
        <Reveal>
          <span className="eyebrow"><i /> برندها</span>
          <h2 id="brands-title" className="mt-4 text-3xl font-black leading-[1.5] tracking-tight md:text-4xl md:leading-[1.5]">
            برندهایی که می‌شناسید.
            <span className="grad block">انتخاب‌هایی که به آن‌ها اعتماد دارید.</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-foreground/60">
            مجموعه‌ای از برندهای معتبر موبایل، تکنولوژی و لوازم جانبی، در یک تجربهٔ خرید واحد.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-border py-6" role="list" aria-label="برندهای منتخب حامی همراه">
            {brandWall.map((brand) => {
              const isActive = brand.story === active;
              return (
                <button
                  key={brand.name}
                  type="button"
                  role="listitem"
                  disabled={!brand.story}
                  aria-pressed={isActive}
                  aria-label={brand.story ? `نمایش روایت ${brand.name}` : `${brand.name} — روایت برند به‌زودی`}
                  title={brand.story ? undefined : "روایت این برند به‌زودی افزوده می‌شود"}
                  onClick={() => brand.story && setActive(brand.story)}
                  onFocus={() => brand.story && setActive(brand.story)}
                  className={cn(
                    "font-mono text-lg tracking-[0.04em] transition-colors md:text-xl",
                    isActive ? "text-gold" : "text-foreground/60",
                    brand.story ? "hover:text-gold/80 cursor-pointer" : "cursor-default",
                  )}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <article className="glass mt-10 grid overflow-hidden rounded-2xl md:grid-cols-[0.9fr_1.1fr]" aria-live="polite">
            <div className="relative grid min-h-64 place-items-center bg-ink/50">
              <span className="absolute start-4 top-4 font-mono text-[9px] tracking-[0.1em] text-gold-lite/70">01 / BRAND STORY</span>
              <div className="text-center" aria-hidden="true">
                <b className="block font-mono text-4xl tracking-[0.08em] text-gold/80">{story.name}</b>
                <span className="mt-2 block font-mono text-[9px] tracking-[0.14em] text-foreground/55">BRAND VISUAL / PENDING ASSET</span>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <p className="m-0 font-mono text-[10px] tracking-[0.1em] text-gold">{story.name}</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">{story.title}</h3>
              <p className="mt-3 text-sm leading-8 text-foreground/65">{story.text}</p>
              <Link href={story.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
                مشاهده محصولات {story.name} <ArrowLeft className="size-4" />
              </Link>
            </div>
          </article>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-14 flex flex-wrap items-baseline justify-center gap-3 text-center">
            <p className="m-0 text-lg text-foreground/60">یک مقصد.</p>
            <strong className="text-2xl font-black text-gold">انتخاب‌های بی‌نهایت.</strong>
            <span className="font-mono text-[10px] tracking-[0.12em] text-foreground/60">HAMI HAMRAH</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
