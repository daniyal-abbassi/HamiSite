import { Role, type Prisma, type PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { LegacyCustomer } from "./types";

export const IMPORTED_CUSTOMER_PASSWORD = "Imported@12345";

export function normalizePhoneNumber(raw: string): string {
  if (raw.startsWith("+")) return raw;
  return `+98${raw.replace(/^0/, "")}`;
}

function hasPhoneNumber(raw: LegacyCustomer): raw is LegacyCustomer & { phone_number: string } {
  return typeof raw.phone_number === "string" && raw.phone_number.length > 0;
}

export function mapLegacyCustomer(raw: LegacyCustomer & { phone_number: string }, passwordHash: string): Prisma.UserUncheckedCreateInput {
  return {
    role: Role.RETAIL,
    username: raw.username,
    email: raw.email,
    passwordHash,
    firstName: raw.first_name,
    lastName: raw.last_name,
    phoneNumber: normalizePhoneNumber(raw.phone_number),
    phoneVerified: raw.verified,
    nationalNumber: raw.national_number,
    cardNumber: raw.card_number,
    isActive: raw.is_active,
    receiveNewsletters: raw.receive_newsletters,
    managementSmsNotif: raw.management_sms_notifications,
    managementEmailNotif: raw.management_email_notifications,
    referer: raw.referer,
    creationMethod: raw.creation_method,
    createdAt: new Date(raw.date_joined),
  };
}

export async function importCustomers(prisma: PrismaClient, rows: LegacyCustomer[]): Promise<Map<string, number>> {
  const idMap = new Map<string, number>();
  const passwordHash = await bcrypt.hash(IMPORTED_CUSTOMER_PASSWORD, 10);

  for (const raw of rows) {
    if (!hasPhoneNumber(raw)) {
      console.warn(`Skipping legacy customer ${raw.id} (${raw.username}): no phone number.`);
      continue;
    }
    const data = mapLegacyCustomer(raw, passwordHash);

    const user = await prisma.user.upsert({
      where: { phoneNumber: data.phoneNumber },
      update: data,
      create: data,
    });

    idMap.set(data.phoneNumber, user.id);
  }

  return idMap;
}
