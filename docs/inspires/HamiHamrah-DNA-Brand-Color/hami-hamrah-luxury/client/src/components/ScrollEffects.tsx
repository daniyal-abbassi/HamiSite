import { useEffect } from "react";
import { useLocation } from "wouter";
import { shouldUseObserverReveal } from "@/lib/mobileRuntime";

/** Activates CSS-driven reveal transitions for each route without animating reduced-motion users. */
export function ScrollEffects() {
  const [location] = useLocation();

	useEffect(() => {
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const runtime = {
			viewportWidth: window.innerWidth,
			coarsePointer: window.matchMedia("(pointer: coarse), (hover: none)").matches,
			reducedMotion: reduceMotion,
		};

		if (!shouldUseObserverReveal(runtime)) {
			document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => item.classList.add("is-revealed"));
			return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -7%" },
    );

    const observed = new WeakSet<HTMLElement>();
    const observe = (item: HTMLElement) => {
      if (observed.has(item) || item.classList.contains("is-revealed")) return;
      observed.add(item);
      observer.observe(item);
    };
    const observeWithin = (root: ParentNode) => {
      if (root instanceof HTMLElement && root.matches("[data-reveal]")) observe(root);
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(observe);
    };

    observeWithin(document);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) observeWithin(node);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location]);

  return null;
}
