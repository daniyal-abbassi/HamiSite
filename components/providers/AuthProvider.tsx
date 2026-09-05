"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import type { PublicUser } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  /** Re-fetch /api/auth/me — call after login/register or to re-sync state. */
  refresh: () => Promise<PublicUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const me = await apiGet<PublicUser>("/api/auth/me");
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch {
      // 401 (no/expired session) or a transient failure — both render as guest;
      // the storefront is fully browsable without an account.
      setUser(null);
      setStatus("guest");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // Session was already gone server-side — clearing locally is still correct.
    }
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(() => ({ user, status, refresh, logout }), [user, status, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
