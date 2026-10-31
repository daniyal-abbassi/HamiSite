"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Where each piece lies before it is placed: its centre as a percentage of the stage, and its tilt. */
const SCATTER = [
  { x: 52, y: 24, rotate: -5 },
  { x: 28, y: 47, rotate: -9 },
  { x: 74, y: 58, rotate: 8 },
  { x: 86, y: 36, rotate: 14 },
  { x: 16, y: 72, rotate: -13 },
  { x: 46, y: 60, rotate: 11 },
  { x: 84, y: 68, rotate: -16 },
  { x: 42, y: 79, rotate: 5 },
];

export function AssemblyMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const pieces = gsap.utils.toArray<HTMLElement>("[data-piece]", node);
      const frame = node.querySelector("[data-assembly-frame]");

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      pieces.forEach((piece, index) => {
        const scatter = SCATTER[index % SCATTER.length]!;
        // Offsets are layout boxes, untouched by the transform, so these hold across a refresh.
        const seat = () => {
          const panel = piece.offsetParent as HTMLElement;
          return {
            x: panel.offsetLeft + piece.offsetLeft + piece.offsetWidth / 2,
            y: panel.offsetTop + piece.offsetTop + piece.offsetHeight / 2,
          };
        };
        timeline.from(piece, {
          x: () => (scatter.x * window.innerWidth) / 100 - seat().x,
          y: () => (scatter.y * window.innerHeight) / 100 - seat().y,
          rotate: scatter.rotate,
          scale: 0.82,
          "--r": "20px",
          duration: 0.62,
        }, index * 0.05);
      });
      if (frame) timeline.from(frame, { opacity: 0, scale: 1.03, duration: 0.14 }, ">-0.04");
      // A beat of stillness, so the finished arch is read before the page moves on.
      timeline.to({}, { duration: 0.16 });
    });

    /* Sections above stream in after this mounts and move the trigger, and nothing else reports that. */
    let pending: gsap.core.Tween | undefined;
    const observer = new ResizeObserver(() => {
      pending?.kill();
      pending = gsap.delayedCall(0.2, () => ScrollTrigger.refresh());
    });
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      pending?.kill();
      media.revert();
    };
  }, []);

  return <div ref={root} className="assembly__track">{children}</div>;
}
