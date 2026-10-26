"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  BatteryCharging,
  Cable,
  ChevronDown,
  Headphones,
  Smartphone,
  Watch,
  Wifi,
} from "lucide-react";
import { categoryMosaic } from "@/lib/content/home";

const categoryIcons = [Smartphone, Headphones, Cable, BatteryCharging, Watch, Wifi];

/** Smooth animated category dropdown for the store navigation item. */
export default function SmoothDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative hidden shrink-0 lg:block"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="store-category-menu"
        aria-haspopup="true"
        aria-label="دسته‌بندی‌های فروشگاه"
        onClick={() => setOpen((value) => !value)}
        className={`relative z-20 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors ${
          open
            ? "border-champagne/45 bg-champagne/15 text-champagne"
            : "border-white/10 bg-white/[0.04] text-foreground/80 hover:border-champagne/30 hover:text-foreground"
        }`}
      >
        فروشگاه
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="store-category-menu"
            role="region"
            aria-label="دسته‌بندی محصولات فروشگاه"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            /* Anchored to the «فروشگاه» trigger, not to the bar: the panel's
               inline-start edge lines up with the button's edge in RTL, so the
               menu reads as that button's menu instead of floating mid-bar. */
            className="absolute start-0 top-full z-50 mt-3 w-[min(45rem,calc(100vw-2rem))] rounded-[1.6rem] border border-champagne/20 bg-[linear-gradient(145deg,#260b12_0%,#14060a_72%)] p-5 text-start shadow-[0_24px_80px_rgba(0,0,0,.55)]"
            dir="rtl"
          >
            {/* Pointer tying the panel to the trigger's centre. */}
            <span
              aria-hidden="true"
              className="absolute -top-[7px] start-[3.35rem] size-3 rotate-45 rounded-[2px] border-s border-t border-champagne/20 bg-[#260b12]"
            />
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-champagne/10 pb-3">
              <div>
                <p className="text-xs font-medium text-champagne/65">ویترین حامی همراه</p>
                <h2 className="mt-1 text-base font-bold text-foreground">دسته‌بندی محصولات</h2>
              </div>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 extend-touch-target shrink-0 items-center gap-2 rounded-full border border-champagne/35 bg-champagne px-4 py-2.5 text-xs font-bold text-oxblood-deep transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(229,211,179,.2)]"
              >
                مشاهدهٔ فروشگاه
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categoryMosaic.map((category, index) => {
                const Icon = categoryIcons[index];
                return (
                  <Link
                    key={category.key}
                    href={category.href}
                    onClick={() => setOpen(false)}
                    className="group flex min-h-20 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 transition hover:border-champagne/25 hover:bg-champagne/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/70"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-champagne/15 bg-champagne/[0.07] text-champagne transition group-hover:bg-champagne/15">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground/90">{category.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{category.eyebrow}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
