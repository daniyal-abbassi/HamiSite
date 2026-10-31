import { createHash } from "node:crypto";
import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me, PATCH as updateMe } from "@/app/api/auth/me/route";
import { POST as changePassword } from "@/app/api/auth/change-password/route";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedMinimal, type SeedResult } from "../helpers/seed";
import { ctx, loginAs } from "../helpers/request";

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

function rawRequest(url: string, body: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

const LOGIN_URL = "http://localhost/api/auth/login";

describe("POST /api/auth/login", () => {
  it("sets a session for staff password login", async () => {
    const res = await login(jsonRequest({ identifier: seed.admin.username, password: seed.admin.password }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(await prisma.session.count({ where: { userId: seed.admin.id } })).toBe(1);
  });

  it("rejects customer passwords even when correct", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("INVALID_CREDENTIALS");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns the same credential failure for unknown users and customer accounts", async () => {
    const unknown = await login(jsonRequest({ identifier: "no.such.user", password: seed.retail.password }));
    const customer = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    expect(unknown.status).toBe(401);
    expect(customer.status).toBe(401);
    expect(await unknown.json()).toEqual(await customer.json());
  });

  it("accepts a staff phone in either Iranian spelling", async () => {
    const res = await login(jsonRequest({ identifier: "09120000101", password: seed.admin.password }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(seed.admin.id);
  });

  it("rejects malformed or incomplete requests", async () => {
    expect((await login(rawRequest(LOGIN_URL, "{ identifier: "))).status).toBe(400);
    const invalid = await login(jsonRequest({ identifier: seed.admin.username }));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.code).toBe("VALIDATION_FAILED");
  });
});

describe("POST /api/auth/register", () => {
  async function proofCookie(phoneNumber: string) {
    const token = "a".repeat(64);
    await prisma.registrationProof.create({ data: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      phoneNumber,
      expiresAt: new Date(Date.now() + 60_000),
    } });
    return `registration_proof=${token}`;
  }

  it("requires a verified phone proof before creating an account", async () => {
    const res = await register(jsonRequest({ username: "new.customer", phoneNumber: "+989120000199" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("REGISTRATION_PROOF_REQUIRED");
    expect(await prisma.user.findUnique({ where: { username: "new.customer" } })).toBeNull();
  });

  it("creates a verified account and one session from a single-use phone proof", async () => {
    const cookie = await proofCookie("+989120000199");
    const makeRequest = () => new Request("http://localhost/api/auth/register", {
      method: "POST", headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ username: "new.customer", role: "RETAIL" }),
    });
    const res = await register(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "new.customer" } });
    expect(user.phoneNumber).toBe("+989120000199");
    expect(user.phoneVerified).toBe(true);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
    expect((await register(makeRequest())).status).toBe(401);
  });

  it("rejects self-registration as ADMIN or AGENT", async () => {
    for (const role of ["ADMIN", "AGENT"]) {
      const res = await register(jsonRequest({ username: `escalate.${role}`, role }));
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
    }
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await register(rawRequest("http://localhost/api/auth/register", "{{"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });
});

describe("POST /api/auth/logout", () => {
  it("deletes the session row and clears the cookie", async () => {
    const cookie = await loginAs(seed.retail);

    const res = await logout(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }), ctx());
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/session_token=;/);

    const sessionCount = await prisma.session.count({ where: { userId: seed.retail.id } });
    expect(sessionCount).toBe(0);
  });

  it("returns 401 without a session cookie", async () => {
    const res = await logout(new Request("http://localhost/api/auth/logout", { method: "POST" }), ctx());
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the sanitized current user", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.admin.username, password: seed.admin.password }));
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.username).toBe(seed.admin.username);
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("returns 401 without a session", async () => {
    const res = await me(new Request("http://localhost/api/auth/me"), ctx());
    expect(res.status).toBe(401);
  });
  it("authenticates normally when the browser also sends a malformed cookie", async () => {
    const sessionCookie = await loginAs(seed.retail);

    const res = await me(new Request("http://localhost/api/auth/me", {
      headers: { cookie: `_ga=%zz; ${sessionCookie}` },
    }), ctx());
    expect(res.status).toBe(200);   // was 500 before this fix
  });
});

describe("session lifecycle (login -> me -> logout -> me)", () => {
  it("revokes the session end-to-end and clears the cookie at Path=/", async () => {
    const cookie = await loginAs(seed.retail);

    const meBeforeLogout = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }), ctx());
    expect(meBeforeLogout.status).toBe(200);

    const logoutRes = await logout(
      new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }), ctx());
    expect(logoutRes.status).toBe(200);
    const logoutSetCookie = logoutRes.headers.get("set-cookie") ?? "";
    expect(logoutSetCookie).toMatch(/session_token=;/);
    // This is the assertion that would have caught the missing Path attribute:
    // without it, the clearing cookie is scoped to /api/auth and never
    // overrides the Path=/ cookie the browser is actually holding.
    expect(logoutSetCookie).toContain("Path=/");

    // Same original cookie, reused after logout — the session row is gone,
    // so this must be rejected even though the cookie string itself is unchanged.
    const meAfterLogout = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }), ctx());
    expect(meAfterLogout.status).toBe(401);
  });

  it("rejects an authenticated session whose user has been deactivated with 403 ACCOUNT_DEACTIVATED", async () => {
    const cookie = await loginAs(seed.retail);

    await prisma.user.update({ where: { id: seed.retail.id }, data: { isActive: false } });

    const res = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }), ctx());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("ACCOUNT_DEACTIVATED");
  });
});

describe("PATCH /api/auth/me", () => {
  it("returns 401 without a valid session", async () => {
    const res = await updateMe(
      new Request("http://localhost/api/auth/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Ali" }),
      }),
      ctx(),
    );
    expect(res.status).toBe(401);
  });

  it("updates allowed profile fields and returns sanitized user", async () => {
    const cookie = await loginAs(seed.retail);

    const res = await updateMe(
      new Request("http://localhost/api/auth/me", {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ firstName: "Reza", lastName: "Rezayi", city: "Mashhad" }),
      }),
      ctx(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.firstName).toBe("Reza");
    expect(body.data.lastName).toBe("Rezayi");
    expect(body.data.city).toBe("Mashhad");
    expect(body.data.passwordHash).toBeUndefined();

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(dbUser.firstName).toBe("Reza");
  });

  it("drops or ignores unexpected identity and privilege fields (overposting defense)", async () => {
    const cookie = await loginAs(seed.retail);

    const res = await updateMe(
      new Request("http://localhost/api/auth/me", {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          firstName: "Hacked",
          role: "ADMIN",
          isActive: false,
          id: 9999,
        }),
      }),
      ctx(),
    );
    expect(res.status).toBe(200);

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(dbUser.firstName).toBe("Hacked");
    expect(dbUser.role).toBe(Role.RETAIL);
    expect(dbUser.isActive).toBe(true);
    expect(dbUser.id).toBe(seed.retail.id);
  });

  it("rejects duplicate email if already in use by another account", async () => {
    await prisma.user.update({ where: { id: seed.wholesale.id }, data: { email: "wholesale@example.com" } });

    const cookie = await loginAs(seed.retail);

    const res = await updateMe(
      new Request("http://localhost/api/auth/me", {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ email: "wholesale@example.com" }),
      }),
      ctx(),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE_ACCOUNT");
  });
});

describe("POST /api/auth/change-password", () => {
  it("returns 401 without a valid session", async () => {
    const res = await changePassword(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: seed.retail.password, newPassword: "newsecretpassword123" }),
      }),
      ctx(),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 INVALID_CURRENT_PASSWORD on wrong current password without revoking session", async () => {
    const cookie = await loginAs(seed.retail);

    const res = await changePassword(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ currentPassword: "wrongcurrentpassword", newPassword: "newsecretpassword123" }),
      }),
      ctx(),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_CURRENT_PASSWORD");

    // Existing session must still be intact
    const meRes = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }), ctx());
    expect(meRes.status).toBe(200);
  });

  it("changes password successfully and revokes concurrent sessions while keeping current", async () => {
    // Device 1
    const cookie1 = await loginAs(seed.retail);

    // Device 2
    const cookie2 = await loginAs(seed.retail);

    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(2);

    // Change password from Device 1
    const res = await changePassword(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookie1 },
        body: JSON.stringify({ currentPassword: seed.retail.password, newPassword: "newBrandNewPassword123" }),
      }),
      ctx(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.passwordChanged).toBe(true);
    expect(body.data.revokedSessions).toBe(1);

    // Device 1 should still be authenticated
    const me1 = await me(new Request("http://localhost/api/auth/me", { headers: { cookie: cookie1 } }), ctx());
    expect(me1.status).toBe(200);

    // Device 2 must now be revoked
    const me2 = await me(new Request("http://localhost/api/auth/me", { headers: { cookie: cookie2 } }), ctx());
    expect(me2.status).toBe(401);

    // Customers cannot use password login even after changing their stored password.
    const oldLogin = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(jsonRequest({ identifier: seed.retail.username, password: "newBrandNewPassword123" }));
    expect(newLogin.status).toBe(401);
  });
});
