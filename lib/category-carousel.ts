export const MAX_FLICK_TRAVEL = 2;

export function clampCarouselIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, index));
}

export function boundCarouselSnap(previous: number, selected: number, count: number, maxTravel = MAX_FLICK_TRAVEL): number {
  const delta = selected - previous;
  if (Math.abs(delta) <= maxTravel) return clampCarouselIndex(selected, count);
  return clampCarouselIndex(previous + Math.sign(delta) * maxTravel, count);
}

export function carouselKeyboardTarget(key: string, current: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    // In RTL reading order, left advances and right returns.
    case "ArrowRight": return clampCarouselIndex(current - 1, count);
    case "ArrowLeft": return clampCarouselIndex(current + 1, count);
    case "Home": return 0;
    case "End": return count - 1;
    default: return null;
  }
}
