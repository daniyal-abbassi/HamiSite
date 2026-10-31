"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { AdaptiveProductImage } from "@/components/shop/AdaptiveProductImage";
import { TomanPrice } from "@/components/ui/TomanPrice";
import type { DepartmentShelf, ShelfProduct } from "@/lib/category-departments-db";
import { cn } from "@/lib/utils";

const DESKTOP = "(min-width: 1024px)";
/** Matches the panel's transition, so the opened header is held in place until it settles. */
const SETTLE_MS = 320;
const HOVER_INTENT_MS = 120;

function ShelfItem({ product, index }: { product: ShelfProduct; index: number }) {
  return (
    <li style={{ "--i": index } as React.CSSProperties}>
      <Link href={product.href} className="cats__item">
        <span
          className="cats__plate"
          data-photo-plate=""
          data-kind={product.image.startsWith("/images/products/") ? "studio" : undefined}
        >
          <AdaptiveProductImage src={product.image} alt="" fill sizes="150px" className="cats__photo" />
        </span>
        <span className="cats__title"><bdi>{product.title}</bdi></span>
        {product.price != null && <TomanPrice as="strong" amount={product.price} />}
        {!product.purchasable && <span className="cats__state">ناموجود</span>}
      </Link>
    </li>
  );
}

export function CategoryExplorer({ departments }: { departments: DepartmentShelf[] }) {
  const [open, setOpen] = useState(0);
  const items = useRef<Array<HTMLLIElement | null>>([]);
  const hoverTimer = useRef<number | undefined>(undefined);
  const settleFrame = useRef(0);

  useEffect(() => () => {
    window.clearTimeout(hoverTimer.current);
    cancelAnimationFrame(settleFrame.current);
  }, []);

  /* Opening a shelf collapses the one above it, which would pull the tapped row out from under
     the finger. The row's position is held until the transition ends. */
  const holdInPlace = useCallback((item: HTMLElement) => {
    const anchor = item.getBoundingClientRect().top;
    const started = performance.now();
    cancelAnimationFrame(settleFrame.current);
    const hold = (now: number) => {
      const drift = item.getBoundingClientRect().top - anchor;
      if (Math.abs(drift) > 0.5) window.scrollBy({ top: drift, behavior: "instant" });
      if (now - started < SETTLE_MS) settleFrame.current = requestAnimationFrame(hold);
    };
    settleFrame.current = requestAnimationFrame(hold);
  }, []);

  const toggle = (index: number) => {
    const desktop = window.matchMedia(DESKTOP).matches;
    const item = items.current[index];
    if (!desktop && item) holdInPlace(item);
    setOpen((current) => (current === index && !desktop ? -1 : index));
  };

  const hoverOpen = (index: number, event: React.PointerEvent) => {
    if (event.pointerType !== "mouse" || !window.matchMedia(DESKTOP).matches) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpen(index), HOVER_INTENT_MS);
  };

  return (
    <ul className="cats" role="list">
      {departments.map((department, index) => {
        const isOpen = index === open;
        const panelId = `cats-panel-${department.kind}`;
        const headId = `cats-head-${department.kind}`;
        return (
          <li
            key={department.kind}
            ref={(node) => { items.current[index] = node; }}
            className={cn("cats__slat", isOpen && "is-open")}
            onPointerEnter={(event) => hoverOpen(index, event)}
            onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
          >
            <span className="cats__art">
              <Image src={department.image} alt="" fill sizes="(max-width: 1023px) 100vw, 640px" />
            </span>

            <h3 className="cats__heading">
              <button
                type="button"
                id={headId}
                className="cats__toggle"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span className="cats__name">{department.label}</span>
                {department.showsCount && (
                  <span className="cats__count">
                    {department.reachableCount.toLocaleString("fa-IR")} محصول
                  </span>
                )}
                <Plus className="cats__icon" aria-hidden="true" />
              </button>
            </h3>

            <div id={panelId} className="cats__panel" role="region" aria-labelledby={headId}>
              <div className="cats__panel-inner">
                {department.products.length > 0 && (
                  <ul className="cats__rail" role="list">
                    {department.products.map((product, position) => (
                      <ShelfItem key={product.id} product={product} index={position} />
                    ))}
                  </ul>
                )}
                <Link href={department.href} className="cats__all">
                  <span>ورود به {department.label}</span>
                  <ArrowLeft aria-hidden="true" />
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
