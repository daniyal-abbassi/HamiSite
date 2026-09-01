import { describe, expect, it } from "vitest";
import { getHeroGlowOffset } from "./heroGlow";

describe("getHeroGlowOffset", () => {
  const bounds = { left: 100, top: 50, width: 800, height: 500 };

  it("keeps the virtual light centred when the pointer is centred", () => {
    expect(getHeroGlowOffset(500, 300, bounds)).toEqual({ x: 0, y: 0 });
  });

  it("keeps virtual light inside a quiet secondary-motion budget", () => {
    expect(getHeroGlowOffset(100, 50, bounds)).toEqual({ x: -7, y: -4 });
    expect(getHeroGlowOffset(900, 550, bounds)).toEqual({ x: 7, y: 4 });
  });

  it("clamps coordinates outside the Hero instead of exceeding the light range", () => {
    expect(getHeroGlowOffset(-500, 2000, bounds)).toEqual({ x: -7, y: 4 });
  });
});
