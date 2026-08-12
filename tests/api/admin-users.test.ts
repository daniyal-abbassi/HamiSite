import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as listUsers } from "@/app/api/admin/users/route";
import { GET as getUser, PATCH as patchUser } from "@/app/api/admin/users/[id]/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

describe("admin users", () => {
  it("403s listing for a non-admin", async () => {
    const res = await listUsers(getRequest("http://localhost/api/admin/users", retailCookie));
    expect(res.status).toBe(403);
  });

  it("lists users without leaking passwordHash", async () => {
    const res = await listUsers(getRequest("http://localhost/api/admin/users", adminCookie));
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    expect(body.data[0].passwordHash).toBeUndefined();
  });

  it("filters by role", async () => {
    const res = await listUsers(getRequest("http://localhost/api/admin/users?role=WHOLESALE", adminCookie));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].role).toBe(Role.WHOLESALE);
  });

  it("gets a single user by id", async () => {
    const res = await getUser(getRequest(`http://localhost/api/admin/users/${seed.retail.id}`, adminCookie), {
      params: { id: String(seed.retail.id) },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.username).toBe(seed.retail.username);
  });

  it("deactivates a user, and the deactivated user is immediately locked out", async () => {
    const res = await patchUser(
      jsonRequest(`http://localhost/api/admin/users/${seed.retail.id}`, "PATCH", { isActive: false }, adminCookie),
      { params: { id: String(seed.retail.id) } },
    );
    expect(res.status).toBe(200);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(updated.isActive).toBe(false);

    const relist = await listUsers(getRequest(`http://localhost/api/admin/users?role=RETAIL`, adminCookie));
    const body = await relist.json();
    expect(body.data[0].isActive).toBe(false);
  });

  it("changes a user's role", async () => {
    const res = await patchUser(
      jsonRequest(`http://localhost/api/admin/users/${seed.retail.id}`, "PATCH", { role: "AGENT" }, adminCookie),
      { params: { id: String(seed.retail.id) } },
    );
    const body = await res.json();
    expect(body.data.role).toBe(Role.AGENT);
  });
});
