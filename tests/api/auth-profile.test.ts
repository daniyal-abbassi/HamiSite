import { beforeEach, describe, expect, it } from "vitest";
import { POST as changePassword } from "@/app/api/auth/change-password/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me, PATCH as updateMe } from "@/app/api/auth/me/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let cookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  cookie = await loginAs(seed.retail);
});

const URL = "http://localhost/api/auth/me";

describe("PATCH /api/auth/me", () => {
  it("updates the whitelisted fields and returns the sanitized user", async () => {
    const res = await updateMe(
      jsonRequest(URL, "PATCH", {
        firstName: "Ali",
        lastName: "Rezaei",
        city: "Tehran",
        email: "ali@example.com",
        receiveNewsletters: true,
      }, cookie),
    );

    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data).toMatchObject({
      firstName: "Ali",
      lastName: "Rezaei",
      city: "Tehran",
      email: "ali@example.com",
      receiveNewsletters: true,
    });
    expect(Object.keys(data)).not.toContain("passwordHash");
  });

  it("leaves omitted fields untouched and clears a field sent as null", async () => {
    await updateMe(jsonRequest(URL, "PATCH", { firstName: "Ali", city: "Tehran" }, cookie));
    await updateMe(jsonRequest(URL, "PATCH", { city: null }, cookie));

    const user = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(user.firstName).toBe("Ali"); // untouched
    expect(user.city).toBeNull(); // explicitly cleared
  });

  it("ignores privileged fields entirely", async () => {
    const res = await updateMe(
      jsonRequest(URL, "PATCH", {
        firstName: "Ali",
        role: "ADMIN",
        isActive: false,
        creditLimit: 999999999,
        agentId: seed.admin.id,
        businessVerified: true,
        phoneNumber: "+989999999999",
        username: "hacked",
      }, cookie),
    );

    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(user.role).toBe("RETAIL");
    expect(user.isActive).toBe(true);
    expect(Number(user.creditLimit)).toBe(0);
    expect(user.agentId).toBeNull();
    expect(user.businessVerified).toBe(false);
    expect(user.phoneNumber).toBe("+989120000102");
    expect(user.username).toBe("test.retail");
  });

  it("returns 409 DUPLICATE_ACCOUNT for another user's email", async () => {
    await prisma.user.update({ where: { id: seed.admin.id }, data: { email: "boss@example.com" } });
    const res = await updateMe(jsonRequest(URL, "PATCH", { email: "boss@example.com" }, cookie));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("DUPLICATE_ACCOUNT");
  });

  it("allows re-submitting your OWN current email", async () => {
    await updateMe(jsonRequest(URL, "PATCH", { email: "mine@example.com" }, cookie));
    const res = await updateMe(jsonRequest(URL, "PATCH", { email: "mine@example.com", city: "Shiraz" }, cookie));
    expect(res.status).toBe(200);
  });

  it("returns 400 for an empty body, an invalid email, and malformed JSON", async () => {
    expect((await updateMe(jsonRequest(URL, "PATCH", {}, cookie))).status).toBe(400);
    expect((await updateMe(jsonRequest(URL, "PATCH", { email: "not-an-email" }, cookie))).status).toBe(400);

    const bad = await updateMe(
      new Request(URL, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: "{",
      }),
    );
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("returns 401 AUTH_REQUIRED without a session", async () => {
    const res = await updateMe(jsonRequest(URL, "PATCH", { firstName: "Ali" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("AUTH_REQUIRED");
  });

  it("refreshes the session cookie on the response (sliding expiry via withAuth)", async () => {
    const res = await updateMe(jsonRequest(URL, "PATCH", { firstName: "Ali" }, cookie));
    expect(res.headers.get("set-cookie")).toContain("Path=/");
    expect((await me(getRequest(URL, cookie))).status).toBe(200);
  });
});

const CP_URL = "http://localhost/api/auth/change-password";
const LOGIN_URL = "http://localhost/api/auth/login";

describe("POST /api/auth/change-password", () => {
  it("changes the password; the old one stops working and the new one works", async () => {
    const res = await changePassword(
      jsonRequest(CP_URL, "POST", { currentPassword: seed.retail.password, newPassword: "NewPassword@456" }, cookie),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.passwordChanged).toBe(true);

    const old = await login(
      jsonRequest(LOGIN_URL, "POST", { identifier: seed.retail.username, password: seed.retail.password }),
    );
    expect(old.status).toBe(401);
    expect((await old.json()).error.code).toBe("INVALID_CREDENTIALS");

    const fresh = await login(
      jsonRequest(LOGIN_URL, "POST", { identifier: seed.retail.username, password: "NewPassword@456" }),
    );
    expect(fresh.status).toBe(200);
  });

  it("revokes every OTHER session and keeps the current one alive", async () => {
    const otherCookie = await loginAs(seed.retail);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(2);

    const res = await changePassword(
      jsonRequest(CP_URL, "POST", { currentPassword: seed.retail.password, newPassword: "NewPassword@456" }, cookie),
    );
    expect((await res.json()).data.revokedSessions).toBe(1);

    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(1);
    expect((await me(getRequest(URL, cookie))).status).toBe(200); // current: alive
    expect((await me(getRequest(URL, otherCookie))).status).toBe(401); // other: revoked
  });

  it("returns 400 INVALID_CURRENT_PASSWORD (not 401) for a wrong current password", async () => {
    const res = await changePassword(
      jsonRequest(CP_URL, "POST", { currentPassword: "not-my-password", newPassword: "NewPassword@456" }, cookie),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_CURRENT_PASSWORD");

    // Nothing changed: password intact, session untouched.
    expect(
      (await login(jsonRequest(LOGIN_URL, "POST", { identifier: seed.retail.username, password: seed.retail.password })))
        .status,
    ).toBe(200);
    expect((await me(getRequest(URL, cookie))).status).toBe(200);
  });

  it("rejects a new password identical to the current one", async () => {
    const res = await changePassword(
      jsonRequest(CP_URL, "POST", { currentPassword: seed.retail.password, newPassword: seed.retail.password }, cookie),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects a new password under 6 characters", async () => {
    const res = await changePassword(
      jsonRequest(CP_URL, "POST", { currentPassword: seed.retail.password, newPassword: "abc12" }, cookie),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.newPassword).toBeTruthy();
  });

  it("returns 401 AUTH_REQUIRED without a session and 400 MALFORMED_JSON on bad JSON", async () => {
    expect(
      (await changePassword(jsonRequest(CP_URL, "POST", { currentPassword: "x", newPassword: "NewPassword@456" })))
        .status,
    ).toBe(401);

    const bad = await changePassword(
      new Request(CP_URL, { method: "POST", headers: { "content-type": "application/json", cookie }, body: "nope" }),
    );
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("MALFORMED_JSON");
  });
});
