import crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface TelegramAuthResult {
  authenticated: boolean;
  user?: TelegramUser;
  error?: string;
}

export interface VerifyTelegramOptions {
  /** Maximum age of auth_date in seconds (default 86400, 0 to disable) */
  maxAgeSeconds?: number;
  /** List of Telegram user IDs permitted as admins */
  adminIds?: (string | number)[];
}

/**
 * Parse an initData query string into a key-value record.
 */
export function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

/**
 * Compute the expected HMAC-SHA256 signature for Telegram WebApp initData.
 * Algorithm:
 * 1. Filter out `hash`
 * 2. Sort key-value pairs alphabetically
 * 3. Join with newline: `key=value\n...`
 * 4. secret_key = HMAC_SHA256("WebAppData", botToken)
 * 5. hash = HMAC_SHA256(secret_key, data_check_string).hex()
 */
export function generateInitDataHash(data: Record<string, string>, botToken: string): string {
  const filteredKeys = Object.keys(data)
    .filter((k) => k !== "hash")
    .sort();

  const dataCheckString = filteredKeys.map((k) => `${k}=${data[k]}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  return crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}

/**
 * Check if a given Telegram user ID is present in the admin whitelist.
 */
export function isTelegramAdmin(
  userId: number | string,
  adminIdsEnv: string | (string | number)[] = process.env.TELEGRAM_ADMIN_IDS || ""
): boolean {
  if (!userId) return false;
  const targetIdStr = String(userId).trim();

  let allowedIds: string[] = [];
  if (Array.isArray(adminIdsEnv)) {
    allowedIds = adminIdsEnv.map((id) => String(id).trim());
  } else if (typeof adminIdsEnv === "string") {
    allowedIds = adminIdsEnv
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return allowedIds.includes(targetIdStr);
}

/**
 * Verify Telegram WebApp initData cryptographic signature and validate user & permissions.
 */
export function verifyTelegramWebAppData(
  initData: string,
  botToken: string = process.env.TELEGRAM_BOT_TOKEN || "",
  options: VerifyTelegramOptions = {}
): TelegramAuthResult {
  if (!initData || typeof initData !== "string") {
    return { authenticated: false, error: "MISSING_INIT_DATA" };
  }

  if (!botToken) {
    return { authenticated: false, error: "MISSING_BOT_TOKEN" };
  }

  const data = parseInitData(initData);
  const providedHash = data.hash;

  if (!providedHash) {
    return { authenticated: false, error: "MISSING_HASH" };
  }

  // 1. Verify HMAC-SHA256 hash
  const expectedHash = generateInitDataHash(data, botToken);
  if (providedHash !== expectedHash) {
    return { authenticated: false, error: "INVALID_HASH" };
  }

  // 2. Validate auth_date expiry
  const maxAgeSeconds = options.maxAgeSeconds !== undefined ? options.maxAgeSeconds : 86400;
  if (maxAgeSeconds > 0) {
    const authDate = parseInt(data.auth_date, 10);
    if (isNaN(authDate)) {
      return { authenticated: false, error: "INVALID_AUTH_DATE" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - authDate) > maxAgeSeconds) {
      return { authenticated: false, error: "AUTH_DATE_EXPIRED" };
    }
  }

  // 3. Parse user payload
  let user: TelegramUser | undefined;
  if (data.user) {
    try {
      user = JSON.parse(data.user) as TelegramUser;
    } catch {
      return { authenticated: false, error: "INVALID_USER_JSON" };
    }
  }

  if (!user || !user.id) {
    return { authenticated: false, error: "USER_INFO_MISSING" };
  }

  // 4. Validate admin whitelist
  const adminIds = options.adminIds !== undefined ? options.adminIds : process.env.TELEGRAM_ADMIN_IDS;
  if (adminIds && !isTelegramAdmin(user.id, adminIds)) {
    return { authenticated: false, error: "NOT_AN_ADMIN", user };
  }

  return { authenticated: true, user };
}

