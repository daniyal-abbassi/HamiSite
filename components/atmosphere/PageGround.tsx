"use client";

import { usePathname } from "next/navigation";
import { interiorGround } from "@/lib/atmosphere/progression";
import "./page-ground.css";

/**
 * A static base behind the shopper pages. Homepage sections paint their own
 * backgrounds in document flow, so both canvases stay visible at a boundary.
 * Interior routes retain their settled tone. No scroll color listener is mounted.
 */
export function PageGround() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const interior = interiorGround(pathname);

  if (!isHome && interior === null) return null;

  return (
    <div
      className={`hami-page-ground${isHome ? " hami-page-ground--home" : ""}`}
      aria-hidden="true"
      style={{ backgroundColor: isHome ? "#30080f" : interior! }}
    />
  );
}
