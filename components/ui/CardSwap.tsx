"use client";

import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A stack of cards in 3D perspective that cycles: the front card drops away and
 * returns to the back while the rest promote forward.
 *
 * Adapted from a supplied reference implementation. GSAP 3.15 was already a
 * dependency, so this adds no bundle weight; the reference's `framer-motion`
 * dependency is not needed — it was listed but never imported.
 *
 * ## Four things the reference version did not do
 *
 * The reference is a good animation and an incomplete component. Each of these
 * is a rule this project is already held to elsewhere:
 *
 * 1. **No stop control.** Auto-rotating content must offer one, and must also
 *    stop on hover *and* on keyboard focus — otherwise a keyboard user tabbing
 *    into a card has it yanked out from under them mid-read.
 * 2. **No `prefers-reduced-motion` handling.** This project already kills the
 *    star drift and the CTA's spinning rim under that query; an auto-cycling
 *    3D stack is precisely the kind of motion it exists to stop. Under reduced
 *    motion the stack renders statically and the cycle never starts — the
 *    control still lets someone advance it deliberately.
 * 3. **The timeline was never killed.** `clearInterval` alone leaves an
 *    in-flight GSAP timeline animating detached nodes after unmount.
 * 4. **`x: i * distX` assumes LTR.** The page is RTL, and GSAP transforms are
 *    physical, so the stack leaned the wrong way against the reading
 *    direction. `dirSign` flips it.
 *
 * ## What it is not
 *
 * It shows one card at a time, so it is wrong for anything a visitor needs to
 * compare — prices, specs, options. Use it for a small set of equal,
 * non-comparative statements. Below `lg` the caller should render a plain grid
 * instead; a 3D stack cannot be made to work in 390px without becoming a
 * different component.
 */

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  /** Horizontal offset per card in the stack. */
  cardDistance?: number;
  /** Vertical offset per card in the stack. */
  verticalDistance?: number;
  /** Milliseconds between swaps. */
  delay?: number;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  onCardClick?: (idx: number) => void;
  /** Labels the stack for assistive tech, and names the pause control. */
  label: string;
  children: ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={cn(
      "absolute left-1/2 top-1/2 rounded-2xl border border-line bg-card shadow-deep",
      "[backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform]",
      customClass,
      rest.className,
    )}
  />
));
Card.displayName = "Card";

type CardRef = RefObject<HTMLDivElement | null>;
interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number, dirSign: number): Slot => ({
  x: i * distX * dirSign,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number, dirSign: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew * dirSign,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });

export function CardSwap({
  width = 460,
  height = 300,
  cardDistance = 48,
  verticalDistance = 44,
  delay = 4600,
  skewAmount = 5,
  easing = "elastic",
  onCardClick,
  label,
  children,
}: CardSwapProps) {
  const childArr = useMemo(() => Children.toArray(children) as ReactElement<CardProps>[], [children]);
  const refs = useMemo<CardRef[]>(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length],
  );

  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const swapRef = useRef<() => void>(() => {});

  // `null` until the media query is read, so the first paint never starts a
  // cycle we are about to cancel.
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mq.matches);
      if (mq.matches) setPlaying(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const config = useMemo(
    () =>
      easing === "elastic"
        ? { ease: "elastic.out(0.6,0.9)", durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 }
        : { ease: "power1.inOut", durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 },
    [easing],
  );

  const dirSign = useMemo(() => {
    if (typeof document === "undefined") return 1;
    return document.documentElement.dir === "rtl" ? -1 : 1;
  }, []);

  /** One swap. Kept in a ref so the interval always calls the current closure. */
  const swap = useCallback(() => {
    if (order.current.length < 2) return;
    const [front, ...rest] = order.current;
    const elFront = refs[front]?.current;
    if (!elFront) return;

    const total = refs.length;
    tlRef.current?.kill();
    const tl = gsap.timeline();
    tlRef.current = tl;

    // Drop far enough to clear the stack, derived from the card height rather
    // than a fixed 460px. Hardcoded, it was tuned for a 300px card; at 380px the
    // front card fell short of clearing and at any larger size the travel would
    // spill further out of the section than the layout reserves for it.
    const drop = typeof height === "number" ? height * 1.15 : 400;
    tl.to(elFront, { y: `+=${drop}`, duration: config.durDrop, ease: config.ease });
    tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);

    rest.forEach((idx, i) => {
      const el = refs[idx]?.current;
      if (!el) return;
      const slot = makeSlot(i, cardDistance, verticalDistance, total, dirSign);
      tl.set(el, { zIndex: slot.zIndex }, "promote");
      tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.15}`);
    });

    const back = makeSlot(total - 1, cardDistance, verticalDistance, total, dirSign);
    tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
    tl.call(() => gsap.set(elFront, { zIndex: back.zIndex }), undefined, "return");
    tl.to(elFront, { x: back.x, y: back.y, z: back.z, duration: config.durReturn, ease: config.ease }, "return");
    tl.call(() => {
      order.current = [...rest, front];
    });
  }, [refs, config, cardDistance, verticalDistance, dirSign, height]);

  swapRef.current = swap;

  // Lay the stack out. Runs regardless of motion preference — the arrangement
  // is the design, only the cycling is motion.
  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total, dirSign), skewAmount, dirSign);
    });
  }, [refs, cardDistance, verticalDistance, skewAmount, dirSign]);

  // The cycle. Never starts while `reduced` is unknown or true, or when paused.
  useEffect(() => {
    if (reduced !== false || !playing) return;
    intervalRef.current = window.setInterval(() => swapRef.current(), delay);
    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [reduced, playing, delay]);

  // Kill any in-flight timeline on unmount — clearInterval alone leaves GSAP
  // animating detached nodes.
  useEffect(() => () => void tlRef.current?.kill(), []);

  // Hover and focus both pause, and both restore only if the user had it
  // playing — so pausing by hover cannot silently un-pause a stopped stack.
  const holdRef = useRef(false);
  const hold = useCallback(() => {
    if (!playing) return;
    holdRef.current = true;
    tlRef.current?.pause();
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [playing]);
  const release = useCallback(() => {
    if (!playing || !holdRef.current) return;
    holdRef.current = false;
    tlRef.current?.play();
    if (intervalRef.current == null) intervalRef.current = window.setInterval(() => swapRef.current(), delay);
  }, [playing, delay]);

  const rendered = childArr.map((child, i) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (e: React.MouseEvent<HTMLDivElement>) => {
            child.props.onClick?.(e);
            onCardClick?.(i);
          },
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child,
  );

  return (
    <div className="relative" style={{ width, height }}>
      <div
        ref={container}
        role="group"
        aria-label={label}
        aria-roledescription="چرخه کارت"
        className="relative h-full w-full transform-gpu [perspective:1200px]"
        onMouseEnter={hold}
        onMouseLeave={release}
        onFocusCapture={hold}
        onBlurCapture={release}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">{rendered}</div>
      </div>

      {/* Required, not decorative: auto-advancing content has to offer a stop.
          Placed outside the perspective container so it is not transformed. */}
        {/* Stop control. Pinned centered UNDER the stack, not on the front
            card's edge: `-bottom-2 end-0` put it at the bottom-left (RTL),
            overlapping the card — it read as a phantom dark circle artifact
            glued to the artwork (the 3-cards capture). The wrapper below has
            py-16 of clear space, so -bottom-14 lands there, clear of cards. */}
      <button
        type="button"
        onClick={() => {
          setPlaying((p) => {
            const next = !p;
            // Stopping has to stop what is on screen too. Clearing the interval
            // alone only prevents the *next* swap, so an in-flight elastic
            // timeline kept animating for ~4s after the user pressed stop —
            // which reads as a broken control, not a deliberate finish.
            if (next) tlRef.current?.play();
            else tlRef.current?.pause();
            return next;
          });
          holdRef.current = false;
        }}
        aria-label={playing ? `توقف ${label}` : `پخش ${label}`}
        className="absolute -bottom-14 left-1/2 z-20 grid size-11 -translate-x-1/2 place-items-center rounded-full border border-champagne/25 bg-[#14060A]/85 text-foreground/75 backdrop-blur transition-colors hover:border-champagne/50 hover:bg-foreground/10 hover:text-foreground"
      >
        {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

export default CardSwap;
