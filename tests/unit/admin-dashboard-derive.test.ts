/**
 * Derived dashboard figures against the rules in specs/015-admin-dashboard/data-model.md:49-59.
 * Node-environment suite — pure functions only, no render.
 */
import { describe, expect, it } from "vitest";
import {
  avgPaidOrder,
  needsAction,
  orderVolume,
  paidRevenue,
  type StatusRow,
} from "@/components/admin/dashboard/sections/derive";

/** Build StatusRow[] from [status, orderCount, revenue] tuples. */
const rows = (...entries: [string, number, number][]): StatusRow[] =>
  entries.map(([status, orderCount, revenue]) => ({ status, orderCount, revenue }));

describe("needsAction — sum(orderCount) over PENDING + PROCESSING + SHIPPING (data-model.md:53)", () => {
  it("counts only the three states a human moves an order through", () => {
    const byStatus = rows(
      ["PENDING", 2, 100],
      ["PROCESSING", 3, 200],
      ["SHIPPING", 1, 50],
      ["COMPLETED", 10, 900],
      ["CANCELED", 4, 300],
    );
    expect(needsAction(byStatus)).toBe(6);
  });

  it("returns 0 when every status is terminal (CANCELED/FAILED/REVERSED) — terminal-cancel statuses are not work", () => {
    const byStatus = rows(
      ["CANCELED", 4, 300],
      ["FAILED", 1, 10],
      ["REVERSED", 2, 20],
    );
    expect(needsAction(byStatus)).toBe(0);
  });

  it("returns 0 for an empty byStatus", () => {
    expect(needsAction([])).toBe(0);
  });

  it("ignores a status the enum does not know", () => {
    expect(needsAction(rows(["REFUNDED", 5, 500]))).toBe(0);
  });
});

describe("paidRevenue — sum(revenue) over every status except CANCELED, FAILED, REVERSED (data-model.md:54)", () => {
  it("excludes exactly the terminal-cancel set the code already uses (lib/orders.ts:82)", () => {
    const byStatus = rows(
      ["COMPLETED", 10, 900],
      ["SHIPPING", 1, 50],
      ["CANCELED", 4, 300],
      ["FAILED", 1, 10],
      ["REVERSED", 2, 20],
    );
    expect(paidRevenue(byStatus)).toBe(950);
  });

  it("returns 0 when all statuses are terminal", () => {
    const byStatus = rows(
      ["CANCELED", 4, 300],
      ["FAILED", 1, 10],
      ["REVERSED", 2, 20],
    );
    expect(paidRevenue(byStatus)).toBe(0);
  });

  it("returns 0 for an empty byStatus", () => {
    expect(paidRevenue([])).toBe(0);
  });

  it("includes a status the enum does not know — the exclusion list is explicit, not the enum", () => {
    expect(paidRevenue(rows(["REFUNDED", 5, 500]))).toBe(500);
  });
});

describe("avgPaidOrder — paidRevenue / (non-terminal orderCount), rounded (data-model.md:56)", () => {
  it("divides paid revenue by the count of non-terminal orders, not by totalOrders", () => {
    const byStatus = rows(
      ["COMPLETED", 3, 1000],
      ["SHIPPING", 1, 250],
      ["CANCELED", 4, 300],
    );
    // paidRevenue = 1250, paidOrderCount = 4 → 312.5 → 313.
    // The old totalRevenue/totalOrders would have divided by 8 and counted cancelled money.
    expect(avgPaidOrder(byStatus)).toBe(313);
  });

  it("is 0 when there are no paid orders — a divide-by-zero never surfaces as a figure", () => {
    expect(avgPaidOrder(rows(["CANCELED", 4, 300]))).toBe(0);
    expect(avgPaidOrder([])).toBe(0);
  });
});

describe("orderVolume — totalOrders, cancelled included (data-model.md:55)", () => {
  it("is the sum of every status's orderCount, matching the route's own totalOrders (route.ts:25)", () => {
    const byStatus = rows(
      ["PENDING", 2, 100],
      ["COMPLETED", 10, 900],
      ["CANCELED", 4, 300],
    );
    expect(orderVolume(byStatus)).toBe(16);
  });

  it("is 0 for an empty byStatus", () => {
    expect(orderVolume([])).toBe(0);
  });
});
