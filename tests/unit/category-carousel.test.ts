import { describe, expect, it } from "vitest";
import { boundCarouselSnap, carouselKeyboardTarget, clampCarouselIndex } from "@/lib/category-carousel";

describe("category carousel movement", () => {
  it("clamps indices at both ends", () => {
    expect(clampCarouselIndex(-1, 9)).toBe(0);
    expect(clampCarouselIndex(9, 9)).toBe(8);
    expect(clampCarouselIndex(5, 0)).toBe(0);
  });

  it("caps a flick to two panels while allowing a one-panel move", () => {
    expect(boundCarouselSnap(1, 8, 9)).toBe(3);
    expect(boundCarouselSnap(7, 0, 9)).toBe(5);
    expect(boundCarouselSnap(3, 4, 9)).toBe(4);
  });

  it("moves keys in RTL reading order and supports Home and End", () => {
    expect(carouselKeyboardTarget("ArrowLeft", 0, 9)).toBe(1);
    expect(carouselKeyboardTarget("ArrowRight", 8, 9)).toBe(7);
    expect(carouselKeyboardTarget("ArrowRight", 0, 9)).toBe(0);
    expect(carouselKeyboardTarget("Home", 5, 9)).toBe(0);
    expect(carouselKeyboardTarget("End", 5, 9)).toBe(8);
    expect(carouselKeyboardTarget("Enter", 5, 9)).toBeNull();
  });
});
