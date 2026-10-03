/** Hand-built for this repo — no upstream counterpart. The kit's `list-pagination.tsx` expects a
 * `pagination` primitive and computes its window inside the component; this file is the same math
 * pulled out so it can be tested without a DOM (Vitest here runs in `node`, there is no DOM harness).
 *
 * The input is the exact envelope the admin routes return — `meta` from `lib/http.ts:98-109` and
 * `app/api/admin/orders/route.ts:49-54` — so a caller can hand this function the object it already
 * has. Nothing here invents a figure: `from`/`to` are arithmetic over `total`, and `hasNext` is the
 * server's own flag rather than a guess about what exists beyond it.
 */

/** `{ page, pageSize, total, hasNextPage }` as the API sends it. */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

/** A page button, or the ellipsis that stands for pages you are not showing. */
export type PageWindowItem = number | "gap";

export type PageWindow = {
  /** The page every control is measured against: `page`, clamped into `[1, lastPage]`. */
  current: number;
  /** `ceil(total / pageSize)`, never below 1 — an empty list has one page with nothing on it. */
  lastPage: number;
  /** Left-to-right in reading order. Under RTL the row is laid out in this same order and CSS
   * mirrors it; the numbers stay ascending from the start edge. */
  items: PageWindowItem[];
  hasPrevious: boolean;
  /** The server's flag, passed through: only the route knows whether another page exists. */
  hasNext: boolean;
  /** 1-based index of the first record on this page; 0 when there are no records at all. */
  from: number;
  /** 1-based index of the last record on this page; 0 when there are no records at all. */
  to: number;
};

export type PageWindowOptions = {
  /** Pages always shown at each end. Default 1 — «۱» and «۹». */
  boundaryCount?: number;
  /** Neighbours shown either side of the current page. Default 1. */
  siblingCount?: number;
};

/** Append a page number, collapsing the degenerate cases: no duplicate, no ellipsis that hides a
 * single page (spending «…» on one hidden page is worse than showing it), no gap before anything. */
function appendPage(items: PageWindowItem[], page: number) {
  const previous = items[items.length - 1];

  if (previous === undefined || previous === "gap") {
    items.push(page);
    return;
  }
  if (page - previous === 1) {
    items.push(page);
    return;
  }
  if (page - previous === 2) {
    items.push(previous + 1, page);
    return;
  }
  items.push("gap", page);
}

export function paginationRange(meta: PaginationMeta, options: PageWindowOptions = {}): PageWindow {
  // `page`/`pageSize` arrive from a URL, and `total` from a `count()`. All three are sanitised
  // rather than trusted: a `pageSize` of 0 would make every page boundary Infinity, and a negative
  // `total` would produce a last page that no page button corresponds to.
  const size = Number.isFinite(meta.pageSize) && meta.pageSize >= 1 ? Math.floor(meta.pageSize) : 1;
  const total = Number.isFinite(meta.total) && meta.total > 0 ? Math.floor(meta.total) : 0;
  const requested = Number.isFinite(meta.page) && meta.page >= 1 ? Math.floor(meta.page) : 1;

  const lastPage = Math.max(1, Math.ceil(total / size));
  const current = Math.min(requested, lastPage);

  const boundary = Math.max(1, options.boundaryCount ?? 1);
  const sibling = Math.max(0, options.siblingCount ?? 1);

  const items: PageWindowItem[] = [];
  if (lastPage === 1) {
    items.push(1);
  } else {
    for (let page = 1; page <= Math.min(boundary, lastPage); page += 1) appendPage(items, page);

    const middleStart = Math.max(boundary + 1, current - sibling);
    const middleEnd = Math.min(lastPage - boundary, current + sibling);
    for (let page = middleStart; page <= middleEnd; page += 1) appendPage(items, page);

    for (let page = Math.max(lastPage - boundary + 1, boundary + 1); page <= lastPage; page += 1) {
      appendPage(items, page);
    }
  }

  return {
    current,
    lastPage,
    items,
    hasPrevious: current > 1,
    hasNext: meta.hasNextPage,
    from: total === 0 ? 0 : (current - 1) * size + 1,
    to: total === 0 ? 0 : Math.min(current * size, total),
  };
}
