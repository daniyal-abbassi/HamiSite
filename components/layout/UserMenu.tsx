"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

/** Header auth island: login link for guests, account menu for mobile users.
 * Cart clearing on logout happens automatically — CartProvider watches the
 * auth status and drops the server cart state. */
export function UserMenu() {
  const { user, status, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!mobileMenuRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  if (status === "loading") {
    return (
      <span className="grid size-11 shrink-0 place-items-center rounded-full text-foreground/75" aria-hidden="true">
        <UserRound className="size-[18px]" />
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="ورود به حساب"
        className="grid size-11 shrink-0 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <UserRound className="size-[18px]" aria-hidden="true" />
      </Link>
    );
  }

  const displayName = user.firstName ?? user.username;

  return (
    <>
      <div ref={mobileMenuRef} className="relative sm:hidden">
        <button
          type="button"
          aria-label="حساب کاربری"
          aria-expanded={mobileOpen}
          aria-controls="mobile-account-menu"
          onClick={() => setMobileOpen((open) => !open)}
          className="grid size-11 shrink-0 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <UserRound className="size-[18px]" aria-hidden="true" />
        </button>
        {mobileOpen && (
          <div
            id="mobile-account-menu"
            className="absolute end-0 top-full z-50 mt-2 min-w-36 rounded-2xl border border-champagne/25 bg-[#350713]/95 p-1.5 text-foreground shadow-xl backdrop-blur-xl"
          >
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm hover:bg-white/10"
            >
              حساب کاربری
            </Link>
            {(user.role === "WHOLESALE" || user.role === "AGENT" || user.role === "ADMIN") && (
              <Link
                href="/partners/bundles"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm text-amber-300 font-bold hover:bg-white/10"
              >
                سبدهای همکار
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                void logout();
              }}
              className="block w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-white/10"
            >
              خروج از حساب
            </button>
          </div>
        )}
      </div>
      <div className="hidden items-center gap-1.5 sm:flex">
        {(user.role === "WHOLESALE" || user.role === "AGENT" || user.role === "ADMIN") && (
          <Link
            href="/partners/bundles"
            className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
          >
            سبدهای همکار
          </Link>
        )}
        <Link
          href="/account"
          title={`حساب کاربری: ${displayName}`}
          className="max-w-36 truncate rounded-full border border-line bg-foreground/5 px-3 py-1.5 text-xs font-bold text-foreground/90 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {displayName}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="خروج از حساب"
          className="grid size-11 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
