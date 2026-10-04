import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Check, CircleHelp, Clock3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "نتیجه پرداخت",
  description: "وضعیت پرداخت سفارش در فروشگاه حامی همراه.",
  robots: { index: false, follow: false },
};

const states = {
  success: {
    eyebrow: "پرداخت تأیید شد",
    title: "سفارش شما ثبت شد.",
    description: "پرداخت از درگاه تأیید شد و سفارش برای پردازش آماده است.",
    icon: Check,
    tone: "text-emerald-400",
  },
  failed: {
    eyebrow: "پرداخت انجام نشد",
    title: "تراکنش کامل نشد.",
    description: "پرداخت لغو شد یا درگاه آن را نپذیرفت. وضعیت سفارش را در صفحه سفارش بررسی کنید.",
    icon: X,
    tone: "text-destructive",
  },
  verify_failed: {
    eyebrow: "تأیید پرداخت ناموفق بود",
    title: "پرداخت تأیید نشد.",
    description: "درگاه این تراکنش را تأیید نکرد. وضعیت سفارش را پیش از اقدام بعدی بررسی کنید.",
    icon: X,
    tone: "text-destructive",
  },
  notfound: {
    eyebrow: "تراکنش پیدا نشد",
    title: "اطلاعات پرداخت در دسترس نیست.",
    description: "شناسه بازگشتی درگاه با پرداخت ثبت‌شده‌ای مطابقت ندارد. سفارش‌های خود را بررسی کنید.",
    icon: CircleHelp,
    tone: "text-muted-foreground",
  },
  error: {
    eyebrow: "بررسی پرداخت در جریان است",
    title: "هنوز نمی‌توانیم نتیجه را تأیید کنیم.",
    description: "اگر از حساب شما مبلغی کم شده، پیش از پرداخت دوباره وضعیت سفارش را بررسی کنید. در صورت نیاز با فروشگاه تماس بگیرید.",
    icon: Clock3,
    tone: "text-aqua",
  },
} as const;

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; orderId?: string }>;
}) {
  const { payment, orderId } = await searchParams;
  const safeOrderId = orderId && /^[1-9]\d*$/.test(orderId) ? orderId : null;
  let confirmedSuccess = false;
  if (payment === "success" && safeOrderId) {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await prisma.session.findUnique({
        where: { tokenHash: hashSessionToken(token) },
        select: { userId: true, expiresAt: true, user: { select: { isActive: true } } },
      });
      if (session && session.expiresAt > new Date() && session.user.isActive) {
        const order = await prisma.order.findFirst({
          where: { id: Number(safeOrderId), userId: session.userId },
          select: { paymentStatus: true },
        });
        confirmedSuccess = order?.paymentStatus === "COMPLETED";
      }
    }
  }
  const state = payment === "success" && !confirmedSuccess
    ? states.error
    : payment && payment in states ? states[payment as keyof typeof states] : states.error;
  const linkedOrderId = payment === "success" && !confirmedSuccess ? null : safeOrderId;
  const Icon = state.icon;

  return (
    <main className="container flex min-h-[65vh] items-center justify-center py-16">
      <section className="glass relative w-full max-w-xl overflow-hidden rounded-3xl border border-line p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-aqua/50 to-transparent" />
        <div className={`mx-auto grid size-16 place-items-center rounded-full border border-current/20 bg-foreground/5 ${state.tone}`}>
          <Icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="mt-7 text-xs font-bold text-aqua">{state.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-black leading-relaxed sm:text-3xl">{state.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-muted-foreground">{state.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-line pt-7">
          {linkedOrderId && (
            <Link href={`/order/${linkedOrderId}`}>
              <Button variant="oxblood">مشاهده سفارش</Button>
            </Link>
          )}
          <Link href="/orders">
            <Button variant="ghost">سفارش‌های من</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
