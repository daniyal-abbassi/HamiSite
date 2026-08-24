import { describe, expect, it } from "vitest";
import { getMobileHeroObjectPosition, shouldRunScrollChoreography, shouldUseObserverReveal } from "./mobileRuntime";

describe("mobile runtime safety", () => {
  it("disables scroll choreography on a coarse-pointer mobile viewport", () => {
    expect(shouldRunScrollChoreography({ viewportWidth: 390, coarsePointer: true, reducedMotion: false })).toBe(false);
  });

  it("keeps observer-driven reveal off on mobile so content is visible by default", () => {
    expect(shouldUseObserverReveal({ viewportWidth: 390, coarsePointer: true, reducedMotion: false })).toBe(false);
  });

  it("preserves progressive scroll choreography and reveal on a desktop fine pointer", () => {
    const desktop = { viewportWidth: 1280, coarsePointer: false, reducedMotion: false };
    expect(shouldRunScrollChoreography(desktop)).toBe(true);
    expect(shouldUseObserverReveal(desktop)).toBe(true);
  });

  it("anchors the mobile Hero crop to the product-side of the approved video", () => {
    expect(getMobileHeroObjectPosition()).toBe("88% center");
  });
});
