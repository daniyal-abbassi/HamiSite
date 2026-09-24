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
import hamiWordmark from "@/public/brand/قسمت-فارسی-لوگو.png";
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
            : "rounded-full border border-champagne/20 bg-[#14060A] px-3 py-2 shadow-monolith"
        )}
      >
        {/*
         * T082: the identity is the shop's own supplied wordmark, not a redrawn
         * derivative. This used to be `hami-mark.png` — a 1254×1254 source file
         * scaled into a 36px square, with the name it stands for hidden below `sm`,
         * so at 360 and 390 the header carried a shape no shopper could read as a
         * shop name. The Assumption is that the official files are used as supplied
         * and not redrawn, and `قسمت-فارسی-لوگو.png` is exactly that: the Persian
         * lockup on the brand's own oxblood, which is why it needs no plate, no
         * ring and no gradient behind it. It is the name, so nothing repeats it.
         */}
        <Link
          href="/"
          className="flex shrink-0 items-center px-1 md:ps-1 md:pe-0"
          aria-label="حامی همراه — صفحه اصلی"
        >
          <Image
            src={hamiWordmark}
            alt="حامی همراه"
            priority
            sizes="(min-width: 768px) 92px, 78px"
            className="h-10 w-[78px] rounded-lg md:h-11 md:w-[92px]"
          />
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
          <form action="/shop" role="search" aria-label="جست‌وجوی محصول" className="min-w-0 flex-1 md:flex-none">
            {/*
             * T086: the visible hint is shorter than the field's name on purpose.
             * Measured at 360px the search box is 104px wide with 24px of padding,
             * so it has ~78px of text area, and «جست‌وجوی محصول…» renders 109px in
             * the page's own 12px face — it was being cut mid-word on every phone.
             * No padding change closes a 31px gap, so the hint gives way and the
             * accessible name does not: `aria-label` still says the whole phrase.
             */}
            <Input
              type="search"
              name="q"
              placeholder="جست‌وجو…"
              aria-label="جست‌وجوی محصول"
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
           *
           * T086: this opened at `md`, and measured at 768px the control sat at
           * x=-8..34 — eight of its 42px past the left edge, clipped by the
           * `overflow-x` on the wrapper, so it was invisible to a pointer and still
           * reachable by Tab. It starts at `lg`, where it measures 146..290 and is
           * wholly on canvas. Compact at lg (icon only); the digits return at xl.
           */}
          <a
            href={storeContact.phoneHref}
            aria-label={`تماس با فروشگاه ${storeContact.phoneDisplay}`}
            className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-champagne/25 bg-ink/60 px-3 text-xs font-bold text-foreground/80 transition-colors hover:border-champagne/50 hover:text-foreground lg:inline-flex xl:h-9"
          >
            <Phone className="size-4 text-champagne" aria-hidden="true" />
            <b dir="ltr" className="hidden font-mono xl:inline">
              {storeContact.phoneDisplay}
            </b>
          </a>

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
            className="cta-quiet hidden h-12 items-center gap-2 px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 active:scale-95 xl:inline-flex"
          >
            شروع همکاری
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
