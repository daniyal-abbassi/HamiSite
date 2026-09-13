"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { PillNav, type PillNavItem } from "@/components/layout/PillNav";
import hamiMark from "@/public/brand/hami-mark.png";
import { cn } from "@/lib/utils";

const navItems: PillNavItem[] = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/partners", label: "همکاری عمده" },
];

/**
 * Responsive luxury header:
 * - At top of page: floating glass pill island
 * - When scrolled: docked full-width obsidian glass bar with champagne hairline
 *   border that cleanly masks content scrolling beneath it, preventing any
 *   overlapping lines, text, or ghost borders.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    /* One rAF per burst of scroll events instead of one handler per event:
       the listener only schedules a frame, so a fast flick costs a single
       layout read and at most one state update per frame — not per pixel.
       setState with an unchanged value bails out before re-rendering, so the
       steady-state cost while scrolling is zero renders. */
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const currentScrollY = window.scrollY;

        // Scrolled past initial hero threshold
        setScrolled(currentScrollY > 20);

        // Smart auto-hide: hide on scroll down to leave reading view completely clean;
        // reveal on scroll up for quick navigation; always reveal near the very top.
        if (currentScrollY <= 40) {
          setVisible(true);
        } else if (currentScrollY > lastScrollY.current + 6) {
          // Scrolling down
          setVisible(false);
        } else if (currentScrollY < lastScrollY.current - 6) {
          // Scrolling up
          setVisible(true);
        }

        lastScrollY.current = currentScrollY;
      });
    };

    // Restored scroll (a reload or back-forward navigation) can land mid-page;
    // without this the floating pill rendered over deep content until the
    // first scroll event — exactly the «header floating over sections» capture.
    setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out",
        visible ? "translate-y-0" : "-translate-y-full",
        scrolled
          ? "border-b border-champagne/15 bg-[#0B0204] py-2.5 px-4 shadow-monolith"
          : "bg-transparent px-4 pt-4 md:pt-6"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center gap-2 transition-all duration-300 md:gap-3",
          scrolled
            ? "px-1 py-0"
            : "rounded-full border border-champagne/20 bg-[#14060A] px-3 py-2 shadow-monolith backdrop-blur-2xl"
        )}
      >
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2.5 px-1 md:min-h-0 md:ps-1 md:pe-0"
          aria-label="حامی همراه — صفحه اصلی"
        >
          <Image
            src={hamiMark}
            alt=""
            priority
            sizes="36px"
            className="size-9 rounded-xl bg-white/95 ring-1 ring-champagne/40"
          />
          <span className="hidden text-[15px] font-black tracking-tight text-foreground sm:block">
            حامی همراه
          </span>
        </Link>

        <PillNav
          className="hidden md:block"
          showLogo={false}
          logo=""
          items={navItems}
          baseColor="transparent"
          circleColor="rgb(var(--primary))"
          pillColor="rgb(var(--foreground) / 0.05)"
          pillTextColor="rgb(var(--foreground) / 0.85)"
          hoveredPillTextColor="rgb(var(--primary-foreground))"
        />

        {/* On mobile this group takes the remaining width so the search field
            can fill it; from md it collapses to its content and `ms-auto`
            pushes it to the end, which is the desktop layout unchanged. */}
        <div className="ms-auto flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <form action="/shop" role="search" aria-label="جستجوی محصول" className="min-w-0 flex-1 md:flex-none">
            <Input
              type="search"
              name="q"
              placeholder="جستجوی محصول…"
              aria-label="جستجوی محصول"
              className="h-11 w-full rounded-full border border-champagne/20 bg-ink/60 px-4 text-xs transition-colors placeholder:text-muted-foreground/60 focus:border-champagne/50 md:h-9 md:w-52"
            />
          </form>

          <div className="hidden items-center gap-1 md:flex">
            <UserMenu />
          </div>
          <CartButton />

          <Link
            href="/partners"
            className="shiny-edge inline-flex h-12 items-center gap-2 px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            شروع همکاری
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
