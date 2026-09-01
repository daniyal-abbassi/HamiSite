import { describe, expect, it } from "vitest";
import { communityContentState, customerJourney, customerTrustCtas, customerTrustSignals } from "./customerTrust";

describe("customer trust contract", () => {
  it("keeps community content explicitly pending until verified customer permission and social sources are supplied", () => {
    expect(communityContentState.status).toBe("awaiting-verified-content");
    expect(communityContentState.items).toEqual([]);
    expect(communityContentState.message).toMatch(/تأیید/);
    expect("reviews" in communityContentState).toBe(false);
    expect("ratings" in communityContentState).toBe(false);
  });

  it("uses only existing business trust signals and one purchase CTA without fabricating Instagram integration or metrics", () => {
    expect(customerTrustSignals.map((signal) => signal.label)).toEqual(["فروش حضوری", "فروش آنلاین", "پشتیبانی", "همکاری عمده", "تنوع برند"]);
    expect(customerJourney).toHaveLength(4);
    expect(customerTrustCtas).toEqual([{ label: "شروع خرید", href: "/shop" }]);
    expect(customerTrustCtas.some((cta) => /instagram|instagram\.com/i.test(cta.href))).toBe(false);
  });
});
