"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

import { LiquidSelection, type LiquidSelectionItem } from "@/components/liquid/LiquidSelection";
import { prefersReducedMotion } from "@/components/liquid/motion";

/**
 * PillNav — the desktop header's pill navigation.
 *
 * Ported from a react-router/Tailwind original. The original answered "which page
 * am I on" with a GSAP **rising circle**: a circle scaled up from under each pill
 * on hover, taking a duplicate of the label with it. Feature 012 replaced that
 * with the site's one travelling marker, `components/liquid/LiquidSelection`, and
 * the circle is gone rather than coexisting with it — two selection indicators on
 * one surface is the failure mode FR-040 exists to prevent (T029).
 *
 * What that substitution removed, and why each piece had to go with it:
 *
 * - `hover-circle` spans, `circleRefs`, `tlRefs`, `activeTweenRefs`, the
 *   per-pill radius arithmetic, the resize/font re-measure (the marker owns its
 *   own ResizeObserver now), and `handleEnter`/`handleLeave`.
 * - `.pill-label` and `.pill-label-hover`. The second copy existed only to be
 *   scrolled into view as the circle rose; with no circle it is a duplicate of
 *   every nav name in the accessibility tree.
 * - `circleColor`, `pillColor`, `pillTextColor`, `hoveredPillTextColor`. The
 *   marker's body and its current label are one token decision inside
 *   `liquid-selection.module.css` — FR-016 makes them impossible to disagree, and
 *   it does that by not exposing a prop for either. A surface that could tint one
 *   and not the other would be re-opening that.
 * - `ease`, which fed nothing but the deleted tweens.
 * - Its own `prefersReducedMotion`, in favour of the port's single implementation
 *   (FR-021).
 *
 * What stayed: the glass container, the logo circle and its rotate-on-hover, and
 * the staggered entrance — none of which answers a one-of-N question.
 *
 * The original's built-in mobile dropdown is NOT ported, and this component is
 * `hidden md:block` in the header for the same reason: mobile navigation is the
 * bottom dock (components/layout/MobileDock.tsx), not a second menu up here.
 * PillNav renders the desktop pills only.
 *
 * The logo is deliberately OUTSIDE the marker group. It is a route to the home
 * page, but it is not a destination in the nav — marking it would make the brand
 * mark compete with «خانه» for the same answer, and the marker would sit under
 * the wrong thing whenever both point at `/`.
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
  /** The container the pills sit in, and the logo circle. Not the marker. */
  baseColor?: string;
  initialLoadAnimation?: boolean;
  /** Hide the logo circle when the host already shows the brand mark, so the
   *  nav can sit inside a floating bar without nesting a pill in a pill. */
  showLogo?: boolean;
}

/* (3) The original defaulted to `hsl(var(--primary))`. This project stores its
   CSS variables as bare RGB triplets (`--primary: 201 162 39`) and consumes
   them as `rgb(var(--x) / <alpha>)`. Feeding those to hsl() yields an invalid
   colour, not a wrong one — it silently renders nothing. */
const DEFAULT_BASE = "rgb(var(--card))";

/** `#anchor`, `tel:`, `mailto:` and real URLs must not go through the router. */
const isExternal = (href: string) =>
  /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#");

export function PillNav({
  logo,
  logoAlt = "لوگو",
  logoHref = "/",
  items,
  activeHref,
  className = "",
  baseColor = DEFAULT_BASE,
  initialLoadAnimation = true,
  showLogo = true,
}: PillNavProps) {
  /* Falls back to the live route so the header can stay a Server Component:
     the caller does not have to thread the current path down. */
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname;

  const logoMarkRef = useRef<HTMLSpanElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | null>(null);

  /* The marker rests under the item whose href is the live route, and under
     nothing when no item is — on /cart or a product page there is no pill to
     light up, and a marker defaulted to «خانه» there would claim the shopper is
     somewhere they are not (FR-017). */
  const current = items.some((item) => item.href === currentHref) ? currentHref : null;

  const lsItems: LiquidSelectionItem<string>[] = items.map((item) => ({
    id: item.href,
    // A `label` that is not a plain string is what makes the port publish
    // `aria-label` from `name` rather than reading it off the markup. Passed
    // through so every pill's accessible name is the string it was before T029
    // (SC-010) — including the `ariaLabel` override the original supported.
    label: <span>{item.label}</span>,
    name: item.ariaLabel ?? item.label,
    ...(isExternal(item.href) ? { href: item.href } : { to: item.href }),
  }));

  useEffect(() => {
    if (!initialLoadAnimation || prefersReducedMotion()) {
      return;
    }

    if (logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
      );
    }

    if (navItemsRef.current) {
      /* (4) RTL: the original slid items in from x:-20, i.e. from the left.
         This document is dir="rtl", so entrances come from the right.
         Measured as `x` transforms on the items, which is what the port reads
         `offsetLeft` for — layout, not composition — so the marker's own resting
         box is never measured through a mid-flight translate. */
      const rtl = document.documentElement.dir === "rtl";
      const pills = navItemsRef.current.querySelectorAll("[data-ls-item]");
      gsap.fromTo(
        pills,
        { opacity: 0, x: rtl ? 20 : -20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: "power2.out", delay: 0.2 },
      );
    }
  }, [initialLoadAnimation]);

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

  const cssVars = {
    "--base": baseColor,
    "--nav-h": "48px",
    "--pill-pad-x": "20px",
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

        {/* Desktop pills. The wrapper owns the responsive hide so the marker
            group never has to compete with a `display` utility of its own: the
            port's own class sets `display: flex` at the same specificity as a
            Tailwind utility, and which one wins would come down to stylesheet
            order. Gating the parent instead keeps that off the table. */}
        <div
          ref={navItemsRef}
          className="hidden items-center rounded-full px-1.5 md:flex"
          style={{ height: "var(--nav-h)", background: "var(--base)" }}
        >
          <LiquidSelection
            /* The group is content-width, not equalWidth: these three labels are
               different lengths, unlike the dock's five. */
            className="h-full"
            itemClassName="h-[calc(var(--nav-h)-12px)] self-center no-underline px-[var(--pill-pad-x)] text-sm font-bold"
            items={lsItems}
            value={current}
            announce="page"
            groupRole="menubar"
            itemRole="menuitem"
            /* Resting inset, so the body reads as a thing inside the pill rather
               than a block the size of it (FR-065). No `label`: the `nav` above
               already names this region, and giving the menubar its own
               accessible name here would be a control gaining one (SC-010). */
            markerInset={4}
          />
        </div>
      </nav>
    </div>
  );
}

export default PillNav;
