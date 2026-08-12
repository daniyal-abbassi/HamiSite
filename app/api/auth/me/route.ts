import { sanitizeUser, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";

export const GET = withAuth(async (_request, { user }) => {
  return ok(sanitizeUser(user));
});
