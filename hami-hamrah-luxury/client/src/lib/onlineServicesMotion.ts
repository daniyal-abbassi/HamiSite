type Bounds = { left: number; top: number; width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function getOnlineServicesPointerOffsets(clientX: number, clientY: number, bounds: Bounds) {
  const normalizedX = clamp(((clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
  const normalizedY = clamp(((clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);

  return {
    phoneX: Number((normalizedX * 5).toFixed(2)),
    phoneY: Number((normalizedY * 6).toFixed(2)),
    glowX: Number((((normalizedX + 1) / 2) * 100).toFixed(1)),
    glowY: Number((((normalizedY + 1) / 2) * 100).toFixed(1)),
  };
}
