import { describe, it, expect, vi } from "vitest";
import {
  formatNewOrderAlertMessage,
  createOrderInlineKeyboard,
  formatPaymentReportedMessage,
  notifyAdminsNewOrder,
  notifyAdminsPaymentReported,
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

  it("escapes customer-supplied text so characters special to Telegram cannot break the alert", () => {
    const text = formatNewOrderAlertMessage({ ...sampleOrder, customerName: "ali_*[x]`<b>&", city: "a_b" });
    expect(text).toContain("ali_*[x]`&lt;b&gt;&amp;");
    expect(text).not.toContain("<b>&");
    expect(formatPaymentReportedMessage({ ...sampleOrder, customerName: "a<i>b", reportedAt: new Date() })).toContain("a&lt;i&gt;b");
  });

  it("sends HTML, not Markdown", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    await notifyAdminsPaymentReported({ ...sampleOrder, reportedAt: new Date() }, "tok", "1", "https://s.example", mockFetch as any);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).parse_mode).toBe("HTML");
  });

  it("resends without the button when Telegram refuses it, and logs Telegram's reason", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ description: "Bad Request: inline button web app url invalid" }) })
      .mockResolvedValueOnce({ ok: true });
    const result = await notifyAdminsPaymentReported({ ...sampleOrder, reportedAt: new Date() }, "SECRET_TOKEN", "1", "https://s.example", mockFetch as any);
    expect(result).toEqual({ sentCount: 1, failedCount: 0 });
    expect(JSON.parse(mockFetch.mock.calls[1][1].body).reply_markup).toBeUndefined();
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).toContain("inline button web app url invalid");
    expect(logged).toContain(sampleOrder.orderNumber);
    expect(logged).not.toContain("SECRET_TOKEN");
    warn.mockRestore();
  });

  it("one unreachable admin does not block the others and the reason is logged", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const chatNotFound = { ok: false, status: 403, json: async () => ({ description: "Forbidden: bot was blocked by the user" }) };
    const mockFetch = vi.fn().mockImplementation(async (_url: string, init: { body: string }) => (JSON.parse(init.body).chat_id === "1" ? chatNotFound : { ok: true }));
    const result = await notifyAdminsNewOrder(sampleOrder, "tok", "1, 2", "https://s.example", mockFetch as any);
    expect(result).toEqual({ sentCount: 1, failedCount: 1 });
    expect(warn.mock.calls.flat().join(" ")).toContain("bot was blocked by the user");
    warn.mockRestore();
  });
});
