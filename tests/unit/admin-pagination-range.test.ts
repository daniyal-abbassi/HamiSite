import { describe, expect, it } from "vitest";
import { paginationRange } from "@/components/admin/ui/pagination-range";

/**
 * The arithmetic behind the admin pagination primitive. Tested as a pure function because this
 * project's Vitest runs in `node` with no DOM harness — what is under test is the window maths and
 * the clamping, not the buttons.
 *
 * Every case is written against the envelope the API actually sends
 * (`meta = { page, pageSize, total, hasNextPage }`, `lib/http.ts:98-109`), so the guard against a
 * hostile URL lives here rather than in the component.
 */

const meta = (page: number, pageSize: number, total: number, hasNextPage = page * pageSize < total) => ({
  page,
  pageSize,
  total,
  hasNextPage,
});

describe("paginationRange — the empty and single-page ends", () => {
  it("shows one page and no records when the result set is empty", () => {
    const window = paginationRange(meta(1, 20, 0, false));

    expect(window.lastPage).toBe(1);
    expect(window.current).toBe(1);
    expect(window.items).toEqual([1]);
    expect(window.from).toBe(0);
    expect(window.to).toBe(0);
    expect(window.hasPrevious).toBe(false);
    expect(window.hasNext).toBe(false);
  });

  it("shows one page for a result that fits on a single page", () => {
    const window = paginationRange(meta(1, 20, 8));

    expect(window.items).toEqual([1]);
    expect(window.from).toBe(1);
    expect(window.to).toBe(8);
    expect(window.hasNext).toBe(false);
  });

  it("keeps one page when the count is exactly the page size", () => {
    expect(paginationRange(meta(1, 20, 20)).lastPage).toBe(1);
  });
});

describe("paginationRange — a total that does not divide evenly", () => {
  it("rounds the last page up and lets it hold fewer records", () => {
    // ۴۵ records at ۲۰ per page: three pages, the last holding five.
    const window = paginationRange(meta(3, 20, 45));

    expect(window.lastPage).toBe(3);
    expect(window.from).toBe(41);
    expect(window.to).toBe(45);
    expect(window.current).toBe(3);
  });

  it("reports a partial last page as the end of the range", () => {
    expect(paginationRange(meta(2, 10, 15)).to).toBe(15);
    expect(paginationRange(meta(1, 10, 11)).to).toBe(10);
  });
});

describe("paginationRange — the window at each end of a long list", () => {
  // ۲۰۰ records at ۲۰ per page = ۱۰ pages.
  const tenPages = (page: number) => meta(page, 20, 200);

  it("omits the leading ellipsis when the current page is the first", () => {
    expect(paginationRange(tenPages(1)).items).toEqual([1, 2, "gap", 10]);
  });

  it("omits the trailing ellipsis when the current page is the last", () => {
    const window = paginationRange(tenPages(10));

    expect(window.items).toEqual([1, "gap", 9, 10]);
    expect(window.hasPrevious).toBe(true);
    expect(window.current).toBe(10);
  });

  it("ellipsises both sides from the middle", () => {
    expect(paginationRange(tenPages(5)).items).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  });

  it("clamps a requested page beyond the end instead of showing an empty one", () => {
    const window = paginationRange(tenPages(99));

    expect(window.current).toBe(10);
    expect(window.items).toEqual([1, "gap", 9, 10]);
  });

  it("spends no ellipsis on a single hidden page", () => {
    // ۷ pages, current ۳: page ۲ sits alone between ۱ and ۴, so it is shown rather than folded.
    expect(paginationRange(meta(3, 20, 7 * 20)).items).toEqual([1, 2, 3, 4, "gap", 7]);
  });

  it("lists every page when they all fit in the window", () => {
    expect(paginationRange(meta(2, 20, 4 * 20)).items).toEqual([1, 2, 3, 4]);
  });
});

describe("paginationRange — the window is configurable", () => {
  it("widens with more siblings", () => {
    // Pages ۹–۱۰ are the tail boundary; ۹ lands one step after ۸, so it joins the run instead of
    // being hidden behind an ellipsis that would cover a single page.
    expect(paginationRange(meta(6, 20, 200), { siblingCount: 2 }).items).toEqual([
      1,
      "gap",
      4,
      5,
      6,
      7,
      8,
      9,
      10,
    ]);
  });

  it("keeps more pages at each boundary", () => {
    expect(paginationRange(meta(6, 20, 200), { boundaryCount: 2, siblingCount: 0 }).items).toEqual([
      1,
      2,
      "gap",
      6,
      "gap",
      9,
      10,
    ]);
  });

  it("never drops the first or last page, whatever the counts", () => {
    const window = paginationRange(meta(5, 20, 200), { boundaryCount: 4, siblingCount: 3 });

    expect(window.items[0]).toBe(1);
    expect(window.items[window.items.length - 1]).toBe(10);
    expect(window.items).not.toContain("gap");
  });
});

describe("paginationRange — untrusted input", () => {
  it("treats a zero or negative page size as one", () => {
    expect(paginationRange({ page: 1, pageSize: 0, total: 45, hasNextPage: true }).lastPage).toBe(45);
    expect(paginationRange({ page: 1, pageSize: -3, total: 45, hasNextPage: true }).lastPage).toBe(45);
  });

  it("treats a negative or missing total as empty", () => {
    expect(paginationRange({ page: 1, pageSize: 20, total: -5, hasNextPage: false }).items).toEqual([1]);
    expect(paginationRange({ page: 1, pageSize: 20, total: NaN, hasNextPage: false }).to).toBe(0);
  });

  it("treats a page below one as the first page", () => {
    expect(paginationRange({ page: 0, pageSize: 20, total: 200, hasNextPage: true }).current).toBe(1);
  });

  it("floors a fractional page rather than rendering ۲٫۵", () => {
    expect(paginationRange({ page: 2.7, pageSize: 20, total: 200, hasNextPage: true }).current).toBe(2);
  });
});

describe("paginationRange — hasNextPage is the server's word", () => {
  it("passes the flag through rather than deriving it from the count", () => {
    // A stale or capped `total` must not disable the control that reaches existing records.
    expect(paginationRange({ page: 1, pageSize: 20, total: 20, hasNextPage: true }).hasNext).toBe(true);
    expect(paginationRange({ page: 1, pageSize: 20, total: 200, hasNextPage: false }).hasNext).toBe(false);
  });

  it("still derives hasPrevious from the page you are on", () => {
    expect(paginationRange({ page: 1, pageSize: 20, total: 200, hasNextPage: true }).hasPrevious).toBe(false);
    expect(paginationRange({ page: 2, pageSize: 20, total: 200, hasNextPage: true }).hasPrevious).toBe(true);
  });
});
