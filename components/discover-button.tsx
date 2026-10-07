"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Grid2X2, Search, X } from "lucide-react";
import { brandHref, brandSlugByName } from "@/lib/content/home";

const TABS = [
  {
    id: "iphone",
    label: "آیفون",
    href: `/categories/${encodeURIComponent("آیفون-استوک")}`,
    color: "text-champagne",
    fill: "fill-champagne",
    bg: "bg-champagne/15",
  },
  {
    id: "samsung",
    label: "سامسونگ",
    href: brandHref(brandSlugByName.SAMSUNG),
    color: "text-sky-300",
    fill: "fill-sky-300",
    bg: "bg-sky-300/15",
  },
  {
    id: "xiaomi",
    label: "شیائومی",
    href: brandHref(brandSlugByName.XIAOMI),
    color: "text-orange-300",
    fill: "fill-orange-300",
    bg: "bg-orange-300/15",
  },
] as const;

const spring = { type: "spring" as const, damping: 24, stiffness: 260, mass: 0.9 };

/** Animated one-row search and category toolbar for the navbar. */
export default function DiscoverButton() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>(TABS[0].id);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const routeTab = TABS.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));

  useEffect(() => {
    if (isSearching) inputRef.current?.focus();
    if (!isSearching && !mobileCategoriesOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMobileCategoriesOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearching(false);
        setMobileCategoriesOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSearching, mobileCategoriesOpen]);

  return (
    <div ref={rootRef} className="relative flex h-10 w-max max-w-full shrink items-center gap-1.5 md:h-9" dir="rtl">
      <motion.form
        layout
        action="/shop"
        role="search"
        aria-label="جست‌وجوی محصولات"
        initial={false}
        animate={{ width: isSearching ? "clamp(108px, 18vw, 248px)" : 42 }}
        transition={spring}
        onClick={() => !isSearching && setIsSearching(true)}
        className="flex h-full min-w-0 items-center overflow-hidden rounded-full border border-champagne/25 bg-ink/70 px-3 text-foreground shadow-[0_5px_18px_rgba(0,0,0,.2)]"
      >
        <button
          type={isSearching ? "submit" : "button"}
          aria-label={isSearching ? "جست‌وجو" : "باز کردن جست‌وجو"}
          onClick={(event) => {
            if (!isSearching) {
              event.preventDefault();
              setIsSearching(true);
            }
          }}
          className="grid size-5 shrink-0 place-items-center text-champagne"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>

        <motion.div
          initial={false}
          animate={{
            width: isSearching ? "100%" : 0,
            opacity: isSearching ? 1 : 0,
            filter: isSearching ? "blur(0px)" : "blur(4px)",
            marginInlineStart: isSearching ? 10 : 0,
          }}
          transition={spring}
          className="min-w-0 overflow-hidden"
          aria-hidden={!isSearching}
        >
          <input
            ref={inputRef}
            type="search"
            name="q"
            tabIndex={isSearching ? 0 : -1}
            placeholder="جست‌وجو در فروشگاه…"
            aria-label="جست‌وجو در فروشگاه"
            className="w-full border-0 bg-transparent p-0 text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-0"
          />
        </motion.div>
      </motion.form>

      <motion.div
        layout
        initial={false}
        animate={{ width: isSearching ? 40 : "auto" }}
        transition={spring}
        className="relative hidden h-full shrink-0 items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.96] text-slate-700 shadow-[0_5px_18px_rgba(0,0,0,.2)] sm:flex"
        style={{ backgroundColor: "rgba(255,255,255,.96)" }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: isSearching ? 0 : 1, filter: isSearching ? "blur(4px)" : "blur(0px)" }}
          transition={{ duration: 0.18 }}
          className="flex h-full items-center gap-0.5 px-1"
          style={{ pointerEvents: isSearching ? "none" : "auto" }}
          aria-hidden={isSearching}
        >
          {TABS.map((tab) => {
            const selected = routeTab ? routeTab.id === tab.id : activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-label={tab.label}
                aria-current={pathname === tab.href ? "page" : undefined}
                tabIndex={isSearching ? -1 : 0}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition-colors sm:px-2.5 sm:text-xs ${selected ? tab.color : "text-slate-500 hover:text-slate-900"}`}
              >
                {selected && (
                  <motion.span
                    layoutId="discover-category-pill"
                    className={`absolute inset-0 rounded-full ${tab.bg}`}
                    transition={{ type: "spring", bounce: 0.18, duration: 0.42 }}
                  />
                )}
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: isSearching ? 1 : 0, filter: isSearching ? "blur(0px)" : "blur(4px)" }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 grid place-items-center"
          style={{ pointerEvents: isSearching ? "auto" : "none" }}
        >
          <button
            type="button"
            aria-label="بستن جست‌وجو"
            tabIndex={isSearching ? 0 : -1}
            onClick={() => setIsSearching(false)}
            className="grid size-full place-items-center text-slate-700 hover:text-[#640211]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </motion.div>
      </motion.div>

      <div className="relative sm:hidden">
        <button
          type="button"
          aria-label={isSearching ? "بستن جست‌وجو" : "دسته‌بندی‌های گوشی"}
          aria-expanded={isSearching ? undefined : mobileCategoriesOpen}
          aria-controls="mobile-discover-categories"
          onClick={() => {
            if (isSearching) setIsSearching(false);
            else setMobileCategoriesOpen((open) => !open);
          }}
          className="grid size-10 place-items-center rounded-full border border-champagne/25 bg-ink/70 text-champagne shadow-[0_5px_18px_rgba(0,0,0,.2)]"
        >
          {isSearching ? <X className="size-5" aria-hidden="true" /> : <Grid2X2 className="size-[18px]" aria-hidden="true" />}
        </button>

        {!isSearching && mobileCategoriesOpen && (
          <motion.div
            id="mobile-discover-categories"
            role="region"
            aria-label="دسته‌بندی گوشی‌ها"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute end-0 top-full z-[70] mt-2 w-52 rounded-2xl border border-champagne/20 bg-[linear-gradient(145deg,#260b12_0%,#14060a_72%)] p-2 shadow-[0_20px_60px_rgba(0,0,0,.55)]"
          >
            {TABS.map((tab) => {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileCategoriesOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/90 transition hover:bg-champagne/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/60"
                >
                  {tab.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
