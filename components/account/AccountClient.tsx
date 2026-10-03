"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ApiClientError, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { PublicUser } from "@/types/auth";

type ProfileForm = Pick<PublicUser, "firstName" | "lastName" | "email" | "city" | "receiveNewsletters">;
const emptyProfile: ProfileForm = { firstName: null, lastName: null, email: null, city: null, receiveNewsletters: false };

function message(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return "نشست شما پایان یافته است. دوباره وارد حساب شوید.";
    if (error.code === "DUPLICATE_ACCOUNT") return "این ایمیل قبلاً برای حساب دیگری ثبت شده است.";
    return error.message;
  }
  return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
}

export function AccountClient() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    apiGet<PublicUser>("/api/auth/me").then((user) => {
      if (active) setProfile({ firstName: user.firstName, lastName: user.lastName, email: user.email, city: user.city, receiveNewsletters: user.receiveNewsletters });
    }).catch((reason: unknown) => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const saved = await apiPatch<PublicUser>("/api/auth/me", profile);
      setProfile({ firstName: saved.firstName, lastName: saved.lastName, email: saved.email, city: saved.city, receiveNewsletters: saved.receiveNewsletters });
      setNotice("اطلاعات حساب ذخیره شد.");
    } catch (reason) { setError(message(reason)); }
    finally { setSaving(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setChangingPassword(true); setError(""); setNotice("");
    try {
      await apiPost<{ passwordChanged: true; revokedSessions: number }>("/api/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setNotice("گذرواژه با موفقیت تغییر کرد.");
    } catch (reason) { setError(message(reason)); }
    finally { setChangingPassword(false); }
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-line bg-background px-3.5 py-3 text-sm outline-none transition focus:border-aqua";

  if (loading) return <p className="mt-8 rounded-2xl border border-line p-5 text-sm text-muted-foreground" aria-live="polite">در حال دریافت اطلاعات حساب…</p>;
  if (error && !profile.email && !profile.firstName && !profile.lastName) return (
    <section className="mt-8 rounded-2xl border border-line p-5" role="alert">
      <p className="text-sm leading-7">{error}</p>
      <Link href="/login" className="mt-3 inline-flex font-bold text-aqua underline-offset-4 hover:underline">ورود به حساب</Link>
    </section>
  );

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={saveProfile} className="rounded-2xl border border-line bg-card p-5 md:p-7">
        <h2 className="text-base font-black">اطلاعات تماس</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">نام<input className={inputClass} value={profile.firstName ?? ""} onChange={(e) => setProfile({ ...profile, firstName: e.target.value || null })} maxLength={100} autoComplete="given-name" /></label>
          <label className="text-xs font-bold">نام خانوادگی<input className={inputClass} value={profile.lastName ?? ""} onChange={(e) => setProfile({ ...profile, lastName: e.target.value || null })} maxLength={100} autoComplete="family-name" /></label>
          <label className="text-xs font-bold">ایمیل<input className={inputClass} type="email" value={profile.email ?? ""} onChange={(e) => setProfile({ ...profile, email: e.target.value || null })} maxLength={255} autoComplete="email" /></label>
          <label className="text-xs font-bold">شهر<input className={inputClass} value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value || null })} maxLength={100} autoComplete="address-level2" /></label>
        </div>
        <label className="mt-5 flex items-center gap-2.5 text-sm"><input type="checkbox" checked={profile.receiveNewsletters} onChange={(e) => setProfile({ ...profile, receiveNewsletters: e.target.checked })} className="size-4 accent-current" /> دریافت خبرها و پیشنهادهای فروشگاه</label>
        <button disabled={saving} className="mt-6 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60">{saving ? "در حال ذخیره…" : "ذخیره اطلاعات"}</button>
      </form>

      <form onSubmit={changePassword} className="rounded-2xl border border-line bg-card p-5 md:p-7">
        <h2 className="text-base font-black">تغییر گذرواژه</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">گذرواژه فعلی<input required type="password" autoComplete="current-password" className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
          <label className="text-xs font-bold">گذرواژه جدید<input required minLength={6} maxLength={100} type="password" autoComplete="new-password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
        </div>
        <button disabled={changingPassword} className="mt-6 rounded-xl border border-line px-5 py-3 text-sm font-bold disabled:opacity-60">{changingPassword ? "در حال تغییر…" : "تغییر گذرواژه"}</button>
      </form>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm leading-6 ${error ? "border-destructive/40 text-destructive" : "border-line text-foreground"}`}>{error || notice}</p>}
    </div>
  );
}
