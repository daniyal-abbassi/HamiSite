export type AdminSessionRecord = {
  expiresAt: Date;
  user: { role: string; isActive: boolean };
};

export type AdminPageAccess = "admin" | "guest" | "forbidden";

/** Keep server page access decisions explicit and independently testable. */
export function classifyAdminSession(
  session: AdminSessionRecord | null,
  now = new Date(),
): AdminPageAccess {
  if (!session || session.expiresAt <= now || !session.user.isActive) return "guest";
  return session.user.role === "ADMIN" ? "admin" : "forbidden";
}
