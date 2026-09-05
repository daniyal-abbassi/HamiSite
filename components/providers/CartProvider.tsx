"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Cart } from "@/types/store";

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
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await apiGet<Cart>("/api/cart"));
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync the server cart with the session state: fetch on login, drop on logout.
  useEffect(() => {
    if (status === "authenticated") {
      void refresh();
    } else if (status === "guest") {
      setCart(null);
      setLoading(false);
    }
  }, [status, refresh]);

  const addItem = useCallback(async (productId: number, variantId?: number, quantity = 1) => {
    // `variantId: undefined` is dropped by JSON.stringify — matches the API's
    // optional-variant contract for products without variants.
    const updated = await apiPost<Cart>("/api/cart/items", { productId, variantId, quantity });
    setCart(updated);
    setDrawerOpen(true);
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    setCart(await apiPatch<Cart>(`/api/cart/items/${itemId}`, { quantity }));
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    setCart(await apiDelete<Cart>(`/api/cart/items/${itemId}`));
  }, []);

  const clear = useCallback(async () => {
    setCart(await apiDelete<Cart>("/api/cart"));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading: loading || status === "loading",
      hasCart: status === "authenticated",
      itemCount: cart?.itemCount ?? 0,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, status, drawerOpen, refresh, addItem, updateItem, removeItem, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider> (inside <AuthProvider>)");
  return ctx;
}
