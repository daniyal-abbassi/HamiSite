import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramWebAppData, type TelegramAuthResult } from "./telegram-auth";

/**
 * Validates Telegram initData header on TMA API requests.
 * Returns either authenticated user or a pre-formatted JSON error response.
 */
export function authenticateTmaRequest(
  req: NextRequest
): { ok: true; user: any } | { ok: false; response: NextResponse } {
  const initData = req.headers.get("x-telegram-init-data") || "";

  // Allow dev mock in non-production
  if (process.env.NODE_ENV === "development" && (initData === "dev_mock_admin" || !initData)) {
    return {
      ok: true,
      user: {
        id: 12345678,
        first_name: "مدیر توسعه",
        username: "dev_admin",
      },
    };
  }

  if (!initData) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "MISSING_INIT_DATA", message: "احراز هویت تلگرام یافت نشد." },
        { status: 401 }
      ),
    };
  }

  const result: TelegramAuthResult = verifyTelegramWebAppData(initData);

  if (!result.authenticated) {
    const status = result.error === "NOT_AN_ADMIN" ? 403 : 401;
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: result.error,
          message:
            result.error === "NOT_AN_ADMIN"
              ? "دسترسی مدیریت به این حساب تلگرام داده نشده است."
              : "اعتبار نشست تلگرام تایید نشد.",
        },
        { status }
      ),
    };
  }

  return { ok: true, user: result.user };
}

