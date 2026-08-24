import { describe, expect, it } from "vitest";
import { getOnlineServicesPointerOffsets } from "./onlineServicesMotion";

describe("online services motion", () => {
  it("clamps phone motion to the intentionally subtle five-by-six pixel budget", () => {
    const offsets = getOnlineServicesPointerOffsets(0, 0, { left: 0, top: 0, width: 100, height: 100 });
    expect(offsets.phoneX).toBe(-5);
    expect(offsets.phoneY).toBe(-6);
  });

  it("returns bounded percentage positions for the digital glow", () => {
    const offsets = getOnlineServicesPointerOffsets(180, -40, { left: 0, top: 0, width: 100, height: 100 });
    expect(offsets.glowX).toBe(100);
    expect(offsets.glowY).toBe(0);
  });
});
