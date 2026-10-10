import { describe, expect, it } from "vitest";
import { classifyAdminSession } from "@/lib/admin-access";

const now = new Date("2026-10-08T12:00:00.000Z");

function session(role: string, isActive = true, expiresAt = new Date("2026-10-09T12:00:00.000Z")) {
  return { expiresAt, user: { role, isActive } };
}

describe("classifyAdminSession", () => {
  it("allows an active admin with an unexpired session", () => {
    expect(classifyAdminSession(session("ADMIN"), now)).toBe("admin");
  });

  it("sends missing, expired, and deactivated sessions to the guest path", () => {
    expect(classifyAdminSession(null, now)).toBe("guest");
    expect(classifyAdminSession(session("ADMIN", true, now), now)).toBe("guest");
    expect(classifyAdminSession(session("ADMIN", false), now)).toBe("guest");
  });

  it("distinguishes an active non-admin from a guest", () => {
    expect(classifyAdminSession(session("RETAIL"), now)).toBe("forbidden");
  });
});
