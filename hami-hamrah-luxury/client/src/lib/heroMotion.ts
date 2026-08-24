/**
 * Converts the Hero's upward scroll distance into a stable 0–1 progress value.
 * The caller can map this to small transform and opacity offsets without ever
 * overdriving the visual layers beyond their defined motion budget.
 */
export function getHeroScrollProgress(top: number, height: number) {
  if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0) return 0;
  const normalizedProgress = Math.min(1, Math.max(0, -top / height));
  return normalizedProgress ** 1.25;
}

export function interpolateHeroScrollProgress(current: number, target: number, smoothing: number) {
  const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const safeCurrent = clamp(current);
  const safeTarget = clamp(target);
  const safeSmoothing = clamp(smoothing);
  return clamp(safeCurrent + (safeTarget - safeCurrent) * safeSmoothing);
}

export function getHeroScrollChoreography(progress: number) {
  const safeProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const contentY = safeProgress === 0 ? 0 : -32 * safeProgress;
  return {
    contentY,
    contentOpacity: 1 - 0.66 * safeProgress,
    videoScale: 1.015 + 0.035 * safeProgress,
    atmosphereOpacity: 0.9 - 0.78 * safeProgress,
    proofY: 14 * safeProgress,
    proofOpacity: 1 - 0.38 * safeProgress,
  };
}
