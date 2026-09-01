import { beforeEach, describe, expect, it } from "vitest";
import { POST as createCoupon } from "@/app/api/admin/coupons/route";
import { DELETE as deleteCoupon, PATCH as patchCoupon } from "@/app/api/admin/coupons/[id]/route";
import { prisma } from "@/lib/prisma";
import { jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

function payload(overrides: Record<string, unknown> = {}) {
  return { name: "Spring Sale", code: "SPRING10", type: "PERCENT_BASED", amount: 10, ...overrides };
}

describe("admin coupons", () => {
  it("403s for a non-admin", async () => {
    const res = await createCoupon(jsonRequest("http://localhost/api/admin/coupons", "POST", payload(), retailCookie));
    expect(res.status).toBe(403);
  });

  it("creates a coupon", async () => {
    const res = await createCoupon(jsonRequest("http://localhost/api/admin/coupons", "POST", payload(), adminCookie));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.code).toBe("SPRING10");
    expect(body.data.amount).toBe(10);
  });

  it("409s on a duplicate code", async () => {
    await createCoupon(jsonRequest("http://localhost/api/admin/coupons", "POST", payload(), adminCookie));
    const res = await createCoupon(jsonRequest("http://localhost/api/admin/coupons", "POST", payload(), adminCookie));
    expect(res.status).toBe(409);
  });

  it("409s when patching a coupon to a colliding code", async () => {
    const other = await (
      await createCoupon(jsonRequest("http://localhost/api/admin/coupons", "POST", payload({ code: "OTHER10" }), adminCookie))
    ).json();

    const res = await patchCoupon(
      jsonRequest(`http://localhost/api/admin/coupons/${other.data.id}`, "PATCH", { code: seed.coupon.code }, adminCookie),
      { params: { id: String(other.data.id) } },
    );
    expect(res.status).toBe(409);
  });

  it("patches and deletes a coupon", async () => {
    const patchRes = await patchCoupon(
      jsonRequest(`http://localhost/api/admin/coupons/${seed.coupon.id}`, "PATCH", { isActive: false }, adminCookie),
      { params: { id: String(seed.coupon.id) } },
    );
    expect(patchRes.status).toBe(200);

    const deleteRes = await deleteCoupon(
      jsonRequest(`http://localhost/api/admin/coupons/${seed.coupon.id}`, "DELETE", undefined, adminCookie),
      { params: { id: String(seed.coupon.id) } },
    );
    expect(deleteRes.status).toBe(200);
    expect(await prisma.coupon.findUnique({ where: { id: seed.coupon.id } })).toBeNull();
  });
});
