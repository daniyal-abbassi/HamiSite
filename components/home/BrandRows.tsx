"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { partnerMarks } from "@/components/brand/BrandMarks";
import { brandStoriesByName, buildBrandRows } from "@/lib/content/home";

/** Mark nodes are keyed by display name so the row model can stay free of JSX. */
const markByName = Object.fromEntries(partnerMarks.map((mark) => [mark.name, mark.node]));

/**
 * The brands, as a stack of full-width rows that answer when chosen.
 *
 * Two controls per row, and they do different things: the row itself is a route to that
 * brand's products and navigates on the first press, while the chevron beside the name
 * holds emphasis. That split is the spec's Resolution of Question 2 — the reference's
 * two-tap interception is not acceptable on a storefront, so emphasis gets its own target
 * rather than borrowing the link's. Because the destination is a real `<a>`, keyboard and
 * screen-reader users reach the products in one action too, and emphasis never stands in
 * the way: it is a sibling control, not a mode the row has to be in.
 *
 * Emphasis never changes a row's height. The story band has a fixed height, so pressing a
 * row cannot slide the row below it out from under a thumb (research.md D5, contract C11).
 * Nothing loops and nothing travels: transitions only, CSS only, and the reduced-motion
 * path shows the identical content.
 */
export function BrandRows({ counts }: { counts: Record<string, number> }) {
  const [active, setActive] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const rows = buildBrandRows(partnerMarks, counts);

  // Release on a press anywhere outside the list, or on Escape.
  useEffect(() => {
    if (!active) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!list.current?.contains(event.target as Node)) setActive(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  // Release once the list has scrolled out of view, so emphasis can never be held off screen.
  useEffect(() => {
    const node = list.current;
    if (!node || !active) return;
    const observer = new IntersectionObserver(
      ([entry]) => !entry.isIntersecting && setActive(null),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  return (
    <ul className="brand-rows" ref={list} aria-label="برندهای حامی همراه">
      {rows.map((row) => {
        const emphasised = active === row.name;
        const story = row.hasStory ? brandStoriesByName[row.name] : null;

        return (
          <li key={row.name} className="brand-rows__item" data-emphasised={emphasised || undefined}>
            {/* The row itself is the destination: one stretched link under the whole thing,
                so the first press anywhere on it navigates (C6) and the expand control is
                lifted back above it as the only other target. */}
            {row.href ? <Link href={row.href} className="brand-rows__go" aria-label={row.linkLabel} /> : null}

            <span className="brand-rows__index" aria-hidden="true">
              {row.ordinal}
            </span>
            <span className="brand-rows__mark" aria-hidden="true">
              {markByName[row.name]}
            </span>
            <span className="brand-rows__label">{row.label}</span>
            {row.countLabel ? <span className="brand-rows__count">{row.countLabel}</span> : null}

            <span className="brand-rows__detail" id={row.detailId}>
              {story ? (
                <span className="brand-rows__story">
                  <b className="brand-rows__story-title">{story.title}</b>
                  <span className="brand-rows__story-text">{story.text}</span>
                </span>
              ) : null}
            </span>

            <button
              type="button"
              className="brand-rows__expand"
              aria-expanded={emphasised}
              aria-controls={row.detailId}
              aria-label={emphasised ? row.collapseLabel : row.expandLabel}
              onClick={() => setActive(emphasised ? null : row.name)}
            >
              <ChevronDown className="brand-rows__chevron" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
