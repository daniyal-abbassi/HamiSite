type Bounds = Pick<DOMRect, "left" | "top" | "width" | "height">;

const clamp = (value: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, value));

/**
 * Derives the two motion budgets used by the Hero from a pointer location.
 * Video remains deliberately restrained while Atmosphere adds the perception
 * of depth without moving the product itself by a noticeable amount.
 */
export function getHeroParallaxOffsets(pointerX: number, pointerY: number, bounds: Bounds) {
  if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0) {
    return { videoX: 0, videoY: 0, atmosphereX: 0, atmosphereY: 0 };
  }

  const normalizedX = clamp((pointerX - bounds.left) / bounds.width, 0, 1) * 2 - 1;
  const normalizedY = clamp((pointerY - bounds.top) / bounds.height, 0, 1) * 2 - 1;

  const normalizeZero = (value: number) => (Object.is(value, -0) ? 0 : value);

  return {
    videoX: normalizeZero(-normalizedX * 2),
    videoY: normalizeZero(-normalizedY),
    atmosphereX: normalizeZero(normalizedX * 8),
    atmosphereY: normalizeZero(normalizedY * 5),
  };
}
