"use client";

export type WorldKey =
  | "hero"
  | "deals"
  | "new"
  | "store"
  | "gallery"
  | "partner"
  | "explore"
  | "creative"
  | "footer";

export type ExploreKey =
  | "all"
  | "apple"
  | "samsung"
  | "xiaomi"
  | "accessory"
  | "flagship"
  | "midrange"
  | "earbuds"
  | "wearable"
  | "charging";

/** Mutable, frame-friendly store. No React re-renders on scroll. */
export const journey = {
  scroll: 0, // 0..1 of full page
  world: "hero" as WorldKey,
  progress: 0, // 0..1 within active world section
  explore: "all" as ExploreKey,
  px: 0, // pointer -1..1
  py: 0,
  vh: 800,
};

type Listener = (w: WorldKey) => void;
const listeners = new Set<Listener>();
export function onWorldChange(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setWorld(w: WorldKey, progress: number) {
  journey.progress = progress;
  if (journey.world !== w) {
    journey.world = w;
    listeners.forEach((l) => l(w));
  }
}

export type Quality = {
  mobile: boolean;
  low: boolean;
  dpr: [number, number];
  particles: number;
  segments: number;
};

let cachedQuality: Quality | null = null;
export function getQuality(): Quality {
  if (cachedQuality) return cachedQuality;
  if (typeof window === "undefined") {
    return { mobile: true, low: true, dpr: [1, 1], particles: 200, segments: 3 };
  }
  const mobile = window.matchMedia("(max-width: 820px)").matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const low = mobile && (cores <= 4 || mem <= 3);
  cachedQuality = {
    mobile,
    low,
    dpr: low ? [1, 1.2] : mobile ? [1, 1.6] : [1, 2],
    particles: low ? 220 : mobile ? 420 : 1100,
    segments: low ? 2 : mobile ? 3 : 5,
  };
  return cachedQuality;
}

export const WORLD_BG: Record<WorldKey, { a: string; b: string; c: string }> = {
  hero: { a: "#0e0d10", b: "#1a1216", c: "#0e0d10" },
  deals: { a: "#2a090f", b: "#5a121d", c: "#120609" },
  new: { a: "#0b0b0f", b: "#1d1a22", c: "#08080a" },
  store: { a: "#111014", b: "#221c1a", c: "#0e0d10" },
  gallery: { a: "#171210", b: "#2b1e17", c: "#100c0a" },
  partner: { a: "#0f0e11", b: "#2a1f12", c: "#0e0d10" },
  explore: { a: "#0e0d10", b: "#1b1519", c: "#0e0d10" },
  creative: { a: "#0b0a0d", b: "#1e0f14", c: "#0b0a0d" },
  footer: { a: "#0a090b", b: "#130d0f", c: "#0a090b" },
};
