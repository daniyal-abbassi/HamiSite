import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
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

function rawRequest(url: string, body: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

const LOGIN_URL = "http://localhost/api/auth/login";

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
  it("logs in by normalized phone number, not just username", async () => {
    const res = await login(jsonRequest({ identifier: "+989120000102", password: seed.retail.password }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(seed.retail.id);
  });

  it("accepts the local 0912… spelling of a stored +98 number", async () => {
    const res = await login(jsonRequest({ identifier: "09120000102", password: seed.retail.password }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(seed.retail.id);
  });

  it("returns a byte-identical 401 for an unknown identifier and a wrong password", async () => {
    const unknown = await login(jsonRequest({ identifier: "no.such.user", password: seed.retail.password }));
    const wrongPw = await login(jsonRequest({ identifier: seed.retail.username, password: "definitely-wrong" }));

    expect(unknown.status).toBe(401);
    expect(wrongPw.status).toBe(401);
    expect(await unknown.json()).toEqual(await wrongPw.json());
    expect(unknown.headers.get("set-cookie")).toBeNull();
  });

  it("tags a failed login with INVALID_CREDENTIALS", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: "nope" }));
    expect((await res.json()).error.code).toBe("INVALID_CREDENTIALS");
  });

  it("pays the bcrypt cost even when no user matched (no timing oracle)", async () => {
    const start = Date.now();
    const res = await login(jsonRequest({ identifier: "no.such.user", password: "whatever" }));
    const elapsed = Date.now() - start;

    expect(res.status).toBe(401);
    // Floor only, never a ceiling or a ratio -> cannot flake on a loaded runner.
    // A cost-10 compare is ~120ms; the pre-fix code returned in ~1ms.
    expect(elapsed).toBeGreaterThan(20);
  });

  it("returns 403 ACCOUNT_DEACTIVATED at the login route itself", async () => {
    await prisma.user.update({ where: { id: seed.retail.id }, data: { isActive: false } });
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));

    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("ACCOUNT_DEACTIVATED");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(0);
  });

  it("returns 400 MALFORMED_JSON (not 500) for an unparseable body", async () => {
    const res = await login(rawRequest(LOGIN_URL, "{ identifier: "));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("returns 400 VALIDATION_FAILED for a missing, empty, or too-short field", async () => {
    for (const body of [
      { password: "Password@123" },                       // identifier missing
      { identifier: seed.retail.username },               // password missing
      { identifier: seed.retail.username, password: "" }, // empty password
      { identifier: "ab", password: "Password@123" },     // identifier too short
    ]) {
      const res = await login(jsonRequest(body));
      expect(res.status).toBe(400);
      const parsed = await res.json();
      expect(parsed.error.code).toBe("VALIDATION_FAILED");
      expect(parsed.error.details).toBeTruthy();
    }
  });

  it("returns the sanitized user with no passwordHash", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const { data } = await res.json();

    expect(Object.keys(data)).not.toContain("passwordHash");
    expect(data).toMatchObject({
      id: seed.retail.id,
      username: seed.retail.username,
      role: "RETAIL",
      isActive: true,
    });
    expect(typeof data.createdAt).toBe("string"); // ISO string, not a Date
  });

  it("sets the session cookie with Path=/, HttpOnly, SameSite and an Expires", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const setCookie = res.headers.get("set-cookie")!;

    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=lax/i); // Next serializes it LOWERCASE
    expect(setCookie).toMatch(/Expires=/);
    expect(setCookie).not.toContain("Secure"); // NODE_ENV !== production
  });

  it("persists the request's user-agent on the Session row", async () => {
    await login(
      rawRequest(
        LOGIN_URL,
        JSON.stringify({ identifier: seed.retail.username, password: seed.retail.password }),
        { "user-agent": "HamiTest/1.0 (vitest)" },
      ),
    );
    const session = await prisma.session.findFirstOrThrow({ where: { userId: seed.retail.id } });
    expect(session.userAgent).toBe("HamiTest/1.0 (vitest)");
  });

  it("stores only a SHA-256 hash of the token, never the token itself", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const token = res.headers.get("set-cookie")!.split(";")[0].split("=")[1];

    const session = await prisma.session.findFirstOrThrow({ where: { userId: seed.retail.id } });
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(session.tokenHash).not.toBe(token);
    expect(session.tokenHash).toBe(hashSessionToken(token));
  });

  it("keeps a second device signed in when the first logs out", async () => {
    const a = (await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password })))
      .headers.get("set-cookie")!.split(";")[0];
    const b = (await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password })))
      .headers.get("set-cookie")!.split(";")[0];

    expect(a).not.toBe(b);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(2);

    await logout(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie: a } }));

    expect((await me(new Request("http://localhost/api/auth/me", { headers: { cookie: a } }))).status).toBe(401);
    expect((await me(new Request("http://localhost/api/auth/me", { headers: { cookie: b } }))).status).toBe(200);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(1);
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
  it("returns 409 DUPLICATE_ACCOUNT for a duplicate phoneNumber", async () => {
    const res = await register(jsonRequest({
      username: "brand.new", password: "Password@123", phoneNumber: "+989120000102",
    }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE_ACCOUNT");
    expect(body.error.message).toContain("phoneNumber");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 409 DUPLICATE_ACCOUNT for a duplicate email", async () => {
    await prisma.user.update({ where: { id: seed.retail.id }, data: { email: "taken@example.com" } });
    const res = await register(jsonRequest({
      username: "brand.new2", password: "Password@123",
      phoneNumber: "+989120000197", email: "taken@example.com",
    }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toContain("email");
  });

  it("rejects self-registration as ADMIN or AGENT", async () => {
    for (const [role, digit] of [["ADMIN", "5"], ["AGENT", "6"]] as const) {
      const res = await register(jsonRequest({
        username: `escalate.${role}`, password: "Password@123",
        phoneNumber: `+98912000019${digit}`, role,
      }));
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
      expect(await prisma.user.findUnique({ where: { username: `escalate.${role}` } })).toBeNull();
    }
  });

  it("returns 400 for a password under 6 characters", async () => {
    const res = await register(jsonRequest({
      username: "shorty", password: "abc12", phoneNumber: "+989120000194",
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.password).toBeTruthy();
  });

  it("drops shopName/businessLicenseNumber for a non-WHOLESALE role", async () => {
    await register(jsonRequest({
      username: "retail.shop", password: "Password@123", phoneNumber: "+989120000193",
      role: "RETAIL", shopName: "Should Be Dropped", businessLicenseNumber: "LIC-999",
    }));
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "retail.shop" } });
    expect(user.shopName).toBeNull();
    expect(user.businessLicenseNumber).toBeNull();
  });

  it("keeps shopName/businessLicenseNumber for WHOLESALE", async () => {
    await register(jsonRequest({
      username: "wholesale.shop", password: "Password@123", phoneNumber: "+989120000192",
      role: "WHOLESALE", shopName: "Hami Distribution", businessLicenseNumber: "LIC-123",
    }));
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "wholesale.shop" } });
    expect(user.shopName).toBe("Hami Distribution");
  });

  it("rejects agentId on a non-WHOLESALE account", async () => {
    const res = await register(jsonRequest({
      username: "retail.agent", password: "Password@123", phoneNumber: "+989120000191",
      role: "RETAIL", agentId: seed.admin.id,
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toContain("WHOLESALE");
  });

  it("rejects an agentId that doesn't reference an active AGENT", async () => {
    const agent = await prisma.user.create({
      data: { username: "an.agent", phoneNumber: "+989120000190",
              passwordHash: "x", role: Role.AGENT, isActive: false },
    });
    const res = await register(jsonRequest({
      username: "ws.badagent", password: "Password@123", phoneNumber: "+989120000189",
      role: "WHOLESALE", agentId: agent.id,
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toContain("active AGENT");
  });

  it("normalizes an Iranian mobile to E.164 and rejects the other spelling as a duplicate", async () => {
    await register(jsonRequest({ username: "phone.norm", password: "Password@123", phoneNumber: "09121112233" }));
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "phone.norm" } });
    expect(user.phoneNumber).toBe("+989121112233");

    const dup = await register(jsonRequest({
      username: "phone.norm2", password: "Password@123", phoneNumber: "+989121112233",
    }));
    expect(dup.status).toBe(409);
    expect((await dup.json()).error.code).toBe("DUPLICATE_ACCOUNT");
  });

  it("returns 400 MALFORMED_JSON for an unparseable body", async () => {
    const res = await register(rawRequest("http://localhost/api/auth/register", "{{"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
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
  it("authenticates normally when the browser also sends a malformed cookie", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const sessionCookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await me(new Request("http://localhost/api/auth/me", {
      headers: { cookie: `_ga=%zz; ${sessionCookie}` },
    }));
    expect(res.status).toBe(200);   // was 500 before this fix
  });
});

describe("session lifecycle (login -> me -> logout -> me)", () => {
  it("revokes the session end-to-end and clears the cookie at Path=/", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const meBeforeLogout = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }));
    expect(meBeforeLogout.status).toBe(200);

    const logoutRes = await logout(
      new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }),
    );
    expect(logoutRes.status).toBe(200);
    const logoutSetCookie = logoutRes.headers.get("set-cookie") ?? "";
    expect(logoutSetCookie).toMatch(/session_token=;/);
    // This is the assertion that would have caught the missing Path attribute:
    // without it, the clearing cookie is scoped to /api/auth and never
    // overrides the Path=/ cookie the browser is actually holding.
    expect(logoutSetCookie).toContain("Path=/");

    // Same original cookie, reused after logout — the session row is gone,
    // so this must be rejected even though the cookie string itself is unchanged.
    const meAfterLogout = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }));
    expect(meAfterLogout.status).toBe(401);
  });
});
