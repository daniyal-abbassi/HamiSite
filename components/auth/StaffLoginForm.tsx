"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiPost } from "@/lib/api-client";
import type { PublicUser } from "@/types/auth";

export function StaffLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter(); const { refresh } = useAuth(); const { refresh: refreshCart } = useCart();
  const [identifier, setIdentifier] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await apiPost<PublicUser>("/api/auth/login", { identifier: identifier.trim(), password }); await refresh(); void refreshCart(); router.push(nextPath); }
    catch (cause) { setError(apiErrorToFa(cause)); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
    <AuthField id="staff-identifier" label="نام کاربری کارکنان" autoComplete="username" required dir="auto" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
    <AuthField id="staff-password" label="رمز عبور" type="password" autoComplete="current-password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
    {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <Button type="submit" variant="oxblood" className="w-full" size="lg" loading={busy}><LogIn className="size-4" />ورود کارکنان</Button>
  </form>;
}
