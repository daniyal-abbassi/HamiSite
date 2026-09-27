import { brandSlugByName, brandStoriesByName, brandHref } from "@/lib/content/home";
import { toFaDigits } from "@/lib/utils";

/**
 * Feature 008 — the brand deck, as data. The component in
 * `components/home/BrandRows.tsx` renders these cards; `lib/brand-counts.ts`
 * and `lib/content/home.ts` supply the facts each one is allowed to state.
 *
 * The module is deliberately a pair of pure functions, because everything the
 * deck claims about itself is cheap to assert and expensive to eyeball — and
 * the last two rebuilds of this section shipped defects a one-line assertion
 * would have caught (`tests/unit/brand-deck.test.ts` is the record).
 */

/** One row from `components/brand/BrandMarks.tsx` — the mark stays a node. */
export type BrandMarkSource = { name: string; label: string; node: unknown };

/** The card, per specs/008-brands-stacking-cards/data-model.md. */
export type BrandCard = {
  name: string;
  label: string;
  mark: unknown;
  /** Absent — not empty — when the brand has no story (rule 3, FR-010). */
  story?: { title: string; text: string };
  /** Absent when the destination lists nothing purchasable (rule 4, FR-011). */
  count?: number;
  /** Persian numerals, only present alongside `count` (FR-019). */
  countLabel?: string;
  href: string;
  stackIndex: number;
  /** stackIndex × 16px — the stacked edge, applied as `inset-block-start` (D3). */
  stickyOffset: number;
  /** stackIndex + 1 — paint order inside the section's stacking context (D6). */
  zIndex: number;
};

/** The two states FR-014 permits. A bad fit is the static stack, never a negative height. */
export type FitBudgetMode = "deck" | "static-stack";

/**
 * The smallest card that can still satisfy contract C2 — the mark and the Persian name entirely
 * inside the viewport while the card is on top.
 *
 *   mark plate (research D4's ~40px optical height)      40
 *   Persian name, one line at the row's text-2xl         32
 *   story text, up to two lines at the shipped 13/26     52
 *   card padding, 2 × 28px                                56
 *   ────────────────────────────────────────────────────
 *                                                        180
 *
 * Below this the deck is not "tight", it is cropped: the label is the thing C2 protects, and a card
 * that cannot hold mark plus name plus its own padding is the half-fit deck FR-014 forbids. The
 * documented fit case yields 472, so this floor is 38% of the budget — nowhere near binding on a
 * phone, and exactly the line a 200px-tall viewport falls over.
 */
export const MIN_CARD_HEIGHT = 180;

export type FitBudget = {
  /** Card height available for the deepest card; never negative. */
  available: number;
  /** `(cardCount − 1) × stackEdgeSize` — the cost of the visible deck edge (D3). */
  deepestOffset: number;
  mode: FitBudgetMode;
};

/**
 * Build the six cards with absent-where-empty fields.
 *
 * Every rule from data-model.md lives here, as code:
 *   1. the deck keeps the marks' order — nothing added, nothing dropped
 *   2. mark, Persian label and a resolving href on every card
 *   3. a card with no story has no story field to reserve
 *   4. a count appears only where the destination lists something purchasable
 *   5. stackIndex is dense (0…n−1) even if the catalogue shortens
 *   6. the six authentic marks are the whole of the imagery — passed through, not re-sourced
 */
export function buildBrandCards(
  marks: readonly BrandMarkSource[],
  purchasableCounts: Record<string, number>,
): BrandCard[] {
  return marks.map((mark, stackIndex) => {
    const slug = brandSlugByName[mark.name] ?? "";
    const story = brandStoriesByName[mark.name];
    const purchasable = purchasableCounts[mark.name] ?? 0;
    const card: BrandCard = {
      name: mark.name,
      label: mark.label,
      mark: mark.node,
      href: slug ? brandHref(slug) : "",
      stackIndex,
      stickyOffset: stackIndex * 16,
      zIndex: stackIndex + 1,
    };
    if (story) card.story = { title: story.title, text: story.text };
    if (purchasable > 0) {
      card.count = purchasable;
      card.countLabel = `${toFaDigits(String(purchasable))} محصول`;
    }
    return card;
  });
}

/**
 * The fit budget (D2), as arithmetic. The three numbers of the documented case —
 * viewport 640, dock 88, edges 80 — are inputs here, so a change to any of them is
 * a change to the budget, not a silent re-definition of what "fits" means.
 * A viewport too short to hold a card returns `static-stack`: a completion (FR-014),
 * not a negative height.
 */
export function cardFitBudget({
  viewportHeight,
  dockClearance,
  stackEdgeSize,
  cardCount = 6,
}: {
  viewportHeight: number;
  dockClearance: number;
  stackEdgeSize: number;
  cardCount?: number;
}): FitBudget {
  const deepestOffset = Math.max(0, cardCount - 1) * stackEdgeSize;
  const raw = viewportHeight - dockClearance - deepestOffset;
  return {
    available: Math.max(0, raw),
    deepestOffset,
    // `raw > 0` was the first version's test, and it let a 200px-tall viewport through as a "deck"
    // with a 32px card — a negative-height deck wearing a positive number. Fit is not "some room
    // left", it is "room enough to hold the label C2 protects" (MIN_CARD_HEIGHT above).
    mode: raw >= MIN_CARD_HEIGHT ? "deck" : "static-stack",
  };
}
