/**
 * Filter-parameter resolution for the shop listing.
 *
 * Catalog slugs are derived from the shop's own brand and category names, most of
 * which are Persian — `اپل`, `تی-سی-اچ`, `موبایل-و-تبلت`. Before this module an
 * unrecognised slug in the URL was simply dropped from the request, so a link like
 * `/shop?brand=apple` rendered all 189 products and looked exactly like a working
 * filter. Eleven homepage links were broken that way and none of them failed loudly.
 *
 * An unrecognised slug is now its own outcome. A shopper is better served by an honest
 * "we don't have that brand" than by an unfiltered catalogue wearing a filter's clothes.
 */

export type FilterItem = { id: number; name: string; slug: string };

export type FilterOutcome<T extends FilterItem> =
  | { status: "resolved"; item: T }
  | { status: "unknown"; requested: string }
  | { status: "not-requested" };

/**
 * Mirrors the derivation the catalog itself uses, so a slug that arrives percent
 * encoded, with a stray space, or with the `name | LATIN` separator spelled
 * differently still lands on the right record.
 */
export function normalizeSlug(value: string): string {
  let text = value.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // A malformed escape is not a reason to fail the lookup; match on the raw text.
  }
  return text
    .replace(/\s*\|\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .toLowerCase();
}

/**
 * Resolve a requested brand or category slug against the list the API returned.
 *
 * Matching is tried exact-slug, then normalised-slug, then normalised-name, in that
 * order. It deliberately never falls back to "no filter": an empty or absent
 * `requested` yields `not-requested`, and a non-empty one that matches nothing
 * yields `unknown`.
 */
export function resolveFilter<T extends FilterItem>(
  items: readonly T[],
  requested: string | null | undefined,
): FilterOutcome<T> {
  if (!requested || !requested.trim()) return { status: "not-requested" };

  const wanted = normalizeSlug(requested);
  const found =
    items.find((item) => item.slug === requested) ??
    items.find((item) => normalizeSlug(item.slug) === wanted) ??
    items.find((item) => normalizeSlug(item.name) === wanted);

  return found ? { status: "resolved", item: found } : { status: "unknown", requested: requested.trim() };
}

/** Categories arrive as a tree; resolution needs every node flattened. */
export function flattenTree<T extends { children?: T[] }>(tree: readonly T[], into: T[] = []): T[] {
  for (const node of tree) {
    into.push(node);
    if (node.children?.length) flattenTree(node.children, into);
  }
  return into;
}
