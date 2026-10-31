import { createHash, randomBytes } from "node:crypto";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PartnerApplicationStatus, Prisma, Role } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as registerCustomer } from "@/app/api/auth/register/route";
import { POST as registerPartner } from "@/app/api/auth/register/partner/route";
import { POST as applyAnonymously } from "@/app/api/partners/route";
import { GET as listBundles } from "@/app/api/partners/bundles/route";
import { POST as quotePricing } from "@/app/api/pricing/quote/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { executeApplicationDecision } from "@/lib/partner-applications";
import { PARTNER_UPLOAD_DIR } from "@/lib/partner-uploads";
import { prisma } from "@/lib/prisma";
import { ctx, getRequest, jsonRequest } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

const PROOF_PHONE = "+989121112233";

let seed: SeedResult;
let filesBefore: Set<string>;

async function storedFiles() {
  await mkdir(PARTNER_UPLOAD_DIR, { recursive: true });
  return readdir(PARTNER_UPLOAD_DIR);
}

async function newFiles() {
  return (await storedFiles()).filter((name) => !filesBefore.has(name));
}

beforeEach(async () => {
  seed = await seedMinimal();
  filesBefore = new Set(await storedFiles());
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all((await newFiles()).map((name) => rm(path.join(PARTNER_UPLOAD_DIR, name), { force: true })));
});

async function proof(phoneNumber = PROOF_PHONE, ttlMs = 60_000) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [{ now }] = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT timezone('UTC', clock_timestamp()) AS now`;
  await prisma.registrationProof.create({ data: { tokenHash, phoneNumber, expiresAt: new Date(now.getTime() + ttlMs) } });
  return token;
}

const pdf = (name = "doc.pdf") => new File(["%PDF-1.4"], name, { type: "application/pdf" });

function individualForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const text = {
    entityType: "INDIVIDUAL",
    fullName: "سارا احمدی نژاد",
    nationalCode: "0012345679",
    shopName: "فروشگاه سارا",
    shopAddress: "مشهد، خیابان امام رضا",
    postalCode: "9177948974",
    shopPhone: "05131234567",
    ...overrides,
  };
  for (const [key, value] of Object.entries(text)) form.set(key, value);
  form.set("leaseDocument", pdf("lease.pdf"));
  form.set("businessLicense", pdf("license.pdf"));
  return form;
}

function legalForm() {
  const form = new FormData();
  const text = {
    entityType: "LEGAL",
    fullName: "سارا احمدی",
    nationalCode: "0012345679",
    shopName: "فروشگاه سارا",
    shopAddress: "مشهد، خیابان امام رضا",
    companyName: "شرکت همراه",
    companyAddress: "مشهد، بلوار وکیل‌آباد",
    legalNationalId: "10101234567",
    economicCode: "411111111111",
  };
  for (const [key, value] of Object.entries(text)) form.set(key, value);
  form.set("leaseDocument", pdf("lease.pdf"));
  form.set("registrationNotice", pdf("notice.pdf"));
  return form;
}

function partnerRequest(form: FormData, token?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/auth/register/partner", {
    method: "POST",
    headers: { origin: "http://localhost", host: "localhost", ...(token ? { cookie: `registration_proof=${token}` } : {}), ...headers },
    body: form,
  });
}

function sessionCookie(response: Response) {
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`));
  return cookie?.split(";")[0] ?? "";
}

describe("POST /api/auth/register/partner", () => {
  it("creates a signed-in customer and a pending application with stored documents", async () => {
    const response = await registerPartner(partnerRequest(individualForm(), await proof(), { "user-agent": "vitest", "x-real-ip": "10.0.0.1" }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.user.role).toBe(Role.RETAIL);
    expect(body.data.application).toMatchObject({ entityType: "INDIVIDUAL", status: "PENDING" });
    expect(sessionCookie(response)).not.toBe("");
    expect(response.headers.getSetCookie().some((value) => value.startsWith("registration_proof=;"))).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { phoneNumber: PROOF_PHONE } });
    expect(user).toMatchObject({
      username: "partner_989121112233",
      role: Role.RETAIL,
      businessVerified: false,
      firstName: "سارا",
      lastName: "احمدی نژاد",
      nationalNumber: "0012345679",
      shopName: "فروشگاه سارا",
      phoneVerified: true,
      creationMethod: "otp",
    });

    const application = await prisma.partnerApplication.findUniqueOrThrow({ where: { mobile: PROOF_PHONE } });
    expect(application.status).toBe(PartnerApplicationStatus.PENDING);
    expect(application.ipAddress).toBe("10.0.0.1");
    expect(application.userAgent).toBe("vitest");
    expect((await newFiles()).sort()).toEqual([application.businessLicensePath, application.leaseDocumentPath].sort());
    expect(await prisma.registrationProof.count({ where: { consumedAt: null } })).toBe(0);
  });

  it("records a legal business's own fields and documents", async () => {
    const response = await registerPartner(partnerRequest(legalForm(), await proof()));
    expect(response.status).toBe(200);
    const application = await prisma.partnerApplication.findUniqueOrThrow({ where: { mobile: PROOF_PHONE } });
    expect(application).toMatchObject({ entityType: "LEGAL", companyName: "شرکت همراه", economicCode: "411111111111" });
    expect(application.registrationNoticePath).toBeTruthy();
    expect(application.businessLicensePath).toBeNull();
  });

  it("records the verified number, whatever mobile the request claims", async () => {
    const form = individualForm({ mobile: "09350000000" });
    expect((await registerPartner(partnerRequest(form, await proof()))).status).toBe(200);
    expect(await prisma.partnerApplication.count({ where: { mobile: PROOF_PHONE } })).toBe(1);
    expect(await prisma.partnerApplication.count({ where: { mobile: "+989350000000" } })).toBe(0);
  });

  it("refuses a missing, expired, or replayed proof", async () => {
    expect((await (await registerPartner(partnerRequest(individualForm()))).json()).error.code).toBe("REGISTRATION_PROOF_REQUIRED");

    const expired = await registerPartner(partnerRequest(individualForm(), await proof(PROOF_PHONE, -1000)));
    expect(expired.status).toBe(401);

    const token = await proof();
    expect((await registerPartner(partnerRequest(individualForm(), token))).status).toBe(200);
    expect((await registerPartner(partnerRequest(individualForm(), token))).status).toBe(401);

    expect(await prisma.user.count({ where: { phoneNumber: PROOF_PHONE } })).toBe(1);
    expect(await prisma.partnerApplication.count()).toBe(1);
  });

  it("refuses a cross-origin request", async () => {
    const response = await registerPartner(partnerRequest(individualForm(), await proof(), { origin: "https://evil.example" }));
    expect(response.status).toBe(403);
    expect(await newFiles()).toEqual([]);
  });

  it("reports a bad field or document and stores nothing", async () => {
    const token = await proof();
    const badText = await registerPartner(partnerRequest(individualForm({ postalCode: "12" }), token));
    expect(badText.status).toBe(400);
    expect((await badText.json()).error.details.fieldErrors.postalCode[0]).toBe("کد پستی باید ۱۰ رقم باشد");

    const form = individualForm();
    form.set("businessLicense", new File(["x"], "note.txt", { type: "text/plain" }));
    const badFile = await registerPartner(partnerRequest(form, token));
    expect(badFile.status).toBe(400);
    expect((await badFile.json()).error.details.field).toBe("businessLicense");

    expect(await newFiles()).toEqual([]);
    expect(await prisma.user.count({ where: { phoneNumber: PROOF_PHONE } })).toBe(0);
    expect(await prisma.registrationProof.count({ where: { consumedAt: null } })).toBe(1);
  });

  it("stops before storing anything when the mobile already has an application or an account", async () => {
    const token = await proof();
    await prisma.partnerApplication.create({ data: { entityType: "INDIVIDUAL", fullName: "x y", mobile: PROOF_PHONE, nationalCode: "0012345679", shopName: "x y", shopAddress: "x y z w" } });
    const applied = await registerPartner(partnerRequest(individualForm(), token));
    expect(applied.status).toBe(409);
    expect((await applied.json()).error.code).toBe("CONFLICT");

    const account = await registerPartner(partnerRequest(individualForm(), await proof("+989120000102")));
    expect(account.status).toBe(409);
    expect((await account.json()).error.code).toBe("DUPLICATE_ACCOUNT");

    expect(await newFiles()).toEqual([]);
    expect(await prisma.registrationProof.count({ where: { consumedAt: null } })).toBe(2);
  });

  it("leaves no account, application, session, or file behind when the commit fails", async () => {
    const usersBefore = await prisma.user.count();
    const original = prisma.$transaction.bind(prisma);
    let calls = 0;
    vi.spyOn(prisma, "$transaction").mockImplementation(((run: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
      calls += 1;
      // The second transaction is the commit; fail it at its last step.
      if (calls < 2) return original(run);
      return original(async (tx) => {
        await run(new Proxy(tx, {
          get: (target, key) => key === "session" ? { create: () => { throw new Error("disk full"); } } : Reflect.get(target, key),
        }));
      });
    }) as never);

    const response = await registerPartner(partnerRequest(individualForm(), await proof()));
    expect(response.status).toBe(500);
    expect(await newFiles()).toEqual([]);
    expect(await prisma.user.count()).toBe(usersBefore);
    expect(await prisma.partnerApplication.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.registrationProof.count({ where: { consumedAt: null } })).toBe(1);
  });

  it("reports a lost race on the application's mobile as CONFLICT and removes the files", async () => {
    const token = await proof();
    await prisma.partnerApplication.create({ data: { entityType: "INDIVIDUAL", fullName: "x y", mobile: PROOF_PHONE, nationalCode: "0012345679", shopName: "x y", shopAddress: "x y z w" } });
    vi.spyOn(prisma.partnerApplication, "findUnique").mockResolvedValueOnce(null);

    const response = await registerPartner(partnerRequest(individualForm(), token));
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("CONFLICT");
    expect(await newFiles()).toEqual([]);
    expect(await prisma.user.count({ where: { phoneNumber: PROOF_PHONE } })).toBe(0);
  });

  it("lets only one of two simultaneous submissions through", async () => {
    const token = await proof();
    const results = await Promise.all([
      registerPartner(partnerRequest(individualForm(), token)),
      registerPartner(partnerRequest(individualForm(), token)),
    ]);
    expect(results.map((response) => response.status).sort()).toEqual([200, 401]);
    expect(await prisma.partnerApplication.count()).toBe(1);
    expect((await newFiles()).length).toBe(2);
  });
});

describe("wholesale access comes only from approval", () => {
  const quote = (cookie: string) => quotePricing(jsonRequest(
    "http://localhost/api/pricing/quote",
    "POST",
    { items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }] },
    cookie,
  ));
  const bundles = (cookie: string) => listBundles(getRequest("http://localhost/api/partners/bundles", cookie), ctx());

  it("keeps a pending partner a customer, then upgrades the same account on approval", async () => {
    const response = await registerPartner(partnerRequest(individualForm(), await proof()));
    const cookie = sessionCookie(response);
    const { data } = await response.json();

    expect((await bundles(cookie)).status).toBe(403);
    expect((await (await quote(cookie)).json()).data.role).toBe(Role.RETAIL);

    const decision = await executeApplicationDecision(data.application.id, { action: "APPROVE" }, seed.admin.id);
    expect(decision.userElevated?.userId).toBe(data.user.id);
    expect(await prisma.user.count({ where: { phoneNumber: PROOF_PHONE } })).toBe(1);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: data.user.id } })).toMatchObject({ role: Role.WHOLESALE, businessVerified: true });

    expect((await bundles(cookie)).status).toBe(200);
    expect((await (await quote(cookie)).json()).data.role).toBe(Role.WHOLESALE);
  });

  it("leaves a working customer account after a rejection", async () => {
    const response = await registerPartner(partnerRequest(individualForm(), await proof()));
    const cookie = sessionCookie(response);
    const { data } = await response.json();

    await executeApplicationDecision(data.application.id, { action: "REJECT", note: "مدارک ناقص" }, seed.admin.id);

    expect(await prisma.user.findUniqueOrThrow({ where: { id: data.user.id } })).toMatchObject({ role: Role.RETAIL, isActive: true, businessVerified: false });
    expect((await quote(cookie)).status).toBe(200);
  });

  it("refuses a direct registration asking for wholesale", async () => {
    const token = await proof();
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `registration_proof=${token}` },
      body: JSON.stringify({ username: "sneaky", role: "WHOLESALE", shopName: "x" }),
    });
    const response = await registerCustomer(request);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_FAILED");
    expect(await prisma.user.count({ where: { username: "sneaky" } })).toBe(0);
  });

  it("creates plain customers through the customer route, with no application", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `registration_proof=${await proof()}` },
      body: JSON.stringify({ username: "sara", role: "RETAIL" }),
    });
    const response = await registerCustomer(request);
    expect(response.status).toBe(200);
    expect((await response.json()).data.role).toBe(Role.RETAIL);
    expect(await prisma.partnerApplication.count()).toBe(0);
  });
});

describe("POST /api/partners stays open to anonymous visitors", () => {
  it("accepts an application and stores its documents", async () => {
    const form = individualForm({ mobile: "09121112233" });
    const response = await applyAnonymously(new Request("http://localhost/api/partners", { method: "POST", body: form }));
    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe("PENDING");
    expect(await prisma.user.count({ where: { phoneNumber: PROOF_PHONE } })).toBe(0);
    expect((await newFiles()).length).toBe(2);
  });

  it("still refuses a second application for the same mobile", async () => {
    const send = () => applyAnonymously(new Request("http://localhost/api/partners", { method: "POST", body: individualForm({ mobile: "09121112233" }) }));
    expect((await send()).status).toBe(200);
    const second = await send();
    expect(second.status).toBe(409);
    expect((await second.json()).error.message).toBe("این شماره موبایل قبلاً درخواست همکاری ثبت کرده است.");
  });
});
