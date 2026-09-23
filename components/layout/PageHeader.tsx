import { cn } from "@/lib/utils";

/**
 * The page-heading grammar, in one place.
 *
 * Six routes each had their own copy of the same three lines — `.section-label` with an ordinal, an `<h1>`
 * with an `<em>` accent word, an optional description — and because each copy was written separately they
 * had drifted into three different schemes at once: `/shop` and `/cart` both claimed **۰۰۱**, `/orders` said
 * **۰۰**, `/partners` said **۰۱** (a different width), and `/login` and `/register` had no header at all —
 * just a centred card floating on the ground, which is the one thing a shopper page should never be, because
 * it tells the person nothing about where they are or what they are doing.
 *
 * The ordinal is kept deliberately. It is the site's editorial device — the homepage numbers its chapters
 * the same way — and Constitution IV's bar is exactly what a decorative index like this buys. What it is NOT
 * is information: it is `aria-hidden`, because "page 1 of 6" would be a claim about a set of routes nobody
 * navigates in order, and FR-047 forbids meaning that exists only in a visual device. So the number can be
 * seen and must not be announced.
 *
 * One source for the numbering, so it cannot drift back into a duplicate: `PAGE_INDEX`.
 */
export const PAGE_INDEX = {
  shop: "۰۰۱",
  cart: "۰۰۲",
  checkout: "۰۰۳",
  orders: "۰۰۴",
  partners: "۰۰۵",
  login: "۰۰۶",
  register: "۰۰۷",
} as const;

export type PageKey = keyof typeof PAGE_INDEX;

export function PageHeader({
  page,
  eyebrow,
  title,
  accent,
  description,
  className,
  children,
}: {
  page: PageKey;
  eyebrow: string;
  title: string;
  /** The word that carries the accent colour. Rendered inline after `title`. */
  accent?: string;
  description?: string;
  className?: string;
  /** Anything else the page puts under its heading — a data note, a filter row. */
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("mb-8 max-w-2xl", className)}>
      <div className="section-label">
        <span aria-hidden="true">{PAGE_INDEX[page]}</span>
        <i aria-hidden="true" />
        <p>{eyebrow}</p>
      </div>
      <h1 className="mt-4 text-2xl font-black leading-[1.4] tracking-normal md:text-3xl">
        {title}
        {accent ? (
          <>
            {" "}
            <em className="font-black not-italic text-aqua">{accent}</em>
          </>
        ) : null}
      </h1>
      {description ? <p className="mt-3 text-sm leading-8 text-foreground/65">{description}</p> : null}
      {children}
    </header>
  );
}
