"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Menu, X } from "lucide-react";
import type { CatalogMapDepartment } from "@/lib/category-departments-db";
import { cn } from "@/lib/utils";

/** Matches the shutter's transition in header-glass.css. */
const SHUTTER_MS = 320;

type MapLink = { label: string; href: string };

function Row({
  id,
  label,
  count,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  count?: number | null;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className={cn("catalog-map__row", expanded && "is-expanded")}>
      <button
        type="button"
        id={`${id}-toggle`}
        aria-expanded={expanded}
        aria-controls={id}
        onClick={onToggle}
      >
        <span>{label}</span>
        {count != null && <small>{count.toLocaleString("fa-IR")} محصول</small>}
        <ChevronDown aria-hidden="true" />
      </button>
      <div id={id} className="catalog-map__fold" role="region" aria-labelledby={`${id}-toggle`}>
        <div>{children}</div>
      </div>
    </li>
  );
}

/** A panel lowered from under the header: brands and every department, each opening in place. */
export function CatalogMap({ departments, brands }: { departments: CatalogMapDepartment[]; brands: MapLink[] }) {
  const [mounted, setMounted] = useState(false);
  const [lowered, setLowered] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [top, setTop] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const closing = useRef<number | undefined>(undefined);

  const close = useCallback(() => {
    setLowered(false);
    window.clearTimeout(closing.current);
    closing.current = window.setTimeout(() => setMounted(false), SHUTTER_MS);
  }, []);

  const open = () => {
    window.clearTimeout(closing.current);
    setTop(trigger.current?.closest("header")?.getBoundingClientRect().bottom ?? 0);
    setMounted(true);
  };

  useEffect(() => {
    if (!mounted) return;
    // A frame after mounting, so the raised position paints and the shutter has somewhere to travel from.
    const frame = requestAnimationFrame(() => setLowered(true));
    const button = trigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus({ preventScroll: true });

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      button?.focus({ preventScroll: true });
    };
  }, [mounted, close]);

  useEffect(() => () => window.clearTimeout(closing.current), []);

  const toggle = (id: string) => setExpanded((current) => (current === id ? null : id));

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="catalog-map-trigger"
        aria-label={lowered ? "بستن نقشه فروشگاه" : "نقشه فروشگاه"}
        aria-expanded={lowered}
        aria-controls="catalog-map"
        onClick={lowered ? close : open}
      >
        {lowered ? <X aria-hidden="true" strokeWidth={1.8} /> : <Menu aria-hidden="true" strokeWidth={1.8} />}
      </button>

      {mounted && createPortal(
        <div className={cn("catalog-map", lowered && "is-lowered")} dir="rtl" style={{ "--map-top": `${top}px` } as React.CSSProperties}>
          <div className="catalog-map__scrim" onClick={close} aria-hidden="true" />
          <nav ref={panel} id="catalog-map" className="catalog-map__panel" aria-label="نقشه فروشگاه">
            <ul role="list">
              <Row id="catalog-map-brands" label="برندها" expanded={expanded === "brands"} onToggle={() => toggle("brands")}>
                <div className="catalog-map__links">
                  {brands.map((brand) => (
                    <Link key={brand.href} href={brand.href} onClick={close}>{brand.label}</Link>
                  ))}
                </div>
              </Row>

              {departments.map((department, index) => (
                <Row
                  key={department.href}
                  id={`catalog-map-${index}`}
                  label={department.label}
                  count={department.count}
                  expanded={expanded === department.href}
                  onToggle={() => toggle(department.href)}
                >
                  {department.products.length > 0 && (
                    <div className="catalog-map__links">
                      {department.products.map((product) => (
                        <Link key={product.href} href={product.href} onClick={close}><bdi>{product.title}</bdi></Link>
                      ))}
                    </div>
                  )}
                  <Link href={department.href} className="catalog-map__enter" onClick={close}>
                    <span>ورود به {department.label}</span>
                    <ArrowLeft aria-hidden="true" />
                  </Link>
                </Row>
              ))}
            </ul>

            <Link href="/shop" className="catalog-map__enter catalog-map__enter--all" onClick={close}>
              <span>مشاهده همه محصولات</span>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </nav>
        </div>,
        document.body,
      )}
    </>
  );
}
