import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/schemas/auth";

describe("registerSchema", () => {
  it.each(["WHOLESALE", "AGENT", "ADMIN"])("refuses self-assigned %s", (role) => {
    expect(registerSchema.safeParse({ username: "sara", role }).success).toBe(false);
  });

  it("accepts a customer, with or without an explicit role", () => {
    expect(registerSchema.parse({ username: "sara", role: "RETAIL" }).role).toBe("RETAIL");
    expect(registerSchema.parse({ username: "sara" }).role).toBeUndefined();
  });

  it("drops the fields only wholesale registration used to carry", () => {
    const parsed = registerSchema.parse({ username: "sara", shopName: "x", businessLicenseNumber: "1", agentId: 3 });
    expect(parsed).toEqual({ username: "sara" });
  });
});
