import { describe, expect, it } from "vitest";
import { Prisma, Role } from "@prisma/client";
import {
  DUMMY_PASSWORD_HASH,
  generateSessionToken,
  getSessionTokenFromRequest,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  sanitizeUser,
  verifyPassword,
} from "@/lib/auth";
import { normalizeIranianMobile } from "@/lib/phone";

describe("session token helpers", () => {
  it("generates a 64-char hex token that differs each call", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically and differently per token", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(generateSessionToken())).not.toBe(hashSessionToken(token));
  });

  it("exposes the cookie name and a 30-day TTL", () => {
    expect(SESSION_COOKIE_NAME).toBe("session_token");
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("cookie parsing robustness", () => {
  it("survives a malformed percent-escape in an unrelated cookie", () => {
    const req = new Request("http://localhost/x", {
      headers: { cookie: `_ga=%zz; ${SESSION_COOKIE_NAME}=deadbeef; other=%E0%A4%A` },
    });
    expect(getSessionTokenFromRequest(req)).toBe("deadbeef");
  });

  it("still decodes well-formed escapes and skips a valueless cookie", () => {
    const req = new Request("http://localhost/x", {
      headers: { cookie: "a=hello%20world; b=eyJ4Ijox=; c" },
    });
    // `c` has no '=' and must be skipped rather than producing a garbage key.
    expect(getSessionTokenFromRequest(req)).toBeNull();
  });
});

describe("login timing equalization", () => {
  it("DUMMY_PASSWORD_HASH is a well-formed cost-10 bcrypt hash", () => {
    // A malformed hash makes bcrypt.compare return false in ~0ms, silently
    // reintroducing the user-enumeration oracle this constant exists to close.
    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/);
  });

  it("comparing against it costs real bcrypt work and never matches", async () => {
    const start = Date.now();
    await expect(verifyPassword("anything at all", DUMMY_PASSWORD_HASH)).resolves.toBe(false);
    expect(Date.now() - start).toBeGreaterThan(20);
  });
});

describe("normalizeIranianMobile", () => {
  it("canonicalizes the common Iranian mobile spellings to E.164", () => {
    expect(normalizeIranianMobile("09121112233")).toBe("+989121112233");
    expect(normalizeIranianMobile("9121112233")).toBe("+989121112233");
    expect(normalizeIranianMobile("0912 111 2233")).toBe("+989121112233");
    expect(normalizeIranianMobile("+989121112233")).toBe("+989121112233");
  });

  it("leaves anything unrecognised untouched so usernames pass through", () => {
    expect(normalizeIranianMobile("test.retail")).toBe("test.retail");
    expect(normalizeIranianMobile("admin")).toBe("admin");
  });
});

describe("sanitizeUser", () => {
  it("strips passwordHash and preserves critical safe attributes", () => {
    const rawUser = {
      id: 42,
      role: Role.RETAIL,
      username: "testuser",
      email: "test@example.com",
      passwordHash: "$2a$10$secretpasswordhash",
      firstName: "Ali",
      lastName: "Alavi",
      phoneNumber: "+989121234567",
      phoneVerified: true,
      nationalNumber: "0012345678",
      city: "Mashhad",
      shopName: null,
      businessLicenseNumber: null,
      businessVerified: false,
      agentId: null,
      isActive: true,
      receiveNewsletters: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    };

    const sanitized = sanitizeUser(rawUser as any);
    expect((sanitized as any).passwordHash).toBeUndefined();
    expect(sanitized.id).toBe(42);
    expect(sanitized.username).toBe("testuser");
    expect(sanitized.role).toBe(Role.RETAIL);
    expect(sanitized.isActive).toBe(true);
    expect(sanitized.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
