"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Split a subtree into whitespace-delimited WORD spans (never per letter —
 *  FR-002: separating Persian letters breaks glyph joining), preserving the
 *  spaces as text so wrapping is unchanged. Inline elements (emphasis/em)
 *  pass through and are split inside. */
function splitWords(node: React.ReactNode, ctx: { i: number }): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (typeof child === "string") {
      return child.split(/(\s+)/).map((part, j) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={j} className="heading-arrival__word" style={{ transitionDelay: `${ctx.i++ * 45}ms` }}>
            {part}
          </span>
        ),
      );
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return React.cloneElement(child, undefined, splitWords(child.props.children, ctx));
    }
    return child;
  });
}

/**
 * Heading arrival (feature 007 / US1): words lift into place and resolve from
 * soft to sharp, once per page load. Extends `Reveal`'s fail-open contract —
 * SSR renders the heading fully visible; only after mount is an
 * out-of-view heading armed, and headings already in view never animate.
 * The settled DOM is the original tree plus classes, so the settled heading is
 * pixel-identical (SC-002). Reduced motion returns the children untouched.
 */
export function HeadingArrival({
  id,
  level,
  children,
  className,
}: {
  id: string;
  level: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = React.useState<"idle" | "armed" | "settled">("idle");
  const [plain, setPlain] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlain(true);
      return;
    }
    const rect = node.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (inView) {
      setPhase("settled");
      return;
    }
    setPhase("armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("settled");
          observer.disconnect(); // once per page load — never replays on scroll back
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The three levels are the same element type to React's ref; narrow to h2's props.
  const Tag = `h${level}` as "h2";
  return (
    <Tag
      id={id}
      ref={ref}
      className={cn("heading-arrival", phase !== "idle" && `heading-arrival--${phase}`, className)}
    >
      {plain ? children : splitWords(children, { i: 0 })}
    </Tag>
  );
}
