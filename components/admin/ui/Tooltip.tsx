/** Hand-built for this repo — no upstream counterpart. The kit's `data-table.tsx`,
 * `columns-button.tsx`, `sort-button.tsx` and `icon-button-with-tooltip.tsx` all import a `tooltip`
 * primitive that ships on `@radix-ui/react-tooltip`; this repo has no Radix (research.md R7), so the
 * disclosure here is CSS state and nothing else — no portal, no floating-ui, no provider, no timer.
 *
 * No JavaScript is the design, not the shortcut: the component renders on the server, so a page may
 * ship a tooltip inside a Server Component without becoming a Client Component.
 *
 * ONE RULE THIS PRIMITIVE CANNOT ENFORCE FOR YOU. The bubble is painted on `:hover` only — Tailwind's
 * `hover` variant is emitted unconditionally at v3.4 (verified against the generated CSS, not
 * assumed), so it is a plain `:hover` and a touch device never fires it. A screen reader does get the
 * text, because `aria-describedby` is wired into the accessibility tree whether or not anything
 * paints. So: a tooltip may add detail, and must never be the only route to meaning (Principle II).
 * Anything an operator has to know — a status, a restriction, the reason a row is blocked — belongs in
 * visible text, in an `Alert`, or in the column itself.
 */

import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  /** The trigger. Pass a single element — a `button`, an `a`, or a lucide icon inside one. Its own
   * accessible name still carries it; this only appends the description. */
  children: React.ReactNode;
  content: React.ReactNode;
  /** `top` and `bottom` only. There is no portal, so a side-anchored bubble would be clipped by the
   * viewport edge on the narrowest screen it is used on; a vertically anchored one is not. */
  side?: "top" | "bottom";
  className?: string;
};

export function Tooltip({ children, content, side = "top", className }: TooltipProps) {
  const id = useId();

  // The description is attached to the trigger rather than nested inside it, so the bubble can be a
  // sibling and still not be trapped by an `overflow-hidden` table cell. An existing
  // `aria-describedby` is kept and extended, not replaced.
  const existing =
    isValidElement<{ "aria-describedby"?: string }>(children) && children.props["aria-describedby"]
      ? `${children.props["aria-describedby"]} ${id}`
      : id;
  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ "aria-describedby": string }>, { "aria-describedby": existing })
    : children;

  return (
    <span className="group relative inline-flex">
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={cn(
          // Centred over the trigger with physical `left-1/2` + a physical translate. Both are
          // physical on purpose: the pair is symmetric, so it centres identically in RTL and LTR —
          // which is the one case where a logical value would be wrong (start-1/2 flips its sign
          // against a translate that does not).
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-[min(16rem,80vw)] -translate-x-1/2",
          "rounded-md border border-line bg-ink-3 px-2.5 py-1.5 text-xs leading-5 text-foreground shadow-card",
          "opacity-0 transition-opacity duration-fast",
          "group-hover:opacity-100 group-has-[:focus-visible]:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
