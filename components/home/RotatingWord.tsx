"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * The headline's last word, flipping on a loop — a split-flap style rotation
 * on the X axis: the outgoing word falls away as the incoming one swings up
 * into its place.
 *
 * Driven by GSAP rather than a new animation dependency, because GSAP is
 * already in the bundle for PillNav. Adding framer-motion for one word would
 * have cost ~50KB to do something a dozen lines of GSAP already does.
 *
 * Two properties this has to hold:
 *
 * 1. **No layout shift.** Every candidate word occupies the same grid cell, so
 *    the box is always as wide as the longest word and the sentence never
 *    reflows mid-flip. Measuring in JS would reflow on first paint.
 * 2. **One accessible reading.** The flipper is decorative repetition: it is
 *    hidden from assistive tech and the phrase is exposed once as visually
 *    hidden text. Announcing a new word every few seconds would hijack a
 *    screen reader for as long as the page stays open.
 *
 * Under reduced motion it settles on the first word and stops.
 */
export function RotatingWord({
  words,
  intervalMs = 2800,
  className = "",
}: {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const slots = useRef<Array<HTMLSpanElement | null>>([]);
  const shown = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  useEffect(() => {
    const from = shown.current;
    const to = index;
    if (from === to) return;
    shown.current = to;

    const outEl = slots.current[from];
    const inEl = slots.current[to];
    if (!outEl || !inEl) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(outEl, { autoAlpha: 0 });
      gsap.set(inEl, { autoAlpha: 1, rotateX: 0, y: 0 });
      return;
    }

    // Hinge about the text's own centre line so it reads as one card flipping,
    // not two separate words crossfading past each other.
    gsap.set(inEl, { autoAlpha: 1, rotateX: -92, y: "0.32em", transformOrigin: "50% 50%" });
    gsap.to(outEl, {
      rotateX: 92,
      y: "-0.32em",
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.in",
      overwrite: "auto",
    });
    gsap.to(inEl, {
      rotateX: 0,
      y: 0,
      autoAlpha: 1,
      duration: 0.55,
      delay: 0.13,
      ease: "power3.out",
      overwrite: "auto",
    });
  }, [index]);

  return (
    <>
      <span
        className={`relative inline-grid align-bottom ${className}`}
        style={{ perspective: "600px" }}
        aria-hidden="true"
      >
        {words.map((word, i) => (
          <span
            key={word}
            ref={(el) => {
              slots.current[i] = el;
            }}
            // One shared cell: the grid takes the width of the longest word.
            className="col-start-1 row-start-1 whitespace-nowrap"
            style={{
              backfaceVisibility: "hidden",
              opacity: i === 0 ? 1 : 0,
              visibility: i === 0 ? "visible" : "hidden",
            }}
          >
            {word}
          </span>
        ))}
      </span>
      <span className="sr-only">{words.join("، ")}</span>
    </>
  );
}
