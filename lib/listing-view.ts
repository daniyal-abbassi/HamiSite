import { toFaDigits } from "@/lib/utils";

/**
 * The view state of a dedicated destination (`/categories/<slug>`, `/brands/<slug>`) and
 * the links that change it.
 *
 * Its own module because the interesting part is not rendering, it is composition: two
 * independent controls whose URL has to carry both, and a composite control whose link
 * must be byte-identical to pressing them one after another. Getting that wrong is
 * invisible in a screenshot and reads to a shopper as the page forgetting a filter.
 */
export type ListingView = { sort: string; obtainable: boolean };

/** `next` is what the pressed control sets; anything it leaves out keeps its value. */
export function listingViewHref(basePath: string, view: ListingView, next: Partial<ListingView>): string {
  const merged = { ...view, ...next };
  const params = new URLSearchParams();
  if (merged.sort) params.set("sort", merged.sort);
  if (merged.obtainable) params.set("obtainable", "1");
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** A view is active when any control is set, which is when a «پاک کردن» link has a job. */
export function isFilteredView(view: ListingView): boolean {
  return view.sort !== "" || view.obtainable;
}

/**
 * The one sentence under a destination's title that says what the destination holds.
 *
 * Lives here because both routes write it, and FR-011 — every number a shopper reads is
 * in Persian digits — had been honoured on the count line and broken on this one, a
 * «۶ محصول» sitting under a «6 محصول در دستهٔ…». Two inline template strings in two
 * files is how that happens; one function with a test is how it stops happening again.
 */
export function destinationDescription(input: {
  total: number;
  /** The shopper-facing name: the brand's label, or the category's stored name. */
  name: string;
  kind: "brand" | "category";
  subCategories?: number;
}): string {
  const count = toFaDigits(input.total);
  if (input.kind === "brand") return `${input.name} — ${count} محصول از فروشگاه حضوری حامی همراه در مشهد.`;
  const subs = input.subCategories ?? 0;
  if (subs > 0) return `${count} محصول در این دسته و ${toFaDigits(subs)} زیردستهٔ آن.`;
  return `${count} محصول در دستهٔ ${input.name}.`;
}
