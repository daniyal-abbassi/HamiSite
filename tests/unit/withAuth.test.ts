import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME, withAuth } from "@/lib/auth";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

function requestWithCookie(token?: string) {
  return new Request("http://localhost/api/test", {
    headers: token ? { cookie: `${SESSION_COOKIE_NAME}=${token}` } : {},
  });
}

describe("withAuth", () => {
  it("returns 401 with no cookie", async () => {
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie());
    expect(res.status).toBe(401);
  });

  it("returns 401 for an unknown or expired token", async () => {
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie("not-a-real-token"));
    expect(res.status).toBe(401);

    const { token } = await createSession(seed.retail.id);
    await prisma.session.updateMany({
      where: { userId: seed.retail.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expiredRes = await handler(requestWithCookie(token));
    expect(expiredRes.status).toBe(401);
  });

  it("returns 403 for a deactivated account", async () => {
    await prisma.user.update({ where: { id: seed.retail.id }, data: { isActive: false } });
    const { token } = await createSession(seed.retail.id);
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(403);
  });

  it("returns 403 when roles don't include the user's role", async () => {
    const { token } = await createSession(seed.retail.id);
    const handler = withAuth(async () => NextResponse.json({ ok: true }), { roles: [Role.ADMIN] });
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(403);
  });

  it("calls the handler with the resolved user on success and bumps expiresAt", async () => {
    const { token, session } = await createSession(seed.admin.id);
    const handler = withAuth(async (_req, { user }) => NextResponse.json({ id: user.id, role: user.role }));
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: seed.admin.id, role: Role.ADMIN });

    const updated = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(updated.expiresAt.getTime()).toBeGreaterThan(session.expiresAt.getTime());
  });

  it("threads real route params through to the handler", async () => {
    const { token } = await createSession(seed.admin.id);
    const handler = withAuth<{ id: string }>(async (_req, { params }) =>
      NextResponse.json({ receivedId: params.id }),
    );
    const res = await handler(requestWithCookie(token), { params: { id: "42" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ receivedId: "42" });
  });

  it("refreshes the session cookie's expiry on the response (sliding expiry)", async () => {
    const { token } = await createSession(seed.admin.id);
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=${token}`);
    expect(setCookie).toContain("Path=/");
  });
});
