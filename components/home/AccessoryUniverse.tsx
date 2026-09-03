"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { accessoryCategories, type AccessoryCategoryKey } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/Reveal";

/** Accessories universe — interactive focus list (hover/press switches the
 * featured category panel), ported from the reference section. */
export function AccessoryUniverse() {
  const [active, setActive] = useState<AccessoryCategoryKey>("audio");
  const current = accessoryCategories.find((c) => c.key === active) ?? accessoryCategories[0];

  return (
    <section id="accessories" className="wrap container py-20" aria-labelledby="accessories-title">
      <Reveal>
        <span className="eyebrow"><i /> لوازم جانبی</span>
        <h2 id="accessories-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
          لوازم جانبی، <span className="grad">دقیق انتخاب کنید.</span>
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <ul className="m-0 list-none divide-y divide-line border-y border-line p-0" aria-label="دسته‌های لوازم جانبی">
            {accessoryCategories.map((category) => {
              const isActive = category.key === active;
              return (
                <li key={category.key} className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`نمایش تمرکز بصری دسته ${category.title}`}
                    onMouseEnter={() => setActive(category.key)}
                    onFocus={() => setActive(category.key)}
                    onClick={() => setActive(category.key)}
                    className={cn(
                      "flex flex-1 items-center gap-4 py-4 text-start transition-colors duration-fast",
                      isActive ? "text-gold" : "text-foreground/60 hover:text-foreground/90",
                    )}
                  >
                    <span className="font-mono text-[10px]">{category.index}</span>
                    <b className="text-sm font-extrabold">{category.label}</b>
                    <small className="hidden text-[11px] text-foreground/60 sm:block">{category.detail}</small>
                  </button>
                  <Link
                    href={category.href}
                    aria-label={`مشاهدهٔ دسته ${category.title}`}
                    className="grid size-9 place-items-center rounded-xl text-foreground/55 transition-colors duration-fast hover:bg-gold/10 hover:text-gold"
                  >
                    <ArrowLeft className="size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={100}>
          <div className="glass relative grid min-h-72 place-items-center overflow-hidden rounded-2xl shadow-deep">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--lx,50%)_var(--ly,40%),rgba(201,162,39,0.14),transparent_55%)]" aria-hidden="true" />
            <div className="relative p-10 text-center" aria-live="polite">
              <span className="font-mono text-[10px] tracking-[0.14em] text-gold">{current.label}</span>
              <b className="mt-3 block text-5xl font-black tracking-tight text-foreground">{current.title}</b>
              <p className="mt-3 text-sm text-foreground/60">{current.detail}</p>
              <Link href={current.href} className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-bold text-gold transition-colors duration-fast hover:bg-gold/10">
                مشاهده محصولات <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={140}>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <p className="m-0 text-sm text-foreground/60">برای کامل‌کردن تجربهٔ هر دستگاه، انتخابی دقیق‌تر داشته باشید.</p>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
            مشاهده همه لوازم جانبی <ArrowLeft className="size-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}