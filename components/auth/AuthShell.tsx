"use client";

import "./auth-card.css";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { TextMorph } from "@/components/ui/text-morph";
import { storeWarranty, trustFacts } from "@/lib/content/verified-facts";
import hamiMark from "@/public/brand/hami-mark-alpha.png";
import { cn } from "@/lib/utils";

const PROMISES = [
  storeWarranty.label,
  ...trustFacts.filter((fact) => fact.key === "store" || fact.key === "priceMatch").map((fact) => fact.label),
];

/** The frame both account pages share: a light that follows the pointer, a brand panel, and the tabs. */
export function AuthShell({
  mode,
  nextPath,
  children,
}: {
  mode: "login" | "register";
  nextPath: string;
  children: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const suffix = nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : "";

  const followPointer = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    stage.current?.style.setProperty("--light-x", `${event.clientX}px`);
    stage.current?.style.setProperty("--light-y", `${event.clientY}px`);
  };

  return (
    <div ref={stage} className="auth-page" onPointerMove={followPointer}>
      <div className="auth-card">
        <aside className="auth-card__brand">
          <Image src={hamiMark} alt="حامی همراه" sizes="56px" className="auth-card__mark" priority />
          <div>
            <p className="auth-card__name">حامی همراه</p>
            <TextMorph words={PROMISES} interval={2400} className="auth-card__promise" />
          </div>
        </aside>

        <div className="auth-card__form">
          <nav className="auth-tabs" data-mode={mode} aria-label="حساب کاربری">
            <span className="auth-tabs__pill" aria-hidden="true" />
            <Link href={`/login${suffix}`} className={cn(mode === "login" && "is-active")} aria-current={mode === "login" ? "page" : undefined}>ورود</Link>
            <Link href={`/register${suffix}`} className={cn(mode === "register" && "is-active")} aria-current={mode === "register" ? "page" : undefined}>ثبت‌نام</Link>
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
