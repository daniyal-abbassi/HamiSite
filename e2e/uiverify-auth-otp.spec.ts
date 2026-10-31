import { expect, test } from "@playwright/test";

test("customer OTP login and staff mode remain clear on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(new URL("/login", origin).toString());
  await expect(page.getByLabel("شماره موبایل")).toBeVisible();
  await expect(page.getByRole("button", { name: "دریافت کد ورود" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "ناوبری سریع فروشگاه" })).toBeHidden();
  await page.screenshot({ path: "specs/043-smsir-otp-login/verification/login-otp-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "ورود کارکنان" }).click();
  await expect(page.getByLabel("نام کاربری کارکنان")).toBeVisible();
  await expect(page.getByLabel("رمز عبور")).toBeVisible();
  await page.goto(new URL("/register", origin).toString());
  await expect(page.getByLabel("نام کاربری")).toHaveCount(0);
  await page.getByRole("radio", { name: /خریدار/ }).click();
  await expect(page.getByLabel("نام کامل")).toBeVisible();
  await expect(page.getByLabel("نام فروشگاه")).toHaveCount(0);
  await page.getByRole("radio", { name: /همکار عمده/ }).click();
  await expect(page.getByLabel("نام فروشگاه")).toBeVisible();
  await expect(page.getByLabel("نام کاربری")).toBeVisible();
  await expect(page.getByLabel("شماره موبایل")).toBeVisible();
  await expect(page.getByLabel("رمز عبور")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ارسال کد تأیید موبایل" })).toBeVisible();
  await page.screenshot({ path: "specs/043-smsir-otp-login/verification/register-otp-mobile.png", fullPage: true });
});

test("typing keeps focus and the full name reaches both account name fields", async ({ page }) => {
  await page.setViewportSize({ width: 384, height: 645 });
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  let submitted: Record<string, string> = {};
  await page.route("**/api/auth/otp/request", (route) => route.fulfill({ json: { success: true, data: { challengeId: "x", resendAfterSeconds: 60 } } }));
  await page.route("**/api/auth/otp/verify", (route) => route.fulfill({ json: { success: true, data: {} } }));
  await page.route("**/api/auth/register", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { success: false, error: { code: "BAD_REQUEST", message: "x" } } });
  });

  await page.goto(new URL("/register", origin).toString());
  await page.getByRole("radio", { name: /خریدار/ }).click();
  await page.getByLabel("نام کامل").pressSequentially("سارا احمدی نژاد");
  await expect(page.getByLabel("نام کامل")).toHaveValue("سارا احمدی نژاد");
  await page.getByLabel("نام کاربری").fill("sara");
  await page.getByLabel("شماره موبایل").fill("09121112233");
  await page.getByRole("button", { name: "ارسال کد تأیید موبایل" }).click();
  await page.getByLabel("کد شش‌رقمی پیامک‌شده").fill("123456");
  await page.getByRole("button", { name: "تأیید شماره موبایل" }).click();
  await page.getByRole("button", { name: "ایجاد حساب" }).click();

  await expect.poll(() => submitted.firstName).toBe("سارا");
  expect(submitted.lastName).toBe("احمدی نژاد");
  expect(submitted.role).toBe("RETAIL");
});
