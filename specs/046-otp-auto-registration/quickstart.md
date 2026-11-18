# Quickstart: Validating Automatic Registration

Prerequisites: a disposable test database whose name marks it as a test database (the suite refuses any other). Never run tests against the production or development data.

## Automated
1. `npm run typecheck`
2. `npx vitest run tests/api/auth-otp-auto-register.test.ts` with a mocked SMS adapter that captures the code inside the test process.

Expected cases (see `contracts/otp-verify-auto-registration.md`):
- new number + correct code → 200, one new RETAIL user (`creationMethod = "otp-auto"`, phone verified), one session
- new number + wrong code → no user, no session
- two concurrent verifies for the same new number → exactly one user
- existing customer → same user id, no new row; wholesale privileges unchanged
- inactive customer and ADMIN/AGENT phone → `OTP_INVALID`, no new user
- `/otp/request` responses identical in shape for known and unknown numbers

## Manual (after deploy)
1. Open `/login` on a private window with a number never used on the shop.
2. Request the code, enter it → you land signed in, with no sign-up form.
3. Request a second code from the same number → you sign in to the same account (check the admin account list shows one user).
4. Add to cart and go to checkout → name, phone and address are asked there.
5. Check `creationMethod = 'otp-auto'` rows in the admin list or database.
