import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "@/lib/security/csrf";
import { SITE_ORIGIN } from "@/lib/seo-metadata";

describe("CSRF & Origin Verification", () => {
  it("allows requests from same site origin", () => {
    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        origin: SITE_ORIGIN,
        host: "localhost:3000",
      },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("allows requests matching host header", () => {
    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("throws 403 ApiError on cross-origin mutation request", () => {
    const request = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        origin: "https://evil-attacker.example.com",
        host: "localhost:3000",
      },
    });

    expect(() => assertSameOrigin(request)).toThrowError(/Cross-origin mutation request rejected/);
  });

  it("falls back to referer header if origin header is omitted", () => {
    const safeRequest = new Request("http://localhost:3000/api/cart/items", {
      method: "POST",
      headers: {
        referer: `${SITE_ORIGIN}/shop/iphone-16`,
        host: "localhost:3000",
      },
    });
    expect(() => assertSameOrigin(safeRequest)).not.toThrow();

    const evilRequest = new Request("http://localhost:3000/api/cart/items", {
      method: "POST",
      headers: {
        referer: "https://evil.com/phishing-page",
        host: "localhost:3000",
      },
    });
    expect(() => assertSameOrigin(evilRequest)).toThrowError(/Cross-origin mutation request rejected/);
  });

  it("allows non-browser requests with no origin or referer", () => {
    const curlRequest = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: {
        host: "localhost:3000",
      },
    });

    expect(() => assertSameOrigin(curlRequest)).not.toThrow();
  });
});

