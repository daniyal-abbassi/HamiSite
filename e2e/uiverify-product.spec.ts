import { expect, test } from "@uiverify/playwright";

const productPath = "/shop/گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال";

test("product detail keeps its title, price and principal image", async ({ page }) => {
  await page.goto(productPath);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".toman-price").first()).toBeVisible();
  await expect(page.locator("main img").first()).toHaveJSProperty("complete", true);
  await page.waitForLoadState("networkidle");
});
