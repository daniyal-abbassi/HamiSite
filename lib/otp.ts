import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export type CustomerOtpPurpose = "LOGIN" | "REGISTER";

export class OtpConfigurationError extends Error {
  constructor() {
    super("OTP service is not configured");
    this.name = "OtpConfigurationError";
  }
}

function secretBytes(name: "OTP_HASH_SECRET" | "OTP_SOURCE_HASH_SECRET"): Buffer {
  const value = process.env[name];
  if (!value || Buffer.byteLength(value, "utf8") < 32) throw new OtpConfigurationError();
  return Buffer.from(value, "utf8");
}

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function digestOtpCode(input: {
  code: string;
  challengeId: string;
  phoneNumber: string;
  purpose: CustomerOtpPurpose;
}): string {
  const digest = createHmac("sha256", secretBytes("OTP_HASH_SECRET"));
  digest.update("hami-customer-otp-v1\0");
  digest.update(input.challengeId);
  digest.update("\0");
  digest.update(input.phoneNumber);
  digest.update("\0");
  digest.update(input.purpose);
  digest.update("\0");
  digest.update(input.code);
  return digest.digest("hex");
}

export function verifyOtpCode(input: {
  code: string;
  challengeId: string;
  phoneNumber: string;
  purpose: CustomerOtpPurpose;
  expectedDigest: string;
}): boolean {
  if (!/^\d{6}$/.test(input.code) || !/^[a-f0-9]{64}$/i.test(input.expectedDigest)) return false;
  const actual = Buffer.from(
    digestOtpCode({
      code: input.code,
      challengeId: input.challengeId,
      phoneNumber: input.phoneNumber,
      purpose: input.purpose,
    }),
    "hex",
  );
  const expected = Buffer.from(input.expectedDigest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashOtpSourceIdentifier(value: string): string {
  return createHmac("sha256", secretBytes("OTP_SOURCE_HASH_SECRET"))
    .update("hami-otp-source-v1\0")
    .update(value)
    .digest("hex");
}
