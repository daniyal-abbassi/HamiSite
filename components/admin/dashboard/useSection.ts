"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reduceReadState, type ReducedRead } from "./sections/readState";

export type SectionRead<T> = ReducedRead<T> & { onRetry: () => void };

/**
 * One section's read: `loading` → `real` | `empty` | `unreadable`, retried independently
 * of every other section (C1.5 — one failing section must not blank its siblings).
 *
 * `empty` (the API answered and there is nothing here) is never collapsed into
 * `unreadable` (the API could not be read), and a failed read never renders as `0` — the
 * invariant in data-model.md:34-35. `isEmpty` is the section's own judgment of
 * "answered, nothing here", passed in so this hook stays generic.
 */
export function useSection<T>(
  fetcher: () => Promise<T>,
  isEmpty: (data: T) => boolean,
): SectionRead<T> {
  const [reduced, setReduced] = useState<ReducedRead<T>>({
    state: "loading",
    data: null,
    error: null,
  });
  // Latest-ref pattern: the fetcher and isEmpty closures are captured once (stable load)
  // but always call the versions from the render that scheduled them.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  const load = useCallback(() => {
    let cancelled = false;
    setReduced({ state: "loading", data: null, error: null });
    fetcherRef.current()
      .then((data) => {
        if (cancelled) return;
        setReduced(reduceReadState<T>({ kind: "success", data }, isEmptyRef.current));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "unknown";
        setReduced(reduceReadState<T>({ kind: "failure", message }, isEmptyRef.current));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { ...reduced, onRetry: load };
}
