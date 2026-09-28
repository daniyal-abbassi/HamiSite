"use client";

/* LiquidSelection — one body of material that travels between the items of a
 * group, answering "which of these is the current one".
 *
 * Ported from `PillTabs.tsx` in liquid-taffy (MIT, Copyright (c) 2026 arknow91);
 * see ./UPSTREAM.md for what was taken and what was deliberately not. The
 * reference's behaviour is intact — one shared marker floats UNDER the labels and
 * GSAP carries it from item to item, long and low mid-flight and leaning into the
 * direction of travel, ringing back to shape on an elastic, with width tweening
 * alongside x so it is already becoming the next item's size while it flies.
 *
 * What changed on the way in, and why it had to:
 *
 * - It renders what the surface actually is (FR-062). Upstream hardcoded
 *   `role="tablist"` + `role="tab"` + `aria-selected`; five of our seven surfaces
 *   are page navigation and those roles would tell a screen reader that panels
 *   swap in place when the truth is that the page changes. An item with `to` is a
 *   router link, one with `href` is a plain anchor, and one with neither is a
 *   button — the element follows the thing, and the state it announces
 *   (`aria-current` / `aria-selected` / `aria-pressed`) is a configuration.
 * - Its colours are this storefront's (FR-063), in the CSS module.
 * - No SVG filter was taken, and none may be added (FR-030, FR-066); no sound was
 *   taken (FR-042), which is why `sfx` and `theme` are gone from the imports.
 * - The slot arithmetic lives in selection-geometry.ts so a node-env test can
 *   reach it.
 *
 * ## Interface
 *
 * Hand it `items`, the `value` that is current (or `null` when nothing is), and —
 * for a button group — `onChange`. It knows nothing about what it selects, and it
 * has no colour, no timing, and no geometry of its own beyond the numbers in
 * motion.ts. Every surface configures this one implementation (FR-040); a second
 * travelling-marker component is the failure mode this file exists to prevent.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";

import { cn } from "@/lib/utils";
import { DEFORM, PRESS, TRIP, prefersReducedMotion } from "./motion";
import {
  MAX_TRAVEL_PX,
  parkStyle,
  planTrip,
  slotGeometry,
  type Slot,
} from "./selection-geometry";
import styles from "./liquid-selection.module.css";

export type LiquidSelectionItem<Id extends string = string> = {
  id: Id;
  /** A word, or an icon stacked over a word — the row measures whatever renders. */
  label: ReactNode;
  /** The label as TEXT, for anything that cannot read markup (a11y names). */
  name?: string;
  /** An in-app route: renders a router link, which is what navigation is (FR-062). */
  to?: string;
  /** A raw href: `tel:`, an external link, anything the router must not touch. */
  href?: string;
  /**
   * False for an item that can never become current — the bar's dial request
   * (FR-015). It never receives the marker, and pressing it never deforms the
   * marker, because a marker that flinches toward a destination says "you might
   * go here" on a control whose whole meaning is "you are here" (FR-012a).
   */
  marked?: boolean;
  disabled?: boolean;
  /**
   * Inert attributes a surface needs on the element it does not render — the featured
   * tabs' `id`, their roving `tabIndex` and `aria-controls`. Spread BEFORE the port's
   * own aria block, not after it: a surface may carry these, but it must not be able to
   * reach `role` or `aria-selected`, which are the port's decisions and the reason
   * FR-047's "nothing changes what a surface announces" holds. (The pending-patch note
   * asked for a trailing spread; that would let a consumer overwrite the selected state
   * and call it configuration.)
   */
  attrs?: Record<string, string | number | boolean>;
};

/** Which attribute carries "this is the current one", per surface (FR-047). */
export type Announce = "page" | "true" | "pressed" | "selected" | "none";

export type LiquidSelectionProps<Id extends string> = {
  items: readonly LiquidSelectionItem<Id>[];
  /** `null` means no item is current, and the marker is absent entirely (FR-017). */
  value: Id | null;
  /** Required for a button group; a link group navigates by itself. */
  onChange?: (id: Id) => void;
  /** Names the group for assistive tech. Optional because the surface often already
   *  wraps this in a `nav`/`role=group` that carries the name. */
  label?: string;
  /** Equal-width slots rather than content width — the bottom bar (FR-064). */
  equalWidth?: boolean;
  /** Shrink the resting marker inside its slot, in px. For a tall slot or an
   *  icon-stacked item, where filling the box would be a block, not a body (FR-065). */
  markerInset?: number;
  announce?: Announce;
  /** The group's own role, when it has one: `tablist` for the featured tabs,
   *  `menubar` for the header, nothing for a row inside a `nav`. */
  groupRole?: "tablist" | "menubar" | "toolbar" | "group" | "list";
  itemRole?: "tab" | "menuitem";
  /** The distance past which a trip is suppressed rather than crawled (FR-046). */
  maxTravelPx?: number;
  /** Feeds ONLY the pre-measurement first frame (FR-067). Every trip and every
   *  lean is derived from measured x, so this cannot make the motion wrong — the
   *  worst it can do is park the server's shape on the wrong side for one frame,
   *  and layout effects run before the first paint anyway. */
  rtl?: boolean;
  className?: string;
  itemClassName?: string;
};

/* The page's one in-flight marker (FR-033). Seven markers may REST at once; only
 * one body may be moving, because two surfaces are on the home page together on a
 * laptop and a shop page can show a filter row, pagination and a category row at
 * once. Starting a trip retires whoever was mid-flight before it — the old marker
 * stops where it is rather than being fought over by two timelines, which is the
 * same discipline the single-marker kill applies inside one group.
 *
 * FR-031, stated plainly: the number of layout-writing elements that can be
 * mid-travel at one instant is exactly one, and it is the marker element itself
 * (width and height are layout, not composition). */
let inFlight: HTMLSpanElement | null = null;

function beginTrip(marker: HTMLSpanElement) {
  if (inFlight && inFlight !== marker) {
    gsap.killTweensOf(inFlight);
    inFlight.style.willChange = "auto";
  }

  inFlight = marker;
  marker.style.willChange = "transform";
}

function endTrip(marker: HTMLSpanElement) {
  if (inFlight === marker) {
    inFlight = null;
  }

  // FR-034: the hint exists only while a trip is in flight.
  marker.style.willChange = "auto";
}

/** Neutral geometry, written rather than animated. */
function parkAt(marker: HTMLSpanElement, slot: Slot) {
  gsap.set(marker, {
    // The server may have parked this element with `left` in percentages; x does
    // the moving now, so the physical origin has to come back to zero or the two
    // add up and the marker lands a slot away from its label.
    left: 0,
    top: 0,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    autoAlpha: 1,
  });
}

export function LiquidSelection<Id extends string>({
  items,
  value,
  onChange,
  label,
  equalWidth = false,
  markerInset = 0,
  announce,
  groupRole,
  itemRole,
  maxTravelPx = MAX_TRAVEL_PX,
  rtl = true,
  className,
  itemClassName,
}: LiquidSelectionProps<Id>) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const itemRefs = useRef(new Map<Id, HTMLElement>());
  /* The selection right now, for the resize observer below — it is created once
     and must not close over a stale one. */
  const valueRef = useRef(value);
  valueRef.current = value;

  /* The marker's position in the HTML the server sends. Computed ONCE, on the
   * first render, and then never again: if it tracked `value`, every navigation
   * would hand React a changed `left`/`width` to write inline, and React would
   * overwrite the geometry GSAP is mid-flight tweening. After the first layout
   * effect the marker's `left` is 0 and its place is a transform; the server's
   * percentage is a single frame of history. */
  const [firstPark] = useState(() =>
    parkStyle({
      equalWidth,
      index: items.findIndex((item) => item.id === value),
      count: items.length,
      rtl,
    }),
  );

  /* `items` itself is not a dependency: a surface that builds its array inline
   * (as the bar does) hands us a new identity on every render, and re-running on
   * that would mean re-running for hovers, auth changes and cart counts. The ids
   * are what a re-measure is actually about. */
  const slotIds = items.map((item) => item.id).join("|");

  useLayoutEffect(() => {
    const row = rowRef.current;
    const marker = markerRef.current;

    if (!row || !marker) {
      return;
    }

    /* Follows the selection, not whatever is painted: on a link surface the route
       changes and this row is re-rendered from the new page with the new value. */
    const target = value === null ? undefined : itemRefs.current.get(value);

    /* No item is current — /cart, /checkout — so there is no marker at all. Not a
       marker under the first entry "just so the bar looks complete" (FR-017),
       which is the exact bug the bar's own documentation says it was moved to fix. */
    if (!target || target.offsetParent === null) {
      gsap.killTweensOf(marker);
      endTrip(marker);
      gsap.set(marker, { autoAlpha: 0 });
      return;
    }

    const to = slotGeometry(
      target,
      { clientLeft: row.clientLeft, clientTop: row.clientTop },
      markerInset,
    );

    /* "Has the client placed this marker yet?" is read off the ELEMENT, not a ref
       (FR-068). Upstream's version of this test was `pill.style.width === ""`, and
       the reason it is on the element at all is StrictMode: the throwaway first
       mount reverts the inline styles `set` wrote, so an armed ref would leave the
       real mount animating a marker that is back to zero width. Ours is a
       `data-ls-placed` attribute on the row because our marker can arrive with a
       width already written by the server, which would have made upstream's test
       read "placed" on the first frame. Either way the rule is the same: element
       state, never ref state.
     *
     * `hidden` is the sibling of that question: a marker that was just absent (no
     * route matched, FR-017) has no honest previous slot to leave from, so it
     * arrives rather than travelling from wherever it last rested. */
    const placed = row.dataset.lsPlaced === "1";
    const hidden = marker.style.opacity === "0";

    const from: Slot | null =
      placed && !hidden
        ? {
            x: Number(gsap.getProperty(marker, "x")),
            y: Number(gsap.getProperty(marker, "y")),
            width: Number(gsap.getProperty(marker, "width")),
            height: Number(gsap.getProperty(marker, "height")),
          }
        : null;

    const plan = planTrip({
      placed,
      visible: !hidden,
      reducedMotion: prefersReducedMotion(),
      from,
      to,
      maxTravelPx,
    });

    row.dataset.lsPlaced = "1";

    /* Already there. Any re-run that is NOT a change of slot — a parent
       re-rendering, a fresh `items` array arriving with the same ids, a route
       resolving late — must not fire the travel again: on the selected item that
       reads as the marker bouncing in place under the pointer, which is not a
       thing the selection ever did (FR-068). */
    if (plan.kind === "stay") {
      return;
    }

    /* First paint, reduced motion, or a destination too far to be worth crawling
       (FR-046, and the wrapped-line case is handled by `corner` below): the
       marker is simply where it belongs (FR-014, FR-021). */
    if (plan.kind === "park" || plan.kind === "arrive") {
      gsap.killTweensOf(marker);
      endTrip(marker);
      parkAt(marker, to);
      return;
    }

    /* The previous trip dies here (FR-068, FR-031). Without it, a second click
       landing inside the ~620ms flight leaves both timelines alive and both
       writing width to the same element every frame — and width is layout, so a
       flurry of clicks piles up synchronous reflows under the page swap. The new
       trip starts from wherever the marker actually is, which is what makes an
       interrupted trip look like a change of mind rather than a glitch. */
    gsap.killTweensOf(marker);
    beginTrip(marker);

    const timeline = gsap.timeline({
      onComplete: () => endTrip(marker),
    });

    if (plan.kind === "corner") {
      /* A group that wraps (variant chips, image views) must not have its marker
       * stretch across the full width of the group to change lines (FR-045). So it
       * goes down first, then across: two legs, each as long as the gap it has to
       * cross, and no lean, because leaning is a statement about horizontal speed
       * and this body is not travelling horizontally while it drops. */
      timeline
        .to(marker, { y: to.y, height: to.height, duration: TRIP.glide, ease: TRIP.glideEase }, 0)
        .to(marker, { x: to.x, width: to.width, duration: TRIP.glide, ease: TRIP.glideEase }, ">");

      return;
    }

    timeline
      .to(marker, { ...to, duration: TRIP.glide, ease: TRIP.glideEase }, 0)
      /* The squash: long and low mid-flight, leaning into the travel. The lean
         comes from planTrip, which got it from measured x — never from which item
         comes first in the source, which is what makes RTL correct by
         construction rather than by a mirror special case (FR-013, FR-061). */
      .to(
        marker,
        {
          scaleX: DEFORM.scaleX,
          scaleY: DEFORM.scaleY,
          skewX: plan.lean,
          duration: TRIP.squash,
          ease: TRIP.squashEase,
        },
        0,
      )
      /* The wobble: everything rings back to rest on one elastic. */
      .to(
        marker,
        { scaleX: 1, scaleY: 1, skewX: 0, duration: TRIP.ring, ease: TRIP.ringEase },
        TRIP.ringAt,
      );

    /* No per-run cleanup killing this timeline, which is where this departs from
       upstream. Its `return () => timeline.kill()` fires whenever the effect
       re-runs — and a re-run that then bails out at `stay` would leave the body
       frozen mid-squash in a stretched shape it never rings back from. Trip A is
       ended by trip B's killTweensOf above, or by the unmount cleanup below. */
  }, [value, slotIds, markerInset, maxTravelPx]);

  /* The marker is parked at pixel coordinates measured once, so anything that
     re-lays the row out — a window resize, a font finally arriving, a rotation —
     leaves it sitting under the wrong label. Re-park it, without animating: this
     is not a selection changing, it is the same selection being re-measured.
   *
   * Observed once, for the life of the row, reading the current selection off a
   * ref. Re-observing on every pick would deliver an initial callback mid-flight
   * and park the marker on the spot it was still travelling to; the size guard is
   * the same defence against that first delivery (FR-014 must not be broken by a
   * resize, and FR-011's resting place must survive one). */
  useLayoutEffect(() => {
    const row = rowRef.current;

    if (!row || typeof ResizeObserver === "undefined") {
      return;
    }

    let last = { width: row.offsetWidth, height: row.offsetHeight };

    const observer = new ResizeObserver(() => {
      const marker = markerRef.current;
      const target = valueRef.current === null ? undefined : itemRefs.current.get(valueRef.current);
      const now = { width: row.offsetWidth, height: row.offsetHeight };

      if (!marker || !target || (now.width === last.width && now.height === last.height)) {
        return;
      }

      last = now;
      gsap.killTweensOf(marker);
      parkAt(
        marker,
        slotGeometry(target, { clientLeft: row.clientLeft, clientTop: row.clientTop }, markerInset),
      );
    });

    observer.observe(row);

    return () => observer.disconnect();
  }, [markerInset]);

  /* Unmount: nothing keeps writing to a node that is gone, and the page's
     in-flight slot is not left pointing at a corpse. */
  useEffect(() => {
    const marker = markerRef.current;

    return () => {
      if (marker) {
        gsap.killTweensOf(marker);
        endTrip(marker);
      }
    };
  }, []);

  /* FR-012: a held press deforms the marker for as long as it is held, and
     releasing returns it to its resting form. Upstream only scaled the pressed
     label; here the body itself takes the press, because the body is the thing
     that means something.
   *
     Deliberately absent (FR-012a): you cannot drag the marker between slots. The
     reference lets you grab it and pull it, and that is declined on the record —
     a previewing marker means "you might go here", which on the primary
     navigation must never be confused with "you are here". Navigation is the
     link or button's own click, on release, exactly when it happens today. */
  const deformPress = () => {
    const marker = markerRef.current;

    if (!marker || inFlight === marker || prefersReducedMotion()) {
      return;
    }

    gsap.killTweensOf(marker);
    gsap.to(marker, {
      scaleX: PRESS.scaleX,
      scaleY: PRESS.scaleY,
      transformOrigin: PRESS.origin,
      duration: PRESS.duration,
      ease: PRESS.ease,
    });
  };

  const releasePress = () => {
    const marker = markerRef.current;

    if (!marker || inFlight === marker || prefersReducedMotion()) {
      return;
    }

    gsap.to(marker, {
      scaleX: 1,
      scaleY: 1,
      transformOrigin: "50% 50%",
      duration: PRESS.release,
      ease: PRESS.releaseEase,
    });
  };

  /* One listener pair on the row, delegated: the pressed item is found by walking
   * up from the event target, which works however deep a surface nests its icon
   * and label. A pointer that leaves the row releases rather than navigating —
   * which is also what a link does, so nothing here decides the destination. */
  const itemFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = (event.target as HTMLElement | null)?.closest?.("[data-ls-item]") as HTMLElement | null;

    return node?.dataset.lsMarked === "1" ? node : null;
  };

  const announceProps = (isActive: boolean) => {
    const kind: Announce =
      announce ?? (items.some((item) => item.to != null || item.href != null) ? "page" : "pressed");

    switch (kind) {
      case "page":
        return isActive ? { "aria-current": "page" as const } : {};
      case "true":
        return isActive ? { "aria-current": "true" as const } : {};
      case "selected":
        /* A tabset has to say `false` as well as `true`: the role only means
         * something if every tab reports its side. Only the featured tabs may use
         * this, because only they swap a panel in place. */
        return { "aria-selected": isActive };
      case "pressed":
        return { "aria-pressed": isActive };
      case "none":
        return {};
    }
  };

  const setItemRef = (id: Id) => (node: HTMLElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  };

  return (
    <div
      ref={rowRef}
      className={cn(styles.group, equalWidth && styles.equal, className)}
      role={groupRole}
      aria-label={label}
      onPointerDown={(event) => {
        if (itemFromEvent(event)) deformPress();
      }}
      onPointerUp={(event) => {
        if (itemFromEvent(event)) releasePress();
      }}
      onPointerCancel={releasePress}
      onPointerLeave={releasePress}
    >
      {/* The marker is decoration over an existing truth (FR-024): it announces
          nothing, so nothing a screen reader receives depends on it. */}
      <span
        ref={markerRef}
        aria-hidden="true"
        className={styles.marker}
        style={firstPark as CSSProperties | undefined}
      />
      {items.map((item) => {
        const isActive = item.id === value && item.marked !== false;
        const aria = {
          ...announceProps(isActive),
          role: itemRole,
          "aria-label": typeof item.label === "string" ? undefined : item.name,
        };
        const cls = cn(styles.item, isActive && styles.itemActive, itemClassName);
        const markerEligible = item.marked === false ? "0" : "1";

        if (item.to != null) {
          return (
            <Link
              key={item.id}
              href={item.to}
              className={cls}
              data-ls-item={item.id}
              data-ls-marked={markerEligible}
              ref={setItemRef(item.id)}
              {...item.attrs}
              {...aria}
            >
              {item.label}
            </Link>
          );
        }

        if (item.href != null) {
          return (
            <a
              key={item.id}
              href={item.href}
              className={cls}
              data-ls-item={item.id}
              data-ls-marked={markerEligible}
              ref={setItemRef(item.id)}
              {...item.attrs}
              {...aria}
            >
              {item.label}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            className={cls}
            data-ls-item={item.id}
            data-ls-marked={markerEligible}
            ref={setItemRef(item.id)}
            disabled={item.disabled}
            onClick={onChange ? () => onChange(item.id) : undefined}
            {...item.attrs}
            {...aria}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
