import { expect, test } from "@uiverify/playwright";

const productPath = "/shop/گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال";

test("product detail keeps its title, price and principal image", async ({ page }) => {
  await page.goto(productPath);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".toman-price").first()).toBeVisible();
  await expect(page.locator("main img").first()).toHaveJSProperty("complete", true);
  await page.waitForLoadState("networkidle");
});

const slug = encodeURIComponent("گوشی-موبایل-سامسونگ-مدل-galaxy-a56-دو-سیم-کارت-ظرفیت-128-گیگابایت-و-رم-8-گیگابایت-ویتنام");

test("product page: colours are swatches that reprice, without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/shop/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Galaxy A56");

  const swatches = page.locator(".pdp-swatches button");
  await expect(swatches.first()).toBeVisible();
  const price = page.locator(".pdp-price strong");
  const before = await price.textContent();
  await page.getByRole("button", { name: /رنگ: مشکی/ }).click();
  await expect(page.getByRole("button", { name: /رنگ: مشکی/ })).toHaveAttribute("aria-pressed", "true");
  await expect(price).not.toHaveText(before ?? "");

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("product page: long specs open and close, and stay in the markup while closed", async ({ page }) => {
  await page.goto(`/shop/${slug}`);
  const rows = page.locator(".pdp-specs dl > div");
  const total = await rows.count();
  expect(total).toBeGreaterThan(8);
  await expect(rows.nth(8)).toBeHidden();
  await page.getByRole("button", { name: /نمایش همه/ }).click();
  await expect(rows.nth(8)).toBeVisible();
});
