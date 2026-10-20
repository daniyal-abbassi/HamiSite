import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { RESPONSIVE_BREAKPOINTS, MIN_TOUCH_TARGET_SIZE_PX } from "@/types/responsive-design";

describe("Responsive Design Standards", () => {
  it("defines standard breakpoint boundaries", () => {
    expect(RESPONSIVE_BREAKPOINTS.xs.minWidth).toBe(320);
    expect(RESPONSIVE_BREAKPOINTS.sm.minWidth).toBe(640);
    expect(RESPONSIVE_BREAKPOINTS.md.minWidth).toBe(768);
    expect(RESPONSIVE_BREAKPOINTS.lg.minWidth).toBe(1024);
    expect(RESPONSIVE_BREAKPOINTS.xl.minWidth).toBe(1280);
    expect(MIN_TOUCH_TARGET_SIZE_PX).toBe(44);
  });

  describe("Touch Target Compliance (WCAG 2.5.5 / 2.5.8)", () => {
    it("ensures mobile navigation dock provides minimum 44px hit height", () => {
      const dockPath = path.resolve(process.cwd(), "components/layout/MobileDock.tsx");
      const content = fs.readFileSync(dockPath, "utf-8");
      expect(content.includes("min-h-[44px]") || content.includes("min-h-11")).toBe(true);
    });

    it("ensures header CartButton provides size-11 (44px) hit area", () => {
      const cartButtonPath = path.resolve(process.cwd(), "components/layout/CartButton.tsx");
      const content = fs.readFileSync(cartButtonPath, "utf-8");
      expect(content).toContain("size-11");
    });
  });

  describe("Safe Area Insets & Viewport Fit", () => {
    it("ensures viewport metadata enforces viewportFit: cover", () => {
      const layoutPath = path.resolve(process.cwd(), "app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain('viewportFit: "cover"');
    });

    it("ensures MobileDock and Footer declare env(safe-area-inset-bottom)", () => {
      const footerPath = path.resolve(process.cwd(), "components/layout/Footer.tsx");
      const footerContent = fs.readFileSync(footerPath, "utf-8");
      expect(footerContent).toContain("env(safe-area-inset-bottom)");

      const adminLayoutPath = path.resolve(process.cwd(), "app/(admin)/layout.tsx");
      const adminContent = fs.readFileSync(adminLayoutPath, "utf-8");
      expect(adminContent).toContain("env(safe-area-inset-bottom)");
    });
  });

  describe("Zero Horizontal Overflow & Logical Properties", () => {
    it("ensures body has overflow-x-hidden in globals.css", () => {
      const cssPath = path.resolve(process.cwd(), "app/globals.css");
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("overflow-x: hidden");
    });

    it("verifies logical properties (start/end) on mobile dock and badges", () => {
      const cartButtonPath = path.resolve(process.cwd(), "components/layout/CartButton.tsx");
      const content = fs.readFileSync(cartButtonPath, "utf-8");
      expect(content).toContain("-end-0.5");
      expect(content).toContain("-top-0.5");
    });
  });
});

