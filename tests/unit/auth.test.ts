import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  getSessionTokenFromRequest,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/auth";

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
