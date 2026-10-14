import { describe, expect, it } from "vitest";
import { assertAllowedDigikalaUrl } from "@/lib/digikala";

describe("Digikala outbound security boundary", () => {
  it("accepts valid HTTPS Digikala URLs", () => {
    const u1 = assertAllowedDigikalaUrl("https://api.digikala.com/v1/search/?q=samsung");
    expect(u1.hostname).toBe("api.digikala.com");

    const u2 = assertAllowedDigikalaUrl("https://cdn.digikala.com/products/1.jpg");
    expect(u2.hostname).toBe("cdn.digikala.com");
  });

  it("rejects non-HTTPS URLs", () => {
    expect(() => assertAllowedDigikalaUrl("http://api.digikala.com/v1/search")).toThrow(
      /Only HTTPS requests to Digikala are permitted/,
    );
  });

  it("rejects SSRF destinations, internal addresses, and external untrusted hosts", () => {
    // Cloud metadata
    expect(() => assertAllowedDigikalaUrl("http://169.254.169.254/latest/meta-data")).toThrow();
    // Localhost
    expect(() => assertAllowedDigikalaUrl("https://localhost/api")).toThrow(/Untrusted redirect host/);
    expect(() => assertAllowedDigikalaUrl("https://127.0.0.1/api")).toThrow(/Untrusted redirect host/);
    // Arbitrary external domain
    expect(() => assertAllowedDigikalaUrl("https://evil.com/fake-digikala")).toThrow(/Untrusted redirect host/);
    // Domain spoofing attempt
    expect(() => assertAllowedDigikalaUrl("https://digikala.com.evil.com/api")).toThrow(/Untrusted redirect host/);
  });

  it("rejects malformed URLs", () => {
    expect(() => assertAllowedDigikalaUrl("not-a-url")).toThrow(/Invalid Digikala URL/);
  });
});

