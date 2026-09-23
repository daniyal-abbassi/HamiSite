"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { PillNav, type PillNavItem } from "@/components/layout/PillNav";
import { storeContact } from "@/lib/content/contact";
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

          {/*
           * Visible at every width now. It was `hidden … md:flex`, and `UserMenu` is
           * the only shopper-facing sign-out in the app — so a signed-in phone
           * shopper could reach /orders and could never leave the account (FR-042
           * asks phone and desktop to reach the same destinations). The control is
           * itself already responsive (name chip above sm, avatar below).
           */}
          <div className="flex items-center gap-1">
            <UserMenu />
          </div>
          <CartButton />

          {/*
           * FR-039: one interaction from any product to a human. On a phone the
           * dock carries the dial request; this is its desktop equivalent, because
           * the only other route to a number on this site is the footer, which on
           * a product page is twenty screens of scrolling below the buy box.
           * Compact at md (icon only) so it does not repeat the squeeze that made
           * «شروع همکاری» hide below md; the digits return at lg.
           */}
          <a
            href={storeContact.phoneHref}
            aria-label={`تماس با فروشگاه ${storeContact.phoneDisplay}`}
            className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-champagne/25 bg-ink/60 px-3 text-xs font-bold text-foreground/80 transition-colors hover:border-champagne/50 hover:text-foreground md:inline-flex lg:h-9"
          >
            <Phone className="size-4 text-champagne" aria-hidden="true" />
            <b dir="ltr" className="hidden font-mono lg:inline">
              {storeContact.phoneDisplay}
            </b>
          </a>

          {/*
           * Hidden below md. At 360px this CTA took ~174 of 336px and squeezed the
           * search field into a ~58px empty pill, and «شروع همکاری» already appears
           * twice in the first screen because the hero repeats it (audits/05). The
           * footer and the dock both reach /partners, so nothing is lost on phone —
           * FR-041 asked for composition rather than clipping, and this is that.
           */}
          <Link
            href="/partners"
            className="shiny-edge hidden h-12 items-center gap-2 px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95 md:inline-flex"
          >
            شروع همکاری
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
