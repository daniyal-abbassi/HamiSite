import { z } from "zod";
import { normalizeIranianMobile } from "@/lib/phone";
import { toLatinDigits } from "@/lib/validators";
import { isValidIranianMobile } from "@/lib/validators";

const canonicalMobile = z
  .string()
  .trim()
  .min(5)
  .max(24)
  .transform(normalizeIranianMobile)
  .refine(isValidIranianMobile, "Enter a valid Iranian mobile number");

export const otpRequestSchema = z
  .object({
    phoneNumber: canonicalMobile,
    purpose: z.enum(["LOGIN", "REGISTER"]),
  })
  .strict();

export const otpVerifySchema = z
  .object({
    challengeId: z.string().uuid(),
    code: z.string().trim().transform(toLatinDigits).pipe(z.string().regex(/^\d{6}$/)),
  })
  .strict();

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
