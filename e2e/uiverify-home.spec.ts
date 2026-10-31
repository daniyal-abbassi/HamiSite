import { expect, test } from "@uiverify/playwright";

test("homepage renders its main storefront entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "مسیرهای اصلی" }).getByRole("link", { name: /مشاهده محصولات/ }),
  ).toBeVisible();
  await expect(page.locator("#featured article.fp-slide").first()).toBeVisible();
  await expect(page.locator("#featured article.fp-slide img").first()).toHaveJSProperty("complete", true);
  await page.waitForLoadState("networkidle");
});

test("featured showcase keeps its first product visible on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const slide = page.locator("#featured article.fp-slide").first();
  await expect(slide).toBeVisible();
  await slide.scrollIntoViewIfNeeded();
  await expect(slide.locator(".toman-price").first()).toBeVisible();
  await expect.poll(() => slide.locator(".fp-slide__plate img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.waitForLoadState("networkidle");
});

test("featured showcase thumbnails change the product on stage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#featured .fp__thumb").nth(2).click();
  await expect(page.locator("#featured .fp__thumb").nth(2)).toHaveAttribute("aria-current", "true");
  await expect(page.locator("#featured .fp-slide").nth(2)).toHaveClass(/is-active/);
  await page.waitForLoadState("networkidle");
});

test("discounted offers keep every price in view on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  const lead = page.locator("#discounted .offer--lead");
  await lead.scrollIntoViewIfNeeded();
  await expect(lead.locator(".offer__seal")).toBeVisible();
  await expect(lead.locator(".offer__saving")).toBeVisible();
  await expect(page.locator("#discounted .offer .offer__price strong")).toHaveCount(5);
  await page.waitForLoadState("networkidle");
});

test("category shelves open on tap and show their own products", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const watches = page.locator("#categories .cats__slat").filter({ hasText: "ساعت هوشمند" });
  await watches.getByRole("button").click();
  await expect(watches.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  await expect(watches.locator(".cats__item").first()).toBeVisible();
  await expect(page.locator("#categories .cats__slat.is-open")).toHaveCount(1);
  // The shelf it replaced must leave the tab order, not just the screen.
  await expect(page.locator("#categories .cats__slat").first().locator(".cats__item").first()).toBeHidden();
  await page.waitForLoadState("networkidle");
});

test("scattered pieces settle into one arch by the end of the scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const piece = page.locator("#store-experience [data-piece]").nth(1);
  await expect(piece).toHaveCSS("transform", /matrix\(/);
  const scattered = await piece.evaluate((node) => getComputedStyle(node).transform);
  expect(scattered).not.toBe("matrix(1, 0, 0, 1, 0, 0)");

  await page.evaluate(() => {
    const track = document.querySelector(".assembly__track")!;
    const end = track.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    window.scrollTo({ top: end, behavior: "instant" });
  });
  await expect.poll(() => piece.evaluate((node) => getComputedStyle(node).transform)).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/);
  const panel = await page.locator(".assembly__panel").boundingBox();
  expect(panel!.width).toBeLessThanOrEqual(390);
  await page.waitForLoadState("networkidle");
});

test("reduced motion gets the finished arch in normal flow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const piece = page.locator("#store-experience [data-piece]").nth(1);
  await expect(piece).toBeVisible();
  expect(await piece.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  const track = await page.locator(".assembly__track").boundingBox();
  expect(track!.height).toBeLessThan(900);
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
  await expect(page.locator("#store-experience .assembly__panel")).toBeVisible();
  await page.waitForLoadState("networkidle");
});
