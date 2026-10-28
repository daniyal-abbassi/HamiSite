"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import DiscoverButton from "@/components/discover-button";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { PillNav, type PillNavItem } from "@/components/layout/PillNav";
import SmoothDropdown from "@/components/smooth-dropdown";
import hamiWordmark from "@/public/brand/قسمت-فارسی-لوگو-زمینه-سفید.png";
import hamiMarkAlpha from "@/public/brand/hami-mark-alpha.png";
import hamiWordmarkFa from "@/public/brand/hami-wordmark-fa.png";
import { cn } from "@/lib/utils";
import { nextHeaderScrollState, type HeaderScrollState } from "./header-scroll";
import "./header-glass.css";

const navItems: PillNavItem[] = [
  { href: "/", label: "خانه" },
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
  const scrollState = useRef<HeaderScrollState>({ lastY: 0, travel: 0, visible: true });

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

        // Accumulate small movements so a slow gesture can still change direction.
        scrollState.current = nextHeaderScrollState(scrollState.current, currentScrollY);
        setVisible(scrollState.current.visible);
      });
    };

    // Restored scroll (a reload or back-forward navigation) can land mid-page;
    // without this the floating pill rendered over deep content until the
    // first scroll event — exactly the «header floating over sections» capture.
    scrollState.current = { lastY: window.scrollY, travel: 0, visible: true };
    setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
    <Link
      href="/"
      className={cn("site-sticky-brand", scrolled && "site-sticky-brand--scrolled")}
      aria-label="حامی همراه — صفحه اصلی"
    >
      <Image
        src={hamiWordmark}
        alt=""
        sizes="(min-width: 768px) 144px, 112px"
        className="site-sticky-brand__image"
      />
    </Link>
    <header
      className={cn(
        "site-header-glass fixed inset-x-0 top-0 z-50",
        visible ? "translate-y-0" : "-translate-y-full",
        scrolled && "site-header-glass--scrolled"
      )}
    >
      <nav
        className="header-glass-surface header-glass-surface--pill mx-auto flex max-w-6xl items-center gap-1 rounded-full pe-1.5 md:pe-2 md:gap-3"
      >
        {/* On phones the brand is the mockup's white lockup — mark and wordmark
            from the official alpha files, inverted white over the solid oxblood
            bar. No tile: the bar itself is the brand surface. */}
        <Link href="/" aria-label="حامی همراه — صفحه اصلی" className="site-bar-brand shrink-0 md:hidden">
          <Image
            src={hamiMarkAlpha}
            alt=""
            priority
            sizes="40px"
            className="site-bar-brand__mark"
          />
          <Image
            src={hamiWordmarkFa}
            alt=""
            priority
            sizes="110px"
            className="site-bar-brand__wordmark"
          />
        </Link>
        <PillNav
          className="hidden shrink-0 lg:block"
          showLogo={false}
          logo=""
          items={navItems}
          baseColor="transparent"
        />
        <SmoothDropdown />

        {/* Compact utilities take only the space their controls need, leaving
            the brand and navigation clear at phone and desktop widths. */}
        <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1 md:gap-2">
          <DiscoverButton />

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
           * Hidden below xl. At 360px this CTA took ~174 of 336px and squeezed the
           * search field into a ~58px empty pill, and «شروع همکاری» already appears
           * twice in the first screen because the hero repeats it (audits/05).
           *
           * T086 moved the cut from `md` to `xl` because hiding it at 360 did not
           * fix the row, it moved the failure: at 768px this link measured
           * -194..-16 and at 1024px -40..138 — the primary B2B call-to-action was
           * entirely off-canvas at the first breakpoint where the class said to
           * show it, and partly off at the second. `hidden` is honest about that
           * (no focus stop on an invisible control); being clipped is not.
           * The footer's «همکاری عمده (B2B)» and the dock both reach /partners on
           * every width, so FR-042's same-destinations rule still holds — FR-041
           * asked for composition rather than clipping, and this is that.
           */}
          <Link
            href="/partners"
            className="lightbeam-cta hidden h-9 md:h-10 items-center gap-1.5 rounded-full px-5 text-xs md:text-sm font-bold text-wine-950 transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 xl:inline-flex shrink-0"
          >
            شروع همکاری
            <ArrowLeft className="size-3.5 md:size-4" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
    </>
  );
}
