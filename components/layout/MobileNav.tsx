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
        className="grid size-10 place-items-center rounded-full border border-line bg-foreground/5 text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/80 duration-slow backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="glass absolute inset-y-3 start-3 flex w-72 max-w-[85vw] animate-slide-in-end flex-col rounded-2xl p-6 text-foreground">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-black">حامی همراه</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="grid size-9 place-items-center rounded-full transition-colors duration-fast hover:bg-foreground/10"
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
                  className="rounded-xl px-3.5 py-3 text-sm font-bold transition-colors duration-fast hover:bg-foreground/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="brand-hairline my-6" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gradient-to-b from-gold-lite to-gold px-3 py-3 text-center text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              ورود / ثبت‌نام
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
