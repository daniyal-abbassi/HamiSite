import { beforeEach, describe, expect, it } from "vitest";
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
