"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
    <main className={cn("flex-1 relative z-10", !isHomepage && "pt-24 md:pt-28")}>
      {children}
    </main>
  );
}
