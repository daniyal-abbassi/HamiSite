import { beforeAll, describe, expect, it } from "vitest";
import { partnerMarks } from "@/components/brand/BrandMarks";
import { brandProductCounts } from "@/lib/brand-counts";
import { brandSlugByName, brandStoriesByName } from "@/lib/content/home";
import { listBrands, queryProducts } from "@/lib/catalog";
import { resolveFilter } from "@/lib/shop-filters";
import { toFaDigits } from "@/lib/utils";

/**
 * Feature 008 — the brands stacking-card deck, the guarantees that are cheap.
 *
 * Everything here is asserted as pure data or pure arithmetic on purpose. The project has
 * no DOM harness (no jsdom, no Playwright in `package.json`; feature 002's research
 * refused adding one), and research D9 splits the verification accordingly: the unit test
 * owns the claims a card is allowed to make, a real browser owns the geometry. A rule
 * that can be written as data is a rule that does not need a 360 px viewport to be
 * enforced — and this section has been rebuilt twice, both times shipping a defect that a
 * one-line assertion would have caught (a fixed 44 px empty story band on three of six
 * rows, a product count over an empty shelf).
 *
 * The test is written **test-first, against a model that does not exist yet**. Every test
 * that needs it calls `deck()`, which fails with a message naming exactly what to build.
 * The import is guarded on purpose: an unguarded `import` of a missing module kills the
 * whole file at collection time and you get one resolution error instead of fifteen
 * statements about what is missing.
 *
 * **Where the model is expected to live:** `lib/brand-deck.ts`, exporting
 * `buildBrandCards(marks, purchasableCounts)` and `cardFitBudget({...})`. If the
 * implementer keeps it in `lib/content/home.ts` next to `buildBrandRows` — which is what
 * plan.md's "no new abstraction" arguably asks for — re-point `DECK_MODULE` below and
 * nothing else changes.
 *
 * Run it with `npm run test:unit -- tests/unit/brand-deck.test.ts`, or directly:
 *
 *     npx vitest run --config vitest.frontend.config.ts tests/unit/brand-deck.test.ts
 *
 * The `--config` is not optional. The default `vitest.config.ts` loads `tests/setup.ts`,
 * whose `beforeEach` calls `resetDb()` and truncates nineteen tables — and because
 * `setupFiles` applies to every test file, a plain `npx vitest run tests/unit/…` wiped the
 * development database before a single assertion here. `vitest.frontend.config.ts` is the
 * same suite without `setupFiles`, and `tests/setup.ts` now refuses to reset any database
 * not named like a test database. **Do not add a `setupFiles` key to that config.**
 */

/* ------------------------------------------------------------------ the contract */

type Mark = { name: string; label: string; node: unknown };

/**
 * The card, as specs/008-brands-stacking-cards/data-model.md specifies it. Declared here
 * rather than imported so the test states the shape instead of trusting the shape: a field
 * the model does not carry is a field this suite will notice is missing.
 */
type BrandCard = {
  name: string;
  label: string;
  mark: unknown;
  /** `string | absent` — never `""`, never `null` (validation rule 3, FR-010). */
  story?: unknown;
  /** `number | absent` — present only where the destination lists something purchasable (rule 4). */
  count?: number;
  countLabel?: string;
  href: string;
  stackIndex: number;
  stickyOffset: number;
  zIndex: number;
};

type FitBudget = {
  /** Card height available for the deepest card, never negative. */
  available: number;
  /** `(cardCount - 1) * stackEdgeSize` — the cost of the visible deck edge (D3). */
  deepestOffset: number;
  /** The only two states FR-014 permits. */
  mode: "deck" | "static-stack";
};

type DeckModel = {
  buildBrandCards: (marks: readonly Mark[], purchasableCounts: Record<string, number>) => BrandCard[];
  cardFitBudget: (input: {
    viewportHeight: number;
    dockClearance: number;
    stackEdgeSize: number;
    cardCount?: number;
  }) => FitBudget;
};

/**
 * Annotated `string`, not a literal, so TypeScript does not try to resolve a module that
 * does not exist yet — `npm run typecheck` stays green on this file both before and after
 * the model is written. Vite still resolves it at runtime; the import below is guarded.
 */
const DECK_MODULE: string = "@/lib/brand-deck";

/** What to build, in the words of the person who has to build it. */
const MISSING_MODULE =
  `Feature 008 has no card model yet. Create lib/brand-deck.ts exporting buildBrandCards(marks, ` +
  `purchasableCounts) -> BrandCard[] and cardFitBudget({ viewportHeight, dockClearance, ` +
  `stackEdgeSize, cardCount }) -> { available, deepestOffset, mode }, per ` +
  `specs/008-brands-stacking-cards/data-model.md.`;

let model: DeckModel | null = null;
let modelError = MISSING_MODULE;

beforeAll(async () => {
  // The specifier is held in a variable on purpose: a literal would be resolved at
  // transform time and take the whole file down before a single assertion could run.
  const specifier = DECK_MODULE;
  let mod: Record<string, unknown>;
  try {
    mod = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
  } catch {
    return; // modelError already says what to build.
  }
  const missing = ["buildBrandCards", "cardFitBudget"].filter(
    (name) => typeof mod[name] !== "function",
  );
  if (missing.length > 0) {
    modelError = `${DECK_MODULE} exists but does not export ${missing.join(" and ")} — the deck cannot be ` +
      `built or budgeted without both. Shape: ${DECK_MODULE}.${missing[0]}(...)`;
    return;
  }
  model = mod as unknown as DeckModel;
});

/** The deck's model, or a statement of what has to be built before it exists. */
function deck(): DeckModel {
  if (!model) expect.fail(modelError);
  return model;
}

/* ------------------------------------------------- the real facts this asserts on */

const brands = listBrands();

/**
 * What each brand's own destination lists, read the way `app/(main)/brands/[slug]/page.tsx`
 * reads it for its `obtainableCount`: the same `queryProducts({ brandId, purchasableOnly: true })`.
 * The test computes this itself rather than trusting the deck, because the promise a card
 * makes is a claim about the export — if the card and the test were derived from the same
 * function, agreement would prove nothing.
 */
const purchasableByName: Record<string, number> = {};
const totalByName: Record<string, number> = {};
for (const mark of partnerMarks) {
  const outcome = resolveFilter(brands, brandSlugByName[mark.name]);
  if (outcome.status !== "resolved") continue;
  purchasableByName[mark.name] = queryProducts({
    brandId: outcome.item.id,
    purchasableOnly: true,
    page: 1,
    pageSize: 1,
  }).total;
  totalByName[mark.name] = outcome.item.productCount;
}

const SOURCE_ORDER = ["APPLE", "SAMSUNG", "XIAOMI", "NOKIA", "REALME", "TCH"] as const;
const WITH_STORY = ["APPLE", "SAMSUNG", "XIAOMI"] as const;

/** `Object.hasOwn` is ES2022 and tsconfig stops at ES2021, hence the prototype call. */
const hasField = (object: object, field: string) => Object.prototype.hasOwnProperty.call(object, field);

/** Cards are built with counts this test derived from the export — see the note above. */
const cardsOf = () => deck().buildBrandCards(partnerMarks as unknown as readonly Mark[], purchasableByName);

/* -------------------------------------------------- 1. six cards, in source order */

describe("008 deck — exactly six cards, in source order (FR-001)", () => {
  it("carries the six approved brands, in the order the marks declare, with nothing added or dropped", () => {
    const cards = cardsOf();
    expect(cards).toHaveLength(6);
    expect(cards.map((card) => card.name)).toEqual([...SOURCE_ORDER]);
  });

  it("carries no duplicate card, so no brand is dealt twice and none is skipped", () => {
    const names = cardsOf().map((card) => card.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps the deck's order and its marks' order the same list", () => {
    expect(cardsOf().map((card) => card.name)).toEqual(partnerMarks.map((mark) => mark.name));
  });
});
/* ---------------------------------------- 2. every card has mark, label and href */

describe("008 deck — every card is a card (FR-002, FR-005)", () => {
  it("gives every card a mark and a non-empty Persian label", () => {
    for (const card of cardsOf()) {
      expect(card.mark, `${card.name} has no mark`).toBeTruthy();
      expect(typeof card.label, `${card.name} has no label`).toBe("string");
      expect(card.label.trim(), `${card.name} has an empty label`).not.toBe("");
      // A Latin label means the Persian name fell back to the wordmark.
      expect(card.label, `${card.name}'s label is not Persian`).not.toMatch(/[A-Za-z]/);
    }
  });

  it("names each card with the label its own mark declares", () => {
    const labelOf = Object.fromEntries(partnerMarks.map((mark) => [mark.name, mark.label]));
    for (const card of cardsOf()) {
      expect(card.label, `${card.name} carries someone else's label`).toBe(labelOf[card.name]);
    }
  });

  it("gives every card a destination that resolves to that brand's own products", () => {
    for (const card of cardsOf()) {
      expect(card.href, `${card.name} has no href — the card is not a destination`).toBeTruthy();
      const slug = decodeURIComponent(card.href.replace(/^\/brands\//, ""));
      const outcome = resolveFilter(brands, slug);
      expect(outcome.status, `${card.name}'s href resolves to no brand`).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(outcome.item.name).toBe(card.label.replace(/\u200C/g, " "));
      }
    }
  });

  it("marks nothing as pending: no card is disabled, dimmed or labelled as coming soon", () => {
    for (const card of cardsOf()) {
      const claimed = Object.entries(card)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");
      expect(claimed, `${card.name} carries a pending claim`).not.toMatch(/disabled|pending|soon|به.?زودی/i);
    }
  });
});

/* -------------------------------- 3. no story means no placeholder for one (FR-010) */

describe("008 deck — a card with no story has no placeholder for one (FR-010, C4)", () => {
  it("omits the story field entirely on the three brands that have no story", () => {
    const without = cardsOf().filter((card) => !WITH_STORY.includes(card.name as (typeof WITH_STORY)[number]));
    expect(without.map((card) => card.name)).toEqual(["NOKIA", "REALME", "TCH"]);
    for (const card of without) {
      // The defect this exists to catch: a fixed 44 px band under the name that three of
      // six rows could never fill. The band is unrepresentable if the field is *absent* —
      // not empty, not null, not a dash.
      expect(hasField(card, "story"), `${card.name} reserves a story field it cannot fill`).toBe(false);
      expect(card.story).toBeUndefined();
    }
  });

  it("carries a real story, drawn from this brand's own record, on the three that have one", () => {
    const withStory = cardsOf().filter((card) => WITH_STORY.includes(card.name as (typeof WITH_STORY)[number]));
    expect(withStory.map((card) => card.name)).toEqual([...WITH_STORY]);
    for (const card of withStory) {
      const source = brandStoriesByName[card.name];
      expect(source, `${card.name} is in brandStories but has no record`).toBeTruthy();
      expect(card.story, `${card.name} claims a story and carries nothing`).toBeTruthy();
      // The data model types this as a one-line string; the existing record is a
      // {title, text} pair. Either is acceptable, an invented line is not.
      const said =
        typeof card.story === "string"
          ? card.story
          : Object.values(card.story as Record<string, unknown>).join(" ");
      expect(
        said.includes(source.title) || said.includes(source.text),
        `${card.name}'s story is not the one in brandStoriesByName`,
      ).toBe(true);
    }
  });
});

/* ------------------------- 4. the count rule: a number is a promise (FR-011, C5, D5) */

describe("008 deck — a count is present only where the destination has something (FR-011, C5)", () => {
  it("shows no number at all for a brand with nothing purchasable", () => {
    const empty = cardsOf().filter((card) => purchasableByName[card.name] === 0);
    // Measured against data/hami-products.json: APPLE, SAMSUNG and REALME list nothing
    // purchasable today. research.md D5 and contract C5 both still say "two of the six" —
    // that is stale, and it is the reason the count is computed here instead of copied
    // from the spec. Update those two lines; do not soften this assertion.
    expect(empty.map((card) => card.name)).toEqual(["APPLE", "SAMSUNG", "REALME"]);
    for (const card of empty) {
      expect(hasField(card, "count"), `${card.name} shows a count over an empty shelf`).toBe(false);
      expect(card.countLabel, `${card.name} renders a countLabel with no count`).toBeFalsy();
    }
  });

  it("shows exactly the number that brand's own listing lists, and no other figure", () => {
    for (const card of cardsOf()) {
      const purchasable = purchasableByName[card.name];
      if (purchasable === 0) continue;
      expect(card.count, `${card.name} carries the wrong count`).toBe(purchasable);
      // The overstatement the rule exists to prevent: the brand's *total* catalogue
      // count, which is what the current rows render — 49 over a shelf with none of it
      // purchasable is the false claim D5 was written against.
      const total = brandProductCounts()[card.name];
      if (total !== purchasable) {
        expect(card.count, `${card.name} shows the catalogue total instead of its purchasable count`).not.toBe(
          total,
        );
      }
    }
  });

  it("never shows zero, which is a discouraging number and still a claim", () => {
    for (const card of cardsOf()) {
      if (hasField(card, "count")) expect(card.count).toBeGreaterThan(0);
    }
  });

  it("writes every number in Persian numerals (FR-019)", () => {
    for (const card of cardsOf()) {
      if (!card.countLabel) continue;
      expect(card.countLabel, `${card.name}'s count is in Latin digits`).not.toMatch(/[0-9]/);
      expect(card.countLabel).toContain(toFaDigits(String(card.count)));
    }
  });

  it("can get an honest count at all: lib/brand-counts.ts has no purchasable-aware source", async () => {
    // `brandProductCounts()` returns each brand's *total* product count, purchasable or
    // not, so a card built from it says «۴۹ محصول» over a shelf with nothing buyable —
    // the false claim D5 was written against. The deck therefore needs a
    // purchasable-aware count beside it (suggested export:
    // `brandPurchasableCounts(): Record<string, number>` in lib/brand-counts.ts, read
    // through `queryProducts({ purchasableOnly: true })` exactly as the destination reads
    // its own `obtainableCount`). The search is by behaviour, not by name, so any shape
    // that reports a number for every mark and 0 for an empty shelf will pass.
    const countsModule = (await import("@/lib/brand-counts")) as unknown as Record<string, unknown>;
    const emptyListings = Object.keys(purchasableByName).filter((name) => purchasableByName[name] === 0);
    const honest = Object.values(countsModule).filter((value) => {
      if (typeof value !== "function") return false;
      let produced: unknown;
      try {
        produced = (value as () => unknown)();
      } catch {
        return false;
      }
      if (!produced || typeof produced !== "object") return false;
      const record = produced as Record<string, unknown>;
      return (
        partnerMarks.every((mark) => typeof record[mark.name] === "number") &&
        emptyListings.every((name) => record[name] === 0)
      );
    });
    expect(
      honest.length,
      "lib/brand-counts.ts exports no count function that reports 0 for a brand whose " +
        "destination lists nothing purchasable, so FR-011 cannot be satisfied from that module",
    ).toBeGreaterThan(0);
  });
});

/* ------------------------------------- 5. stackIndex is unique and dense (rule 5) */

describe("008 deck — a brand leaving the catalogue cannot leave a hole (rule 5, FR-001)", () => {
  it("numbers the cards 0…n-1 with no gap and no repeat", () => {
    const indexes = cardsOf()
      .map((card) => card.stackIndex)
      .sort((a, b) => a - b);
    expect(indexes).toEqual([...indexes.map((_, position) => position)]);
    expect(new Set(indexes).size).toBe(indexes.length);
  });

  it("keeps the numbering dense for a shortened brand set, not just for six", () => {
    // The edge case in data-model.md rule 5: if the catalogue ever drops a brand, the
    // remaining cards must still be 0…n-1. A builder that hardcodes six leaves a hole the
    // moment it is five, and the fifth card's sticky offset would be wrong by 16 px.
    const { buildBrandCards } = deck();
    const five = buildBrandCards(
      (partnerMarks as unknown as readonly Mark[]).filter((mark) => mark.name !== "TCH"),
      purchasableByName,
    );
    expect(five.map((card) => card.stackIndex).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("derives the sticky offset and the paint order from the stack index (D3, D6)", () => {
    for (const card of cardsOf()) {
      expect(card.stickyOffset, `${card.name}'s sticky offset is not stackIndex × 16px`).toBe(
        card.stackIndex * 16,
      );
      expect(card.zIndex, `${card.name}'s z-index is not stackIndex + 1`).toBe(card.stackIndex + 1);
    }
  });
});

/* -------------------------------- 6. the card record carries no imagery of its own */

describe("008 deck — the card record holds no imagery; the marks module is the only source of the six (FR-016, amended 2026-09-27)", () => {
  it("takes each card's mark from the marks module, not from a card-local literal", () => {
    const allowed = new Set(partnerMarks.map((mark) => (mark as unknown as Mark).node));
    for (const card of cardsOf()) {
      expect(
        allowed.has(card.mark),
        `${card.name}'s mark is not one of the six in components/brand/BrandMarks.tsx`,
      ).toBe(true);
    }
  });

  it("carries no image path, URL or filename of any kind on any card", () => {
    // The trap this effect invites: a deck looks better with pictures, so a stock or generated
    // brand photo is exactly the kind of thing that gets added without anyone deciding to.
    // Imagery IS allowed on the card now — one approved artwork per maker, since 2026-09-27 — but
    // it is resolved in the component from `lib/brand-identity.ts`, so it must still never appear
    // on the record this module builds. That keeps the deck's data model free of assets and puts
    // every picture on the page behind the same six-row table the colour claims are audited from.
    for (const card of cardsOf()) {
      for (const [key, value] of Object.entries(card)) {
        if (typeof value !== "string") continue;
        expect(
          value,
          `${card.name}.${key} references an image (${value}) — artwork belongs on the identity record, not the card`,
        ).not.toMatch(/\.(png|jpe?g|svg|webp|avif|gif)\b|^\/(images|assets|public|static)\//i);
        // The first version of this matcher also rejected `^/brands/`, on the assumption that a
        // path under a brand namespace was an image directory. It is not: `brandHref()` produces
        // `/brands/<persian-slug>`, which is the destination this very file asserts on in rule 2.
        // The assertion was right and its mechanism was wrong, so the mechanism changed and the
        // intent did not — any real asset is still caught by its extension or by /images/.
      }
    }
  });

  it("keeps the six marks the feature 004 approved, and no more", () => {
    expect(partnerMarks.map((mark) => mark.name)).toEqual([...SOURCE_ORDER]);
  });
});

/* --------------------------------------- 7. the fit budget, as arithmetic (FR-014) */

describe("008 deck — the fit budget is arithmetic, settled before styling (FR-014, D2)", () => {
  it("reports 472 px for the documented case: 640 − 88 − 80", () => {
    const { available, deepestOffset, mode } = deck().cardFitBudget({
      viewportHeight: 640,
      dockClearance: 88,
      stackEdgeSize: 16,
    });
    expect(deepestOffset, "five edges of 16 px is the deepest sticky offset").toBe(80);
    expect(available, "640 − 88 − 80 is 472, not whatever it currently returns").toBe(472);
    expect(mode, "640 × 640 fits, so the deck is the delivered state").toBe("deck");
  });

  it("spends its budget on the arithmetic it documents, not on a hardcoded 472", () => {
    const { cardFitBudget } = deck();
    // A deck clearance only exists below 768 px (feature 007's mobile dock, 5.5rem).
    const withDock = cardFitBudget({ viewportHeight: 640, dockClearance: 88, stackEdgeSize: 16 }).available;
    const withoutDock = cardFitBudget({ viewportHeight: 640, dockClearance: 0, stackEdgeSize: 16 }).available;
    expect(withoutDock - withDock).toBe(88);
    // And a deeper stack costs proportionally: 16 px per edge, five edges at six cards.
    const deepStack = cardFitBudget({
      viewportHeight: 640,
      dockClearance: 88,
      stackEdgeSize: 16,
      cardCount: 9,
    });
    expect(deepStack.deepestOffset).toBe(128);
    expect(deepStack.available).toBe(640 - 88 - 128);
  });

  it("reports the static stack rather than a negative height when the viewport is too short (FR-014)", () => {
    const { available, mode } = deck().cardFitBudget({
      viewportHeight: 200,
      dockClearance: 88,
      stackEdgeSize: 16,
    });
    // 200 − 88 − 80 is −68. A negative card height is what a half-fitting deck ships as;
    // FR-014 says the answer to a bad fit is the static stack, which is a completion.
    expect(mode).toBe("static-stack");
    expect(available, "a card height must never be negative").toBeGreaterThanOrEqual(0);
  });

  it("never returns less room for a taller viewport, whatever the floor is", () => {
    const { cardFitBudget } = deck();
    const at = (viewportHeight: number) =>
      cardFitBudget({ viewportHeight, dockClearance: 88, stackEdgeSize: 16 }).available;
    expect(at(900)).toBeGreaterThan(at(640));
    expect(at(640)).toBeGreaterThan(at(400));
    expect(at(400)).toBeGreaterThanOrEqual(0);
  });
});
