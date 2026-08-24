type Bounds = { left: number; top: number; width: number; height: number };

export function getB2bPointerOffsets(clientX: number, clientY: number, bounds: Bounds) {
  const normalizedX = Math.max(-1, Math.min(1, ((clientX - bounds.left) / bounds.width - 0.5) * 2));
  const normalizedY = Math.max(-1, Math.min(1, ((clientY - bounds.top) / bounds.height - 0.5) * 2));

  return {
    productX: Number((normalizedX * 7).toFixed(2)),
    productY: Number((normalizedY * 4).toFixed(2)),
    glowX: Number((normalizedX * 8).toFixed(2)),
    glowY: Number((normalizedY * 5).toFixed(2)),
    dataOpacity: Number((0.42 + (Math.abs(normalizedX) + Math.abs(normalizedY)) * 0.18).toFixed(2)),
  };
}
