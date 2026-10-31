import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { NextResponse } from "next/server";
import { ApiError } from "@/lib/http";

/**
 * The 10-minute, single-use proof that a registrant controls a mobile number. Every
 * registration path spends it the same way: lock it, check it, claim it, all in the
 * transaction that creates the account.
 */

const PROOF_COOKIE = "registration_proof";

const proofRequired = () => ApiError.coded(401, "REGISTRATION_PROOF_REQUIRED", "Verify your phone first");

function getCookie(request: Request, name: string) {
  const item = request.headers.get("cookie")?.split(";").map((v) => v.trim()).find((v) => v.startsWith(`${name}=`));
  if (!item) return null;
  try { return decodeURIComponent(item.slice(name.length + 1)); } catch { return null; }
}

/** The stored hash of the request's proof cookie. Whether that proof is still good is a database question. */
export function registrationProofHash(request: Request): string {
  const token = getCookie(request, PROOF_COOKIE);
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) throw proofRequired();
  return createHash("sha256").update(token).digest("hex");
}

/** Locks the proof for this transaction and returns it with the database's clock, or refuses. */
export async function lockRegistrationProof(tx: Prisma.TransactionClient, tokenHash: string) {
  await tx.$queryRaw`SELECT id FROM "registration_proofs" WHERE "tokenHash" = ${tokenHash} FOR UPDATE`;
  const [{ now }] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT timezone('UTC', clock_timestamp()) AS now`;
  const proof = await tx.registrationProof.findUnique({ where: { tokenHash } });
  if (!proof || proof.consumedAt || proof.expiresAt <= now) throw proofRequired();
  return { proof, now };
}

/** Spends a locked proof. */
export async function claimRegistrationProof(tx: Prisma.TransactionClient, proofId: number, now: Date) {
  const claimed = await tx.registrationProof.updateMany({ where: { id: proofId, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
  if (claimed.count !== 1) throw proofRequired();
}

export function clearRegistrationProofCookie(response: NextResponse) {
  response.cookies.set(PROOF_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0) });
}
