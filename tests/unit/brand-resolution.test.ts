import { describe, expect, it } from "vitest";
import { listBrands, listCategories, queryProducts } from "@/lib/catalog";
import { flattenTree, normalizeSlug, resolveFilter, type FilterItem } from "@/lib/shop-filters";
import { partnerMarks } from "@/components/brand/BrandMarks";
import {
  brandSlugByName,
  brandStories,
  brandWall,
  categoryLinks,
  categoryMosaic,
  featuredOnlineService,
} from "@/lib/content/home";

/**
 * Two jobs here. The first pins the resolver's behaviour — most importantly that an
 * unrecognised slug can never degrade into "no filter". The second is a drift guard:
 * every brand and category slug the homepage links to must exist in the catalogue the
 * shop actually serves, because that is exactly the assumption that was wrong for the
 * homepage's brand and category links and went unnoticed while they silently returned
 * the entire unfiltered product list.
 */

const FIXTURE: FilterItem[] = [
  { id: 1, name: "اپل", slug: "اپل" },
  { id: 2, name: "تی سی اچ", slug: "تی-سی-اچ" },
  { id: 3, name: "نکسا | NEXA", slug: "نکسا-nexa" },
];

describe("resolveFilter", () => {
  it("reports not-requested for an absent or blank slug", () => {
    expect(resolveFilter(FIXTURE, null).status).toBe("not-requested");
    expect(resolveFilter(FIXTURE, undefined).status).toBe("not-requested");
    expect(resolveFilter(FIXTURE, "   ").status).toBe("not-requested");
  });

  it("resolves an exact slug", () => {
    const outcome = resolveFilter(FIXTURE, "اپل");
    expect(outcome.status).toBe("resolved");
    if (outcome.status === "resolved") expect(outcome.item.id).toBe(1);
  });

  it("resolves a percent-encoded slug, as links arrive from chat apps", () => {
    const outcome = resolveFilter(FIXTURE, encodeURIComponent("تی-سی-اچ"));
    expect(outcome.status).toBe("resolved");
    if (outcome.status === "resolved") expect(outcome.item.id).toBe(2);
  });

  it("resolves a name whose separator is spelled differently", () => {
    expect(resolveFilter(FIXTURE, "نکسا | NEXA").status).toBe("resolved");
    expect(resolveFilter(FIXTURE, "نکسا-nexa").status).toBe("resolved");
  });

  it("never degrades an unrecognised slug into no filter", () => {
    const outcome = resolveFilter(FIXTURE, "apple");
    expect(outcome.status).toBe("unknown");
    if (outcome.status === "unknown") expect(outcome.requested).toBe("apple");
  });

  it("reports unknown for an empty catalogue rather than falling through", () => {
    expect(resolveFilter([], "whatever").status).toBe("unknown");
    expect(resolveFilter([], null).status).toBe("not-requested");
  });
});

describe("normalizeSlug", () => {
  it("matches the derivation the catalogue uses for brand and category names", () => {
    expect(normalizeSlug("تی سی اچ")).toBe("تی-سی-اچ");
    expect(normalizeSlug("نکسا | NEXA")).toBe("نکسا-nexa");
    expect(normalizeSlug("  اپل  ")).toBe("اپل");
  });
});

describe("flattenTree", () => {
  it("reaches nested nodes, which category slugs live in", () => {
    type Node = { id: number; name: string; slug: string; children?: Node[] };
    const tree: Node[] = [
      { id: 1, name: "a", slug: "a", children: [{ id: 2, name: "b", slug: "b" }] },
    ];
    expect(flattenTree(tree).map((node) => node.slug)).toEqual(["a", "b"]);
  });
});

describe("homepage brand links resolve against the real catalogue", () => {
  const brands = listBrands();

  it.each(brandWall.map((brand) => [brand.name, brand.slug] as const))(
    "%s resolves to a brand with products",
    (_name, slug) => {
      const outcome = resolveFilter(brands, slug);
      expect(outcome.status).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(outcome.item.productCount).toBeGreaterThan(0);
      }
    },
  );

  it.each(brandStories.map((story) => [story.name, story.slug] as const))(
    "%s story href carries the catalogue slug",
    (_name, slug) => {
      expect(resolveFilter(brands, slug).status).toBe("resolved");
    },
  );

  it("builds each story href from the slug it stores", () => {
    for (const story of brandStories) {
      expect(story.href).toBe(`/brands/${encodeURIComponent(story.slug)}`);
    }
  });
});

describe("homepage category links resolve against the real catalogue", () => {
  const categories = listCategories();
  const links: Set<string> = new Set(Object.values(categoryLinks));

  /*
   * T055 moved these destinations from `/shop?category=<slug>` to the dedicated
   * `/categories/<slug>` route, so the slug is now a path segment. The guard is
   * unchanged in strength: the href must carry a slug that exists verbatim in the
   * catalogue and whose products are reachable, which is the assumption that broke
   * silently when eleven homepage links started returning the whole unfiltered list.
   */
  const requestedSlug = (href: string) => {
    const segment = new URL(href, "http://hami.test").pathname.split("/").pop() ?? "";
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  };

  it.each(Object.entries(categoryLinks))("%s points at a category that has products", (_key, href) => {
    const outcome = resolveFilter(categories, requestedSlug(href));
    expect(outcome.status).toBe("resolved");
    if (outcome.status === "resolved") {
      // The destination is `/categories/<slug>`, which lists the subtree, so the
      // subtree is what has to be non-empty — an exact match would re-introduce the
      // empty door under the parent's own name (T056).
      expect(queryProducts({ categorySubtreeId: outcome.item.id, page: 1, pageSize: 1 }).total).toBeGreaterThan(0);
    }
  });

  it("is a dedicated category route, not a shop query string", () => {
    for (const href of links) expect(href.startsWith("/categories/")).toBe(true);
  });

  it("matches a category slug verbatim, not through the name fallback", () => {
    for (const href of links) {
      expect(categories.some((c) => c.slug === requestedSlug(href))).toBe(true);
    }
  });

  it("is the only source of category hrefs the homepage may use", () => {
    const consumers = [
      // `accessoryCategories` left with the accessories section (T089, 2026-09-24); this guard
      // still covers every authored href the homepage actually renders.
      ...categoryMosaic,
      featuredOnlineService,
    ] as Array<{ href: string }>;
    for (const item of consumers) expect(links.has(item.href)).toBe(true);
  });
});

describe("brand rows carry a destination for every mark", () => {
  const brands = listBrands();

  // partnerMarks is the row set, brandSlugByName the destinations. Either growing past
  // the other silently produces a row that is not a link — C4 and FR-002 together.
  it.each(partnerMarks.map((mark) => [mark.name, mark.label] as const))(
    "%s has a slug and a catalog brand with products",
    (name, label) => {
      const slug = brandSlugByName[name];
      expect(slug, `${label} has no slug in brandWall`).toBeTruthy();
      const outcome = resolveFilter(brands, slug);
      expect(outcome.status).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(outcome.item.productCount).toBeGreaterThan(0);
        expect(outcome.item.name).toBe(label.replace(/\u200C/g, " "));
      }
    },
  );

  it("renders exactly six rows", () => {
    expect(partnerMarks).toHaveLength(6);
  });
});
