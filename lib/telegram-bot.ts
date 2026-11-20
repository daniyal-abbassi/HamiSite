import { formatToman, toFaDigits } from "@/lib/utils";

export interface OrderNotificationData {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  itemCount: number;
  city?: string | null;
}

/**
 * Format an attractive Persian notification message for Telegram admins.
 */
/* Messages are HTML, not Markdown: customer names and cities are free text, and one stray `_`, `*` or
   backtick in Markdown makes Telegram reject the whole message with HTTP 400. Escaping three characters
   in HTML is total; escaping Markdown reliably is not. */
const esc = (value: string | number) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function formatNewOrderAlertMessage(order: OrderNotificationData): string {
  const cityLine = order.city ? `\n📍 مقصد: ${esc(order.city)}` : "";
  return `🛍 <b>سفارش جدید در حامی همراه!</b>

📦 شماره سفارش: <code>${esc(order.orderNumber)}</code>
👤 مشتری: ${esc(order.customerName)}
📞 تماس: <code>${esc(toFaDigits(order.phone))}</code>${cityLine}
🛍 تعداد اقلام: ${toFaDigits(order.itemCount)} عدد
💰 مبلغ کل: <b>${esc(formatToman(order.totalAmount))}</b>

برای مشاهده سریع و تغییر وضعیت سفارش، دکمه زیر را لمس فرمایید:`;
}

/**
 * Create an inline keyboard button opening the order sheet directly in the TMA.
 */
export function createOrderInlineKeyboard(
  orderId: number,
  appBaseUrl: string = process.env.APP_BASE_URL || "http://localhost:3000"
) {
  const cleanBase = (appBaseUrl || "http://localhost:3000").replace(/\/+$/, "");
  const orderUrl = `${cleanBase}/tma/orders/${orderId}`;

  return {
    inline_keyboard: [
      [
        {
          text: "📱 مدیریت در مینی‌اپ تلگرام",
          web_app: {
            url: orderUrl,
          },
        },
      ],
    ],
  };
}

let warnedUnconfigured = false;

function parseAdminIds(adminIds: (string | number)[] | string): string[] {
  return (Array.isArray(adminIds) ? adminIds.map(String) : adminIds.split(/[,\s]+/)).map((id) => id.trim()).filter(Boolean);
}

/** Telegram's own explanation of a refusal ("chat not found", "can't parse entities"...). The token is never part of it. */
async function refusalReason(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { description?: string };
    return body.description ?? "no description";
  } catch {
    return "no description";
  }
}

/**
 * Deliver one alert to every administrator. Never throws; one unreachable admin never blocks the rest.
 * A refusal is logged with Telegram's reason. If the mini-app button is what Telegram refused, the text
 * is resent without it: an alert without a button beats no alert.
 */
async function sendAdminAlert(
  kind: string,
  orderNumber: string,
  text: string,
  replyMarkup: ReturnType<typeof createOrderInlineKeyboard>,
  botToken: string,
  adminIds: (string | number)[] | string,
  customFetch: typeof fetch,
): Promise<{ sentCount: number; failedCount: number }> {
  const targetIds = parseAdminIds(adminIds);
  if (!botToken || botToken === "mock_telegram_bot_token" || targetIds.length === 0) {
    if (!warnedUnconfigured && process.env.NODE_ENV === "production") {
      warnedUnconfigured = true;
      console.warn("Telegram alerts are not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_IDS): no admin will be alerted");
    }
    return { sentCount: 0, failedCount: 0 };
  }

  const post = (chat_id: string, withButton: boolean) =>
    customFetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, parse_mode: "HTML", ...(withButton ? { reply_markup: replyMarkup } : {}) }),
    });

  let sentCount = 0;
  let failedCount = 0;
  for (const chatId of targetIds) {
    try {
      let res = await post(chatId, true);
      if (!res.ok && res.status === 400) {
        const reason = await refusalReason(res);
        console.warn(`Telegram ${kind} alert for order ${orderNumber} refused for chat_id ${chatId}: HTTP 400 — ${reason}; retrying without the button`);
        res = await post(chatId, false);
      }
      if (res.ok) {
        sentCount++;
      } else {
        failedCount++;
        console.warn(`Telegram ${kind} alert for order ${orderNumber} failed for chat_id ${chatId}: HTTP ${res.status} — ${await refusalReason(res)}`);
      }
    } catch (err) {
      failedCount++;
      console.warn(`Telegram ${kind} alert for order ${orderNumber} error for chat_id ${chatId}:`, err instanceof Error ? err.message : err);
    }
  }
  return { sentCount, failedCount };
}

/** New order alert with the mini-app button. Non-blocking, never throws. */
export function notifyAdminsNewOrder(
  order: OrderNotificationData,
  botToken: string = process.env.TELEGRAM_BOT_TOKEN || "",
  adminIds: (string | number)[] | string = process.env.TELEGRAM_ADMIN_IDS || "",
  appBaseUrl: string = process.env.APP_BASE_URL || "http://localhost:3000",
  customFetch: typeof fetch = fetch
): Promise<{ sentCount: number; failedCount: number }> {
  return sendAdminAlert("new-order", order.orderNumber, formatNewOrderAlertMessage(order), createOrderInlineKeyboard(order.id, appBaseUrl), botToken, adminIds, customFetch);
}

export interface PaymentReportData extends OrderNotificationData {
  reportedAt: Date;
}

/** Persian alert for a customer's "I have paid" card-to-card report. */
export function formatPaymentReportedMessage(order: PaymentReportData): string {
  const time = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" }).format(order.reportedAt);
  return `💳 <b>مشتری پرداخت کارت‌به‌کارت را اعلام کرد</b>

📦 شماره سفارش: <code>${esc(order.orderNumber)}</code>
👤 مشتری: ${esc(order.customerName)}
📞 تماس: <code>${esc(toFaDigits(order.phone))}</code>
💰 مبلغ: <b>${esc(formatToman(order.totalAmount))}</b>
🕒 زمان: ${esc(time)}

لطفاً واریز را در حساب بانکی بررسی و سپس پرداخت را تأیید یا رد کنید:`;
}

/** Alert the Telegram admins that a customer reported a card-to-card payment. Never throws. */
export function notifyAdminsPaymentReported(
  order: PaymentReportData,
  botToken: string = process.env.TELEGRAM_BOT_TOKEN || "",
  adminIds: (string | number)[] | string = process.env.TELEGRAM_ADMIN_IDS || "",
  appBaseUrl: string = process.env.APP_BASE_URL || "http://localhost:3000",
  customFetch: typeof fetch = fetch
): Promise<{ sentCount: number; failedCount: number }> {
  return sendAdminAlert("payment-reported", order.orderNumber, formatPaymentReportedMessage(order), createOrderInlineKeyboard(order.id, appBaseUrl), botToken, adminIds, customFetch);
}
