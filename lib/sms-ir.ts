import "server-only";

const SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";
const PROVIDER_TIMEOUT_MS = 8_000;

export class SmsIrDeliveryError extends Error {
  constructor() {
    super("SMS provider request failed");
    this.name = "SmsIrDeliveryError";
  }
}

export type SmsIrDeliveryReceipt = {
  messageId: string | null;
};

type SmsIrResponse = {
  status?: unknown;
  data?: { messageId?: unknown } | null;
};

function requiredConfig() {
  const apiKey = process.env.SMS_IR_API_KEY?.trim();
  const templateId = Number(process.env.SMS_IR_TEMPLATE_ID);
  const parameterName = process.env.SMS_IR_CODE_PARAMETER?.trim() || "Code";

  if (!apiKey || !Number.isSafeInteger(templateId) || templateId <= 0 || !parameterName) {
    throw new SmsIrDeliveryError();
  }

  return { apiKey, templateId, parameterName };
}

function toProviderMobile(canonicalPhone: string): string {
  if (!/^\+989\d{9}$/.test(canonicalPhone)) throw new SmsIrDeliveryError();
  return canonicalPhone.slice(3);
}

/** Sends one verification template request. The fixed URL, disabled redirects,
 * short timeout, and omitted provider body keep credentials out of redirects,
 * logs, and public errors. Delivery acceptance is not handset delivery. */
export async function sendSmsIrVerification(
  canonicalPhone: string,
  code: string,
): Promise<SmsIrDeliveryReceipt> {
  if (!/^\d{6}$/.test(code)) throw new SmsIrDeliveryError();
  const { apiKey, templateId, parameterName } = requiredConfig();

  let response: Response;
  try {
    response = await fetch(SMS_IR_VERIFY_URL, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        mobile: toProviderMobile(canonicalPhone),
        templateId,
        parameters: [{ name: parameterName, value: code }],
      }),
    });
  } catch {
    // The provider may have accepted the request before a network timeout.
    // Never retry here: duplicate messages can incur cost and invalidate order.
    throw new SmsIrDeliveryError();
  }

  if (!response.ok) throw new SmsIrDeliveryError();

  let payload: SmsIrResponse;
  try {
    payload = (await response.json()) as SmsIrResponse;
  } catch {
    throw new SmsIrDeliveryError();
  }

  if (payload.status !== 1) throw new SmsIrDeliveryError();

  const rawMessageId = payload.data?.messageId;
  const messageId =
    typeof rawMessageId === "number" && Number.isSafeInteger(rawMessageId)
      ? String(rawMessageId)
      : typeof rawMessageId === "string" && /^\d+$/.test(rawMessageId)
        ? rawMessageId
        : null;

  return { messageId };
}
