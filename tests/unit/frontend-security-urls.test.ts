import { describe, expect, it } from "vitest";
import { safeHttpUrl, safeRedirectPath } from "@/lib/security/urls";

describe("URL & Redirect Security", () => {
  describe("safeHttpUrl", () => {
    it("allows valid http and https URLs", () => {
      expect(safeHttpUrl("https://example.com")).toBe("https://example.com/");
      expect(safeHttpUrl("http://example.com/foo?bar=1")).toBe("http://example.com/foo?bar=1");
    });

    it("rejects javascript: and other dangerous pseudo-protocols", () => {
      expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
      expect(safeHttpUrl("JAVASCRIPT:alert(document.cookie)")).toBeNull();
      expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(safeHttpUrl("vbscript:msgbox(1)")).toBeNull();
      expect(safeHttpUrl("blob:https://example.com/uuid")).toBeNull();
    });

    it("handles null, undefined, empty, and malformed inputs gracefully", () => {
      expect(safeHttpUrl(null)).toBeNull();
      expect(safeHttpUrl(undefined)).toBeNull();
      expect(safeHttpUrl("")).toBeNull();
      expect(safeHttpUrl("   ")).toBeNull();
      expect(safeHttpUrl("not a url")).toBeNull();
    });
  });

  describe("safeRedirectPath", () => {
    it("allows valid relative paths", () => {
      expect(safeRedirectPath("/admin")).toBe("/admin");
      expect(safeRedirectPath("/shop/iphone-16?color=black")).toBe("/shop/iphone-16?color=black");
      expect(safeRedirectPath("/orders#active")).toBe("/orders#active");
    });

    it("rejects protocol-relative open redirects", () => {
      expect(safeRedirectPath("//evil.example.com")).toBe("/");
      expect(safeRedirectPath("//evil.example.com/login")).toBe("/");
      expect(safeRedirectPath("///evil.example.com")).toBe("/");
    });

    it("rejects backslash bypass vectors", () => {
      expect(safeRedirectPath("/\\evil.example.com")).toBe("/");
      expect(safeRedirectPath("\\evil.example.com")).toBe("/");
      expect(safeRedirectPath("/admin\\evil")).toBe("/");
    });

    it("rejects external scheme absolute URLs", () => {
      expect(safeRedirectPath("https://evil.com")).toBe("/");
      expect(safeRedirectPath("http://evil.com")).toBe("/");
      expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
    });

    it("neutralizes control characters and invalid inputs", () => {
      expect(safeRedirectPath("/test\u0000")).toBe("/");
      expect(safeRedirectPath(null)).toBe("/");
      expect(safeRedirectPath(undefined)).toBe("/");
      expect(safeRedirectPath("")).toBe("/");
      expect(safeRedirectPath("relative-without-slash")).toBe("/");
    });

    it("respects custom fallback path", () => {
      expect(safeRedirectPath("//evil.com", "/login")).toBe("/login");
      expect(safeRedirectPath(null, "/home")).toBe("/home");
    });
  });
});

