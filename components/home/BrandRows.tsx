import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { partnerMarks } from "@/components/brand/BrandMarks";
import { buildBrandCards, cardFitBudget } from "@/lib/brand-deck";
import { brandPurchasableCounts } from "@/lib/brand-counts-db";
import { BRAND_IDENTITIES, cardAccentOkLCH, cardGroundOkLCH } from "@/lib/brand-identity";

/**
 * Feature 008 — the brands deck: six sticky cards in normal flow (research D1).
 *
 * The stacking itself is CSS's job and nothing else: no scroll listener, no
 * animation library, no client state in this file. Each card is a normal-flow
 * block; T011 gives it `position: sticky` and the per-card offset from the
 * `--stack-i` custom property written below, and the browser does the rest —
 * which is also what makes reload, back/forward and End-key land correctly
 * without anyone writing code for them (contracts C9).
 *
 * Composition is research D4's order with one substitution: **artwork, Persian name,
 * sourced line, optional count**. The mark that used to open that list is gone — the
 * approved artwork carries the maker's wordmark, and drawing it twice on a 460 px card is
 * the kind of detail that reads as a template (FR-016 as amended 2026-09-27,
 * notes/artwork-amendment.md). The name stays the protected element and stays live text
 * (FR-015, unamended); the artwork is a band above it, so it cannot push the name out of
 * view (FR-019 as amended).
 *
 * `card.mark` is still built and still decides the deck's order and each card's Persian
 * label — `components/brand/BrandMarks.tsx` remains the single source of the six — it is
 * simply no longer painted.
 *
 * The counts here are the PURCHASABLE figures from `brandPurchasableCounts()`,
 * the same query the brand's own listing page runs, never the catalogue totals
 * the previous `counts` prop carried (C5, FR-011): a card may not promise a
 * shelf the destination does not stock, and two of the six brands have nothing
 * purchasable and show no number at all.
 *
 * Server component on purpose: it reads the catalogue the same way
 * `BrandShowcase` does, and the emphasis/chevron interaction of the old rows is
 * gone with the rows — the card is the destination (C3), so there is nothing
 * left for a second control to do.
 */
export async function BrandRows({ counts: _catalogueCounts }: { counts: Record<string, number> }) {
  // The caller's totals are deliberately unused: C5 admits only purchasable
  // counts. Dropping the prop is a one-line change in BrandShowcase.tsx, which
  // this task does not own — recorded in notes/deck-build-log.md.
  const cards = buildBrandCards(partnerMarks, await brandPurchasableCounts());

  // 011: the identity per card is looked up, not assumed — a maker with no record gets
  // the house treatment rather than a guessed hue. No colour literal lives in this
  // file (R3 + the envelope rule); the only colour strings are those the module returns.
  const identityOf = (name: string) => BRAND_IDENTITIES.find((r) => r.name === name);

  // FR-014/T025: the fit budget decides the shipped state, independent of any
  // media query. The inputs are the spec's own fit case (360×640 viewport, 88px
  // dock clearance, 16px stack edge); a deck that no longer fits — a seventh
  // brand, a re-tuned budget — renders the static stack here and now, not a
  // cropped deck. The CSS hook is `data-deck="static"` on the list.
  const budget = cardFitBudget({ viewportHeight: 640, dockClearance: 88, stackEdgeSize: 16, cardCount: cards.length });

  return (
    <ul className="brand-deck" data-deck={budget.mode === "deck" ? "sticky" : "static"} aria-label="برندهای حامی همراه">
      {cards.map((card) => {
        const ident = identityOf(card.name);
        const content = (
          /* The artwork IS the card now (owner, on the phone, 2026-09-27: "the styled card and the
             bigger card must become one"). There is no outer panel, no ground and no padding box
             around it — the name sits on the picture and the sourced description is gone. What
             remains of 011's identity work is the count's colour, painted from --card-accent.
             `data-deck-mark` is on the picture because the 008 harness reads that attribute to
             decide whether a card holds the top; dropping it would leave the harness with no mark
             on any card and a C2 that passes on zero measurements. Editing the instrument is
             prohibited by T026, so the hook rides with the thing it now measures. */
          <span className="brand-deck__art" data-deck-mark data-deck-art>
            {ident ? (
              <Image
                src={ident.artwork.src}
                alt=""
                width={ident.artwork.width}
                height={ident.artwork.height}
                sizes="(min-width: 768px) 1150px, 330px"
                priority={card.stackIndex === 0}
              />
            ) : null}
            <span className="brand-deck__label" data-deck-label>
              {card.label}
            </span>
            {card.countLabel ? <span className="brand-deck__count">{card.countLabel}</span> : null}
          </span>
        );
        const style = {
          "--stack-i": card.stackIndex,
          ...(ident ? {
            "--card-ground": cardGroundOkLCH(card.name),
            "--card-accent": cardAccentOkLCH(card.name),
            "--card-rule": cardAccentOkLCH(card.name),
          } : {}),
        } as CSSProperties;

        return (
          <li
            key={card.name}
            className="brand-deck__item"
            data-deck-card
            data-hue-placement={ident?.placement ?? "house"}
            style={style}
          >
            {card.href ? (
              <Link href={card.href} className="brand-deck__card" aria-label={`خرید محصولات ${card.label}`}>
                {content}
              </Link>
            ) : (
              /* An unresolved brand has no destination to pretend at (Constitution I);
                 the card still shows who it is. */
              <div className="brand-deck__card">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
