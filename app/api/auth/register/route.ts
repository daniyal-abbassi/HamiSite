import { createHash, randomBytes } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { generateSessionToken, hashPassword, hashSessionToken, sanitizeUser, SESSION_TTL_MS, setSessionCookie } from "@/lib/auth";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/schemas/auth";
import type { RegisterResponse } from "@/types/auth";

const PROOF_COOKIE = "registration_proof";
function getCookie(request: Request, name: string) {
  const item = request.headers.get("cookie")?.split(";").map((v) => v.trim()).find((v) => v.startsWith(`${name}=`));
  if (!item) return null;
  try { return decodeURIComponent(item.slice(name.length + 1)); } catch { return null; }
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    assertSameOrigin(request);
    const input = await parseJsonBody(request, registerSchema);
    const token = getCookie(request, PROOF_COOKIE);
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) throw ApiError.coded(401, "REGISTRATION_PROOF_REQUIRED", "Verify your phone first");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const role = input.role ?? Role.RETAIL;
    if (input.agentId) {
      if (role !== Role.WHOLESALE) throw new ApiError(400, "agentId can only be set for WHOLESALE accounts");
      const agent = await prisma.user.findUnique({ where: { id: input.agentId }, select: { id: true, role: true, isActive: true } });
      if (!agent || !agent.isActive || agent.role !== Role.AGENT) throw new ApiError(400, "Invalid agentId — must reference an active AGENT user");
    }
    const passwordHash = await hashPassword(randomBytes(48).toString("base64url"));
    const sessionToken = generateSessionToken();
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "registration_proofs" WHERE "tokenHash" = ${tokenHash} FOR UPDATE`;
        const [{ now }] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT timezone('UTC', clock_timestamp()) AS now`;
        const proof = await tx.registrationProof.findUnique({ where: { tokenHash } });
        if (!proof || proof.consumedAt || proof.expiresAt <= now) throw ApiError.coded(401, "REGISTRATION_PROOF_REQUIRED", "Verify your phone first");
        const existing = await tx.user.findFirst({ where: { OR: [{ phoneNumber: proof.phoneNumber }, { username: input.username }, ...(input.email ? [{ email: input.email }] : [])] }, select: { id: true } });
        if (existing) throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "Account already exists");
        const claimed = await tx.registrationProof.updateMany({ where: { id: proof.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
        if (claimed.count !== 1) throw ApiError.coded(401, "REGISTRATION_PROOF_REQUIRED", "Verify your phone first");
        const created = await tx.user.create({ data: { username: input.username, email: input.email, passwordHash, role, firstName: input.firstName, lastName: input.lastName, phoneNumber: proof.phoneNumber, phoneVerified: true, phoneVerifiedAt: now, city: input.city, shopName: role === Role.WHOLESALE ? input.shopName : undefined, businessLicenseNumber: role === Role.WHOLESALE ? input.businessLicenseNumber : undefined, nationalNumber: input.nationalNumber, agentId: input.agentId, referer: input.referer, creationMethod: "otp" } });
        const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
        await tx.session.create({ data: { userId: created.id, tokenHash: hashSessionToken(sessionToken), userAgent: request.headers.get("user-agent"), expiresAt } });
        return { user: created, expiresAt };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "Account already exists");
      throw error;
    }
    const response = ok<RegisterResponse>(sanitizeUser(user.user), { message: "Account created" });
    setSessionCookie(response, sessionToken, user.expiresAt);
    response.cookies.set(PROOF_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0) });
    return response;
  });
}
