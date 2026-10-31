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

test("the hero search narrows the list through the URL and can be cleared", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("searchbox", { name: "جست‌وجو در محصولات" }).fill("پاوربانک");
  await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
  await expect(page).toHaveURL(/q=/);
  await expect(page.locator(".shop-active__chip").first()).toBeVisible();
  await page.getByRole("button", { name: "پاک کردن جست‌وجو" }).click();
  await expect(page).not.toHaveURL(/q=/);
});

test("the filter drawer applies a choice at once, shows the live count and returns focus on close", async ({ page }) => {
  await page.goto("/shop");
  const trigger = page.getByRole("button", { name: /فیلترها/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "فیلتر محصولات" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "۵ تا ۲۰ میلیون" }).click();
  await expect(page).toHaveURL(/min=5000000&max=20000000/);
  await expect(dialog.getByRole("button", { name: "۵ تا ۲۰ میلیون" })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: /^نمایش .* محصول$/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("group", { name: "فیلترهای فعال" })).toBeVisible();
});

test("the quick filters toggle and the phone sheet fits without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/shop");
  await page.getByRole("button", { name: "قابل خرید", exact: true }).click();
  await expect(page).toHaveURL(/stock=purchasable/);
  await expect(page.getByRole("button", { name: "قابل خرید", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /فیلترها/ }).click();
  const sheet = page.locator(".shop-drawer");
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.width).toBeLessThanOrEqual(360);
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("a card's colour swatches choose the variant and swap its photograph", async ({ page }) => {
  await page.setViewportSize({ width: 384, height: 749 });
  await page.goto("/shop?q=" + encodeURIComponent("One Pro"));
  const card = page.locator(".shop-product-grid article.product-card:has(.lux-swatches)").first();
  await expect(card).toBeVisible();
  // The name leads the card, and stock status and scarcity are separate marks.
  await expect(card.locator(".lux-name")).toContainText(/\S/);
  const swatches = card.locator(".lux-swatches button");
  await expect(swatches).toHaveCount(2);
  const before = await card.locator(".lux-stage img").getAttribute("src");
  await swatches.nth(1).click();
  await expect(swatches.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(swatches.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => card.locator(".lux-stage img").getAttribute("src")).not.toBe(before);
  for (const swatch of await swatches.all()) {
    const box = await swatch.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("«موجود» and «محدود» are two separate marks", async ({ page }) => {
  await page.goto("/shop");
  const scarce = page.locator(".shop-product-grid .lux-scarce").first();
  await expect(scarce).toHaveText("محدود");
  await expect(scarce.locator("xpath=preceding-sibling::span[1]")).toHaveText("موجود");
});
