import { describe, expect, it } from "vitest";
import { getCampaignPointerOffsets, getCampaignScrollState } from "./campaignMotion";

describe("campaign motion", () => {
  it("keeps pointer parallax inside the premium 6px product and 3px glow limits", () => {
    expect(getCampaignPointerOffsets(100, 100, { left: 0, top: 0, width: 100, height: 100 })).toEqual({
      productX: 6,
      productY: 4,
      glowX: 3,
      glowY: 2,
    });
  });

  it("caps the scroll response and counter-moves the product by five pixels at most", () => {
    expect(getCampaignScrollState(-1000, 700, 800)).toEqual({ progress: 1, productY: -5 });
    expect(getCampaignScrollState(2000, 700, 800)).toEqual({ progress: -1, productY: 5 });
  });
});
