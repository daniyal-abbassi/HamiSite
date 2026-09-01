import { beforeEach, describe, expect, it } from "vitest";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getSummary } from "@/app/api/admin/reports/summary/route";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

describe("admin reports summary", () => {
  it("403s for a non-admin", async () => {
    const res = await getSummary(getRequest("http://localhost/api/admin/reports/summary", retailCookie));
    expect(res.status).toBe(403);
  });

  it("summarizes order count and revenue by status for the last 30 days", async () => {
    await createOrder(
      jsonRequest(
        "http://localhost/api/orders",
        "POST",
        {
          firstName: "Ali",
          lastName: "Retail",
          phone: "+989120000000",
          city: "Tehran",
          addressText: "123 Test St",
          items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 2 }],
        },
        retailCookie,
      ),
    );

    const res = await getSummary(getRequest("http://localhost/api/admin/reports/summary", adminCookie));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.periodDays).toBe(30);
    expect(body.data.totalOrders).toBe(1);
    expect(body.data.totalRevenue).toBe(2_400_000);
    expect(body.data.byStatus).toEqual([{ status: "PENDING", orderCount: 1, revenue: 2_400_000 }]);
  });
});
