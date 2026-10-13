import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CORE_GUIDELINE_RULES } from "@/types/web-interface-guidelines";

describe("Web Interface Guidelines Standards", () => {
  it("defines core guideline rules correctly", () => {
    expect(CORE_GUIDELINE_RULES.length).toBeGreaterThanOrEqual(5);
    const ruleIds = CORE_GUIDELINE_RULES.map((r) => r.id);
    expect(ruleIds).toContain("a11y-no-bare-outline-none");
    expect(ruleIds).toContain("forms-no-paste-blocking");
    expect(ruleIds).toContain("motion-prefer-reduced");
    expect(ruleIds).toContain("touch-manipulation");
    expect(ruleIds).toContain("media-explicit-dimensions");
  });

  describe("Focus States & Outlines", () => {
    it("ensures interactive badge has focus-visible ring alongside outline-none", () => {
      const badgePath = path.resolve(process.cwd(), "components/ui/badge.tsx");
      const content = fs.readFileSync(badgePath, "utf-8");
      expect(content).toContain("focus-visible:ring-2");
      expect(content).toContain("focus-visible:ring-primary");
    });

    it("verifies global focus-visible and scroll margins in globals.css", () => {
      const cssPath = path.resolve(process.cwd(), "app/globals.css");
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain(":where(a, button, input, select, textarea, [role=\"button\"]):focus-visible");
      expect(content).toContain("scroll-margin-top: calc(var(--header-height");
      expect(content).toContain("scroll-margin-bottom: calc(var(--dock-height");
    });
  });

  describe("Forms & Clipboard Interactivity", () => {
    it("ensures no components intercept or block onPaste events with preventDefault", () => {
      const scanFiles = (dir: string): string[] => {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            if (!file.startsWith(".") && file !== "node_modules") {
              results = results.concat(scanFiles(filePath));
            }
          } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
            results.push(filePath);
          }
        });
        return results;
      };

      const components = scanFiles(path.resolve(process.cwd(), "components"));
      const appFiles = scanFiles(path.resolve(process.cwd(), "app"));
      const allFiles = [...components, ...appFiles];

      const pasteBlockingViolations: string[] = [];
      allFiles.forEach((file) => {
        const text = fs.readFileSync(file, "utf-8");
        if (text.includes("onPaste") && text.includes("preventDefault()")) {
          pasteBlockingViolations.push(file);
        }
      });

      expect(pasteBlockingViolations).toHaveLength(0);
    });
  });

  describe("Motion & Reduced Motion Invariants", () => {
    it("ensures global reduced motion overrides exist for animations and transitions", () => {
      const cssPath = path.resolve(process.cwd(), "app/globals.css");
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("@media (prefers-reduced-motion: reduce)");
      expect(content).toContain("animation-duration: 0.01ms !important;");
      expect(content).toContain("transition-duration: 0.01ms !important;");
    });
  });

  describe("Touch & Layout Invariants", () => {
    it("ensures viewport metadata includes viewportFit cover and colorScheme dark", () => {
      const layoutPath = path.resolve(process.cwd(), "app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain('viewportFit: "cover"');
      expect(content).toContain('colorScheme: "dark"');
    });

    it("verifies touch-action manipulation is configured for touch interactions", () => {
      const cssPath = path.resolve(process.cwd(), "app/globals.css");
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("touch-action: manipulation");
    });
  });
});

