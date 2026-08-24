import { describe, expect, it } from "vitest";
import { getHeroScrollChoreography, getHeroScrollProgress, interpolateHeroScrollProgress } from "./heroMotion";

describe("getHeroScrollProgress", () => {
  it("maps the first Hero viewport to an eased 0–1 cinematic exit range", () => {
    expect(getHeroScrollProgress(0, 900)).toBe(0);
    expect(getHeroScrollProgress(-225, 900)).toBeCloseTo(0.1768, 4);
    expect(getHeroScrollProgress(-450, 900)).toBeCloseTo(0.4204, 4);
    expect(getHeroScrollProgress(-900, 900)).toBe(1);
  });

  it("clamps overscroll and protects against invalid dimensions", () => {
    expect(getHeroScrollProgress(100, 900)).toBe(0);
    expect(getHeroScrollProgress(-1800, 900)).toBe(1);
    expect(getHeroScrollProgress(-100, 0)).toBe(0);
  });

  it("uses the Hero's own height as the exact eased cinematic exit interval", () => {
    expect(getHeroScrollProgress(-203, 812)).toBeCloseTo(0.1768, 4);
    expect(getHeroScrollProgress(-406, 812)).toBeCloseTo(0.4204, 4);
    expect(getHeroScrollProgress(-812, 812)).toBe(1);
  });
});

describe("interpolateHeroScrollProgress", () => {
  it("moves the camera state gradually toward its latest scroll target", () => {
    expect(interpolateHeroScrollProgress(0, 1, 0.08)).toBeCloseTo(0.08, 5);
    expect(interpolateHeroScrollProgress(0.4, 1, 0.08)).toBeCloseTo(0.448, 5);
  });

  it("keeps interpolated camera state within the Hero progress range", () => {
    expect(interpolateHeroScrollProgress(0.99, 1, 0.08)).toBeLessThanOrEqual(1);
    expect(interpolateHeroScrollProgress(0.01, -2, 0.08)).toBeGreaterThanOrEqual(0);
  });
});

describe("getHeroScrollChoreography", () => {
  it("maps the shared camera progress to the requested premium layer budgets", () => {
    expect(getHeroScrollChoreography(0)).toMatchObject({
      contentY: 0,
      contentOpacity: 1,
      videoScale: 1.015,
      atmosphereOpacity: 0.9,
      proofOpacity: 1,
    });
    const finalState = getHeroScrollChoreography(1);
    expect(finalState.contentY).toBe(-32);
    expect(finalState.contentOpacity).toBeCloseTo(0.34, 5);
    expect(finalState.videoScale).toBeCloseTo(1.05, 5);
    expect(finalState.atmosphereOpacity).toBeCloseTo(0.12, 5);
    expect(finalState.proofY).toBe(14);
    expect(finalState.proofOpacity).toBeCloseTo(0.62, 5);
  });

  it("keeps proof visible longer than the main content", () => {
    const choreography = getHeroScrollChoreography(1);
    expect(choreography.proofOpacity).toBeGreaterThan(choreography.contentOpacity);
  });
});
