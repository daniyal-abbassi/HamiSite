"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AdaptiveProductImage } from "@/components/shop/AdaptiveProductImage";
import { Sparkles } from "lucide-react";
import { PLACEHOLDER_ALT, PLACEHOLDER_LABEL, isPlaceholderImage, resolveProductImage } from "@/lib/product-images";
import { LiquidSelection } from "@/components/liquid/LiquidSelection";
import { toFaDigits } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog-db";

/**
 * FR-031: show a count and a position when a record genuinely holds more than one
 * view, and nothing at all when it holds one. 133 of 189 products have a second
 * image and 56 do not, so the difference between the two cases is the most common
 * thing a shopper notices about this page — the 56 must read as finished, which
 * means no dots pointing at nothing and no empty strip where thumbnails would go.
 *
 * The composition MUST NOT depend on the remote host, so index 0 is always the
 * locally-mirrored photograph and a view that fails to load is dropped from the
 * set rather than left as a broken frame: the counter and the strip describe what
 * actually arrived. Remote views measured 5.8–7.5s each, and routing them through
 * the image optimizer made them fail more often still, so only remote views bypass it.
 */
export function ProductGallery({ product, variantImageUrl }: { product: CatalogProduct; variantImageUrl?: string | null }) {
  const productImage = resolveProductImage(product);
  const noImage = isPlaceholderImage(productImage);
  const [viewIndex, setViewIndex] = useState(0);
  const [failedViews, setFailedViews] = useState<string[]>([]);

  useEffect(() => {
    setViewIndex(0);
  }, [variantImageUrl]);

  const views = useMemo(() => {
    const firstView = variantImageUrl || productImage;
    const others = product.images
      .map((image) => image.url)
      .filter((url) => typeof url === "string" && url !== firstView);
    return [firstView, ...others];
  }, [product, productImage, variantImageUrl]);

  const shownViews = views.filter((url) => !failedViews.includes(url));
  const current = Math.min(viewIndex, Math.max(0, shownViews.length - 1));
  const activeView = shownViews[current];
  const [isChanging, setIsChanging] = useState(false);

  return (
    <div className="pdp-gallery">
      <div
        className="pdp-plate relative aspect-square overflow-hidden"
        data-photo-plate=""
        aria-busy={isChanging ? "true" : undefined}
      >
        {noImage && <span className="pdp-plate__tag">{PLACEHOLDER_LABEL}</span>}
        {product.specialOffer && (
          <span className="pdp-plate__offer">
            <Sparkles className="size-3.5" aria-hidden="true" />
            پیشنهاد ویژه
          </span>
        )}
        {shownViews.length > 1 && (
          <span className="pdp-plate__count" aria-hidden="true">
            {toFaDigits(current + 1)} / {toFaDigits(shownViews.length)}
          </span>
        )}
        {activeView && (
          <AdaptiveProductImage
            key={activeView}
            src={activeView}
            alt={
              isPlaceholderImage(activeView)
                ? PLACEHOLDER_ALT
                : `${product.name}${shownViews.length > 1 ? ` — نمای ${toFaDigits(current + 1)} از ${toFaDigits(shownViews.length)}` : ""}`
            }
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-contain p-8 mix-blend-multiply"
            priority
            unoptimized={!activeView.startsWith("/")}
            onLoad={() => setIsChanging(false)}
            onError={() => {
              setIsChanging(false);
              if (activeView === productImage) return;
              setFailedViews((previous) => (previous.includes(activeView) ? previous : [...previous, activeView]));
              setViewIndex(0);
            }}
          />
        )}
      </div>

      {/* One scrolling row: a record can hold 22 views, and wrapped they pushed the buy box a screen down. */}
      {shownViews.length > 1 && (
        <div className="pdp-thumbs">
          <LiquidSelection
            className="!gap-2"
            itemClassName="pdp-thumb"
            noWrap
            value={shownViews[current]}
            announce="pressed"
            groupRole="group"
            label="نمای دیگر این محصول"
            markerInset={2}
            onChange={(url) => {
              setIsChanging(true);
              setViewIndex(shownViews.indexOf(url));
            }}
            items={shownViews.map((url, index) => ({
              id: url,
              label: (
                <span className="relative block aspect-square size-full">
                  <Image src={url} alt="" fill sizes="64px" className="object-contain p-1" unoptimized={!url.startsWith("/")} />
                </span>
              ),
              // The accessible name is passed as `name` because the label is an image:
              // the component only sets `aria-label` for a non-string label, and the
              // name must stay byte-identical to the pre-marker markup (SC-010).
              name: `نمای ${toFaDigits(index + 1)} از ${toFaDigits(shownViews.length)}`,
            }))}
          />
        </div>
      )}
    </div>
  );
}
