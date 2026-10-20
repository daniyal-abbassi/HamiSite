"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Cart } from "@/types/store";

const CartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false },
);

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  /** The cart API is withAuth — guests have no server cart. */
  hasCart: boolean;
  itemCount: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<void>;
  addItem: (productId: number, variantId?: number, quantity?: number) => Promise<void>;
  addBundle: (bundleId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const activeReqId = useRef(0);
  const activeUserIdRef = useRef<number | null>(null);

  const openDrawer = useCallback(() => {
    setHasOpened(true);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const refresh = useCallback(async () => {
    const reqId = ++activeReqId.current;
    const reqUserId = activeUserIdRef.current;
    if (reqUserId === null) {
      setCart(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiGet<Cart>("/api/cart");
      if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
        setCart(data);
      }
    } catch {
      if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
        setCart(null);
      }
    } finally {
      if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
        setLoading(false);
      }
    }
  }, []);

  // Sync the server cart with the session state: fetch on login/user switch, drop on logout.
  const currentUserId = status === "authenticated" && user ? user.id : null;

  useEffect(() => {
    // If the active user has changed (including login, switch, or logout),
    // drop any in-flight requests and previous cart immediately to preserve isolation.
    if (activeUserIdRef.current !== currentUserId) {
      activeUserIdRef.current = currentUserId;
      activeReqId.current++;
      setCart(null);
    }

    if (currentUserId !== null) {
      void refresh();
    } else {
      setLoading(false);
    }
  }, [currentUserId, refresh]);

  const addItem = useCallback(async (productId: number, variantId?: number, quantity = 1) => {
    const reqId = ++activeReqId.current;
    const reqUserId = activeUserIdRef.current;
    const updated = await apiPost<Cart>("/api/cart/items", { productId, variantId, quantity });
    if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
      setCart(updated);
      setHasOpened(true);
      setDrawerOpen(true);
    }
  }, []);

  const addBundle = useCallback(async (bundleId: number, quantity = 1) => {
    const reqId = ++activeReqId.current;
    const reqUserId = activeUserIdRef.current;
    const updated = await apiPost<Cart>("/api/cart/items", { bundleId, quantity });
    if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
      setCart(updated);
      setHasOpened(true);
      setDrawerOpen(true);
    }
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    const reqId = ++activeReqId.current;
    const reqUserId = activeUserIdRef.current;
    const updated = await apiPatch<Cart>(`/api/cart/items/${itemId}`, { quantity });
    if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
      setCart(updated);
    }
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    const reqId = ++activeReqId.current;
    const reqUserId = activeUserIdRef.current;
    const updated = await apiDelete<Cart>(`/api/cart/items/${itemId}`);
    if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
      setCart(updated);
    }
  }, []);

  const clear = useCallback(async () => {
    const reqId = ++activeReqId.current;
    const reqUserId = activeUserIdRef.current;
    const updated = await apiDelete<Cart>("/api/cart");
    if (activeReqId.current === reqId && activeUserIdRef.current === reqUserId) {
      setCart(updated);
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading: loading || status === "loading",
      hasCart: status === "authenticated",
      itemCount: cart?.itemCount ?? 0,
      drawerOpen,
      openDrawer,
      closeDrawer,
      refresh,
      addItem,
      addBundle,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, status, drawerOpen, openDrawer, closeDrawer, refresh, addItem, addBundle, updateItem, removeItem, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {hasOpened && <CartDrawer />}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider> (inside <AuthProvider>)");
  return ctx;
}
