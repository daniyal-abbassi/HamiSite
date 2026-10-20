import { isIP } from "node:net";
import { OtpChallengeStatus, OtpPurpose, Prisma } from "@prisma/client";
import { hashOtpSourceIdentifier } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const PHONE_LIMIT = 5;
const PHONE_WINDOW_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const DEFAULT_SOURCE_LIMIT = 20;
const DEFAULT_SOURCE_WINDOW_SECONDS = 10 * 60;

export class OtpRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("OTP request limit reached");
    this.name = "OtpRateLimitError";
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function trustedSourceIp(request: Request): string {
  const headerName = process.env.OTP_TRUSTED_PROXY_HEADER?.trim().toLowerCase();
  if (!headerName || !/^[a-z0-9-]+$/.test(headerName)) return "unknown-source";

  const headerValue = request.headers.get(headerName)?.trim();
  // Accept only one literal address from a configured proxy-overwritten header;
  // never guess which element of a caller-controlled forwarding chain is real.
  if (!headerValue || headerValue.includes(",") || isIP(headerValue) === 0) return "unknown-source";
  return headerValue;
}

function sourceBucketKey(sourceHash: string, now: Date, windowSeconds: number): string {
  const slot = Math.floor(now.getTime() / (windowSeconds * 1000));
  return `source:${sourceHash}:${slot}`;
}

async function touchBucket(tx: Prisma.TransactionClient, key: string, now: Date, expiresAt: Date) {
  // The upsert obtains a row-level lock for this key in PostgreSQL. Requests
  // sharing a bucket serialize before reading/incrementing the counter.
  await tx.$executeRaw`
    INSERT INTO "otp_request_buckets" ("key", "count", "windowStartedAt", "expiresAt", "updatedAt")
    VALUES (${key}, 0, ${now}, ${expiresAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"
  `;
}

async function incrementSourceBucket(
  tx: Prisma.TransactionClient,
  key: string,
  now: Date,
  expiresAt: Date,
): Promise<number> {
  const rows = await tx.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "otp_request_buckets" ("key", "count", "windowStartedAt", "expiresAt", "updatedAt")
    VALUES (${key}, 1, ${now}, ${expiresAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = "otp_request_buckets"."count" + 1,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "count"
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function reserveOtpChallenge(input: {
  request: Request;
  publicId: string;
  phoneNumber: string;
  purpose: "LOGIN" | "REGISTER";
  codeDigest: string;
  userId: number | null;
}): Promise<{ id: number; publicId: string; expiresAt: Date; requesterHash: string }> {
  const now = new Date();
  const sourceWindowSeconds = positiveInteger(
    process.env.OTP_SOURCE_WINDOW_SECONDS,
    DEFAULT_SOURCE_WINDOW_SECONDS,
  );
  const sourceLimit = positiveInteger(process.env.OTP_SOURCE_REQUEST_LIMIT, DEFAULT_SOURCE_LIMIT);
  const requesterHash = hashOtpSourceIdentifier(trustedSourceIp(input.request));
  const sourceKey = sourceBucketKey(requesterHash, now, sourceWindowSeconds);
  const sourceWindowMs = sourceWindowSeconds * 1000;
  const sourceWindowEnd = new Date((Math.floor(now.getTime() / sourceWindowMs) + 1) * sourceWindowMs);
  const lockKey = `phone:${hashOtpSourceIdentifier(input.phoneNumber)}`;

  try {
    return await prisma.$transaction(async (tx) => {
      await touchBucket(tx, lockKey, now, new Date(now.getTime() + PHONE_WINDOW_MS));
      const recentPhoneRequests = await tx.otpCode.findMany({
        where: { phoneNumber: input.phoneNumber, createdAt: { gte: new Date(now.getTime() - PHONE_WINDOW_MS) } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      });

      const sourceCount = await incrementSourceBucket(tx, sourceKey, now, sourceWindowEnd);
      if (sourceCount > sourceLimit) {
        throw new OtpRateLimitError(
          Math.max(1, Math.ceil((sourceWindowEnd.getTime() - now.getTime()) / 1000)),
        );
      }

      if (recentPhoneRequests.length >= PHONE_LIMIT) {
        const earliest = recentPhoneRequests[0].createdAt;
        throw new OtpRateLimitError(
          Math.max(1, Math.ceil((earliest.getTime() + PHONE_WINDOW_MS - now.getTime()) / 1000)),
        );
      }

      const latestActiveRequest = [...recentPhoneRequests]
        .reverse()
        .find((challenge) =>
          challenge.status === OtpChallengeStatus.PENDING || challenge.status === OtpChallengeStatus.SENT,
        );
      if (latestActiveRequest) {
        const retryAfter = latestActiveRequest.createdAt.getTime() + RESEND_COOLDOWN_MS - now.getTime();
        if (retryAfter > 0) throw new OtpRateLimitError(Math.ceil(retryAfter / 1000));
      }

      await tx.otpCode.updateMany({
        where: {
          phoneNumber: input.phoneNumber,
          purpose: input.purpose as OtpPurpose,
          status: { in: [OtpChallengeStatus.PENDING, OtpChallengeStatus.SENT] },
        },
        data: { status: OtpChallengeStatus.SUPERSEDED },
      });

      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
      const challenge = await tx.otpCode.create({
        data: {
          publicId: input.publicId,
          phoneNumber: input.phoneNumber,
          userId: input.userId,
          codeDigest: input.codeDigest,
          purpose: input.purpose as OtpPurpose,
          status: OtpChallengeStatus.PENDING,
          attemptCount: 0,
          requesterHash,
          expiresAt,
          createdAt: now,
        },
        select: { id: true, publicId: true, expiresAt: true },
      });
      return { ...challenge, requesterHash };
    });
  } catch (error) {
    if (error instanceof OtpRateLimitError) throw error;
    throw error;
  }
}

export async function markOtpChallengeSent(id: number, messageId: string | null) {
  return prisma.otpCode.updateMany({
    where: { id, status: OtpChallengeStatus.PENDING },
    data: { status: OtpChallengeStatus.SENT, providerMessageId: messageId },
  });
}

export async function markOtpChallengeFailed(id: number) {
  return prisma.otpCode.updateMany({
    where: { id, status: OtpChallengeStatus.PENDING },
    data: { status: OtpChallengeStatus.FAILED },
  });
}
