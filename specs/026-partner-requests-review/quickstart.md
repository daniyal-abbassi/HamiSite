# Quickstart: Review Partner Requests in Admin Dashboard

**Feature**: `026-partner-requests-review`  
**Date**: 2026-10-13

---

## 1. Prerequisites

1. PostgreSQL database running and synced (`npx prisma db push`).
2. Development server running (`npm run dev`).
3. An administrative account (`phoneNumber: '+989120000001'`, `password: 'Admin@12345'`).

---

## 2. End-to-End Validation Scenarios

### Scenario 1: Admin Views Inbound Applications & Counts
1. Log into `/login` with username `admin` and password `Admin@12345`.
2. Inspect the admin navigation sidebar: confirm the new menu item **«درخواست‌های همکاری»** displays with a pending count badge (e.g. `۱`).
3. Click **«درخواست‌های همکاری»** to navigate to `/admin/partners`.
4. Verify the table displays application `#1`:
   - Name: `رضا رضایی`
   - Mobile: `۰۹۳۶۱۲۳۴۵۶۷`
   - Shop: `فروشگاه موبایل رضایی`
   - Entity: `حقیقی`
   - Status Badge: `در انتظار بررسی` (amber/gold badge)

---

### Scenario 2: Inspect Application Details and Verification Documents
1. In the `/admin/partners` table, click the **«بررسی»** (Inspect) action on application `#1`.
2. Verify the application modal/drawer opens showing:
   - Complete personal and business addresses.
   - National code and postal code formatted with Persian numerals.
   - Document action buttons: «مشاهده اجاره‌نامه» and «مشاهده جواز کسب».
3. Click «مشاهده اجاره‌نامه»: confirm the image loads cleanly in a high-resolution preview window via `/api/admin/partners/1/documents/leaseDocument`.

---

### Scenario 3: Approve Application and Verify Wholesale Access
1. In the inspection modal, click the green button **«تأیید درخواست همکاری»**.
2. Enter an optional approval note: «مدارک بررسی و تأیید شد.»
3. Confirm the modal.
4. Verify the status updates to `APPROVED` («تأییدشده») and the badge changes to green.
5. In another browser / incognito tab, log in using mobile `09361234567` (or verify in DB):
   - Navigate to `/partners/bundles`.
   - Confirm that access is granted immediately without security blocking.
   - Confirm the partner can view and order exclusive partner bundles.

---

### Scenario 4: Reject Ineligible Application
1. Submit another application at `/partners` with invalid business details.
2. Open the application in `/admin/partners` and click **«رد درخواست همکاری»**.
3. Attempt to submit without a note: verify client validation enforces a rejection note.
4. Enter rejection reason: «تصویر ارسالی برای جواز کسب ناخوانا است. لطفاً مجدداً ارسال فرمایید.»
5. Confirm rejection: verify status switches to `REJECTED` («ردشده») and reason is recorded in audit logs.

