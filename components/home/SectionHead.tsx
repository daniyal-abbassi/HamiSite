import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section headings, in four shapes instead of one.
 *
 * Every section on this page opened the same way: an eyebrow pill, a 3xl/4xl
 * heading with a `.grad` shimmer on its last phrase, and a description
 * underneath. Ten times, byte-for-byte the same structure. The page had already
 * been fixed for a monotonous *background*; this is the other half of the same
 * complaint — the monotony of **form**. A visitor scrolling ten identical
 * rectangles has nothing to mark distance by, so the page feels longer and
 * duller than it is.
 *
 * Four archetypes, meant to be alternated down the page rather than picked by
 * taste:
 *
 * | | |
 * |---|---|
 * | `stack`   | the original — eyebrow, heading, description, all at the reading start |
 * | `split`   | heading one side, description opposite, a rule between. Editorial and wide |
 * | `rule`    | an index marker and a hairline running the width, heading below. A chapter mark |
 * | `display` | no eyebrow, oversized heading, generous air. For the two or three moments that should feel big |
 *
 * **The shimmer is deliberately not available on every archetype.** `.grad` on
 * all ten headings is a large part of why they read as one thing; here it is
 * reserved for `stack` and `display`, so it means "this one matters" again.
 */
export function SectionHead({
  id,
  eyebrow,
  title,
  description,
  action,
  index,
  variant = "stack",
  className,
}: {
  /** Goes on the h2 — sections reference it from `aria-labelledby`. */
  id: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** A link or button that belongs to the heading, e.g. "see all". */
  action?: ReactNode;
  /** Two-digit chapter marker, `rule` variant only. */
  index?: string;
  variant?: "stack" | "split" | "rule" | "display";
  className?: string;
}) {
  if (variant === "split") {
    return (
      <div
        className={cn(
          "flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16",
          className,
        )}
      >
        <div className="lg:max-w-xl">
          {eyebrow && (
            <span className="mb-3 block font-mono text-xs tracking-[0.18em] text-aqua/70">{eyebrow}</span>
          )}
          <h2 id={id} className="text-3xl font-black leading-[1.35] tracking-tight md:text-[2.6rem]">
            {title}
          </h2>
        </div>
        {(description || action) && (
          <div className="lg:max-w-sm lg:text-start">
            {description && <p className="text-sm leading-7 text-muted-foreground">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
          </div>
        )}
      </div>
    );
  }

  if (variant === "rule") {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center gap-4">
          {index && <span className="font-mono text-xs tracking-[0.2em] text-aqua/70">{index}</span>}
          {eyebrow && (
            <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">{eyebrow}</span>
          )}
          <i className="h-px flex-1 bg-line" aria-hidden="true" />
          {action}
        </div>
        <h2 id={id} className="mt-6 text-3xl font-black tracking-tight md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }

  if (variant === "display") {
    return (
      <div className={cn("max-w-3xl", className)}>
        <h2
          id={id}
          className="text-[2.4rem] font-black leading-[1.25] tracking-tight md:text-6xl md:leading-[1.15]"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-7">{action}</div>}
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {eyebrow && (
        <span className="eyebrow">
          <i /> {eyebrow}
        </span>
      )}
      <h2 id={id} className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
