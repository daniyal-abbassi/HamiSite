import { beforeEach, describe, expect, it } from "vitest";
import { GET as listAddresses, POST as createAddress } from "@/app/api/addresses/route";
import {
  DELETE as deleteAddress,
  GET as getAddress,
  PATCH as patchAddress,
} from "@/app/api/addresses/[id]/route";
import { prisma } from "@/lib/prisma";
import { ctx, getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let retailCookie: string;
let wholesaleCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  retailCookie = await loginAs(seed.retail);
  wholesaleCookie = await loginAs(seed.wholesale);
});

async function createRetailAddress() {
  const res = await createAddress(
    jsonRequest(
      "http://localhost/api/addresses",
      "POST",
      { userId: seed.wholesale.id, city: "Tehran", address: "123 Test St" },
      retailCookie,
    ), ctx());
  return res;
}

describe("address authorization", () => {
  it("POST ignores a spoofed userId and creates the address for the session user", async () => {
    const res = await createRetailAddress();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.userId).toBe(seed.retail.id);
  });

  it("GET (list) ignores a spoofed userId query param", async () => {
    await createRetailAddress();
    const res = await listAddresses(getRequest(`http://localhost/api/addresses?userId=${seed.wholesale.id}`, retailCookie), ctx());
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe(seed.retail.id);
  });

  it("lists the owner's default address first for checkout selection", async () => {
    const first = await createRetailAddress();
    const firstId = (await first.json()).data.id;
    const second = await createAddress(
      jsonRequest(
        "http://localhost/api/addresses",
        "POST",
        { city: "Mashhad", address: "456 Default St", isDefault: true },
        retailCookie,
      ), ctx());
    const secondId = (await second.json()).data.id;

    const res = await listAddresses(getRequest("http://localhost/api/addresses", retailCookie), ctx());
    const body = await res.json();
    expect(body.data[0].id).toBe(secondId);
    expect(body.data[0].isDefault).toBe(true);
    expect(body.data.find((address: { id: number }) => address.id === firstId)?.isDefault).toBe(false);
  });

  it("another user cannot GET/PATCH/DELETE this address by id", async () => {
    const created = await (await createRetailAddress()).json();
    const id = created.data.id;

    const getRes = await getAddress(getRequest(`http://localhost/api/addresses/${id}`, wholesaleCookie), ctx({ id: String(id) }));
    expect(getRes.status).toBe(404);

    const patchRes = await patchAddress(
      jsonRequest(`http://localhost/api/addresses/${id}`, "PATCH", { city: "Mashhad" }, wholesaleCookie),
      ctx({ id: String(id) }),
    );
    expect(patchRes.status).toBe(404);

    const deleteRes = await deleteAddress(getRequest(`http://localhost/api/addresses/${id}`, wholesaleCookie), ctx({ id: String(id) }));
    expect(deleteRes.status).toBe(404);

    const stillThere = await prisma.address.findUnique({ where: { id } });
    expect(stillThere).not.toBeNull();
  });

  it("the owner can GET/PATCH/DELETE their own address", async () => {
    const created = await (await createRetailAddress()).json();
    const id = created.data.id;

    const patchRes = await patchAddress(
      jsonRequest(`http://localhost/api/addresses/${id}`, "PATCH", { city: "Mashhad" }, retailCookie),
      ctx({ id: String(id) }),
    );
    expect(patchRes.status).toBe(200);

    const deleteRes = await deleteAddress(getRequest(`http://localhost/api/addresses/${id}`, retailCookie), ctx({ id: String(id) }));
    expect(deleteRes.status).toBe(200);
  });
});
