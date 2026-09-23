"use client";

/**
 * The categories carousel — feature 005.
 *
 * Nine departments on an arc. Embla owns drag, inertia, snapping, looping and RTL scroll physics
 * (`research.md` D2); this file owns the bend, the keyboard, and the accessibility state.
 *
 * The one thing this component must never do is touch the page's own scroll. The reference it is
 * modelled on attaches its wheel and pointer listeners to the document, so a cursor crossing the
 * section converts a shopper's vertical scroll into horizontal carousel movement — on a 19,134px
 * homepage that is the single most damaging property a section can have, and FR-016 and contract G1
 * exist to forbid it. Embla cannot exhibit that bug: it listens inside its own viewport node, claims
 * only its own axis, and its wheel handling is a separate plugin that is not installed. So the
 * guarantee is structural. There is deliberately no `addEventListener` on `window` or `document`
 * anywhere in this file, and adding one should be treated as a defect rather than a feature decision.
 *
 * Server-rendered, this is a plain list of nine working links with no arc and no motion. That is the
 * fallback (FR-021, contract F1) rather than a mode: the animation is layered onto the markup, so a
 * hydration failure degrades to a usable category list instead of to an empty band.
 */

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Department } from "@/lib/category-departments";
import { toFaDigits } from "@/lib/utils";
import "./category-carousel.css";

/**
 * How many panels one flick may carry. Embla's inertia is velocity-driven and a hard swipe will
 * happily skip five panels to the far side of the loop; FR-014 requires a shopper intending one
 * panel not to travel three, and SC-004 measures it at 9 in 10. The cap is enforced after the fact
 * by re-issuing a bounded scroll, because Embla exposes no maximum-travel option.
 */
const MAX_FLICK_TRAVEL = 2;

/**
 * Where the shopper left the carousel, kept for the rest of the visit (FR-015, contract A7).
 * Module-scoped rather than `localStorage`: a fresh page load legitimately starts at the first
 * department, and persisted state would disagree with the server-rendered first frame. It also has
 * to survive Embla being destroyed and rebuilt at a viewport boundary, where a component-local
 * value would be lost.
 */
let rememberedIndex = 0;

/** Shortest signed distance on a loop of `count` panels, so a bend never sends a panel the long way. */
function wrappedOffset(from: number, to: number, count: number): number {
  let d = from - to;
  const half = count / 2;
  if (d > half) d -= count;
  if (d < -half) d += count;
  return d;
}

export function CategoryCarousel({ departments }: { departments: Department[] }) {
  const count = departments.length;
  const [viewportRef, embla] = useEmblaCarousel({
    axis: "x",
    // RTL is not a mirror here: Embla's `direction` flips the scroll axis, so `align: "center"` and
    // `loop` behave the same way and the only RTL-specific work left is the sign of the bend.
    direction: "rtl",
    align: "center",
    loop: true,
    // `containScroll` is intentionally absent — it has no effect with `loop: true`, and leaving it in
    // would suggest a containment rule that is not running.
  });

  const [live, setLive] = useState(true);
  const [activeIndex, setActiveIndex] = useState(rememberedIndex);
  const slideRefs = useRef<Array<HTMLLIElement | null>>([]);
  const frame = useRef<number | null>(null);
  // Embla's viewport ref is a callable ref, not a RefObject, so the node is kept separately for the
  // observer below.
  const nodeRef = useRef<HTMLElement | null>(null);

  /**
   * The arc. Two custom properties per slide, written on Embla's own frame tick.
   *
   * No `translate` term: Embla's track already moves the slides and a second offset derived from the
   * same progress would double-apply the motion, putting the bend ahead of the finger driving it.
   * No `setState` here either — a per-frame React render is precisely what FR-020 and contract P4
   * forbid, and it would cost more than the animation it is meant to express.
   */
  const paintArc = useCallback(
    (progress: number) => {
      const position = progress * (count - 1);
      for (let i = 0; i < count; i += 1) {
        const node = slideRefs.current[i];
        if (!node) continue;
        const offset = wrappedOffset(i, position, count);
        const distance = Math.min(Math.abs(offset), 4);
        node.style.setProperty("--o", offset.toFixed(3));
        node.style.setProperty("--d", (distance / 4).toFixed(3));
        node.style.setProperty("--zi", String(Math.round(distance)));
      }
    },
    [count],
  );

  useEffect(() => {
    if (!embla || !live) return;

    /**
     * The flick cap. Embla has no maximum-travel option, so a hard swipe is bounded after the fact:
     * if the newly selected panel is further than MAX_FLICK_TRAVEL from where the shopper was, the
     * carousel is re-issued a bounded scroll toward it. The short-arc distance is used rather than
     * the raw index difference, because with `loop: true` travelling 2 panels backwards through the
     * wrap is the same gesture as travelling 7 forwards, and a naive difference would clamp almost
     * every flick.
     */
    const lastSnap = { current: embla.selectedScrollSnap() };
    const onSelect = () => {
      const next = embla.selectedScrollSnap();
      const delta = wrappedOffset(next, lastSnap.current, count);
      if (Math.abs(delta) > MAX_FLICK_TRAVEL) {
        const bounded = (lastSnap.current + Math.sign(delta) * MAX_FLICK_TRAVEL + count) % count;
        rememberedIndex = bounded;
        embla.scrollTo(bounded);
        setActiveIndex(bounded);
        lastSnap.current = bounded;
        return;
      }
      lastSnap.current = next;
      rememberedIndex = next;
      setActiveIndex(next);
    };

    const read = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        paintArc(embla.scrollProgress());
      });
    };

    read();
    embla.on("scroll", read).on("reInit", read);
    embla.on("select", onSelect);
    return () => {
      embla.off("scroll", read).off("reInit", read).off("select", onSelect);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [embla, live, count, paintArc]);

  /**
   * Off-screen, Embla is destroyed rather than paused (FR-019, contract P1). One call removes its
   * scroll watch, its resize interpreter and its snap loop, which is a smaller surface to be wrong
   * than a hand-rolled "ignore events while hidden" flag — and it cannot leak a frame.
   *
   * Re-entry restores the remembered index without animating, so the shopper finds the section
   * exactly as they left it and no entrance replays (US3/3, US3/4).
   */
  useEffect(() => {
    const node = nodeRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (embla && live) embla.scrollTo(rememberedIndex, true);
  }, [embla, live]);

  const goTo = useCallback(
    (index: number, fromKeyboard = false) => {
      if (!embla) return;
      const next = ((index % count) + count) % count;
      rememberedIndex = next;
      embla.scrollTo(next);
      setActiveIndex(next);
      if (fromKeyboard) {
        // Contract K3: keyboard position and visual position must never disagree. Without this the
        // roving tabindex stays on the panel you tabbed into while the carousel has moved on, so the
        // shopper is pressing keys that act on one panel and Enter activates another.
        // `preventScroll` keeps the browser from scrolling the page to reveal the focused link,
        // which would be the one way this component could touch vertical scroll.
        requestAnimationFrame(() => {
          slideRefs.current[next]?.querySelector<HTMLAnchorElement>(".cat-panel")?.focus({ preventScroll: true });
        });
      }
    },
    [embla, count],
  );

  /**
   * Keyboard. The section is one tab stop and the arrow keys move the active panel, which is what
   * makes every department reachable without a gesture (FR-027, contract K1).
   *
   * `ArrowRight` advances in **reading** order, not screen order. In an RTL document reading forward
   * runs to the left, so right goes back — a physical mapping would be a bug, not a preference
   * (FR-028, contract K2).
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const forward = () => goTo(activeIndex + 1, true);
    const back = () => goTo(activeIndex - 1, true);
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        forward();
        return;
      case "ArrowRight":
        event.preventDefault();
        back();
        return;
      case "Home":
        event.preventDefault();
        goTo(0, true);
        return;
      case "End":
        event.preventDefault();
        goTo(count - 1, true);
        return;
      default:
      // Enter and Space reach the focused link natively; nothing to intercept.
    }
  };

  return (
    <div
      className="cat-carousel"
      data-live={live}
      ref={(node) => {
        viewportRef(node);
        nodeRef.current = node;
      }}
      role="group"
      aria-roledescription="carousel"
      aria-label="دسته‌بندی‌های محصولات"
      onKeyDown={onKeyDown}
    >
      <ul className="cat-track">
        {departments.map((department, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              className="cat-slide"
              key={department.kind}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${toFaDigits(index + 1)} از ${toFaDigits(count)}`}
            >
              <Link
                href={department.href}
                className="cat-panel"
                data-active={isActive}
                // Roving tabindex: one stop for the whole carousel, and the panel you land on is the
                // active one, so keyboard position and visual position can never disagree (K3).
                tabIndex={isActive ? 0 : -1}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => {
                  // 005 contract A2 / FR-010: a press on the active panel navigates, a press on any
                  // other brings it to centre. This deliberately diverges from 004's brand rows,
                  // which navigate on the first press — 001's T059 asked for that behaviour here too
                  // and 005's spec forbids it, so the conflict is the owner's to settle, not this
                  // component's to quietly pick a side of. See
                  // specs/001-premium-rtl-storefront/notes/band2-decisions.md.
                  if (!isActive) {
                    event.preventDefault();
                    goTo(index);
                  }
                }}
              >
                <span className="cat-panel__art">
                  {department.badge ? (
                    <Image
                      src={department.badge}
                      alt=""
                      width={800}
                      height={960}
                      className="cat-panel__image"
                      unoptimized
                    />
                  ) : null}
                </span>
                <span className="cat-panel__label">{department.label}</span>
                {/* FR-005: a count appears only where the destination genuinely holds that many.
                    The phones department is silent by rule, not by omission — 134 exist and the
                    route reaches 8, so any number here would either overstate or understate. */}
                {department.showsCount ? (
                  <span className="cat-panel__count">{toFaDigits(department.reachableCount)} محصول</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="cat-carousel__controls">
        <span className="cat-carousel__status" aria-live="polite">
          {departments[activeIndex]?.label} · {toFaDigits(activeIndex + 1)} از {toFaDigits(count)}
        </span>
        <span className="cat-carousel__nav">
          {/* Pointer users advance without dragging (FR-029, K4). Not the wheel: consuming a vertical
              wheel event over the section is exactly what contract I4 forbids. */}
          <button
            type="button"
            aria-label="دسته‌بندی قبلی"
            onClick={() => goTo(activeIndex - 1)}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="دسته‌بندی بعدی"
            onClick={() => goTo(activeIndex + 1)}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        </span>
      </div>
    </div>
  );
}
