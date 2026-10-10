import { describe, it, expect } from "vitest";
import { calculateDashboardMetrics, type RawOrderForMetrics } from "@/lib/tma-service";

describe("tma-dashboard metrics calculation", () => {
  const now = new Date("2026-10-11T12:00:00Z");

  const sampleOrders: RawOrderForMetrics[] = [
    {
      id: 1,
      totalAmount: 15000000,
      status: "PROCESSING",
      paymentStatus: "COMPLETED",
      createdAt: new Date("2026-10-11T09:30:00Z"),
    },
    {
      id: 2,
      totalAmount: 22000000,
      status: "COMPLETED",
      paymentStatus: "COMPLETED",
      createdAt: new Date("2026-10-11T10:15:00Z"),
    },
    {
      id: 3,
      totalAmount: 5000000,
      status: "PENDING",
      paymentStatus: "INITIATED",
      createdAt: new Date("2026-10-11T11:00:00Z"),
    },
    {
      id: 4,
      totalAmount: 8000000,
      status: "CANCELED",
      paymentStatus: "FAILED",
      createdAt: new Date("2026-10-11T08:00:00Z"),
    },
    {
      id: 5,
      totalAmount: 30000000,
      status: "COMPLETED",
      paymentStatus: "COMPLETED",
      createdAt: new Date("2026-10-10T15:00:00Z"), // Yesterday
    },
  ];

  it("should compute today's revenue correctly excluding unpaid/canceled orders", () => {
    const metrics = calculateDashboardMetrics(sampleOrders, 3, now);
    // Order 1 (15,000,000) + Order 2 (22,000,000) = 37,000,000
    expect(metrics.todayRevenue).toBe(37000000);
  });

  it("should count pending orders that require admin attention", () => {
    const metrics = calculateDashboardMetrics(sampleOrders, 3, now);
    // Order 1 (PROCESSING) + Order 3 (PENDING) = 2
    expect(metrics.pendingCount).toBe(2);
  });

  it("should count completed orders today", () => {
    const metrics = calculateDashboardMetrics(sampleOrders, 3, now);
    // Order 2 = 1
    expect(metrics.todayCompletedCount).toBe(1);
  });

  it("should include inventory stock alert count", () => {
    const metrics = calculateDashboardMetrics(sampleOrders, 5, now);
    expect(metrics.lowStockAlerts).toBe(5);
  });
});

