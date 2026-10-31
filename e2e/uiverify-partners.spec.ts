import { expect, test } from "@uiverify/playwright";

test("the partners page shows the photo and the application, without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/partners");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("همکارِ امروز");
  await page.locator("#partner-application").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "فرم ثبت درخواست همکاری" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("both calls to action lead to the application", async ({ page }) => {
  await page.goto("/partners");
  for (const link of await page.locator('.partners-page a.partners-button[href="#partner-application"]').all()) {
    await expect(link).toHaveAttribute("href", "#partner-application");
  }
  await expect(page.locator("#partner-application")).toHaveCount(1);
});
