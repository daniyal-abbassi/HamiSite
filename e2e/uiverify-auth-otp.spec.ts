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
  await expect(page.getByLabel("نام کاربری")).toBeVisible();
  await expect(page.getByLabel("شماره موبایل")).toBeVisible();
  await expect(page.getByLabel("رمز عبور")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ارسال کد تأیید موبایل" })).toBeVisible();
  await page.screenshot({ path: "specs/043-smsir-otp-login/verification/register-otp-mobile.png", fullPage: true });
});
