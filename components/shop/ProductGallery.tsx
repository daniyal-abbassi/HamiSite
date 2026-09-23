"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { PLACEHOLDER_ALT, PLACEHOLDER_LABEL, isPlaceholderImage, resolveProductImage } from "@/lib/product-images";
import { cn, toFaDigits } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";

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
 * the image optimizer made them fail more often still, so they are `unoptimized`.
 */
export function ProductGallery({ product }: { product: CatalogProduct }) {
  const productImage = resolveProductImage(product);
  const noImage = isPlaceholderImage(productImage);
  const [viewIndex, setViewIndex] = useState(0);
  const [failedViews, setFailedViews] = useState<string[]>([]);

  const views = useMemo(() => {
    const others = product.images
      .map((image) => image.url)
      .filter((url) => typeof url === "string" && url !== productImage);
    return [productImage, ...others];
  }, [product, productImage]);

  const shownViews = views.filter((url) => !failedViews.includes(url));
  const current = Math.min(viewIndex, Math.max(0, shownViews.length - 1));
  const activeView = shownViews[current];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl glass-smoked border border-champagne/25 shadow-monolith">
        {noImage && (
          <span className="absolute end-4 top-4 z-20 rounded-full border border-champagne/25 bg-ink/80 px-3 py-1.5 font-mono text-[11px] text-foreground/75">
            {PLACEHOLDER_LABEL}
          </span>
        )}
        {product.specialOffer && (
          <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-oxblood/90 px-3.5 py-1.5 font-mono text-xs tracking-[0.14em] text-champagne backdrop-blur-md shadow-glow-oxblood">
            <Sparkles className="size-3 text-champagne" />
            SPECIAL OFFER
          </span>
        )}
        {activeView && (
          <Image
            key={activeView}
            src={activeView}
            alt={
              isPlaceholderImage(activeView)
                ? PLACEHOLDER_ALT
                : `${product.name}${shownViews.length > 1 ? ` — نمای ${toFaDigits(current + 1)} از ${toFaDigits(shownViews.length)}` : ""}`
            }
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-contain p-8 transition-transform duration-700 hover:scale-105"
            priority
            unoptimized={activeView !== productImage}
            onError={() => {
              if (activeView === productImage) return;
              setFailedViews((previous) => (previous.includes(activeView) ? previous : [...previous, activeView]));
              setViewIndex(0);
            }}
          />
        )}
      </div>

      {/*
        * flex-wrap, not a scroll container: 22 thumbs measured 1626px wide inside a
        * 360px viewport, which the page only survived because `body` clips the
        * overflow — FR-041 asks for composition rather than clipping, and the row
        * breaks the same way at every width on a desktop column half that wide.
       */}
      {shownViews.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="نمای دیگر این محصول">
          {shownViews.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setViewIndex(index)}
              aria-pressed={index === current}
              aria-label={`نمای ${toFaDigits(index + 1)} از ${toFaDigits(shownViews.length)}`}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border transition-colors",
                index === current ? "border-champagne" : "border-line hover:border-champagne/50",
              )}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-contain p-1" unoptimized={url !== productImage} />
            </button>
          ))}
          <span className="ms-1 font-mono text-xs text-muted-foreground">
            {toFaDigits(current + 1)} / {toFaDigits(shownViews.length)}
          </span>
        </div>
      )}
    </div>
  );
}
