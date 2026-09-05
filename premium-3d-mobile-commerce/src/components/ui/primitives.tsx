"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ProductView } from "@/lib/catalog";
import { formatToman, pad2, stockLabel, toFa } from "@/lib/format";
import { discount } from "@/lib/catalog";
import { journey, onWorldChange, type WorldKey } from "@/components/three/journey-state";

/* ------------------------------ Reveal ------------------------------ */

export function Reveal({ children, className = "", delay = 0, as: Tag = "div", id }: { children: ReactNode; className?: string; delay?: 0 | 1 | 2 | 3; as?: "div" | "section" | "article" | "li" | "h2" | "p"; id?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const El = Tag as unknown as "div";
  return (
    <El id={id} ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${delay ? `reveal-delay-${delay}` : ""} ${className}`}>
      {children}
    </El>
  );
}

/* ----------------------------- Parallax ----------------------------- */

export function Parallax({ children, speed = 0.15, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);
  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/* ----------------------------- Countdown ---------------------------- */

function useCountdown(target: string | null) {
  // Start at 0 on both server and client to avoid hydration mismatches; tick after mount.
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const s = Math.floor(left / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: left <= 0 };
}

export function Countdown({ target, size = "md" }: { target: string | null; size?: "sm" | "md" | "lg" }) {
  const { h, m, s } = useCountdown(target);
  const box =
    size === "lg"
      ? "min-w-[64px] px-2 py-2 text-2xl md:min-w-[84px] md:text-4xl"
      : size === "sm"
        ? "min-w-[34px] px-1 py-1 text-sm"
        : "min-w-[46px] px-1.5 py-1.5 text-lg";
  const Unit = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className={`glass-strong rounded-xl text-center font-black tabular-nums text-ivory ${box}`} style={{ fontVariantNumeric: "tabular-nums" }}>
        {pad2(v)}
      </div>
      {size !== "sm" && <span className="text-[10px] text-ivory-dim">{l}</span>}
    </div>
  );
  return (
    <div className="flex items-start gap-1.5" dir="ltr">
      <Unit v={h} l="ساعت" />
      <span className={`pt-1 font-bold text-champagne ${size === "lg" ? "text-2xl md:text-4xl" : ""}`}>:</span>
      <Unit v={m} l="دقیقه" />
      <span className={`pt-1 font-bold text-champagne ${size === "lg" ? "text-2xl md:text-4xl" : ""}`}>:</span>
      <Unit v={s} l="ثانیه" />
    </div>
  );
}

/* ---------------------------- Product card -------------------------- */

export function ProductCard({ p, variant = "default" }: { p: ProductView; variant?: "default" | "deal" | "compact" }) {
  const pct = discount(p);
  const st = stockLabel(p.stock);
  const isDeal = variant === "deal" && p.dealPrice;
  return (
    <Link
      href={`/product/${p.slug}`}
      className={`group glass relative flex flex-col overflow-hidden rounded-[22px] transition-transform duration-300 active:scale-[0.98] ${
        variant === "compact" ? "min-w-[168px] max-w-[168px]" : "min-w-[248px] max-w-[300px] sm:min-w-0 sm:max-w-none"
      }`}
    >
      <div className={`relative overflow-hidden ${variant === "compact" ? "aspect-square" : "aspect-[4/4.2]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-transparent to-transparent" />
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {pct > 0 && <span className="rounded-full bg-oxblood px-2.5 py-1 text-xs font-black text-white shadow-lg shadow-oxblood/40">{toFa(pct)}٪ تخفیف</span>}
          {p.isNew && <span className="rounded-full border border-champagne/40 bg-graphite/70 px-2.5 py-1 text-[11px] font-bold text-champagne backdrop-blur">جدید</span>}
          {p.badge && !p.isNew && <span className="rounded-full border border-ivory/20 bg-graphite/70 px-2.5 py-1 text-[11px] font-bold text-ivory backdrop-blur">{p.badge}</span>}
        </div>
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-ivory-dim">
          <span>{p.brandName}</span>
          <span className={st.tone === "low" ? "text-oxblood-glow font-bold" : st.tone === "out" ? "text-ivory-dim" : "text-emerald-300/90"}>{st.text}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className={`font-bold leading-6 text-ivory ${variant === "compact" ? "text-sm line-clamp-2" : "text-[15px] line-clamp-2"}`}>{p.name}</h3>
        {variant !== "compact" && (
          <p className="text-xs text-ivory-dim">
            {p.color}
            {p.storage ? ` · ${p.storage}` : ""}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            {p.dealPrice ? (
              <>
                <span className="text-[11px] text-ivory-dim line-through decoration-oxblood-glow/70">{formatToman(p.price)}</span>
                <span className="text-base font-black text-ivory">
                  {formatToman(p.dealPrice)} <span className="text-[11px] font-medium text-ivory-dim">تومان</span>
                </span>
              </>
            ) : (
              <span className="text-base font-black text-ivory">
                {formatToman(p.price)} <span className="text-[11px] font-medium text-ivory-dim">تومان</span>
              </span>
            )}
          </div>
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isDeal ? "bg-oxblood text-white" : "border border-champagne/40 text-champagne"}`} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </span>
        </div>
        {isDeal && p.dealEndsAt && (
          <div className="mt-1 flex items-center justify-between rounded-xl border border-oxblood-glow/30 bg-oxblood-deep/40 px-2.5 py-1.5">
            <span className="text-[11px] text-ivory-dim">پایان تخفیف</span>
            <Countdown target={p.dealEndsAt} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}

/* -------------------------------- Nav ------------------------------- */

const NAV = [
  { href: "#deals", label: "شگفت‌انگیز" },
  { href: "#new", label: "جدیدترین‌ها" },
  { href: "#store", label: "فروشگاه" },
  { href: "#gallery", label: "گالری" },
  { href: "#partner", label: "همکاری" },
  { href: "#explore", label: "محصولات" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="حامی همراه">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-champagne/40 bg-gradient-to-br from-oxblood to-oxblood-deep shadow-lg shadow-oxblood/30">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0dcb0" strokeWidth="1.8" strokeLinecap="round">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-black tracking-tight text-ivory">حامی همراه</span>
        <span className="mt-1 text-[10px] tracking-[0.25em] text-champagne">HAMI HAMRAH</span>
      </span>
    </Link>
  );
}

export function Header({ solid = false }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(solid);
  useEffect(() => {
    if (solid) return;
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [solid]);
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6">
      <div className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-3 py-2 transition-all duration-500 md:px-5 ${scrolled || open ? "glass-strong" : ""}`}>
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-sm font-semibold text-ivory-dim transition-colors hover:text-ivory">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/shop" className="btn-gold hidden !min-h-[44px] px-5 text-sm md:inline-flex">
            ورود به فروشگاه
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-ivory/10 bg-white/5 text-ivory lg:hidden"
            aria-label="منو"
            aria-expanded={open}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h10" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="glass-strong mx-auto mt-2 max-w-7xl rounded-2xl p-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex min-h-[48px] items-center rounded-xl border border-ivory/10 bg-white/[0.03] px-4 text-sm font-semibold text-ivory">
                {n.label}
              </a>
            ))}
          </div>
          <Link href="/shop" onClick={() => setOpen(false)} className="btn-gold mt-3 w-full">
            ورود به فروشگاه کامل
          </Link>
        </div>
      )}
    </header>
  );
}

/* -------------------------- Sticky mobile CTA ----------------------- */

const CTA_BY_WORLD: Record<WorldKey, { label: string; href: string; tone: "gold" | "primary" } | null> = {
  hero: { label: "مشاهده فروشگاه", href: "#store", tone: "gold" },
  deals: { label: "خرید با تخفیف", href: "#deals-list", tone: "primary" },
  new: { label: "دیدن جدیدترین‌ها", href: "#new-list", tone: "gold" },
  store: { label: "ورود به فروشگاه کامل", href: "/shop", tone: "gold" },
  gallery: { label: "مسیر فروشگاه", href: "#footer", tone: "gold" },
  partner: { label: "درخواست همکاری", href: "#partner-form", tone: "primary" },
  explore: { label: "همه محصولات", href: "/shop", tone: "gold" },
  creative: { label: "لوازم جانبی", href: "/shop?brand=accessories", tone: "gold" },
  footer: null,
};

export function StickyCTA() {
  const [world, setW] = useState<WorldKey>(journey.world);
  useEffect(() => onWorldChange(setW), []);
  const cta = CTA_BY_WORLD[world];
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] transition-transform duration-500 md:hidden ${cta ? "translate-y-0" : "translate-y-full"}`}>
      <div className="glass-strong flex items-center gap-2 rounded-2xl p-2">
        <a href="tel:02100000000" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ivory/10 text-champagne" aria-label="تماس با مشاور">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.8 2Z" />
          </svg>
        </a>
        {cta && (
          <Link href={cta.href} className={`${cta.tone === "gold" ? "btn-gold" : "btn-primary"} h-12 flex-1`}>
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Section head -------------------------- */

export function SectionHead({ index, eyebrow, title, desc, align = "start" }: { index: string; eyebrow: string; title: string; desc?: string; align?: "start" | "center" }) {
  return (
    <Reveal className={`flex flex-col gap-3 ${align === "center" ? "items-center text-center" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-black tracking-[0.3em] text-champagne/70">{index}</span>
        <span className="h-px w-10 bg-gradient-to-l from-champagne/60 to-transparent" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h2 className="text-balance text-3xl font-black leading-[1.25] text-ivory md:text-5xl md:leading-[1.2]">{title}</h2>
      {desc && <p className="max-w-2xl text-balance text-sm leading-7 text-ivory-dim md:text-base md:leading-8">{desc}</p>}
    </Reveal>
  );
}
