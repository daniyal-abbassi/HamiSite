import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type DemoCartItem = {
  lineId: string;
  productId: string;
  productTitle: string;
  image: string;
  quantity: number;
};

type AddItemInput = Omit<DemoCartItem, "lineId" | "quantity">;

type DemoCart = {
  items: DemoCartItem[];
  itemCount: number;
};

type CartContextValue = {
  cart: DemoCart | null;
  isOpen: boolean;
  loading: boolean;
  itemCount: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddItemInput) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => void;
};

const DEMO_CART_STORAGE_KEY = "hami:demo-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readDemoCart(): DemoCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(DEMO_CART_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DemoCartItem[]>(readDemoCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(DEMO_CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const cart = useMemo<DemoCart | null>(() => {
    if (!items.length) return null;
    return { items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(async (item: AddItemInput) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.productId === item.productId);
      if (existing) return current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry);
      return [...current, { ...item, lineId: `demo-${item.productId}`, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    setItems((current) => quantity <= 0 ? current.filter((item) => item.lineId !== lineId) : current.map((item) => item.lineId === lineId ? { ...item, quantity } : item));
  }, []);

  const removeItem = useCallback(async (lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    isOpen,
    loading: false,
    itemCount: cart?.itemCount ?? 0,
    openCart,
    closeCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }), [addItem, cart, clearCart, closeCart, isOpen, openCart, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
