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
  await expect(page.getByLabel("نام کاربری")).toHaveCount(0);
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

test("the customer option asks for no business details or documents", async ({ page }) => {
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(new URL("/register", origin).toString());
  await page.getByRole("radio", { name: /خریدار/ }).click();
  await expect(page.getByLabel("شهر")).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByRole("radiogroup", { name: "نوع کسب‌وکار" })).toHaveCount(0);
});

test("each business type shows the partners page's fields and keeps what they share", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(new URL("/register", origin).toString());
  await page.getByRole("radio", { name: /همکار عمده/ }).click();

  await expect(page.getByLabel("نام و نام خانوادگی")).toBeVisible();
  for (const label of ["کد ملی", "نام فروشگاه", "آدرس فروشگاه", "کد پستی", "تلفن فروشگاه"]) {
    await expect(page.getByLabel(label, { exact: false }).first()).toBeVisible();
  }
  await expect(page.locator('input[type="file"]')).toHaveCount(2);
  await expect(page.locator("#businessLicense")).toHaveCount(1);
  for (const label of ["شهر", "ایمیل (اختیاری)", "شماره جواز کسب (اختیاری)"]) {
    await expect(page.getByLabel(label)).toHaveCount(0);
  }

  await page.getByLabel("نام فروشگاه").fill("فروشگاه سارا");
  await page.locator("#leaseDocument").setInputFiles({ name: "lease.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
  await page.getByRole("radio", { name: "حقوقی" }).click();

  await expect(page.getByLabel("نام و نام خانوادگی نماینده شرکت")).toBeVisible();
  await expect(page.getByLabel("نام شرکت")).toBeVisible();
  await expect(page.getByLabel("شناسه ملی شرکت")).toBeVisible();
  await expect(page.getByLabel("شماره اقتصادی")).toBeVisible();
  await expect(page.locator("#registrationNotice")).toHaveCount(1);
  await expect(page.locator("#businessLicense")).toHaveCount(0);
  await expect(page.getByLabel("نام فروشگاه")).toHaveValue("فروشگاه سارا");
  await expect(page.getByText("lease.pdf")).toBeVisible();

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("a disallowed document is refused on its field and can be replaced", async ({ page }) => {
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(new URL("/register", origin).toString());
  await page.getByRole("radio", { name: /همکار عمده/ }).click();
  await page.locator("#leaseDocument").setInputFiles({ name: "note.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  await expect(page.getByText("فرمت فایل مجاز نیست (JPG/PNG/WebP/PDF)")).toBeVisible();
  await page.getByRole("button", { name: "حذف فایل عکس اجاره‌نامه" }).click();
  await expect(page.getByText("فرمت فایل مجاز نیست (JPG/PNG/WebP/PDF)")).toHaveCount(0);
  await expect(page.getByText("note.txt")).toHaveCount(0);
});

test("a partner verifies last, submits multipart, and is told the request is under review", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  let requestedCode = false;
  let contentType = "";
  let body = "";
  await page.route("**/api/auth/otp/request", (route) => {
    requestedCode = true;
    return route.fulfill({ json: { success: true, data: { challengeId: "x", resendAfterSeconds: 60 } } });
  });
  await page.route("**/api/auth/otp/verify", (route) => route.fulfill({ json: { success: true, data: {} } }));
  await page.route("**/api/auth/register/partner", async (route) => {
    contentType = (await route.request().allHeaders())["content-type"] ?? "";
    body = route.request().postDataBuffer()?.toString("utf8") ?? "";
    await route.fulfill({ json: { success: true, data: { user: { id: 1 }, application: { id: 57, entityType: "INDIVIDUAL", status: "PENDING" } } } });
  });

  await page.goto(new URL("/register", origin).toString());
  await page.getByRole("radio", { name: /همکار عمده/ }).click();
  await page.getByLabel("شماره موبایل").fill("09121112233");

  // Nothing is sent until the application itself is complete.
  await page.getByRole("button", { name: "ارسال کد تأیید موبایل" }).click();
  await expect(page.getByText("کد پستی باید ۱۰ رقم باشد")).toBeVisible();
  await expect(page.getByText("عکس اجاره‌نامه الزامی است")).toBeVisible();
  expect(requestedCode).toBe(false);

  await page.getByLabel("نام و نام خانوادگی").fill("سارا احمدی");
  await page.getByLabel("کد ملی").fill("0012345679");
  await page.getByLabel("نام فروشگاه").fill("فروشگاه سارا");
  await page.getByLabel("آدرس فروشگاه").fill("مشهد، خیابان امام رضا");
  await page.getByLabel("کد پستی").fill("9177948974");
  await page.getByLabel("تلفن فروشگاه").fill("05131234567");
  await page.locator("#leaseDocument").setInputFiles({ name: "lease.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
  await page.locator("#businessLicense").setInputFiles({ name: "license.png", mimeType: "image/png", buffer: Buffer.from("png") });

  await page.getByRole("button", { name: "ارسال کد تأیید موبایل" }).click();
  await page.getByLabel("کد شش‌رقمی پیامک‌شده").fill("123456");
  await page.getByRole("button", { name: "تأیید شماره موبایل" }).click();
  await page.getByRole("button", { name: "ثبت درخواست همکاری" }).click();

  await expect(page.getByRole("heading", { name: "درخواست همکاری شما ثبت شد" })).toBeVisible();
  await expect(page.getByText("شماره درخواست: ۵۷")).toBeVisible();
  await expect(page.getByText("پس از تأیید، قیمت همکاری فعال می‌شود")).toBeVisible();
  expect(contentType).toContain("multipart/form-data");
  expect(body).toContain('name="entityType"');
  expect(body).toContain('filename="lease.pdf"');
  expect(body).toContain('filename="license.png"');
});

test("a refused partner keeps what was typed and sees the message on the field", async ({ page }) => {
  const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.route("**/api/auth/otp/request", (route) => route.fulfill({ json: { success: true, data: { challengeId: "x", resendAfterSeconds: 60 } } }));
  await page.route("**/api/auth/otp/verify", (route) => route.fulfill({ json: { success: true, data: {} } }));
  let attempts = 0;
  await page.route("**/api/auth/register/partner", (route) => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 400, json: { success: false, error: { code: "VALIDATION_FAILED", message: "جواز کسب باید تصویر (JPG/PNG/WebP) یا PDF باشد", details: { field: "businessLicense" } } } });
    if (attempts === 2) return route.fulfill({ status: 409, json: { success: false, error: { code: "CONFLICT", message: "این شماره موبایل قبلاً درخواست همکاری ثبت کرده است." } } });
    return route.fulfill({ status: 401, json: { success: false, error: { code: "REGISTRATION_PROOF_REQUIRED", message: "Verify your phone first" } } });
  });

  await page.goto(new URL("/register", origin).toString());
  await page.getByRole("radio", { name: /همکار عمده/ }).click();
  await page.getByLabel("شماره موبایل").fill("09121112233");
  await page.getByLabel("نام و نام خانوادگی").fill("سارا احمدی");
  await page.getByLabel("کد ملی").fill("0012345679");
  await page.getByLabel("نام فروشگاه").fill("فروشگاه سارا");
  await page.getByLabel("آدرس فروشگاه").fill("مشهد، خیابان امام رضا");
  await page.getByLabel("کد پستی").fill("9177948974");
  await page.getByLabel("تلفن فروشگاه").fill("05131234567");
  await page.locator("#leaseDocument").setInputFiles({ name: "lease.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
  await page.locator("#businessLicense").setInputFiles({ name: "license.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
  await page.getByRole("button", { name: "ارسال کد تأیید موبایل" }).click();
  await page.getByLabel("کد شش‌رقمی پیامک‌شده").fill("123456");
  await page.getByRole("button", { name: "تأیید شماره موبایل" }).click();

  await page.getByRole("button", { name: "ثبت درخواست همکاری" }).click();
  await expect(page.locator(".auth-field__error")).toHaveText("جواز کسب باید تصویر (JPG/PNG/WebP) یا PDF باشد");
  await expect(page.getByLabel("کد پستی")).toHaveValue("9177948974");

  await page.getByRole("button", { name: "ثبت درخواست همکاری" }).click();
  await expect(page.locator(".auth-card [role=\"alert\"]")).toHaveText("این شماره موبایل قبلاً درخواست همکاری ثبت کرده است.");

  // An expired proof asks for the code again, and nothing typed is lost.
  await page.getByRole("button", { name: "ثبت درخواست همکاری" }).click();
  await expect(page.getByRole("button", { name: "ارسال کد تأیید موبایل" })).toBeVisible();
  await expect(page.getByLabel("نام فروشگاه")).toHaveValue("فروشگاه سارا");
  await expect(page.getByText("lease.pdf")).toBeVisible();
});
