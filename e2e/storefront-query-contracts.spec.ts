import { expect, test } from "@playwright/test";

test("unknown product is a real 404 and unknown shop filter stays empty", async ({ page, request }) => {
  const missing = await request.get("/shop/این-محصول-وجود-ندارد-039-check");
  expect(missing.status()).toBe(404);

  await page.goto("/shop?brand=unknown-039-brand");
  await expect(page.getByText(/در برندها یا دسته‌بندی‌های ما پیدا نشد/)).toBeVisible();
  await expect(page.locator(".shop-product-grid article.product-card")).toHaveCount(0);
});

test("price sort and pagination keep distinct catalog results", async ({ page }) => {
  await page.goto("/shop?sort=price-asc");
  await expect(page.locator("#shop-sort")).toHaveValue("price-asc");
  const sortedCards = page.locator(".shop-product-grid article.product-card");
  await expect(sortedCards.first()).toBeVisible();
  const sortedFirst = await sortedCards.first().locator('a[href^="/shop/"]').first().getAttribute("href");
  await page.goto("/shop?page=2");
  const pageTwo = page.locator(".shop-product-grid article.product-card");
  await expect(pageTwo.first()).toBeVisible();
  const pageTwoFirst = await pageTwo.first().locator('a[href^="/shop/"]').first().getAttribute("href");
  expect(pageTwoFirst).not.toBe(sortedFirst);
  await expect(page.locator('.shop-pagination [aria-current="page"]')).toHaveText("۲");
});
