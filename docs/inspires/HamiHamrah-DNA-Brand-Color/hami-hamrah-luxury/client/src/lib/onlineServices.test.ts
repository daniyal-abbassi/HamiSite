import { describe, expect, it } from "vitest";
import { featuredOnlineService, onlineServiceFaqs, onlineServices, onlineServicesCta } from "./onlineServices";

describe("online services content contract", () => {
  it("keeps Apple ID as the single verified featured service with an existing services-category destination", () => {
    expect(featuredOnlineService.key).toBe("apple-id");
    expect(featuredOnlineService.href).toBe("/shop?category=online-services");
    expect(onlineServices).toEqual([featuredOnlineService]);
    expect(onlineServicesCta.href).toBe("/shop?category=online-services");
  });

  it("keeps the trust and FAQ language free of fabricated price, stock, duration, or delivery promises", () => {
    const allCopy = [
      featuredOnlineService.title,
      featuredOnlineService.description,
      featuredOnlineService.trustCopy,
      ...onlineServiceFaqs.flatMap((faq) => [faq.question, faq.answer]),
    ].join(" ");

    expect(allCopy).not.toMatch(/\d|تومان|موجودی|ساعت|دقیقه|تحویل فوری/);
    expect(onlineServiceFaqs).toHaveLength(3);
  });
});
