import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { INTERACTION_TIMING, INTERACTION_EASINGS } from "@/types/interaction-design";

describe("Interaction Design Standards & Tokens", () => {
  it("defines standard response timing thresholds", () => {
    expect(INTERACTION_TIMING.instantMs).toBeLessThanOrEqual(100);
    expect(INTERACTION_TIMING.fastMs).toBeLessThanOrEqual(150);
    expect(INTERACTION_TIMING.normalMs).toBeLessThanOrEqual(300);
    expect(INTERACTION_TIMING.smoothMs).toBeLessThanOrEqual(400);
  });

  it("defines natural motion easing curves", () => {
    expect(INTERACTION_EASINGS.enter).toContain("cubic-bezier");
    expect(INTERACTION_EASINGS.exit).toContain("cubic-bezier");
    expect(INTERACTION_EASINGS.natural).toContain("cubic-bezier");
  });

  describe("CSS Token Variables", () => {
    it("exports interaction timing variables in globals.css", () => {
      const cssPath = path.resolve(process.cwd(), "app/globals.css");
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("--duration-instant: 100ms;");
      expect(content).toContain("--duration-fast: 150ms;");
      expect(content).toContain("--duration-normal: 250ms;");
      expect(content).toContain("--ease-enter: cubic-bezier");
      expect(content).toContain("--ease-exit: cubic-bezier");
    });
  });

  describe("Tactile Microinteractions & Active States", () => {
    it("ensures DesignSystemPicker features active:scale-95 and duration-100", () => {
      const pickerPath = path.resolve(process.cwd(), "components/common/DesignSystemPicker.tsx");
      const content = fs.readFileSync(pickerPath, "utf-8");
      expect(content).toContain("active:scale-95");
      expect(content).toContain("duration-100");
    });

    it("ensures CartButton features tactile press active:scale-95", () => {
      const cartButtonPath = path.resolve(process.cwd(), "components/layout/CartButton.tsx");
      const content = fs.readFileSync(cartButtonPath, "utf-8");
      expect(content).toContain("active:scale-95");
      expect(content).toContain("duration-100");
    });

    it("ensures mobile dock navigation supports tactile active scaling", () => {
      const dockPath = path.resolve(process.cwd(), "components/layout/MobileDock.tsx");
      const content = fs.readFileSync(dockPath, "utf-8");
      expect(content).toContain("active:scale-95");
    });
  });

  describe("Async Submit Loading & Double-Click Prevention", () => {
    it("ensures partner decision submit disables button during execution", () => {
      const modalPath = path.resolve(process.cwd(), "components/admin/partners/PartnerApplicationModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");
      expect(content).toContain("disabled={submitting");
      expect(content).toContain("در حال ثبت...");
    });

    it("ensures bundle form modal disables submit button during request", () => {
      const modalPath = path.resolve(process.cwd(), "components/admin/bundles/BundleFormModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");
      expect(content).toContain("disabled={submitting}");
      expect(content).toContain("در حال ثبت و انتشار...");
    });
  });
});

