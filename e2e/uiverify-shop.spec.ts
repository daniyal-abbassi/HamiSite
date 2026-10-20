import { expect, test } from "@uiverify/playwright";

test("shop grid keeps its first card usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop");
  const card = page.locator(".shop-product-grid article.product-card").first();
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".toman-price").first()).toBeVisible();
  await expect.poll(() => card.locator(".lux-stage img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.waitForLoadState("networkidle");
});
