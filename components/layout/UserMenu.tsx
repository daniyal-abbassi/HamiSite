"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";

/** Header auth island: login link for guests, name chip + logout for users.
 * Cart clearing on logout happens automatically — CartProvider watches the
 * auth status and drops the server cart state. */
export function UserMenu() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return <Skeleton className="size-10 rounded-full" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="ورود به حساب"
        className="grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <UserRound className="size-[18px]" />
      </Link>
    );
  }

  const displayName = user.firstName ?? user.username;

  return (
    <div className="flex items-center gap-0.5">
      <Link
        href="/orders"
        title={`حساب کاربری: ${displayName}`}
        className="hidden max-w-36 truncate rounded-full border border-line bg-foreground/5 px-3 py-1.5 text-xs font-bold text-foreground/90 transition-colors hover:bg-foreground/10 sm:block"
      >
        {displayName}
      </Link>
      <Link
        href="/orders"
        aria-label="حساب کاربری"
        className="grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground sm:hidden"
      >
        <UserRound className="size-[18px]" />
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        aria-label="خروج از حساب"
        className="grid size-10 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
