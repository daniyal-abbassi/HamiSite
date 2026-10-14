import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitize";
import { escapeJsonLd } from "@/lib/security/xss";

describe("HTML Sanitization & XSS Prevention", () => {
  describe("sanitizeHtml", () => {
    it("preserves safe allowed formatting tags", () => {
      const input = "<p>این یک <strong>توضیح</strong> معتبر است.</p>";
      const output = sanitizeHtml(input);
      expect(output).toBe("<p>این یک <strong>توضیح</strong> معتبر است.</p>");
    });

    it("strips executable script tags completely", () => {
      const input = '<p>متن</p><script>alert("xss")</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<script>");
      expect(output).not.toContain("alert");
      expect(output).toContain("<p>متن</p>");
    });

    it("strips dangerous inline event handlers", () => {
      const input = '<img src="x" onerror="alert(1)" /><p onmouseover="alert(2)">تست</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onerror");
      expect(output).not.toContain("onmouseover");
      expect(output).not.toContain("alert");
    });

    it("strips dangerous iframe, object, and embed elements", () => {
      const input = '<iframe src="https://evil.com"></iframe><object data="evil.swf"></object>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<iframe");
      expect(output).not.toContain("<object");
    });

    it("handles null and undefined input gracefully", () => {
      expect(sanitizeHtml(null)).toBe("");
      expect(sanitizeHtml(undefined)).toBe("");
      expect(sanitizeHtml("")).toBe("");
    });
  });

  describe("escapeJsonLd", () => {
    it("escapes opening angle bracket to prevent script breakout", () => {
      const payload = {
        name: '</script><script>alert("xss")</script>',
        description: "Standard <tag> test",
      };
      const json = escapeJsonLd(payload);

      expect(json).not.toContain("<");
      expect(json).toContain("\\u003c");
      expect(json).toContain("\\u003c/script>");
    });
  });
});

