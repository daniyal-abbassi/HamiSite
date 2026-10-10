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
export function formatNewOrderAlertMessage(order: OrderNotificationData): string {
  const cityLine = order.city ? `\n📍 مقصد: ${order.city}` : "";
  return `🛍 *سفارش جدید در حامی همراه!*

📦 شماره سفارش: \`${order.orderNumber}\`
👤 مشتری: ${order.customerName}
📞 تماس: \`${toFaDigits(order.phone)}\`${cityLine}
🛍 تعداد اقلام: ${toFaDigits(order.itemCount)} عدد
💰 مبلغ کل: *${formatToman(order.totalAmount)}*

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

/**
 * Send new order alert messages with Mini App buttons to all configured admin IDs.
 * Non-blocking and never throws errors upwards.
 */
export async function notifyAdminsNewOrder(
  order: OrderNotificationData,
  botToken: string = process.env.TELEGRAM_BOT_TOKEN || "",
  adminIds: (string | number)[] | string = process.env.TELEGRAM_ADMIN_IDS || "",
  appBaseUrl: string = process.env.APP_BASE_URL || "http://localhost:3000",
  customFetch: typeof fetch = fetch
): Promise<{ sentCount: number; failedCount: number }> {
  if (!botToken || botToken === "mock_telegram_bot_token") {
    // Bot token not configured or default mock; log silently in non-production
    return { sentCount: 0, failedCount: 0 };
  }

  let targetIds: string[] = [];
  if (Array.isArray(adminIds)) {
    targetIds = adminIds.map((id) => String(id).trim()).filter(Boolean);
  } else if (typeof adminIds === "string") {
    targetIds = adminIds
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter(Boolean);
  }

  if (targetIds.length === 0) {
    return { sentCount: 0, failedCount: 0 };
  }

  const messageText = formatNewOrderAlertMessage(order);
  const replyMarkup = createOrderInlineKeyboard(order.id, appBaseUrl);

  let sentCount = 0;
  let failedCount = 0;

  for (const chatId of targetIds) {
    try {
      const res = await customFetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "Markdown",
          reply_markup: replyMarkup,
        }),
      });

      if (res.ok) {
        sentCount++;
      } else {
        failedCount++;
        console.warn(`Telegram alert failed for chat_id ${chatId}: HTTP ${res.status}`);
      }
    } catch (err) {
      failedCount++;
      console.warn(`Telegram alert error for chat_id ${chatId}:`, err);
    }
  }

  return { sentCount, failedCount };
}

