import { beforeEach, describe, expect, it } from "vitest";
import { POST as validateCoupon } from "@/app/api/coupons/validate/route";
import { prisma } from "@/lib/prisma";
import { jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

describe("coupon validation authorization", () => {
  it("works unauthenticated, without a userId in the body", async () => {
    const res = await validateCoupon(
      jsonRequest("http://localhost/api/coupons/validate", "POST", { code: seed.coupon.code, subtotal: 100000 }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.valid).toBe(true);
  });

  it("ignores a spoofed userId and uses the session user for usage-limit checks", async () => {
    await prisma.coupon.update({ where: { id: seed.coupon.id }, data: { usageLimitPerUser: 1 } });
    await prisma.couponUsage.create({ data: { couponId: seed.coupon.id, userId: seed.retail.id } });

    const cookie = await loginAs(seed.retail);
    const res = await validateCoupon(
      jsonRequest(
        "http://localhost/api/coupons/validate",
        "POST",
        { code: seed.coupon.code, subtotal: 100000, userId: seed.wholesale.id },
        cookie,
      ),
    );
    const body = await res.json();
    expect(body.data.valid).toBe(false);
    expect(body.data.reason).toMatch(/maximum number of times/);
  });
});
