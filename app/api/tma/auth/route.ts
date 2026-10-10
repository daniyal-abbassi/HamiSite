import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = body.initData || req.headers.get("x-telegram-init-data") || "";

    // Support local dev testing when specifically enabled or in dev mode with mock token
    if (
      process.env.NODE_ENV === "development" &&
      initData === "dev_mock_admin"
    ) {
      return NextResponse.json({
        ok: true,
        user: {
          id: 12345678,
          first_name: "توسعه‌دهنده",
          last_name: "حامی",
          username: "dev_admin",
        },
        isDevMock: true,
      });
    }

    if (!initData) {
      return NextResponse.json(
        { ok: false, error: "MISSING_INIT_DATA", message: "اطلاعات ورود تلگرام ارسال نشده است." },
        { status: 400 }
      );
    }

    const verification = verifyTelegramWebAppData(initData);

    if (!verification.authenticated) {
      if (verification.error === "NOT_AN_ADMIN") {
        return NextResponse.json(
          {
            ok: false,
            error: "NOT_AN_ADMIN",
            user: verification.user,
            message: "دسترسی شما به عنوان مدیر فروشگاه تایید نشد.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: verification.error,
          message: "امضای دیجیتال تلگرام نامعتبر یا منقضی شده است.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: verification.user,
    });
  } catch (error) {
    console.error("TMA Auth Error:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "خطای سرور در احراز هویت تلگرام." },
      { status: 500 }
    );
  }
}

