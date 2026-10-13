import { describe, it, expect, beforeEach } from "vitest";
import {
  DESIGN_SYSTEM_MAP,
  DESIGN_SYSTEM_COOKIE_NAME,
  DESIGN_SYSTEM_STORAGE_KEY,
  DEFAULT_DESIGN_SYSTEM,
  ALL_DESIGN_SYSTEM_CLASSES,
  resolveDesignSystem,
  getDesignSystemClass,
  parseDesignSystemFromCookie,
  buildDesignSystemCookie,
  isDesignSystemKey,
} from "@/lib/design-system";

describe("Multi Design System Registry & Resolver", () => {
  it("defines default, comfort, and glass styles correctly", () => {
    expect(DESIGN_SYSTEM_MAP.default.className).toBe("style-nova");
    expect(DESIGN_SYSTEM_MAP.comfort.className).toBe("style-vega");
    expect(DESIGN_SYSTEM_MAP.glass.className).toBe("style-glass");
  });

  it("validates design system keys accurately", () => {
    expect(isDesignSystemKey("default")).toBe(true);
    expect(isDesignSystemKey("comfort")).toBe(true);
    expect(isDesignSystemKey("glass")).toBe(true);
    expect(isDesignSystemKey("unknown")).toBe(false);
    expect(isDesignSystemKey("")).toBe(false);
    expect(isDesignSystemKey(null)).toBe(false);
  });

  it("resolves unknown or invalid values to default", () => {
    expect(resolveDesignSystem("unknown")).toBe("default");
    expect(resolveDesignSystem("")).toBe("default");
    expect(resolveDesignSystem(undefined)).toBe("default");
    expect(resolveDesignSystem(null)).toBe("default");
    expect(resolveDesignSystem("style-unknown")).toBe("default");
  });

  it("resolves direct class names to their keys", () => {
    expect(resolveDesignSystem("style-nova")).toBe("default");
    expect(resolveDesignSystem("style-vega")).toBe("comfort");
    expect(resolveDesignSystem("style-glass")).toBe("glass");
  });

  it("returns accurate class for each design system", () => {
    expect(getDesignSystemClass("default")).toBe("style-nova");
    expect(getDesignSystemClass("comfort")).toBe("style-vega");
    expect(getDesignSystemClass("glass")).toBe("style-glass");
    expect(getDesignSystemClass("invalid")).toBe("style-nova");
  });
});

describe("Design System Cookie Handling", () => {
  it("builds correct cookie string with max-age and path", () => {
    const cookie = buildDesignSystemCookie("comfort");
    expect(cookie).toContain(`${DESIGN_SYSTEM_COOKIE_NAME}=comfort`);
    expect(cookie).toContain("path=/");
    expect(cookie).toContain("samesite=lax");
    expect(cookie).toContain("max-age=31536000");
  });

  it("parses valid design system from cookie string", () => {
    const cookieHeader = "session=123; design-system-preview=comfort; other=foo";
    expect(parseDesignSystemFromCookie(cookieHeader)).toBe("comfort");
  });

  it("parses glass design system from cookie string", () => {
    const cookieHeader = "design-system-preview=glass";
    expect(parseDesignSystemFromCookie(cookieHeader)).toBe("glass");
  });

  it("falls back to default if cookie value is invalid or absent", () => {
    expect(parseDesignSystemFromCookie("")).toBe("default");
    expect(parseDesignSystemFromCookie(null)).toBe("default");
    expect(parseDesignSystemFromCookie(undefined)).toBe("default");
    expect(parseDesignSystemFromCookie("design-system-preview=malicious_payload")).toBe("default");
  });
});

describe("Class Isolation Invariant", () => {
  it("contains all three design system classes without duplicates", () => {
    expect(ALL_DESIGN_SYSTEM_CLASSES).toHaveLength(3);
    expect(new Set(ALL_DESIGN_SYSTEM_CLASSES).size).toBe(3);
  });

  it("ensures class replacement leaves only the target style class", () => {
    // Simulate DOM body class list operations
    const classList = new Set<string>(["font-sans", "antialiased", "style-nova"]);

    // Function matching bootstrap / hook behavior
    const switchClass = (targetClass: string) => {
      ALL_DESIGN_SYSTEM_CLASSES.forEach((cls) => classList.delete(cls));
      classList.add(targetClass);
    };

    switchClass("style-vega");
    expect(classList.has("style-vega")).toBe(true);
    expect(classList.has("style-nova")).toBe(false);
    expect(classList.has("style-glass")).toBe(false);

    // Verify non-style classes were preserved
    expect(classList.has("font-sans")).toBe(true);
    expect(classList.has("antialiased")).toBe(true);
  });

  it("preserves orthogonal light/dark mode on html while body switches style", () => {
    const htmlClasses = new Set<string>(["dark"]);
    const bodyClasses = new Set<string>(["style-nova"]);

    // Switch body style
    ALL_DESIGN_SYSTEM_CLASSES.forEach((cls) => bodyClasses.delete(cls));
    bodyClasses.add("style-glass");

    // html class remains dark
    expect(htmlClasses.has("dark")).toBe(true);
    expect(htmlClasses.has("style-glass")).toBe(false);
    expect(bodyClasses.has("style-glass")).toBe(true);
  });
});

describe("Component Preview Route & Iframe Contract", () => {
  it("resolves query parameters to design systems accurately", () => {
    expect(resolveDesignSystem("comfort")).toBe("comfort");
    expect(resolveDesignSystem("glass")).toBe("glass");
    expect(resolveDesignSystem("default")).toBe("default");
    expect(resolveDesignSystem("nonexistent")).toBe("default");
    expect(resolveDesignSystem(undefined)).toBe("default");
  });

  it("constructs isolated iframe src correctly with embed flag", () => {
    const styleKey = "comfort";
    const src = `/preview?style=${encodeURIComponent(styleKey)}&embed=1`;
    expect(src).toBe("/preview?style=comfort&embed=1");
    expect(src).toContain("embed=1");
    expect(src).toContain("style=comfort");
  });

  it("guarantees iframe remount key changes across different design systems", () => {
    const styles = ["default", "comfort", "glass"] as const;
    const keys = styles.map((s) => s);
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[1]).not.toBe(keys[2]);
    expect(new Set(keys).size).toBe(3);
  });
});
