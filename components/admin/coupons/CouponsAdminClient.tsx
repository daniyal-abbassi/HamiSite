"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiGetWithMeta, apiPatch, apiPost } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreateCouponInput } from "@/types/admin";

type CouponType = "PERCENT_BASED" | "AMOUNT_BASED" | "SHIPPING_PRICE";
type CouponForm = {
  name: string;
  code: string;
  type: CouponType;
  amount: string;
  usageLimitPerCoupon: string;
  usageLimitPerUser: string;
  startDate: string;
  endDate: string;
  minCartPrice: string;
  maxDiscountAmount: string;
  minSuccessfulOrderCount: string;
  onlyFirstOrder: boolean;
  isActive: boolean;
};
type CreatedCoupon = {
  id: number;
  name: string;
  code: string;
  type: CouponType;
  amount: number | null;
  createdAt: string;
  isActive: boolean;
  usageLimitPerCoupon: number | null;
  usageLimitPerUser: number | null;
  startDate: string | null;
  endDate: string | null;
  minCartPrice: number | null;
  maxDiscountAmount: number | null;
  minSuccessfulOrderCount: number | null;
  onlyFirstOrder: boolean;
};

const EMPTY: CouponForm = {
  name: "", code: "", type: "PERCENT_BASED", amount: "", usageLimitPerCoupon: "", usageLimitPerUser: "",
  startDate: "", endDate: "", minCartPrice: "", maxDiscountAmount: "", minSuccessfulOrderCount: "",
  onlyFirstOrder: false, isActive: true,
};

export function CouponsAdminClient() {
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const [created, setCreated] = useState<CreatedCoupon[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoadFailed(false);
    try {
      const { data } = await apiGetWithMeta<CreatedCoupon[]>("/api/admin/coupons?page=1&pageSize=50");
      setCreated(data);
    } catch {
      setLoadFailed(true);
    }
  }

  useEffect(() => { void load(); }, []);

  function update(field: keyof CouponForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(coupon: CreatedCoupon) {
    const toLocalDateTime = (value: string | null) => {
      if (!value) return "";
      const date = new Date(value);
      return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    };
    setEditingId(coupon.id);
    setForm({
      name: coupon.name,
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount === null ? "" : String(coupon.amount),
      usageLimitPerCoupon: coupon.usageLimitPerCoupon === null ? "" : String(coupon.usageLimitPerCoupon),
      usageLimitPerUser: coupon.usageLimitPerUser === null ? "" : String(coupon.usageLimitPerUser),
      startDate: toLocalDateTime(coupon.startDate),
      endDate: toLocalDateTime(coupon.endDate),
      minCartPrice: coupon.minCartPrice === null ? "" : String(coupon.minCartPrice),
      maxDiscountAmount: coupon.maxDiscountAmount === null ? "" : String(coupon.maxDiscountAmount),
      minSuccessfulOrderCount: coupon.minSuccessfulOrderCount === null ? "" : String(coupon.minSuccessfulOrderCount),
      onlyFirstOrder: coupon.onlyFirstOrder,
      isActive: coupon.isActive,
    });
    setError(null);
    setDialogOpen(true);
  }

  async function submit() {
    if (!form.name.trim() || !form.code.trim()) {
      setError("نام و کد کوپن الزامی هستند.");
      return;
    }
    setSaving(true);
    setError(null);
    const numberOrUndefined = (value: string) => value ? Number(value) : undefined;
    const payload: CreateCouponInput = {
      name: form.name.trim(), code: form.code.trim().toUpperCase(), type: form.type,
      amount: numberOrUndefined(form.amount), usageLimitPerCoupon: numberOrUndefined(form.usageLimitPerCoupon),
      usageLimitPerUser: numberOrUndefined(form.usageLimitPerUser), startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined, minCartPrice: numberOrUndefined(form.minCartPrice),
      maxDiscountAmount: numberOrUndefined(form.maxDiscountAmount),
      minSuccessfulOrderCount: numberOrUndefined(form.minSuccessfulOrderCount),
      onlyFirstOrder: form.onlyFirstOrder, isActive: form.isActive,
    };
    try {
      if (editingId === null) await apiPost<CreatedCoupon>("/api/admin/coupons", payload);
      else await apiPatch<CreatedCoupon>(`/api/admin/coupons/${editingId}`, payload);
      await load();
      setForm(EMPTY);
      setEditingId(null);
      setDialogOpen(false);
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`کوپن «${name}» برای همیشه حذف شود؟`)) return;
    setBusyId(id);
    setError(null);
    try {
      await apiDelete(`/api/admin/coupons/${id}`);
      await load();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setBusyId(null);
    }
  }

  const input = (label: string, field: keyof CouponForm, type = "text") => (
    <label className="block text-[12px] font-bold">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <Input type={type} value={String(form[field])} onChange={(event) => update(field, event.target.value)} className="h-10" dir={type === "datetime-local" ? "ltr" : undefined} />
    </label>
  );

  return (
    <div>
      {error && <p role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">{error}</p>}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">{(created?.length ?? 0).toLocaleString("fa-IR")} کوپن</p>
        <Button size="sm" onClick={openCreate}><Plus className="size-4" />کوپن جدید</Button>
      </div>
      {loadFailed ? <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center text-sm text-destructive">بارگذاری کوپن‌ها ناموفق بود. <button type="button" className="ms-2 underline" onClick={() => void load()}>تلاش دوباره</button></div> : created === null ? <div className="space-y-2.5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div> : created.length === 0 ? <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">هنوز کوپنی ثبت نشده است.</div> : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {created.map((coupon) => <div key={coupon.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-2.5"><Tag className="mt-1 size-4 shrink-0 text-aqua" /><div className="min-w-0"><p className="truncate text-[13px] font-bold">{coupon.name}</p><p className="font-mono text-[10px] text-muted-foreground/70">{coupon.code}</p><p className="mt-1 text-[10px] text-muted-foreground">{coupon.isActive ? "فعال" : "غیرفعال"}</p></div></div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="sm" aria-label={`ویرایش ${coupon.name}`} onClick={() => openEdit(coupon)}><Pencil className="size-3.5" /></Button>
              <Button variant="ghost" size="sm" loading={busyId === coupon.id} aria-label={`حذف ${coupon.name}`} onClick={() => void remove(coupon.id, coupon.name)}><Trash2 className="size-3.5" /></Button>
            </div>
          </div>)}
        </div>
      )}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} title={editingId === null ? "ایجاد کوپن" : "ویرایش کوپن"}>
        <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2">{input("نام *", "name")}{input("کد کوپن *", "code")}</div>
          <label className="block text-[12px] font-bold"><span className="mb-1 block text-muted-foreground">نوع تخفیف</span><Select value={form.type} onChange={(event) => update("type", event.target.value as CouponType)}><option value="PERCENT_BASED">درصدی</option><option value="AMOUNT_BASED">مبلغی</option><option value="SHIPPING_PRICE">ارسال رایگان</option></Select></label>
          {form.type !== "SHIPPING_PRICE" && input(form.type === "PERCENT_BASED" ? "درصد تخفیف" : "مبلغ تخفیف", "amount", "number")}
          <div className="grid gap-3 sm:grid-cols-2">{input("حداقل مبلغ سبد", "minCartPrice", "number")}{input("حداکثر تخفیف", "maxDiscountAmount", "number")}</div>
          <div className="grid gap-3 sm:grid-cols-2">{input("تعداد استفاده کل", "usageLimitPerCoupon", "number")}{input("استفاده هر کاربر", "usageLimitPerUser", "number")}</div>
          <div className="grid gap-3 sm:grid-cols-2">{input("تاریخ شروع", "startDate", "datetime-local")}{input("تاریخ پایان", "endDate", "datetime-local")}</div>
          {input("حداقل سفارش موفق قبلی", "minSuccessfulOrderCount", "number")}
          <Toggle label="فقط اولین سفارش" checked={form.onlyFirstOrder} onChange={(value) => update("onlyFirstOrder", value)} /><Toggle label="فعال" checked={form.isActive} onChange={(value) => update("isActive", value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => { setDialogOpen(false); setEditingId(null); }}>انصراف</Button><Button loading={saving} onClick={() => void submit()}>{editingId === null ? "ایجاد کوپن" : "ذخیره تغییرات"}</Button></div>
      </Dialog>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-2.5"><label className="text-[12px] font-bold">{label}</label><Switch checked={checked} onCheckedChange={onChange} /></div>;
}
