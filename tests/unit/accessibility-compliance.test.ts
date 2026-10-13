import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("WCAG 2.2 Accessibility Compliance - Landmarks & Skip Links", () => {
  it("includes SkipLink in app/(main)/layout.tsx ahead of navigation", () => {
    const layout = readFileSync(join(process.cwd(), "app/(main)/layout.tsx"), "utf8");
    expect(layout).toContain("<SkipLink");
    expect(layout).toContain("<Header");
    const skipIndex = layout.indexOf("<SkipLink");
    const headerIndex = layout.indexOf("<Header");
    expect(skipIndex).toBeLessThan(headerIndex);
  });

  it("ensures MainContent in components/layout/MainContent.tsx has id='main' and tabIndex={-1}", () => {
    const mainContent = readFileSync(
      join(process.cwd(), "components/layout/MainContent.tsx"),
      "utf8"
    );
    expect(mainContent).toContain('id="main"');
    expect(mainContent).toContain("tabIndex={-1}");
  });

  it("includes SkipLink and id='main' landmark in app/(admin)/layout.tsx", () => {
    const adminLayout = readFileSync(join(process.cwd(), "app/(admin)/layout.tsx"), "utf8");
    expect(adminLayout).toContain("<SkipLink");
    expect(adminLayout).toContain('id="main"');
  });

  it("includes SkipLink and id='main' landmark in app/(tma)/layout.tsx", () => {
    const tmaLayout = readFileSync(join(process.cwd(), "app/(tma)/layout.tsx"), "utf8");
    expect(tmaLayout).toContain("<SkipLink");
    expect(tmaLayout).toContain('id="main"');
    expect(tmaLayout).toContain("tabIndex={-1}");
  });

  it("provides high-contrast focus rings and accessible labels in Header", () => {
    const header = readFileSync(join(process.cwd(), "components/layout/Header.tsx"), "utf8");
    expect(header).toContain("focus-visible:ring-amber-400");
    expect(header).toContain('aria-label="حامی همراه — صفحه اصلی"');
  });

  it("verifies icon button labels in PartnersAdminClient", () => {
    const client = readFileSync(
      join(process.cwd(), "components/admin/partners/PartnersAdminClient.tsx"),
      "utf8"
    );
    expect(client).toContain("aria-label={`بررسی درخواست ${item.fullName}`}");
    expect(client).toContain('aria-label="صفحه قبلی"');
    expect(client).toContain('aria-label="صفحه بعدی"');
  });

  it("verifies form field associations and live region alerts in PartnerForm", () => {
    const form = readFileSync(
      join(process.cwd(), "components/partners/PartnerForm.tsx"),
      "utf8"
    );
    expect(form).toContain('<label htmlFor={id}>');
    expect(form).toContain('role="alert"');
    expect(form).toContain('aria-invalid={!!errors[key]}');
    expect(form).toContain('aria-describedby={errors[key] ? `${id}-error` : undefined}');
  });

  it("ensures descriptive Persian alt text and accessible action names in ProductCard", () => {
    const card = readFileSync(
      join(process.cwd(), "components/shop/ProductCard.tsx"),
      "utf8"
    );
    expect(card).toContain("alt={isPlaceholderImage(productImage) ? PLACEHOLDER_ALT : product.name}");
    expect(card).toContain('aria-label={product.name}');
  });

  it("ensures minimum 44px touch targets on mobile dock navigation", () => {
    const dock = readFileSync(
      join(process.cwd(), "components/layout/MobileDock.tsx"),
      "utf8"
    );
    expect(dock).toContain("min-h-[44px]");
  });

  it("verifies prefersReducedMotion guard correctly defaults safe in non-window env", async () => {
    const { prefersReducedMotion } = await import("@/components/liquid/motion");
    expect(prefersReducedMotion()).toBe(true);
  });
});
