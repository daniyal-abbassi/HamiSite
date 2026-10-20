import "server-only";
import { prisma } from "@/lib/prisma";

/** Delete at most `batchSize` expired rows per table. Schedule this from a
 * trusted maintenance job; it is deliberately not exposed as a public route. */
export async function cleanupExpiredOtpArtifacts(batchSize = 500, now = new Date()) {
  const limit = Number.isSafeInteger(batchSize) ? Math.min(2_000, Math.max(1, batchSize)) : 500;
  return prisma.$transaction(async (tx) => {
    const challenges = await tx.$executeRaw`DELETE FROM "otp_codes" WHERE "id" IN (SELECT "id" FROM "otp_codes" WHERE "expiresAt" <= ${now} ORDER BY "expiresAt" LIMIT ${limit})`;
    const buckets = await tx.$executeRaw`DELETE FROM "otp_request_buckets" WHERE "key" IN (SELECT "key" FROM "otp_request_buckets" WHERE "expiresAt" <= ${now} ORDER BY "expiresAt" LIMIT ${limit})`;
    const proofs = await tx.$executeRaw`DELETE FROM "registration_proofs" WHERE "id" IN (SELECT "id" FROM "registration_proofs" WHERE "expiresAt" <= ${now} OR "consumedAt" IS NOT NULL ORDER BY "expiresAt" LIMIT ${limit})`;
    return { challenges, buckets, proofs };
  });
}
