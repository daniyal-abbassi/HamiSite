import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  it("sets a session cookie and creates a Session row on success", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");

    const sessionCount = await prisma.session.count({ where: { userId: seed.retail.id } });
    expect(sessionCount).toBe(1);
  });

  it("returns 401 and sets no cookie on wrong password", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: "wrong-password" }));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("POST /api/auth/register", () => {
  it("creates the user, a Session row, and sets the cookie", async () => {
    const res = await register(
      jsonRequest({ username: "new.customer", password: "Password@123", phoneNumber: "+989120000199" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);

    const user = await prisma.user.findUniqueOrThrow({ where: { username: "new.customer" } });
    const sessionCount = await prisma.session.count({ where: { userId: user.id } });
    expect(sessionCount).toBe(1);
  });

  it("returns 409 for a duplicate username without creating a session", async () => {
    const res = await register(
      jsonRequest({ username: seed.retail.username, password: "Password@123", phoneNumber: "+989120000198" }),
    );
    expect(res.status).toBe(409);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("POST /api/auth/logout", () => {
  it("deletes the session row and clears the cookie", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await logout(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/session_token=;/);

    const sessionCount = await prisma.session.count({ where: { userId: seed.retail.id } });
    expect(sessionCount).toBe(0);
  });

  it("returns 401 without a session cookie", async () => {
    const res = await logout(new Request("http://localhost/api/auth/logout", { method: "POST" }));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the sanitized current user", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.admin.username, password: seed.admin.password }));
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.username).toBe(seed.admin.username);
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("returns 401 without a session", async () => {
    const res = await me(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
  });
});
