import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/prisma";
import { IMPORTED_CUSTOMER_PASSWORD, mapLegacyCustomer } from "@/prisma/legacy-import/customers";
import type { LegacyCustomer } from "@/prisma/legacy-import/types";

/** Shape taken verbatim from prisma/legacy-import/customers.test.ts — a REAL
 * legacy row. Note `username` is the RAW phone ("099…") while mapLegacyCustomer
 * normalizes phoneNumber to "+9899…". Legacy usernames ARE raw phone numbers,
 * so logging in with the normalized form cannot match the username branch —
 * that is the entire point of this test. */
const rawLegacyCustomer: LegacyCustomer & { phone_number: string } = {
  id: 239,
  username: "09923286434",
  first_name: null,
  last_name: null,
  email: null,
  phone_number: "09923286434",
  national_number: null,
  card_number: null,
  is_active: true,
  verified: false,
  receive_newsletters: false,
  management_sms_notifications: false,
  management_email_notifications: false,
  referer: "google",
  creation_method: "website",
  date_joined: "2026-08-01T12:59:22.495122+03:30",
};

let userId: number;

beforeEach(async () => {
  const passwordHash = await bcrypt.hash(IMPORTED_CUSTOMER_PASSWORD, 10);
  const created = await prisma.user.create({ data: mapLegacyCustomer(rawLegacyCustomer, passwordHash) });
  userId = created.id;
});

function loginRequest(identifier: string, password: string) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
}

describe("legacy-imported customer login", () => {
  it("logs in by NORMALIZED +98 phone number with the imported password", async () => {
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(stored.phoneNumber).toBe("+989923286434");
    // Proves the phone branch is the only thing that can match below.
    expect(stored.username).not.toBe(stored.phoneNumber);

    const res = await login(loginRequest("+989923286434", IMPORTED_CUSTOMER_PASSWORD));
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.id).toBe(userId);
    expect(data.role).toBe("RETAIL");
    expect(res.headers.get("set-cookie")).toContain("session_token=");
    expect(await prisma.session.count({ where: { userId } })).toBe(1);
  });

  it("also accepts the raw 099… form the customer actually remembers", async () => {
    const res = await login(loginRequest("09923286434", IMPORTED_CUSTOMER_PASSWORD));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(userId);
  });

  it("rejects a wrong password with the same 401 as any other account", async () => {
    const res = await login(loginRequest("+989923286434", "not-the-imported-password"));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("INVALID_CREDENTIALS");
  });
});
