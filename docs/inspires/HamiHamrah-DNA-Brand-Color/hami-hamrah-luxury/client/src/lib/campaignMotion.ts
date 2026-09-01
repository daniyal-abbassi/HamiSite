export type CampaignBounds = Pick<DOMRect, "left" | "top" | "width" | "height">;

export const getCampaignPointerOffsets = (clientX: number, clientY: number, bounds: CampaignBounds) => {
  const x = ((clientX - bounds.left) / bounds.width - 0.5) * 2;
  const y = ((clientY - bounds.top) / bounds.height - 0.5) * 2;

  return {
    productX: x * 6,
    productY: y * 4,
    glowX: x * 3,
    glowY: y * 2,
  };
};

export const getCampaignScrollState = (top: number, height: number, viewportHeight: number) => {
  const progress = Math.max(-1, Math.min(1, (viewportHeight * 0.5 - (top + height * 0.5)) / viewportHeight));
  return { progress, productY: -progress * 5 };
};
