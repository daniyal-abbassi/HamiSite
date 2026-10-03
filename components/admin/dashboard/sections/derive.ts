/**
 * Derived dashboard figures — pure functions over the `reports/summary` payload, so the
 * node-environment vitest suite can pin every formula (data-model.md:49-59).
 *
 * The terminal set is the code's own `TERMINAL_CANCEL_STATUSES` (lib/orders.ts:82), not
 * invented here, so the dashboard and the restock/credit logic agree on which statuses
 * mean "reversed".
 */

import { toFaDigits } from "@/lib/utils";

/** Terminal-cancel statuses — lib/orders.ts:82. */
export const TERMINAL_CANCEL_STATUSES: readonly string[] = ["CANCELED", "FAILED", "REVERSED"];

/** The three states a human moves an order through (prisma/schema.prisma:71-79). */
export const ACTION_STATUSES: readonly string[] = ["PENDING", "PROCESSING", "SHIPPING"];

/** One row of `reports/summary.byStatus` (app/api/admin/reports/summary/route.ts:19-23). */
export type StatusRow = {
  status: string;
  orderCount: number;
  revenue: number;
};

/** The `reports/summary` payload (app/api/admin/reports/summary/route.ts:28). */
export type SummaryData = {
  periodDays: number;
  totalOrders: number;
  totalRevenue: number;
  byStatus: StatusRow[];
};

function sumWhere(
  byStatus: readonly StatusRow[],
  keep: (row: StatusRow) => boolean,
  value: (row: StatusRow) => number,
): number {
  let total = 0;
  for (const row of byStatus) {
    if (keep(row)) total += value(row);
  }
  return total;
}

/**
 * `needsAction` — sum of `orderCount` over PENDING + PROCESSING + SHIPPING. Those three are
 * the states a human moves an order through; terminal-cancel statuses are not work
 * (data-model.md:53).
 */
export function needsAction(byStatus: readonly StatusRow[]): number {
  return sumWhere(byStatus, (row) => ACTION_STATUSES.includes(row.status), (row) => row.orderCount);
}

/**
 * `paidRevenue` — sum of `revenue` over every status EXCEPT CANCELED, FAILED, REVERSED.
 * `totalRevenue` from the route includes cancelled orders (the groupBy filters only on
 * createdAt, route.ts:14), so showing it as «درآمد» would be a false statement (FR-003b,
 * data-model.md:54). The exclusion list is explicit: a status the enum does not know is
 * NOT excluded.
 */
export function paidRevenue(byStatus: readonly StatusRow[]): number {
  return sumWhere(
    byStatus,
    (row) => !TERMINAL_CANCEL_STATUSES.includes(row.status),
    (row) => row.revenue,
  );
}

/** Order count over the same non-terminal set — the denominator of `avgPaidOrder`. */
export function paidOrderCount(byStatus: readonly StatusRow[]): number {
  return sumWhere(
    byStatus,
    (row) => !TERMINAL_CANCEL_STATUSES.includes(row.status),
    (row) => row.orderCount,
  );
}

/**
 * `avgPaidOrder` — `paidRevenue / paidOrderCount`, rounded. Replaces the old
 * `totalRevenue / totalOrders`, whose denominator counted cancelled orders
 * (data-model.md:56). 0 when there are no paid orders — a divide-by-zero must never
 * surface as a figure.
 */
export function avgPaidOrder(byStatus: readonly StatusRow[]): number {
  const count = paidOrderCount(byStatus);
  return count > 0 ? Math.round(paidRevenue(byStatus) / count) : 0;
}

/**
 * `orderVolume` — the sum of every status's `orderCount`, cancelled included. This is
 * exactly how the route computes `totalOrders` (route.ts:25), so the dashboard's figure
 * and the API's are the same number by construction. The basis ("includes cancelled") is
 * printed on the card, which is what makes it honest (C5, data-model.md:55).
 */
export function orderVolume(byStatus: readonly StatusRow[]): number {
  return sumWhere(byStatus, () => true, (row) => row.orderCount);
}

/**
 * The window label, from the API's own `periodDays` — never a hardcoded «۳۰». If the route
 * ever changes the window, the label changes with it (brief rule 5).
 */
export function windowLabel(periodDays: number): string {
  return `${toFaDigits(periodDays)} روز اخیر`;
}
