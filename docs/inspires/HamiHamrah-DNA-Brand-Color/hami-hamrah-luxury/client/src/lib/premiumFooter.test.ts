import { describe, expect, it } from "vitest";
import { footerContact, footerGroups, footerMeta } from "./premiumFooter";

describe("premium footer contract", () => {
  it("provides four ordered navigation groups using only live internal destinations", () => {
    expect(footerGroups.map((group) => group.label)).toEqual(["فروشگاه", "خدمات", "همکاری", "حامی همراه"]);
    expect(footerGroups.flatMap((group) => group.links).every((link) => link.href.startsWith("/") || link.href.startsWith("#"))).toBe(true);
    expect(footerGroups.flatMap((group) => group.links).map((link) => link.href)).toContain("/partners/login");
  });

  it("keeps only verified contact information and marks social destinations as pending", () => {
    expect(footerContact).toEqual({ phoneHref: "tel:05138000000", phoneLabel: "۰۵۱ ۳۸۰۰ ۰۰۰۰" });
    expect(footerMeta.socialState).toBe("awaiting-official-links");
    expect(footerMeta).not.toHaveProperty("address");
    expect(footerMeta).not.toHaveProperty("hours");
    expect(footerMeta).not.toHaveProperty("socialLinks");
    expect(footerMeta).not.toHaveProperty("trustBadges");
  });
});
