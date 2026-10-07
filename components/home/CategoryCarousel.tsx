"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { boundCarouselSnap, carouselKeyboardTarget, clampCarouselIndex, MAX_FLICK_TRAVEL } from "@/lib/category-carousel";
import "./category-carousel.css";

let rememberedIndex = 0;

function EmblaViewport({ children, onApiReady }: { children: ReactNode; onApiReady: (api: EmblaCarouselType | null) => void }) {
  const [viewportRef, api] = useEmblaCarousel({
    axis: "x",
    direction: "rtl",
    align: "start",
    slidesToScroll: 1,
    loop: false,
    containScroll: "keepSnaps",
    dragFree: false,
  });

  useEffect(() => {
    onApiReady(api ?? null);
    return () => onApiReady(null);
  }, [api, onApiReady]);

  return <div id="categories-carousel-viewport" className="cat-carousel__viewport" ref={viewportRef}>{children}</div>;
}

export function CategoryCarousel({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(rememberedIndex);
  const [api, setApi] = useState<EmblaCarouselType | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const countRef = useRef(0);
  const programmaticTargetRef = useRef<number | null>(null);

  const onApiReady = useCallback((nextApi: EmblaCarouselType | null) => setApi(nextApi), []);

  useEffect(() => {
    if (!api) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const syncControls = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    syncControls();
    api.on("select", syncControls).on("reInit", syncControls);
    return () => {
      api.off("select", syncControls).off("reInit", syncControls);
    };
  }, [api]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const links = [...root.querySelectorAll<HTMLAnchorElement>(".cat-slide a")];
    countRef.current = links.length;
    links.forEach((link, index) => {
      link.tabIndex = index === activeIndex ? 0 : -1;
      if (index === activeIndex) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, [activeIndex, live]);

  useEffect(() => {
    if (!api) return;
    const count = api.slideNodes().length;
    if (!count) return;
    let lastIndex = clampCarouselIndex(rememberedIndex, count);
    const onSelect = () => {
      const next = api.selectedScrollSnap();
      const programmaticTarget = programmaticTargetRef.current;
      if (programmaticTarget !== null) {
        if (next !== programmaticTarget) {
          api.scrollTo(programmaticTarget);
          return;
        }
        programmaticTargetRef.current = null;
        lastIndex = next;
        rememberedIndex = next;
        setActiveIndex(next);
        return;
      }
      const bounded = boundCarouselSnap(lastIndex, next, count, MAX_FLICK_TRAVEL);
      if (bounded !== next) {
        lastIndex = bounded;
        rememberedIndex = bounded;
        api.scrollTo(bounded);
        setActiveIndex(bounded);
        return;
      }
      lastIndex = next;
      rememberedIndex = next;
      setActiveIndex(next);
    };
    const onReInit = () => {
      const restored = clampCarouselIndex(rememberedIndex, count);
      api.scrollTo(restored, true);
      lastIndex = restored;
      setActiveIndex(restored);
    };
    api.scrollTo(lastIndex, true);
    setActiveIndex(lastIndex);
    api.on("select", onSelect).on("reInit", onReInit);
    return () => {
      api.off("select", onSelect).off("reInit", onReInit);
      rememberedIndex = api.selectedScrollSnap();
    };
  }, [api]);

  const goTo = useCallback((index: number) => {
    const next = clampCarouselIndex(index, countRef.current);
    rememberedIndex = next;
    programmaticTargetRef.current = next;
    setActiveIndex(next);
    api?.scrollTo(next);
    requestAnimationFrame(() => {
      rootRef.current?.querySelectorAll<HTMLAnchorElement>(".cat-slide a")[next]?.focus({ preventScroll: true });
    });
  }, [api]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element) || !event.target.closest(".cat-slide a")) return;
    const target = carouselKeyboardTarget(event.key, activeIndex, countRef.current);
    if (target === null) return;
    event.preventDefault();
    goTo(target);
  };

  return (
    <div
      className="cat-carousel"
      data-live={live ? "true" : "false"}
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="دسته‌بندی محصولات"
      onKeyDown={onKeyDown}
    >
      <div className="cat-carousel__controls" dir="ltr" role="group" aria-label="هدایت دسته‌بندی‌ها">
        <button
          className="cat-carousel__control"
          type="button"
          aria-label="دسته‌های بعدی"
          aria-controls="categories-carousel-viewport"
          disabled={!canScrollNext}
          onClick={() => api?.scrollNext()}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          className="cat-carousel__control"
          type="button"
          aria-label="دسته‌های قبلی"
          aria-controls="categories-carousel-viewport"
          disabled={!canScrollPrev}
          onClick={() => api?.scrollPrev()}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      {live ? <EmblaViewport onApiReady={onApiReady}>{children}</EmblaViewport> : <div id="categories-carousel-viewport" className="cat-carousel__viewport">{children}</div>}
    </div>
  );
}
