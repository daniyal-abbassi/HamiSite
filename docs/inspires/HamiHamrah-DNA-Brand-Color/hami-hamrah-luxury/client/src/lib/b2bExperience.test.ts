import { describe, expect, it } from "vitest";
import { b2bCtas, b2bFeatures, b2bSupplyAreas, b2bWorkflow } from "./b2bExperience";

describe("B2B experience contract", () => {
  it("exposes distinct existing-partner and new-partner destinations", () => {
    expect(b2bCtas).toEqual([
      { label: "ورود به پنل همکاری", href: "/partners/login", kind: "primary" },
      { label: "ثبت‌نام همکار", href: "/partners", kind: "secondary" },
    ]);
  });

  it("uses four non-numeric supply benefits and a clear three-step workflow", () => {
    expect(b2bFeatures).toHaveLength(4);
    expect(b2bWorkflow.map((step) => step.index)).toEqual(["01", "02", "03"]);
    expect(b2bSupplyAreas).toEqual(["موبایل", "لوازم جانبی", "چندبرندی", "همکاری مستمر"]);
    expect([...b2bFeatures, ...b2bWorkflow].flatMap((item) => [item.title, item.description]).join(" ")).not.toMatch(/\d/);
  });
});
