"use client";

import { useCallback } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * The shop's photographs come in two kinds that need opposite framing:
 *
 *  - **packshot** — a product on a white ground (most of the older catalogue). It must be shown whole,
 *    matted, so its own white merges with the card.
 *  - **studio** — the shop's own burgundy set with the house mark at the top right. It is composed as a
 *    full frame, so matting it on white wastes it and crops nothing is lost by filling the plate.
 *
 * The two cannot be told apart from the URL, so the image classifies itself on load by looking at its
 * four corners. The result is written to the nearest `[data-photo-plate]` as `data-kind`, and CSS does
 * the framing. If the pixels cannot be read (a cross-origin image taints the canvas) the plate keeps the
 * packshot treatment, which is the safe, uncropped one.
 */
function classify(image: HTMLImageElement): "studio" | "packshot" {
  try {
    const size = 24;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "packshot";
    context.drawImage(image, 0, 0, size, size);
    const corners = [[1, 1], [size - 2, 1], [1, size - 2], [size - 2, size - 2]];
    const allLight = corners.every(([x, y]) => {
      const [r, g, b] = context.getImageData(x, y, 1, 1).data;
      return r > 226 && g > 226 && b > 226;
    });
    return allLight ? "packshot" : "studio";
  } catch {
    return "packshot";
  }
}

export function AdaptiveProductImage({ onLoad, ...props }: ImageProps) {
  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      const plate = image.closest<HTMLElement>("[data-photo-plate]");
      if (plate && image.naturalWidth > 0) plate.dataset.kind = classify(image);
      onLoad?.(event);
    },
    [onLoad],
  );

  return <Image {...props} onLoad={handleLoad} />;
}
