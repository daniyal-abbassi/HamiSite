"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * FlipWords — adapted from ui.aceternity.com/components/flip-words.
 *
 * The motion is the original's: the incoming word springs up from below as the
 * outgoing one lifts, drifts sideways, blurs and scales away.
 *
 * Two deliberate departures from the upstream component, both required here:
 *
 * 1. **No per-letter split.** The original splits each word into characters and
 *    wraps every one in its own `inline-block` span. Latin survives that;
 *    Persian does not. Arabic-script letters join contextually, and isolating
 *    each one forces its standalone form — "موبایل" renders as "م و ب ا ی ل".
 *    The animation therefore runs on the whole word.
 * 2. **No layout shift.** Upstream absolutely-positions the exiting word, so
 *    the container collapses to the incoming word's width and the sentence
 *    reflows on every flip. Here all candidates are stacked in one invisible
 *    grid cell that reserves the widest word, and the animated layer sits on
 *    top of it.
 *
 * Under reduced motion it settles on the first word and stops cycling.
 */
export function FlipWords({
  words,
  duration = 2800,
  className,
}: {
  words: readonly string[];
  duration?: number;
  className?: string;
}) {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const startAnimation = useCallback(() => {
    const next = words[(words.indexOf(currentWord) + 1) % words.length];
    setCurrentWord(next);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (reduced || isAnimating) return;
    const id = setTimeout(startAnimation, duration);
    return () => clearTimeout(id);
  }, [isAnimating, duration, startAnimation, reduced]);

  return (
    <span className={cn("relative inline-grid align-bottom", className)}>
      {/* Sizer: every candidate in one cell, so the box is always as wide as
          the longest word and the headline never reflows mid-flip. */}
      {words.map((w) => (
        <span key={w} className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">
          {w}
        </span>
      ))}

      <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
          exit={{
            opacity: 0,
            y: -10,
            position: "absolute",
            transition: { duration: 0.14, ease: [0.2, 0.7, 0.3, 1] },
          }}
          className="col-start-1 row-start-1 inline-block whitespace-nowrap"
          aria-hidden="true"
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>

      {/* The phrase read once, in order, instead of announcing every flip. */}
      <span className="sr-only">{words.join("، ")}</span>
    </span>
  );
}
