"use client";

import * as React from "react";
import { animate } from "motion/react";
import { IconClose } from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_RETRACT } from "devignerui/motion";
import { useReducedMotionPreference } from "devignerui/hooks";

// A small label pill. Every tone is one text color: the fill and the outline
// are that same currentColor at low strength, so any text-* class makes a new
// tone. Theme tokens follow light and dark on their own; a palette color needs
// a dark: shade to keep its contrast.

const TONES = {
  neutral: "text-foreground",
  // The storefront uses a dark canvas at every viewport and color scheme.
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-destructive",
  info: "text-blue-400",
} as const;

// Each size sets its icon and media sizes as variables, so the slots' classes
// stay the same. Media and the close button sit 4px from the rim at every
// height (3px of padding inside the 1px border).
const SIZES = {
  sm: "h-6 gap-1 px-2 text-xs [--badge-icon:--spacing(3.5)] [--badge-media:--spacing(4)]",
  md: "h-7 gap-1.5 px-2.5 text-[13px] [--badge-icon:--spacing(4)] [--badge-media:--spacing(5)]",
  lg: "h-8 gap-1.5 px-3 text-sm [--badge-icon:--spacing(4.5)] [--badge-media:--spacing(6)]",
} as const;

const ICON_PAD = { sm: "pl-1", md: "pl-1.5", lg: "pl-2" } as const;
const CLOSE_SIZE = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

/** Inline styles the fold writes, cleared if the badge outlives its removal. */
const FOLD_STYLES = [
  "width",
  "padding-left",
  "padding-right",
  "border-width",
  "margin-inline-end",
  "overflow",
  "pointer-events",
] as const;

export type BadgeTone = keyof typeof TONES;
export type BadgeSize = keyof typeof SIZES;

export interface BadgeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "onClick"
> {
  /** Text color, and with it the fill and outline. Defaults to "neutral". */
  tone?: BadgeTone;
  /** Height, text and icon size. Defaults to "md" (28px). */
  size?: BadgeSize;
  /** Leading glyph, such as an icon or a status dot. An svg without a size
   *  class gets the badge's icon size. */
  icon?: React.ReactNode;
  /** Leading avatar, flag or logo. Whatever is passed (an img, an Avatar
   *  component) is fitted to a circle sized to the badge, 4px from the rim. */
  media?: React.ReactNode;
  /** A small count after the label, like the number of files. */
  count?: React.ReactNode;
  /** Dashed outline and no fill, for an empty or not-applicable value. */
  dashed?: boolean;
  /** Makes the whole badge a link. */
  href?: string;
  /** Passed to the link, such as "_blank" for a new tab. */
  target?: string;
  /** Passed to the link, such as "noopener noreferrer". */
  rel?: string;
  /** Renders the link with this component instead of an a, such as Next's
   *  Link for client-side navigation. Gets href, target, rel and className. */
  linkAs?: React.ElementType;
  /** Makes the whole badge a button. */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Shows a remove button after the label. The badge folds away, then this
   *  is called; unmount the badge in it. A badge still there a moment later
   *  (a cancelled confirm, a failed request) unfolds again. */
  onRemove?: () => void;
  /** Accessible name of the remove button. Defaults to "Remove <label>". */
  removeLabel?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone = "neutral",
      size = "md",
      icon,
      media,
      count,
      dashed = false,
      href,
      target,
      rel,
      linkAs: Link = "a",
      onClick,
      onRemove,
      removeLabel,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const root = React.useRef<HTMLSpanElement | null>(null);
    // ponytail: a callback ref instead of forwardRef's useImperativeHandle;
    // forwardRef itself stays while React 18 is supported.
    const setRoot = React.useCallback(
      (el: HTMLSpanElement | null) => {
        root.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref],
    );
    const reduced = useReducedMotionPreference();
    const leaving = React.useRef(false);
    const id = React.useId();
    const labelId = `${id}-label`;
    const removeTextId = `${id}-remove`;

    const action = href !== undefined || onClick !== undefined;

    // Focus would fall back to the page once the focused remove button is
    // gone, so it moves to the next badge's (or else the previous one's)
    // remove button or action first.
    const handOffFocus = (el: HTMLElement) => {
      if (!el.contains(document.activeElement)) return;
      const badges = [
        ...(el.parentElement?.querySelectorAll<HTMLElement>(
          ":scope > [data-badge]:not([data-leaving])",
        ) ?? []),
      ];
      const at = badges.indexOf(el);
      const next = badges[at + 1] ?? badges[at - 1];
      next
        ?.querySelector<HTMLElement>("[data-badge-remove], [data-badge-action]")
        ?.focus();
    };

    // Brings back a badge whose onRemove kept it: two frames is after the
    // caller's re-render has committed.
    const restoreIfKept = (el: HTMLElement) => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!el.isConnected) return;
          leaving.current = false;
          delete el.dataset.leaving;
          for (const p of FOLD_STYLES) el.style.removeProperty(p);
          if (reduced) {
            el.style.removeProperty("opacity");
            el.style.removeProperty("transform");
            return;
          }
          animate(el, { opacity: 1, scale: 1 }, SPRING_RETRACT);
        }),
      );
    };

    // Folds to nothing, closing the gap after it too, so the badges beside it
    // slide over without the caller animating anything. The gap is the
    // parent's column-gap, so this assumes a flex or grid parent.
    const remove = () => {
      const el = root.current;
      if (!onRemove || leaving.current || !el) return;
      leaving.current = true;
      el.dataset.leaving = "";
      const done = () => {
        handOffFocus(el);
        onRemove();
        restoreIfKept(el);
      };
      if (reduced) return done();
      const gap = parseFloat(
        getComputedStyle(el.parentElement ?? el).columnGap,
      );
      el.style.overflow = "hidden";
      el.style.pointerEvents = "none";
      animate(
        el,
        {
          width: 0,
          paddingLeft: 0,
          paddingRight: 0,
          borderWidth: 0,
          marginInlineEnd: -(gap || 0),
          opacity: 0,
          scale: 0.8,
        },
        SPRING_RETRACT,
      ).then(done);
    };

    // The label is the link or button; its ::after stretches over the whole
    // pill so all of it is clickable, while the remove button sits above.
    const actionClass =
      "flex min-w-0 cursor-pointer outline-none after:absolute after:inset-0 after:rounded-full";
    // leading-normal: with leading-none, truncate's overflow clips the
    // descenders of g, p and y. The pill's height comes from h-* anyway.
    const label = (
      <span
        id={labelId}
        className="truncate leading-normal"
        // The full text as a tooltip, only when the ellipsis cut it.
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.title =
            el.scrollWidth > el.clientWidth ? (el.textContent ?? "") : "";
        }}
      >
        {children}
      </span>
    );
    const main =
      href !== undefined ? (
        <Link
          href={href}
          target={target}
          rel={rel}
          data-badge-action
          className={actionClass}
          onClick={onClick}
        >
          {label}
        </Link>
      ) : action ? (
        <button
          type="button"
          data-badge-action
          className={actionClass}
          onClick={onClick}
        >
          {label}
        </button>
      ) : (
        label
      );

    return (
      <span
        ref={setRoot}
        data-badge
        className={cn(
          "relative inline-flex max-w-full shrink-0 items-center rounded-full border leading-none font-medium whitespace-nowrap transition-[background-color,border-color] duration-150 ease-out",
          SIZES[size],
          TONES[tone],
          dashed
            ? "border-dashed border-current/30"
            : "border-current/15 bg-current/8",
          action && "has-[[data-badge-action]:hover]:bg-current/13",
          action &&
            "has-[[data-badge-action]:focus-visible]:outline-2 has-[[data-badge-action]:focus-visible]:outline-offset-2 has-[[data-badge-action]:focus-visible]:outline-ring",
          // A round avatar or flag sits as far from the rim as from the top
          // and bottom, like a ball in a slot.
          media ? "pl-0.75" : icon && ICON_PAD[size],
          onRemove && "pr-1",
          className,
        )}
        {...props}
      >
        {media && (
          <span
            aria-hidden
            className="grid size-(--badge-media) shrink-0 overflow-hidden rounded-full *:size-full *:object-cover"
          >
            {media}
          </span>
        )}
        {icon && (
          <span
            aria-hidden
            className="flex shrink-0 items-center [&>svg:not([class*='size-'])]:size-(--badge-icon)"
          >
            {icon}
          </span>
        )}
        {main}
        {count !== undefined && (
          <span className="tabular-nums opacity-60">{count}</span>
        )}
        {onRemove && (
          <button
            type="button"
            data-badge-remove
            onClick={remove}
            // "Remove" plus the label's own text, so any children name it.
            aria-label={removeLabel}
            aria-labelledby={
              removeLabel ? undefined : `${removeTextId} ${labelId}`
            }
            className={cn(
              "relative z-1 grid shrink-0 cursor-pointer place-items-center rounded-full opacity-55 transition-[opacity,background-color] duration-150 ease-out hover:bg-current/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
              CLOSE_SIZE[size],
            )}
          >
            <span id={removeTextId} hidden>
              Remove
            </span>
            <IconClose aria-hidden className="size-[80%]" />
          </button>
        )}
      </span>
    );
  },
);
Badge.displayName = "Badge";
