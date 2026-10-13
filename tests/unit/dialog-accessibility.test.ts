import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("WCAG 2.2 Accessibility Compliance - Dialogs & Focus Trapping", () => {
  it("integrates useFocusTrap and dialog semantics in PartnerApplicationModal", () => {
    const modal = readFileSync(
      join(process.cwd(), "components/admin/partners/PartnerApplicationModal.tsx"),
      "utf8"
    );
    expect(modal).toContain("useFocusTrap(modalRef");
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('aria-labelledby="partner-app-title"');
    expect(modal).toContain('aria-label="بستن پنجره"');
  });

  it("integrates useFocusTrap and dialog semantics in BundleFormModal", () => {
    const modal = readFileSync(
      join(process.cwd(), "components/admin/bundles/BundleFormModal.tsx"),
      "utf8"
    );
    expect(modal).toContain("useFocusTrap(modalRef");
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('aria-labelledby="bundle-modal-title"');
    expect(modal).toContain('aria-label="بستن پنجره"');
  });

  it("ensures dialog accessibility and focus management in AdminSidebar", () => {
    const sidebar = readFileSync(
      join(process.cwd(), "components/admin/AdminSidebar.tsx"),
      "utf8"
    );
    expect(sidebar).toContain("useModalDialog");
    expect(sidebar).toContain('aria-labelledby="admin-sheet-title"');
    expect(sidebar).toContain("sheetTriggerRef.current?.focus()");
    expect(sidebar).toContain('aria-label="بستن منو"');
  });
});

