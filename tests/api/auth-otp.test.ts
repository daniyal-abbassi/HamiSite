import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as requestOtp } from "@/app/api/auth/otp/request/route";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { POST as register } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import { seedMinimal, type SeedResult } from "../helpers/seed";

vi.mock("@/lib/sms-ir", () => ({
  sendSmsIrVerification: vi.fn(async (_phone: string, code: string) => {
    if (providerFails) throw new Error("provider payload and credentials must stay private");
    sendCount += 1;
    deliveredCode = code;
    return { messageId: "1001" };
  }),
}));

let seed: SeedResult;
let deliveredCode = "";
let sendCount = 0;
let providerFails = false;

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

function request(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost", "x-real-ip": "127.0.0.1" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  seed = await seedMinimal();
  deliveredCode = "";
  sendCount = 0;
  providerFails = false;
  vi.stubEnv("OTP_HASH_SECRET", "hash-secret-for-tests-at-least-32-bytes");
  vi.stubEnv("OTP_SOURCE_HASH_SECRET", "source-secret-for-tests-at-least-32-bytes");
  vi.stubEnv("OTP_TRUSTED_PROXY_HEADER", "x-real-ip");
  vi.stubEnv("OTP_SOURCE_REQUEST_LIMIT", "20");
  vi.stubEnv("OTP_SOURCE_WINDOW_SECONDS", "600");
});

describe("SMS OTP customer authentication", () => {
  it("authenticates the original customer account and consumes the challenge once", async () => {
    const requested = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "09120000102", purpose: "LOGIN" }));
    expect(requested.status).toBe(200);
    const { data } = await requested.json();
    expect(data.maskedPhone).not.toContain("0000102");
    expect(data.expiresInSeconds).toBe(300);
    expect(deliveredCode).toMatch(/^\d{6}$/);

    const verified = await verifyOtp(request("/api/auth/otp/verify", { challengeId: data.challengeId, code: deliveredCode }));
    expect(verified.status).toBe(200);
    expect(verified.headers.get("set-cookie")).toContain("session_token=");
    expect((await verified.json()).data.id).toBe(seed.retail.id);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } })).phoneVerified).toBe(true);

    const replay = await verifyOtp(request("/api/auth/otp/verify", { challengeId: data.challengeId, code: deliveredCode }));
    expect(replay.status).toBe(400);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(1);
  });

  it("returns the same request confirmation for unknown and registered numbers", async () => {
    const known = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989120000102", purpose: "LOGIN" }));
    const unknown = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989121234567", purpose: "LOGIN" }));
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(Object.keys((await unknown.json()).data).sort()).toEqual(["challengeId", "expiresInSeconds", "maskedPhone", "resendAfterSeconds"]);
  });

  it("locks the challenge at five incorrect attempts", async () => {
    const requested = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989120000102", purpose: "LOGIN" }));
    const { data } = await requested.json();
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await verifyOtp(request("/api/auth/otp/verify", { challengeId: data.challengeId, code: "000000" }));
      expect(response.status).toBe(attempt === 5 ? 429 : 400);
    }
    expect((await prisma.otpCode.findUniqueOrThrow({ where: { publicId: data.challengeId } })).status).toBe("LOCKED");
  });

  it("rejects an expired challenge before consuming it or creating a session", async () => {
    const requested = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989120000102", purpose: "LOGIN" }));
    const { data } = await requested.json();
    await prisma.otpCode.update({ where: { publicId: data.challengeId }, data: { expiresAt: new Date(Date.now() - 1) } });
    const response = await verifyOtp(request("/api/auth/otp/verify", { challengeId: data.challengeId, code: deliveredCode }));
    expect(response.status).toBe(400);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(0);
    expect((await prisma.otpCode.findUniqueOrThrow({ where: { publicId: data.challengeId } })).status).toBe("SENT");
  });

  it("creates a registration proof first, then creates exactly one phone-bound account", async () => {
    const requested = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989120000199", purpose: "REGISTER" }));
    const { data } = await requested.json();
    const proof = await verifyOtp(request("/api/auth/otp/verify", { challengeId: data.challengeId, code: deliveredCode }));
    expect(proof.status).toBe(200);
    expect(proof.headers.get("set-cookie")).toContain("registration_proof=");
    expect(proof.headers.get("set-cookie")).not.toContain("session_token=");
    expect(await prisma.user.findUnique({ where: { username: "otp.new" } })).toBeNull();

    const registration = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost", cookie: proof.headers.get("set-cookie")!.split(";")[0] },
      body: JSON.stringify({ username: "otp.new", role: "RETAIL" }),
    });
    const created = await register(registration);
    expect(created.status).toBe(200);
    const account = await prisma.user.findUniqueOrThrow({ where: { username: "otp.new" } });
    expect(account.phoneNumber).toBe("+989120000199");
    expect(account.phoneVerified).toBe(true);
    expect(await prisma.session.count({ where: { userId: account.id } })).toBe(1);
  });

  it("does not grant staff access through a customer OTP challenge", async () => {
    const requested = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989120000101", purpose: "LOGIN" }));
    const { data } = await requested.json();
    const response = await verifyOtp(request("/api/auth/otp/verify", { challengeId: data.challengeId, code: deliveredCode }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("OTP_INVALID");
    expect(await prisma.session.count({ where: { userId: seed.admin.id } })).toBe(0);
  });

  it("enforces the resend cooldown before another provider call", async () => {
    const payload = { phoneNumber: "+989120000102", purpose: "LOGIN" };
    await requestOtp(request("/api/auth/otp/request", payload));
    const second = await requestOtp(request("/api/auth/otp/request", payload));
    expect(second.status).toBe(429);
    expect(second.headers.get("retry-after")).toBeTruthy();
    expect((await second.json()).error.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(sendCount).toBe(1);
  });

  it("caps each phone at five sends per rolling hour", async () => {
    const phoneNumber = "+989120000102";
    for (let index = 0; index < 5; index += 1) {
      const response = await requestOtp(request("/api/auth/otp/request", { phoneNumber, purpose: "LOGIN" }));
      expect(response.status).toBe(200);
      await prisma.otpCode.updateMany({ where: { phoneNumber }, data: { status: "FAILED" } });
    }
    const sixth = await requestOtp(request("/api/auth/otp/request", { phoneNumber, purpose: "LOGIN" }));
    expect(sixth.status).toBe(429);
    expect((await sixth.json()).error.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(sendCount).toBe(5);
  });

  it("caps one trusted source at twenty requests per ten-minute window", async () => {
    for (let index = 0; index < 20; index += 1) {
      const phoneNumber = `+98912${String(index).padStart(7, "0")}`;
      expect((await requestOtp(request("/api/auth/otp/request", { phoneNumber, purpose: "LOGIN" }))).status).toBe(200);
    }
    const blocked = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989121234567", purpose: "LOGIN" }));
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(sendCount).toBe(20);
  });

  it("hides provider failures and leaves no usable challenge", async () => {
    providerFails = true;
    const response = await requestOtp(request("/api/auth/otp/request", { phoneNumber: "+989120000102", purpose: "LOGIN" }));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("OTP_DELIVERY_FAILED");
    expect(JSON.stringify(body)).not.toContain("provider payload");
    expect(JSON.stringify(body)).not.toContain("credentials");
    expect(await prisma.otpCode.count({ where: { phoneNumber: "+989120000102", status: "FAILED" } })).toBe(1);
    expect(sendCount).toBe(0);
  });
});
