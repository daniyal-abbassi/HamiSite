"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AccessDenied } from "./AccessDenied";
import { type TelegramUser } from "@/lib/telegram-auth";

export interface TMAHapticFeedback {
  impact: (style?: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notification: (type?: "error" | "success" | "warning") => void;
  selection: () => void;
}

export interface TMAContextValue {
  webApp: any | null;
  user: TelegramUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthorizedAdmin: boolean;
  initData: string;
  themeParams: Record<string, string>;
  haptic: TMAHapticFeedback;
  showBackButton: (onClick?: () => void) => void;
  hideBackButton: () => void;
  showMainButton: (params: { text: string; onClick: () => void; color?: string; textColor?: string }) => void;
  hideMainButton: () => void;
  close: () => void;
  devMockLogin: () => Promise<void>;
  isDevMode: boolean;
}

const TelegramContext = createContext<TMAContextValue | null>(null);

export function useTelegram(): TMAContextValue {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [webApp, setWebApp] = useState<any | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [initData, setInitData] = useState<string>("");
  const [themeParams, setThemeParams] = useState<Record<string, string>>({});
  const [isDevMode, setIsDevMode] = useState(false);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      setWebApp(tg);
      try {
        tg.ready();
        tg.expand();
      } catch (err) {
        console.warn("Failed to expand Telegram WebApp:", err);
      }

      // Sync theme parameters to CSS variables
      if (tg.themeParams) {
        setThemeParams(tg.themeParams);
        const root = document.documentElement;
        if (tg.themeParams.bg_color) root.style.setProperty("--tg-theme-bg-color", tg.themeParams.bg_color);
        if (tg.themeParams.text_color) root.style.setProperty("--tg-theme-text-color", tg.themeParams.text_color);
        if (tg.themeParams.button_color) root.style.setProperty("--tg-theme-button-color", tg.themeParams.button_color);
        if (tg.themeParams.button_text_color) root.style.setProperty("--tg-theme-button-text-color", tg.themeParams.button_text_color);
        if (tg.themeParams.secondary_bg_color) root.style.setProperty("--tg-theme-secondary-bg-color", tg.themeParams.secondary_bg_color);
      }

      const rawInitData = tg.initData || "";
      setInitData(rawInitData);

      if (rawInitData) {
        verifyWithServer(rawInitData);
      } else {
        // Not launched with initData or opened directly
        setIsLoading(false);
        setIsDevMode(process.env.NODE_ENV === "development");
      }
    } else {
      // Running outside Telegram WebApp (e.g. desktop web browser testing)
      setIsLoading(false);
      setIsDevMode(process.env.NODE_ENV === "development");
    }
  }, []);

  // BackButton automatic handling: show on subpages, hide on root TMA dashboard
  useEffect(() => {
    if (!webApp?.BackButton) return;

    const isSubPage = pathname !== "/tma" && pathname !== "/tma/";
    if (isSubPage) {
      const handleBack = () => {
        router.back();
      };
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);

      return () => {
        webApp.BackButton.offClick(handleBack);
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [webApp, pathname, router]);

  // Server-side verification
  const verifyWithServer = async (data: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tma/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: data }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setUser(json.user);
        setIsAuthenticated(true);
        setIsAuthorizedAdmin(true);
      } else if (json.error === "NOT_AN_ADMIN") {
        setUser(json.user || null);
        setIsAuthenticated(true);
        setIsAuthorizedAdmin(false);
      } else {
        setIsAuthenticated(false);
        setIsAuthorizedAdmin(false);
      }
    } catch (err) {
      console.error("TMA auth verification failed:", err);
      setIsAuthenticated(false);
      setIsAuthorizedAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock login for desktop development
  const devMockLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tma/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: "dev_mock_admin" }),
      });
      const json = await res.json();
      if (json.ok) {
        setUser(json.user);
        setIsAuthenticated(true);
        setIsAuthorizedAdmin(true);
      }
    } catch (err) {
      console.error("Dev mock login failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Haptic Feedback API wrapper
  const haptic: TMAHapticFeedback = {
    impact: useCallback(
      (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") => {
        try {
          webApp?.HapticFeedback?.impactOccurred?.(style);
        } catch {
          // ignore when not supported
        }
      },
      [webApp]
    ),
    notification: useCallback(
      (type: "error" | "success" | "warning" = "success") => {
        try {
          webApp?.HapticFeedback?.notificationOccurred?.(type);
        } catch {
          // ignore
        }
      },
      [webApp]
    ),
    selection: useCallback(() => {
      try {
        webApp?.HapticFeedback?.selectionChanged?.();
      } catch {
        // ignore
      }
    }, [webApp]),
  };

  const showBackButton = useCallback(
    (onClick?: () => void) => {
      if (!webApp?.BackButton) return;
      webApp.BackButton.show();
      if (onClick) {
        webApp.BackButton.onClick(onClick);
      }
    },
    [webApp]
  );

  const hideBackButton = useCallback(() => {
    if (!webApp?.BackButton) return;
    webApp.BackButton.hide();
  }, [webApp]);

  const showMainButton = useCallback(
    ({
      text,
      onClick,
      color,
      textColor,
    }: {
      text: string;
      onClick: () => void;
      color?: string;
      textColor?: string;
    }) => {
      if (!webApp?.MainButton) return;
      webApp.MainButton.setText(text);
      if (color) webApp.MainButton.setParams({ color, text_color: textColor });
      webApp.MainButton.show();
      webApp.MainButton.onClick(onClick);
    },
    [webApp]
  );

  const hideMainButton = useCallback(() => {
    if (!webApp?.MainButton) return;
    webApp.MainButton.hide();
  }, [webApp]);

  const close = useCallback(() => {
    try {
      webApp?.close?.();
    } catch {
      // ignore
    }
  }, [webApp]);

  const contextValue: TMAContextValue = {
    webApp,
    user,
    isLoading,
    isAuthenticated,
    isAuthorizedAdmin,
    initData,
    themeParams,
    haptic,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    close,
    devMockLogin,
    isDevMode,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-stone-300">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-sm font-medium">در حال اتصال به تلگرام...</div>
        </div>
      ) : isAuthenticated && !isAuthorizedAdmin ? (
        <AccessDenied userId={user?.id} username={user?.username} onClose={close} />
      ) : !isAuthenticated && isDevMode ? (
        <div className="min-h-screen p-4 flex flex-col items-center justify-center text-center">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-base font-bold text-amber-300 mb-2">محیط تست دسکتاپ مینی‌اپ</h2>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              شما خارج از محیط تلگرام هستید. برای تست و مشاهده امکانات پنل، می‌توانید با هویت آزمایشی مدیر وارد شوید.
            </p>
            <button
              onClick={devMockLogin}
              type="button"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl text-sm transition-all active:scale-95 shadow-md"
            >
              ورود آزمایشی مدیر (Dev Mock)
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </TelegramContext.Provider>
  );
}

