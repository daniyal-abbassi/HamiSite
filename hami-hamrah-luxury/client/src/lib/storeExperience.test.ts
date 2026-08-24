import { describe, expect, it } from "vitest";
import { storeExperienceCtas, storeExperienceImageSlots, storeExperiencePoints, storeExperienceStatement } from "./storeExperience";

describe("store experience contract", () => {
  it("keeps three planned real-photo slots clearly marked as pending and preserves their intended editorial roles", () => {
    expect(storeExperienceImageSlots.map((slot) => slot.key)).toEqual(["wide-store", "product-interaction", "store-detail"]);
    expect(storeExperienceImageSlots.every((slot) => slot.status === "pending-real-photo")).toBe(true);
    expect(storeExperienceImageSlots.every((slot) => !slot.src)).toBe(true);
  });

  it("keeps the experience points and CTAs evidence-led without a fabricated address, map link, hours, or directional claim", () => {
    expect(storeExperiencePoints).toHaveLength(3);
    expect(storeExperienceCtas.map((cta) => cta.href)).toEqual(["#contact", "tel:05138000000"]);
    const allCopy = [storeExperienceStatement, ...storeExperiencePoints.flatMap((point) => [point.title, point.description]), ...storeExperienceCtas.map((cta) => cta.label)].join(" ");
    expect(allCopy).not.toMatch(/آدرس|نقشه|ساعت کاری|مسیریابی|\d/);
  });
});
