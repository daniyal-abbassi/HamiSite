import { describe, expect, it } from "vitest";
import { finalConversionCtas, finalConversionCopy } from "./finalConversion";

describe("final conversion contract", () => {
  it("keeps one primary purchase CTA and two secondary routes tied to existing destinations", () => {
    expect(finalConversionCtas).toEqual([
      { kind: "primary", label: "مشاهده محصولات", href: "/shop" },
      { kind: "secondary", label: "فروشگاه حضوری", href: "#store-experience" },
      { kind: "secondary", label: "همکاری با ما", href: "/partners" },
    ]);
  });

  it("uses a calm brand finale without discount, countdown, urgency, or fabricated commercial claims", () => {
    const combined = [finalConversionCopy.eyebrow, finalConversionCopy.title, finalConversionCopy.subtitle, ...finalConversionCtas.map((cta) => cta.label)].join(" ");
    expect(combined).not.toMatch(/تخفیف|فرصت محدود|همین حالا|فقط امروز|شمارش|٪|\d/);
  });
});
