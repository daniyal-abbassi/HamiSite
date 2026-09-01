export type HeroBounds = { left: number; top: number; width: number; height: number };

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

/** Maps pointer coordinates into the intentionally small virtual-light travel range. */
export function getHeroGlowOffset(pointerX: number, pointerY: number, bounds: HeroBounds) {
  const normalizedX = (pointerX - bounds.left) / bounds.width - 0.5;
  const normalizedY = (pointerY - bounds.top) / bounds.height - 0.5;

  return {
    x: Math.round(clamp(normalizedX * 14, -7, 7)),
    y: Math.round(clamp(normalizedY * 8, -4, 4)),
  };
}
