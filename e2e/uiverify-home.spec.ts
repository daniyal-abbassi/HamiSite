import { expect, test } from "@uiverify/playwright";

test("homepage renders its main storefront entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "مسیرهای اصلی" }).getByRole("link", { name: /مشاهده محصولات/ }),
  ).toBeVisible();
  await expect(page.locator("#featured article.product-card").first()).toBeVisible();
  await expect(page.locator("#featured article.product-card img").first()).toHaveJSProperty("complete", true);
  await page.waitForLoadState("networkidle");
});

test("featured rail keeps its first product visible on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const card = page.locator("#featured article.product-card").first();
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".toman-price").first()).toBeVisible();
  await expect.poll(() => card.locator(".lux-stage img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.waitForLoadState("networkidle");
});

test("desktop ticker is a compact pill whose marquee fills the bar", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 752 });
  await page.goto("/");

  const ticker = page.locator(".hero-ticker");
  await expect(ticker).toBeVisible();
  const box = (await ticker.boundingBox())!;

  // Compact and docked: a full-bleed stadium beside the 1152px nav pill read as
  // shapeless, so the desktop bar is capped and centred under the nav.
  expect(box.width).toBeLessThanOrEqual(600);
  expect(box.height).toBeGreaterThanOrEqual(44);

  const navBox = (await page.locator(".header-glass-surface").boundingBox())!;
  expect(Math.abs(box.x + box.width / 2 - (navBox.x + navBox.width / 2))).toBeLessThan(2);

  // The loop translates half the track, so half the track must span the visible
  // window — below that the bar empties out as the text slides away.
  const marquee = await page.evaluate(() => ({
    halfTrack: document.querySelector(".hero-ticker__track")!.getBoundingClientRect().width / 2,
    window: document.querySelector(".hero-ticker__viewport")!.getBoundingClientRect().width,
  }));
  expect(marquee.halfTrack).toBeGreaterThanOrEqual(marquee.window);

  await page.waitForLoadState("networkidle");
});

test("homepage stays inside a narrow 360px phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await expect(page.locator("#online-services .online-services-visual")).toBeVisible();
  await page.waitForLoadState("networkidle");
});
