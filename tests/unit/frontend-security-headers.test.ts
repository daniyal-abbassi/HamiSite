import { describe, expect, it } from "vitest";
import { generateCsp, generateNonce } from "@/lib/security/csp";
import { getStaticSecurityHeaders } from "@/lib/security/static-headers";

describe("Frontend Security Headers & CSP", () => {
  describe("Static Security Headers", () => {
    it("returns essential security headers for non-production", () => {
      const headers = getStaticSecurityHeaders({ isProduction: false });
      const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));

      expect(map["X-Content-Type-Options"]).toBe("nosniff");
      expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(map["Permissions-Policy"]).toContain("camera=()");
      expect(map["X-Frame-Options"]).toBe("DENY");
      expect(map["Strict-Transport-Security"]).toBeUndefined();
    });

    it("includes Strict-Transport-Security in production", () => {
      const headers = getStaticSecurityHeaders({ isProduction: true });
      const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));

      expect(map["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
    });
  });

  describe("Content Security Policy (CSP)", () => {
    it("generates CSP with cryptographic nonce and strict-dynamic", () => {
      const nonce = generateNonce();
      expect(nonce).toBeDefined();
      expect(nonce.length).toBeGreaterThan(16);

      const csp = generateCsp({ nonce, isDev: false, isTma: false });

      expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain("'unsafe-inline'; script-src");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it("allows unsafe-eval only in development mode", () => {
      const nonce = "test-nonce-1234";
      const devCsp = generateCsp({ nonce, isDev: true, isTma: false });
      expect(devCsp).toContain("'unsafe-eval'");

      const prodCsp = generateCsp({ nonce, isDev: false, isTma: false });
      expect(prodCsp).not.toContain("'unsafe-eval'");
    });

    it("allows Telegram framing on /tma routes while denying framing on default routes", () => {
      const nonce = "test-nonce-1234";
      const tmaCsp = generateCsp({ nonce, isDev: false, isTma: true });
      expect(tmaCsp).toContain("frame-ancestors 'self' https://web.telegram.org https://*.telegram.org");

      const defaultCsp = generateCsp({ nonce, isDev: false, isTma: false });
      expect(defaultCsp).toContain("frame-ancestors 'none'");
    });
  });
});

