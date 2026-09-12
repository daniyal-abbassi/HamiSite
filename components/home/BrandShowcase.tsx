"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { brandStories, brandWall, type BrandStoryKey } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/Reveal";
import { SectionHead } from "@/components/home/SectionHead";
import { ModernWhiteWave } from "@/components/home/ModernWhiteWave";

const brandVisuals: Record<string, { image: string; tag: string }> = {
  apple: { image: "/images/banners/iphone.png", tag: "FLAGSHIP ECOSYSTEM" },
  samsung: { image: "/images/banners/headphone.png", tag: "INNOVATION & AUDIO" },
  xiaomi: { image: "/images/banners/gaming-laptop.png", tag: "PERFORMANCE & TECH" },
};

/** Brand wordmark wall + story card elevated to luxury showcase. */
export function BrandShowcase() {
  const [active, setActive] = useState<BrandStoryKey>("apple");
  const story = brandStories.find((s) => s.key === active) ?? brandStories[0];

  return (
    <section id="brands" className="wrap relative overflow-hidden pt-0 pb-14" aria-labelledby="brands-title">
      {/* Modern White Wave — transitioning smoothly from the categories section */}
      <ModernWhiteWave />

      <div className="pointer-events-none absolute -top-40 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-champagne/10 blur-3xl" aria-hidden="true" />
      <div className="container relative">
        <Reveal>
          <SectionHead
            variant="split"
            id="brands-title"
            eyebrow="برندها"
            title={<>برندهایی که می‌شناسید، انتخاب‌هایی که به آن‌ها اعتماد دارید.</>}
            description="مجموعه‌ای از برندهای معتبر موبایل، تکنولوژی و لوازم جانبی، در یک تجربهٔ خرید واحد."
          />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-champagne/15 py-6" role="list" aria-label="برندهای منتخب حامی همراه">
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
                    isActive ? "text-champagne font-bold drop-shadow-[0_0_12px_rgba(229,211,179,0.4)]" : "text-foreground/55",
                    brand.story ? "hover:text-champagne/80 cursor-pointer" : "cursor-default",
                  )}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <article className="glass-smoked mt-10 grid overflow-hidden rounded-3xl border border-champagne/25 shadow-monolith md:grid-cols-[0.9fr_1.1fr]" aria-live="polite">
            <div className="relative grid min-h-64 place-items-center bg-gradient-to-br from-oxblood/30 via-ink/80 to-ink p-8">
              <span className="absolute start-5 top-5 font-mono text-[10px] tracking-[0.14em] text-champagne">
                01 / {story.name}
              </span>
              <div className="relative aspect-square w-44 sm:w-52">
                <Image
                  src={brandVisuals[story.key]?.image ?? "/images/banners/iphone.png"}
                  alt={story.name}
                  fill
                  className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
                />
              </div>
              <div className="absolute bottom-4 flex items-center gap-2 rounded-full border border-champagne/25 bg-black/60 px-3.5 py-1 backdrop-blur-md">
                <span className="font-mono text-[9px] font-bold tracking-wider text-champagne">
                  {brandVisuals[story.key]?.tag ?? "OFFICIAL PARTNER"}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-champagne">{story.name}</span>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">{story.title}</h3>
              <p className="mt-3 text-sm leading-8 text-foreground/75">{story.text}</p>
              <Link href={story.href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-champagne hover:underline w-fit">
                مشاهده محصولات {story.name} <ArrowLeft className="size-4" />
              </Link>
            </div>
          </article>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-14 flex flex-wrap items-baseline justify-center gap-3 text-center">
            <p className="m-0 text-lg text-foreground/60">یک مقصد.</p>
            <strong className="text-2xl font-black text-aqua">انتخاب‌های بی‌نهایت.</strong>
            <span className="font-mono text-[10px] tracking-[0.12em] text-foreground/60">HAMI HAMRAH</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
