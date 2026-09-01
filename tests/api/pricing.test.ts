import { beforeEach, describe, expect, it } from "vitest";
import { POST as quotePricing } from "@/app/api/pricing/quote/route";
import { jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

function quotePayload(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }],
    ...overrides,
  };
}

describe("pricing quote authorization", () => {
  it("an anonymous caller always gets RETAIL role and null credit, with no way to spoof another user's data", async () => {
    const res = await quotePricing(
      jsonRequest("http://localhost/api/pricing/quote", "POST", quotePayload({ role: "WHOLESALE", userId: seed.wholesale.id })),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.role).toBe("RETAIL");
    expect(body.data.credit).toBeNull();
  });

  it("an authenticated WHOLESALE user's own request returns their own role and credit figures", async () => {
    const cookie = await loginAs(seed.wholesale);

    const res = await quotePricing(
      jsonRequest("http://localhost/api/pricing/quote", "POST", quotePayload(), cookie),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.role).toBe("WHOLESALE");
    expect(body.data.credit).toEqual({ creditLimit: seed.wholesale.creditLimit, creditUsed: 0 });
  });

  it("a WHOLESALE user cannot see another user's credit data via a spoofed userId", async () => {
    const retailCookie = await loginAs(seed.retail);

    const res = await quotePricing(
      jsonRequest(
        "http://localhost/api/pricing/quote",
        "POST",
        quotePayload({ userId: seed.wholesale.id, role: "WHOLESALE" }),
        retailCookie,
      ),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.role).toBe("RETAIL");
    expect(body.data.credit).toEqual({ creditLimit: 0, creditUsed: 0 });
  });
});
