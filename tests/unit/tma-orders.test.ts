import { describe, it, expect } from "vitest";
import { isValidOrderStatusTransition, getAllowedNextOrderStatuses } from "@/lib/tma-service";

describe("tma-orders status transitions", () => {
  it("should allow valid forward transitions from PENDING", () => {
    expect(isValidOrderStatusTransition("PENDING", "PROCESSING")).toBe(true);
    expect(isValidOrderStatusTransition("PENDING", "CANCELED")).toBe(true);
    expect(isValidOrderStatusTransition("PENDING", "FAILED")).toBe(true);
  });

  it("should allow valid transitions from PROCESSING", () => {
    expect(isValidOrderStatusTransition("PROCESSING", "SHIPPING")).toBe(true);
    expect(isValidOrderStatusTransition("PROCESSING", "COMPLETED")).toBe(true);
    expect(isValidOrderStatusTransition("PROCESSING", "CANCELED")).toBe(true);
  });

  it("should allow valid transitions from SHIPPING", () => {
    expect(isValidOrderStatusTransition("SHIPPING", "COMPLETED")).toBe(true);
    expect(isValidOrderStatusTransition("SHIPPING", "REVERSED")).toBe(true);
  });

  it("should disallow invalid jumps or no-op identical transitions", () => {
    expect(isValidOrderStatusTransition("PENDING", "PENDING")).toBe(false);
    expect(isValidOrderStatusTransition("CANCELED", "SHIPPING")).toBe(false);
  });

  it("should return the list of allowed next statuses for UI buttons", () => {
    const nextStatuses = getAllowedNextOrderStatuses("PROCESSING");
    expect(nextStatuses).toContain("SHIPPING");
    expect(nextStatuses).toContain("COMPLETED");
    expect(nextStatuses).toContain("CANCELED");
    expect(nextStatuses).not.toContain("PENDING");
  });
});

