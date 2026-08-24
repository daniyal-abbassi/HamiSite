import { describe, expect, it } from "vitest";
import { getB2bPointerOffsets } from "./b2bMotion";

describe("B2B supply-room motion", () => {
  it("keeps the product and glow movement inside a subtle premium range", () => {
    const offsets = getB2bPointerOffsets(1000, 0, { left: 0, top: 0, width: 1000, height: 800 });
    expect(offsets).toEqual({ productX: 7, productY: -4, glowX: 8, glowY: -5, dataOpacity: 0.78 });
  });

  it("returns a calm centre state", () => {
    expect(getB2bPointerOffsets(500, 400, { left: 0, top: 0, width: 1000, height: 800 })).toEqual({ productX: 0, productY: 0, glowX: 0, glowY: 0, dataOpacity: 0.42 });
  });
});
