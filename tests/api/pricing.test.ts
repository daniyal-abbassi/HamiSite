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
  it("an anonymous caller always gets RETAIL role and no way to spoof another user's data", async () => {
    const res = await quotePricing(
      jsonRequest("http://localhost/api/pricing/quote", "POST", quotePayload({ role: "WHOLESALE", userId: seed.wholesale.id })),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.role).toBe("RETAIL");
  });

  it("an authenticated WHOLESALE user's own request returns their own role", async () => {
    const cookie = await loginAs(seed.wholesale);

    const res = await quotePricing(
      jsonRequest("http://localhost/api/pricing/quote", "POST", quotePayload(), cookie),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.role).toBe("WHOLESALE");
  });

  it("a caller cannot take another user's role via a spoofed userId", async () => {
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
  });
});
