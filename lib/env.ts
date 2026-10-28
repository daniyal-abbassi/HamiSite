/**
 * Environment Variable Validation & Configuration Contract
 * 
 * Centralizes runtime environment validation to fail fast on missing required
 * configuration and prevents sensitive secrets from leaking in logs or HTTP responses.
 */

export interface EnvValidationResult {
  valid: boolean;
  isProduction: boolean;
  missing: string[];
  warnings: string[];
  errors: string[];
  values: {
    NODE_ENV: string;
    DATABASE_URL: string;
    APP_BASE_URL: string;
    HOSTNAME: string;
    PORT: number;
    NEXTAUTH_SECRET?: string;
    NEXTAUTH_URL?: string;
    SMS_IR_API_KEY?: string;
    SMS_IR_TEMPLATE_ID?: string;
    SMS_IR_CODE_PARAMETER?: string;
    OTP_HASH_SECRET?: string;
    OTP_SOURCE_HASH_SECRET?: string;
    OTP_TRUSTED_PROXY_HEADER?: string;
    OTP_SOURCE_REQUEST_LIMIT?: number;
    OTP_SOURCE_WINDOW_SECONDS?: number;
    ZARINPAL_MERCHANT_ID?: string;
    ZARINPAL_SANDBOX: boolean;
  };
}

/**
 * Mask sensitive credentials or secrets so they can never be leaked in error messages or logs.
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return "[NOT_SET]";
  if (secret.startsWith("postgres://") || secret.startsWith("postgresql://")) {
    try {
      const url = new URL(secret);
      const user = url.username ? url.username : "***";
      const host = url.host || "localhost:5432";
      const pathname = url.pathname || "";
      return `${url.protocol}//${user}:***@${host}${pathname}`;
    } catch {
      return "postgresql://***:***@masked-host";
    }
  }
  if (secret.length <= 6) return "***";
  const start = secret.slice(0, 3);
  const end = secret.slice(-3);
  return `${start}***${end}`;
}

/**
 * Validate process environment against required and recommended production configurations.
 */
export function validateEnvironment(
  env: Record<string, string | undefined> = process.env,
  options: { isProduction?: boolean } = {}
): EnvValidationResult {
  const nodeEnv = env.NODE_ENV || "development";
  const isProd = options.isProduction !== undefined ? options.isProduction : nodeEnv === "production";

  const missing: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. DATABASE_URL
  const databaseUrl = env.DATABASE_URL?.trim() || "";
  if (!databaseUrl) {
    missing.push("DATABASE_URL");
    errors.push("DATABASE_URL is required for PostgreSQL persistence.");
  } else if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    errors.push("DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://");
  }

  // 2. APP_BASE_URL
  const appBaseUrl = env.APP_BASE_URL?.trim() || (isProd ? "" : "http://localhost:3000");
  if (!appBaseUrl) {
    missing.push("APP_BASE_URL");
    errors.push("APP_BASE_URL is required in production for canonical links and payment callbacks.");
  } else {
    try {
      const parsedUrl = new URL(appBaseUrl);
      if (isProd && parsedUrl.protocol !== "https:") {
        warnings.push("APP_BASE_URL in production should use https:// protocol.");
      }
      if (isProd && ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname)) {
        warnings.push("APP_BASE_URL points at localhost; robots.txt, sitemap and canonical links will publish local URLs.");
      }
    } catch {
      errors.push("APP_BASE_URL must be a valid absolute URL (e.g. https://hamihamrah.com).");
    }
  }

  // 3. NEXTAUTH_SECRET (Recommended / Mandatory in production)
  const nextAuthSecret = env.NEXTAUTH_SECRET?.trim();
  if (isProd && !nextAuthSecret) {
    warnings.push("NEXTAUTH_SECRET is not set. Generating random sessions in-memory may cause session invalidation on restart.");
  } else if (nextAuthSecret && nextAuthSecret.length < 16) {
    warnings.push("NEXTAUTH_SECRET should be at least 16 characters long for cryptographic security.");
  }

  // 4. Host & Port
  const hostname = env.HOSTNAME?.trim() || "127.0.0.1";
  const port = parseInt(env.PORT || "3000", 10) || 3000;

  // 5. Payment Gateway
  const zarinpalMerchantId = env.ZARINPAL_MERCHANT_ID?.trim();
  const zarinpalSandbox = env.ZARINPAL_SANDBOX === "true";
  if (isProd && zarinpalSandbox) {
    warnings.push("ZARINPAL_SANDBOX is enabled in production. Real payment transactions will not be processed.");
  }

  // SMS OTP configuration is optional at process startup so storefront pages
  // remain available during provider outages; OTP request handlers fail closed
  // when the values required for delivery or digesting are absent.
  const smsIrApiKey = env.SMS_IR_API_KEY?.trim();
  const smsIrTemplateId = env.SMS_IR_TEMPLATE_ID?.trim();
  const smsIrCodeParameter = env.SMS_IR_CODE_PARAMETER?.trim() || "Code";
  const otpHashSecret = env.OTP_HASH_SECRET?.trim();
  const otpSourceHashSecret = env.OTP_SOURCE_HASH_SECRET?.trim();
  const otpTrustedProxyHeader = env.OTP_TRUSTED_PROXY_HEADER?.trim();
  const otpSourceRequestLimit = env.OTP_SOURCE_REQUEST_LIMIT?.trim();
  const otpSourceWindowSeconds = env.OTP_SOURCE_WINDOW_SECONDS?.trim();
  if (otpHashSecret && Buffer.byteLength(otpHashSecret, "utf8") < 32) {
    errors.push("OTP_HASH_SECRET must be at least 32 bytes.");
  }
  if (otpSourceHashSecret && Buffer.byteLength(otpSourceHashSecret, "utf8") < 32) {
    errors.push("OTP_SOURCE_HASH_SECRET must be at least 32 bytes.");
  }
  if (otpSourceRequestLimit && (!Number.isSafeInteger(Number(otpSourceRequestLimit)) || Number(otpSourceRequestLimit) < 1)) {
    errors.push("OTP_SOURCE_REQUEST_LIMIT must be a positive integer.");
  }
  if (otpSourceWindowSeconds && (!Number.isSafeInteger(Number(otpSourceWindowSeconds)) || Number(otpSourceWindowSeconds) < 1)) {
    errors.push("OTP_SOURCE_WINDOW_SECONDS must be a positive integer.");
  }
  if (Boolean(smsIrApiKey) !== Boolean(smsIrTemplateId)) {
    warnings.push("SMS_IR_API_KEY and SMS_IR_TEMPLATE_ID must be configured together for OTP delivery.");
  }
  if (isProd && (!smsIrApiKey || !smsIrTemplateId || !otpHashSecret || !otpSourceHashSecret)) {
    warnings.push("SMS OTP login is unavailable until SMS.ir and OTP secrets are configured.");
  }

  const valid = missing.length === 0 && errors.length === 0;

  return {
    valid,
    isProduction: isProd,
    missing,
    warnings,
    errors,
    values: {
      NODE_ENV: nodeEnv,
      DATABASE_URL: databaseUrl,
      APP_BASE_URL: appBaseUrl,
      HOSTNAME: hostname,
      PORT: port,
      NEXTAUTH_SECRET: nextAuthSecret,
      NEXTAUTH_URL: env.NEXTAUTH_URL || appBaseUrl,
      SMS_IR_API_KEY: smsIrApiKey,
      SMS_IR_TEMPLATE_ID: smsIrTemplateId,
      SMS_IR_CODE_PARAMETER: smsIrCodeParameter,
      OTP_HASH_SECRET: otpHashSecret,
      OTP_SOURCE_HASH_SECRET: otpSourceHashSecret,
      OTP_TRUSTED_PROXY_HEADER: otpTrustedProxyHeader,
      OTP_SOURCE_REQUEST_LIMIT: otpSourceRequestLimit ? Number(otpSourceRequestLimit) : undefined,
      OTP_SOURCE_WINDOW_SECONDS: otpSourceWindowSeconds ? Number(otpSourceWindowSeconds) : undefined,
      ZARINPAL_MERCHANT_ID: zarinpalMerchantId,
      ZARINPAL_SANDBOX: zarinpalSandbox,
    },
  };
}

/**
 * Asserts valid environment or throws an informative error without leaking secrets.
 */
export function assertValidEnvironment(): EnvValidationResult {
  const result = validateEnvironment();
  if (!result.valid) {
    const errorDetails = result.errors.join("; ");
    throw new Error(`[Environment Error] Invalid host environment: ${errorDetails}`);
  }
  return result;
}
