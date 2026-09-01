import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { seedMinimal } from "./helpers/seed";

describe("test infrastructure", () => {
  it("resets and seeds a real Postgres test database", async () => {
    const beforeSeed = await prisma.user.count();
    expect(beforeSeed).toBe(0);

    const seed = await seedMinimal();

    expect(seed.admin.username).toBe("test.admin");
    const afterSeed = await prisma.user.count();
    expect(afterSeed).toBe(3);
  });

  it("truncates between tests (proves beforeEach ran)", async () => {
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });
});
