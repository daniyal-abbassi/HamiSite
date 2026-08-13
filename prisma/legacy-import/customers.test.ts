import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, mapLegacyCustomer } from "./customers";
import { Role } from "@prisma/client";
import type { LegacyCustomer } from "./types";

describe("normalizePhoneNumber", () => {
  it("strips a leading 0 and prefixes +98", () => {
    expect(normalizePhoneNumber("09923286434")).toBe("+989923286434");
  });

  it("passes an already-normalized number through unchanged", () => {
    expect(normalizePhoneNumber("+989923286434")).toBe("+989923286434");
  });
});

describe("mapLegacyCustomer", () => {
  const raw: LegacyCustomer = {
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

  it("maps to a RETAIL user with a normalized phone number and the given password hash", () => {
    const mapped = mapLegacyCustomer(raw, "hashed-password");

    expect(mapped).toMatchObject({
      role: Role.RETAIL,
      username: "09923286434",
      phoneNumber: "+989923286434",
      passwordHash: "hashed-password",
      email: null,
      isActive: true,
      phoneVerified: false,
      referer: "google",
      creationMethod: "website",
    });
    expect(mapped.createdAt).toEqual(new Date("2026-08-01T12:59:22.495122+03:30"));
  });
});
