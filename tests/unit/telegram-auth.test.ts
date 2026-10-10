import { describe, it, expect } from "vitest";
import {
  parseInitData,
  generateInitDataHash,
  verifyTelegramWebAppData,
  isTelegramAdmin,
  type TelegramUser,
} from "@/lib/telegram-auth";

describe("telegram-auth", () => {
  const TEST_BOT_TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz";
  const TEST_USER: TelegramUser = {
    id: 98765432,
    first_name: "مدیر",
    last_name: "تست",
    username: "test_admin",
  };

  it("should parse initData query strings correctly", () => {
    const raw = "query_id=AAHd&user=%7B%22id%22%3A123%7D&auth_date=1700000000&hash=abc123";
    const parsed = parseInitData(raw);
    expect(parsed.query_id).toBe("AAHd");
    expect(parsed.user).toBe('{"id":123}');
    expect(parsed.auth_date).toBe("1700000000");
    expect(parsed.hash).toBe("abc123");
  });

  it("should correctly compute HMAC-SHA256 signature and verify valid initData", () => {
    const authDate = Math.floor(Date.now() / 1000).toString();
    const data: Record<string, string> = {
      query_id: "AAHd-test",
      user: JSON.stringify(TEST_USER),
      auth_date: authDate,
    };
    const hash = generateInitDataHash(data, TEST_BOT_TOKEN);
    const validInitData = new URLSearchParams({ ...data, hash }).toString();

    const result = verifyTelegramWebAppData(validInitData, TEST_BOT_TOKEN, {
      adminIds: [TEST_USER.id],
    });

    expect(result.authenticated).toBe(true);
    expect(result.user?.id).toBe(TEST_USER.id);
    expect(result.user?.username).toBe("test_admin");
    expect(result.error).toBeUndefined();
  });

  it("should reject tampered or modified initData", () => {
    const authDate = Math.floor(Date.now() / 1000).toString();
    const data: Record<string, string> = {
      query_id: "AAHd-test",
      user: JSON.stringify(TEST_USER),
      auth_date: authDate,
    };
    const hash = generateInitDataHash(data, TEST_BOT_TOKEN);
    // Tamper with user ID
    const tamperedUser = { ...TEST_USER, id: 111111 };
    const tamperedInitData = new URLSearchParams({
      ...data,
      user: JSON.stringify(tamperedUser),
      hash,
    }).toString();

    const result = verifyTelegramWebAppData(tamperedInitData, TEST_BOT_TOKEN);
    expect(result.authenticated).toBe(false);
    expect(result.error).toBe("INVALID_HASH");
  });

  it("should reject expired auth_date", () => {
    // 2 days ago
    const pastDate = Math.floor(Date.now() / 1000) - 172800;
    const data: Record<string, string> = {
      query_id: "AAHd-test",
      user: JSON.stringify(TEST_USER),
      auth_date: pastDate.toString(),
    };
    const hash = generateInitDataHash(data, TEST_BOT_TOKEN);
    const expiredInitData = new URLSearchParams({ ...data, hash }).toString();

    const result = verifyTelegramWebAppData(expiredInitData, TEST_BOT_TOKEN, {
      maxAgeSeconds: 86400,
    });
    expect(result.authenticated).toBe(false);
    expect(result.error).toBe("AUTH_DATE_EXPIRED");
  });

  it("should enforce admin whitelist", () => {
    const authDate = Math.floor(Date.now() / 1000).toString();
    const data: Record<string, string> = {
      user: JSON.stringify(TEST_USER),
      auth_date: authDate,
    };
    const hash = generateInitDataHash(data, TEST_BOT_TOKEN);
    const initData = new URLSearchParams({ ...data, hash }).toString();

    // Whitelist does NOT contain TEST_USER.id
    const nonAdminResult = verifyTelegramWebAppData(initData, TEST_BOT_TOKEN, {
      adminIds: [555555, 666666],
    });
    expect(nonAdminResult.authenticated).toBe(false);
    expect(nonAdminResult.error).toBe("NOT_AN_ADMIN");

    // Whitelist DOES contain TEST_USER.id
    const adminResult = verifyTelegramWebAppData(initData, TEST_BOT_TOKEN, {
      adminIds: [555555, TEST_USER.id],
    });
    expect(adminResult.authenticated).toBe(true);
  });

  it("should check isTelegramAdmin correctly with comma separated strings and numbers", () => {
    expect(isTelegramAdmin(98765432, "111,98765432,222")).toBe(true);
    expect(isTelegramAdmin("98765432", "111, 98765432 , 222")).toBe(true);
    expect(isTelegramAdmin(99999999, "111,98765432,222")).toBe(false);
    expect(isTelegramAdmin(12345, "")).toBe(false);
  });
});

