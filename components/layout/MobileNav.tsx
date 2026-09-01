"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type NavLink = { href: string; label: string };

/** Minimal RTL slide-over nav — no radix dependency needed yet. */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-sm text-ink-dark/80 hover:bg-wine/10 hover:text-wine"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-wine-ink/70"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] animate-fade-up flex-col bg-wine p-6 text-[#fffaf3]">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-black">حامی همراه</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="grid size-9 place-items-center rounded-sm hover:bg-wine-dark"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-3 text-sm font-bold hover:bg-wine-dark"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="brand-hairline my-6" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-sm bg-champagne px-3 py-3 text-center text-sm font-bold text-wine-ink"
            >
              ورود / ثبت‌نام
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
