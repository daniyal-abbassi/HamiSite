"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

/**
 * PillNav — pill navigation with a GSAP "rising circle" hover.
 *
 * Ported from a react-router/Tailwind original. Each adaptation is noted at its
 * site below; the prop surface is unchanged apart from one addition
 * (`circleColor`) that defaults to the original single-colour behaviour.
 *
 * The original's built-in mobile dropdown is NOT ported, and this component is
 * `hidden md:block` in the header for the same reason: mobile navigation is the
 * bottom dock (components/layout/MobileDock.tsx), not a second menu up here.
 * The site previously ran both a slide-over drawer and the dock, which is two
 * navigations to keep in sync and two answers to the same question; the drawer
 * was removed. PillNav renders the desktop pills only.
 */

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface PillNavProps {
  logo: ReactNode | string;
  logoAlt?: string;
  logoHref?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  /** Container background (and, unless `circleColor` is set, the rising circle). */
  baseColor?: string;
  /** Rising circle fill. Added so the container can be glass while the circle
   *  stays brand aqua; omit it and the original single-colour behaviour holds. */
  circleColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  initialLoadAnimation?: boolean;
  /** Hide the logo circle when the host already shows the brand mark, so the
   *  nav can sit inside a floating bar without nesting a pill in a pill. */
  showLogo?: boolean;
}

/* (3) The original defaulted to `hsl(var(--primary))`. This project stores its
   CSS variables as bare RGB triplets (`--primary: 201 162 39`) and consumes
   them as `rgb(var(--x) / <alpha>)`. Feeding those to hsl() yields an invalid
   colour, not a wrong one — it silently renders nothing. */
const DEFAULTS = {
  base: "rgb(var(--card))",
  circle: "rgb(var(--primary))",
  pill: "rgb(var(--foreground) / 0.06)",
  pillText: "rgb(var(--foreground) / 0.85)",
  hoverText: "rgb(var(--primary-foreground))",
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PillNav({
  logo,
  logoAlt = "لوگو",
  logoHref = "/",
  items,
  activeHref,
  className = "",
  ease = "power3.out",
  baseColor = DEFAULTS.base,
  circleColor,
  pillColor = DEFAULTS.pill,
  hoveredPillTextColor = DEFAULTS.hoverText,
  pillTextColor = DEFAULTS.pillText,
  initialLoadAnimation = true,
  showLogo = true,
}: PillNavProps) {
  /* Falls back to the live route so the header can stay a Server Component:
     the caller does not have to thread the current path down. */
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname;
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoMarkRef = useRef<HTMLSpanElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    /* (7) Honour the OS motion preference. The project's design system requires
       it, and a nav whose links animate on every hover is exactly the kind of
       motion the setting exists to suppress. Reduced motion keeps the colour
       change (which carries the hover affordance) and drops the movement. */
    const reduced = prefersReducedMotion();

    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        const pill = circle?.parentElement as HTMLElement | undefined;
        if (!circle || !pill) return;

        const { width: w, height: h } = pill.getBoundingClientRect();
        if (!w || !h) return;

        // Radius of a circle that, rising from below, fully covers the pill.
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

        const label = pill.querySelector<HTMLElement>(".pill-label");
        const hoverLabel = pill.querySelector<HTMLElement>(".pill-label-hover");

        tlRefs.current[index]?.kill();

        if (reduced) {
          // No travel: the hover label simply cross-fades in place.
          if (label) gsap.set(label, { y: 0 });
          if (hoverLabel) gsap.set(hoverLabel, { y: 0, opacity: 0 });
          const tl = gsap.timeline({ paused: true });
          tl.to(circle, { scale: 1.2, duration: 0.001 }, 0);
          if (hoverLabel) tl.to(hoverLabel, { opacity: 1, duration: 0.001 }, 0);
          tlRefs.current[index] = tl;
          return;
        }

        if (label) gsap.set(label, { y: 0 });
        if (hoverLabel) gsap.set(hoverLabel, { y: Math.ceil(h + 20), opacity: 0 });

        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.8, ease, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 0.6, ease, overwrite: "auto" }, 0);
        if (hoverLabel) tl.to(hoverLabel, { y: 0, opacity: 1, duration: 0.6, ease, overwrite: "auto" }, 0);
        tlRefs.current[index] = tl;
      });
    };

    layout();
    window.addEventListener("resize", layout);
    // Persian glyph metrics shift once Vazirmatn swaps in; re-measure after.
    document.fonts?.ready.then(layout).catch(() => {});

    if (initialLoadAnimation && !reduced) {
      if (logoRef.current) {
        gsap.fromTo(logoRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" });
      }
      if (navItemsRef.current) {
        /* (4) RTL: the original slid items in from x:-20, i.e. from the left.
           This document is dir="rtl", so entrances come from the right. */
        const rtl = document.documentElement.dir === "rtl";
        const listItems = navItemsRef.current.querySelectorAll("li");
        gsap.fromTo(
          listItems,
          { opacity: 0, x: rtl ? 20 : -20 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: "power2.out", delay: 0.2 },
        );
      }
    }

    return () => window.removeEventListener("resize", layout);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), { duration: 0.4, ease, overwrite: "auto" });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.3, ease, overwrite: "auto" });
  };

  const handleLogoEnter = () => {
    const mark = logoMarkRef.current;
    if (!mark || prefersReducedMotion()) return;
    logoTweenRef.current?.kill();
    logoTweenRef.current = gsap.to(mark, {
      rotate: 360,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
      overwrite: "auto",
      onComplete: () => gsap.set(mark, { rotate: 0 }),
    });
  };

  const isExternal = (href: string) =>
    /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#");

  const cssVars = {
    "--base": baseColor,
    "--circle": circleColor ?? baseColor,
    "--pill-bg": pillColor,
    "--hover-text": hoveredPillTextColor,
    "--pill-text": pillTextColor,
    "--nav-h": "48px",
    "--pill-pad-x": "20px",
    "--pill-gap": "6px",
  } as CSSProperties;

  const renderLogo = () => (
    /* (8) The mark is wrapped rather than being the ref'd <img> itself, so the
       rotation tween works the same whether a next/image element or an inline
       icon is passed in. */
    <span ref={logoMarkRef} className="grid place-items-center">
      {typeof logo === "string" && logo ? (
        <Image src={logo} alt={logoAlt} width={32} height={32} className="size-8 object-contain" />
      ) : (
        logo
      )}
    </span>
  );

  const pillClasses =
    /* (5) No `uppercase` / wide tracking: both are meaningless for Persian and
       uppercase actively mangles mixed Latin-Persian strings. */
    "relative overflow-hidden inline-flex items-center justify-center h-[calc(var(--nav-h)-12px)] self-center no-underline rounded-full box-border text-sm font-bold cursor-pointer";

  return (
    <div className={`relative ${className}`} style={cssVars}>
      <nav className="flex items-center gap-2" aria-label="ناوبری اصلی">
        {/* Logo — (6) links to logoHref ("/"), not items[0].href as the original did. */}
        {showLogo && (
          <Link
            ref={logoRef}
            href={logoHref}
            onMouseEnter={handleLogoEnter}
            aria-label="حامی همراه — صفحه اصلی"
            className="grid shrink-0 place-items-center overflow-hidden rounded-full transition-transform duration-fast hover:scale-105 active:scale-95"
            style={{ width: "var(--nav-h)", height: "var(--nav-h)", background: "var(--base)" }}
          >
            {renderLogo()}
          </Link>
        )}

        {/* Desktop pills */}
        <div
          ref={navItemsRef}
          className="hidden items-center rounded-full px-1.5 md:flex"
          style={{ height: "var(--nav-h)", background: "var(--base)" }}
        >
          <ul role="menubar" className="m-0 flex h-full list-none items-stretch p-0" style={{ gap: "var(--pill-gap)" }}>
            {items.map((item, i) => {
              const isActive = currentHref === item.href;
              const pillStyle: CSSProperties = {
                background: isActive ? "var(--circle)" : "var(--pill-bg)",
                color: isActive ? "var(--hover-text)" : "var(--pill-text)",
                paddingInline: "var(--pill-pad-x)",
              };

              const inner = (
                <>
                  <span
                    ref={(el) => { circleRefs.current[i] = el; }}
                    aria-hidden
                    className="hover-circle pointer-events-none absolute bottom-0 left-1/2 z-[1] block rounded-full"
                    style={{ background: "var(--circle)", willChange: "transform" }}
                  />
                  <span className="relative z-[2] inline-block overflow-hidden py-1 leading-none">
                    <span className="pill-label relative z-[2] inline-block" style={{ willChange: "transform" }}>
                      {item.label}
                    </span>
                    <span
                      aria-hidden
                      className="pill-label-hover absolute start-0 top-1 z-[3] inline-block w-full text-center"
                      style={{ color: "var(--hover-text)", willChange: "transform, opacity" }}
                    >
                      {item.label}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={item.href} role="none" className="flex items-center">
                  {/* (1) next/link, not react-router's Link. */}
                  {isExternal(item.href) ? (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={pillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      aria-current={isActive ? "page" : undefined}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link
                      role="menuitem"
                      href={item.href}
                      className={pillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      aria-current={isActive ? "page" : undefined}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

    </div>
  );
}

export default PillNav;
