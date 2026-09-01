import { describe, expect, it } from "vitest";
import { getHeroParallaxOffsets } from "./heroParallax";

const bounds = { left: 100, top: 50, width: 400, height: 200 };

describe("getHeroParallaxOffsets", () => {
  it("keeps Video and Atmosphere at rest in the center", () => {
    expect(getHeroParallaxOffsets(300, 150, bounds)).toEqual({ videoX: 0, videoY: 0, atmosphereX: 0, atmosphereY: 0 });
  });

  it("keeps the physical Video movement below its five-pixel maximum", () => {
    expect(getHeroParallaxOffsets(100, 50, bounds)).toEqual({ videoX: 2, videoY: 1, atmosphereX: -8, atmosphereY: -5 });
    expect(getHeroParallaxOffsets(500, 250, bounds)).toEqual({ videoX: -2, videoY: -1, atmosphereX: 8, atmosphereY: 5 });
  });

  it("clamps pointer positions outside the Hero", () => {
    expect(getHeroParallaxOffsets(-500, 900, bounds)).toEqual({ videoX: 2, videoY: -1, atmosphereX: -8, atmosphereY: 5 });
  });
});
