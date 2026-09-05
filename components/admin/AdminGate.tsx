"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";

/** Role gate for every /admin route. Guests → /login?next=/admin; any
 * non-ADMIN authenticated role → home. Renders a skeleton while /me resolves
 * so there's no flash of dashboard to a non-admin. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login?next=/admin");
    } else if (status === "authenticated" && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, user?.role, router]);

  if (status === "loading") {
    return (
      <div className="grid gap-4 p-8 md:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl md:col-span-2" />
        <Skeleton className="h-64 rounded-2xl md:col-span-3" />
      </div>
    );
  }

  if (status === "guest" || user?.role !== "ADMIN") return null;

  return <>{children}</>;
}