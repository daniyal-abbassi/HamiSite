import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next-path";

describe("safeNextPath", () => {
  it("preserves a same-site product return path and its state", () => {
    expect(safeNextPath("/shop/phone?color=black#details")).toBe("/shop/phone?color=black#details");
  });

  it.each([
    "https://outside.example/",
    "//outside.example/path",
    "/\\outside.example/path",
    "javascript:alert(1)",
    " /shop/phone",
    "/shop/phone\u0000",
  ])("falls back for an unsafe redirect: %s", (candidate) => {
    expect(safeNextPath(candidate)).toBe("/");
  });

  it("falls back when no return path is provided", () => {
    expect(safeNextPath(null)).toBe("/");
  });
});
