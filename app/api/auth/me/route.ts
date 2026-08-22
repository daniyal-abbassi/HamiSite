import { sanitizeUser, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import type { MeResponse } from "@/types/auth";

export const GET = withAuth(async (_request, { user }) => {
  return ok<MeResponse>(sanitizeUser(user));
});
