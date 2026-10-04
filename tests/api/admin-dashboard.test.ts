import { beforeEach, describe, expect, it } from "vitest";
import { GET as getDashboard } from "@/app/api/admin/dashboard/route";
import { ctx, getRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

describe("admin dashboard", () => {
  it("requires an administrator", async () => {
    const response = await getDashboard(getRequest("http://localhost/api/admin/dashboard", retailCookie), ctx());
    expect(response.status).toBe(403);
  });

  it("returns persisted entity totals and stock states", async () => {
    const response = await getDashboard(getRequest("http://localhost/api/admin/dashboard", adminCookie), ctx());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.totals).toEqual({ products: 1, categories: 0, brands: 0, users: 3, orders: 0 });
    expect(body.data.inventory.byStockState).toEqual({ limited: 1 });
    expect(body.data.source).toEqual({ orders: "database", catalog: "database" });
  });
});
