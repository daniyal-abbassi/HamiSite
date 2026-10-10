import { describe, it, expect, vi } from "vitest";
import {
  formatNewOrderAlertMessage,
  createOrderInlineKeyboard,
  notifyAdminsNewOrder,
} from "@/lib/telegram-bot";

describe("telegram-bot notifications", () => {
  const sampleOrder = {
    id: 101,
    orderNumber: "ORD-20261011-8492",
    customerName: "سارا محمدی",
    phone: "09121112233",
    totalAmount: 18500000,
    itemCount: 2,
    city: "مشهد",
  };

  it("should format Persian new order message correctly", () => {
    const text = formatNewOrderAlertMessage(sampleOrder);
    expect(text).toContain("سفارش جدید در حامی همراه");
    expect(text).toContain("سارا محمدی");
    expect(text).toContain("۱۸٬۵۰۰٬۰۰۰ تومان");
    expect(text).toContain("مشهد");
  });

  it("should create inline keyboard with WebApp URL pointing to the order", () => {
    const keyboard = createOrderInlineKeyboard(101, "https://store.example.com");
    expect(keyboard.inline_keyboard).toHaveLength(1);
    expect(keyboard.inline_keyboard[0][0].text).toContain("مینی‌اپ");
    expect(keyboard.inline_keyboard[0][0].web_app?.url).toBe(
      "https://store.example.com/tma/orders/101"
    );
  });

  it("should send message to all whitelisted admins via Telegram API", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const result = await notifyAdminsNewOrder(
      sampleOrder,
      "test_bot_token",
      ["111222", "333444"],
      "https://store.example.com",
      mockFetch as any
    );

    expect(result.sentCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const firstCallUrl = mockFetch.mock.calls[0][0];
    const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);

    expect(firstCallUrl).toBe("https://api.telegram.org/bottest_bot_token/sendMessage");
    expect(firstCallBody.chat_id).toBe("111222");
    expect(firstCallBody.reply_markup.inline_keyboard[0][0].web_app.url).toBe(
      "https://store.example.com/tma/orders/101"
    );
  });

  it("should not fail or throw if fetch rejects or bot token is missing", async () => {
    const mockFailingFetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    const result = await notifyAdminsNewOrder(
      sampleOrder,
      "test_bot_token",
      ["111222"],
      "https://store.example.com",
      mockFailingFetch as any
    );

    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(1);
  });
});

