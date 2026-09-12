"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BatteryCharging,
  Globe2,
  Headphones,
  Phone,
  Plug,
  ShieldCheck,
  Smartphone,
  Speaker,
  Watch,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "@/components/home/Reveal";
import { CardSwap, Card } from "@/components/ui/CardSwap";
import { storeExperiencePoints } from "@/lib/content/home";
import { categoryMosaic } from "@/lib/content/home";

/* The three swap cards reuse the store-experience icon set. */
const pointIcons = [Smartphone, Headphones, ShieldCheck];

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
  const sectionRef = useRef<HTMLElement>(null);
  const cornerGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      const glow = cornerGlowRef.current;
      if (!section || !glow) return;

      // Scroll-driven corner expansion (Top-Left origin)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 15%",
          scrub: 0.8,
          onToggle: (self) => {
            if (self.isActive) {
              section.setAttribute("data-ambience", "light");
            } else {
              section.removeAttribute("data-ambience");
            }
          },
        },
      });

      // From 0% circle at top-left (0% 0%) expanding to 160% across the section, then smoothly retracting
      tl.fromTo(
        glow,
        {
          clipPath: "circle(0% at 0% 0%)",
          opacity: 0,
        },
        {
          clipPath: "circle(160% at 0% 0%)",
          opacity: 1,
          ease: "power1.inOut",
          duration: 0.4,
        }
      )
        .to(glow, { opacity: 1, duration: 0.3 })
        .to(glow, {
          clipPath: "circle(0% at 0% 0%)",
          opacity: 0,
          ease: "power1.inOut",
          duration: 0.3,
        });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="categories"
      className="wrap container relative my-10 overflow-hidden rounded-[36px] p-6 sm:p-10 md:p-12 transition-colors duration-500"
      aria-labelledby="categories-title"
    >
      {/* 
        Section-Scoped Corner-Origin Ambient Stage:
        Only affects this section's background, starting from top-left.
        The rest of the website stays 100% Obsidian Velvet.
      */}
      <div
        className="cat-ambient-stage pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[36px]"
        aria-hidden="true"
      >
        <div
          ref={cornerGlowRef}
          className="cat-corner-glow absolute inset-0 rounded-[36px]"
        />
      </div>

      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow"><i /> فروشگاه</span>
            <h2 id="categories-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              دسته‌بندی <span className="grad">محصولات.</span>
            </h2>
            <p className="mt-3 text-sm text-foreground/75">هر چیزی که برای تجربه بهتر موبایل نیاز داری</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
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
                  <span className="font-mono text-[10px] text-aqua">{category.number}</span>
                  <small className="mt-0.5 block font-mono text-[8px] tracking-[0.1em] text-foreground/50">{category.eyebrow}</small>
                  <h3 className="mt-1 text-sm font-black md:text-base">{category.title}</h3>
                  <p className="mt-0.5 hidden text-[11px] text-foreground/55 md:block">{category.detail}</p>
                  <b className="mt-2 flex items-center gap-1 text-[11px] font-bold text-aqua">
                    مشاهده <ArrowLeft className="size-3.5" />
                  </b>
                </div>
              </Link>
            );
          })}
        </div>
      </Reveal>

      {/* The swapping stack inside categories stage */}
      <Reveal delay={80}>
        <div className="mt-14 hidden justify-center overflow-hidden py-16 lg:flex" aria-hidden="true">
          <CardSwap
            label="تجربه خرید از حامی همراه"
            width={620}
            height={380}
            cardDistance={64}
            verticalDistance={58}
            skewAmount={5}
            delay={2600}
            easing="linear"
          >
            {storeExperiencePoints.map((point, index) => {
              const Icon = pointIcons[index] ?? ShieldCheck;
              return (
                <Card key={point.index} customClass={`swap-card swap-card-${index + 1}`}>
                  <div className="flex h-full flex-col justify-between p-10">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs tracking-[0.2em] swap-card-index">{point.index}</span>
                      <Icon className="size-9 swap-card-icon" strokeWidth={1.3} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black leading-tight swap-card-title">{point.title}</h3>
                      <p className="mt-3 max-w-sm text-base leading-8 swap-card-body">{point.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </CardSwap>
        </div>
      </Reveal>
    </section>
  );
}
