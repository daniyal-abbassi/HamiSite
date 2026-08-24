import { describe, expect, it } from "vitest";
import { whyHamiCtas, whyHamiProofs, whyHamiQuote, whyHamiTrustStrip } from "./whyHamiProofs";

describe("why hami evidence contract", () => {
  it("keeps four evidence-led proof blocks with transparent store-photo status and known in-page destinations", () => {
    expect(whyHamiProofs).toHaveLength(4);
    expect(whyHamiProofs.find((proof) => proof.key === "store")?.media).toBe("store-photo-pending");
    expect(whyHamiProofs.map((proof) => proof.href)).toEqual(["#contact", "#products", "#brands", "#b2b"]);
    expect(whyHamiCtas.map((cta) => cta.href)).toEqual(["#contact", "#journey"]);
  });

  it("does not introduce invented numbers, rankings, guaranteed authenticity, price, stock, or delivery claims", () => {
    const allCopy = [
      ...whyHamiProofs.flatMap((proof) => [proof.title, proof.description, proof.mediaNote]),
      whyHamiQuote,
      ...whyHamiTrustStrip,
    ].join(" ");

    expect(allCopy).not.toMatch(/\d|بهترین|بیشترین|معتبرترین|۱۰۰٪|تضمین شده|تومان|موجودی|تحویل فوری/);
  });
});
