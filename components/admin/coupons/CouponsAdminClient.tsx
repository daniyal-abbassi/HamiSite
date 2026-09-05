"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiPost } from "@/lib/api-client";
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
type CreatedCoupon = { id: number; name: string; code: string; type: CouponType; amount: number | null; createdAt: number };

const EMPTY: CouponForm = {
  name: "", code: "", type: "PERCENT_BASED", amount: "", usageLimitPerCoupon: "", usageLimitPerUser: "",
  startDate: "", endDate: "", minCartPrice: "", maxDiscountAmount: "", minSuccessfulOrderCount: "",
  onlyFirstOrder: false, isActive: true,
};

export function CouponsAdminClient() {
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const [created, setCreated] = useState<CreatedCoupon[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_coupons_session");
      if (stored) setCreated(JSON.parse(stored) as CreatedCoupon[]);
    } catch {
      setCreated([]);
    }
  }, []);

  function persist(next: CreatedCoupon[]) {
    setCreated(next);
    localStorage.setItem("admin_coupons_session", JSON.stringify(next));
  }

  function update(field: keyof CouponForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
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
      usageLimitPerUser: numberOrUndefined(form.usageLimitPerUser), startDate: form.startDate || undefined,
      endDate: form.endDate || undefined, minCartPrice: numberOrUndefined(form.minCartPrice),
      maxDiscountAmount: numberOrUndefined(form.maxDiscountAmount),
      minSuccessfulOrderCount: numberOrUndefined(form.minSuccessfulOrderCount),
      onlyFirstOrder: form.onlyFirstOrder, isActive: form.isActive,
    };
    try {
      const coupon = await apiPost<CreatedCoupon>("/api/admin/coupons", payload);
      persist([{ ...coupon, createdAt: Date.now() }, ...created]);
      setForm(EMPTY);
      setDialogOpen(false);
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setSaving(false);
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
        <p className="text-[12px] text-muted-foreground">{created.length.toLocaleString("fa-IR")} کوپن در این نشست</p>
        <Button size="sm" onClick={() => { setError(null); setDialogOpen(true); }}><Plus className="size-4" />کوپن جدید</Button>
      </div>
      {created.length === 0 ? <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">هنوز کوپنی نساخته‌اید.</div> : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {created.map((coupon) => <div key={coupon.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-2.5"><Tag className="mt-1 size-4 shrink-0 text-gold" /><div className="min-w-0"><p className="truncate text-[13px] font-bold">{coupon.name}</p><p className="font-mono text-[10px] text-muted-foreground/70">{coupon.code}</p></div></div>
            <Button variant="ghost" size="sm" aria-label={`حذف ${coupon.name}`} onClick={() => persist(created.filter((item) => item.id !== coupon.id))}><Trash2 className="size-3.5" /></Button>
          </div>)}
        </div>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="ایجاد کوپن">
        <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2">{input("نام *", "name")}{input("کد کوپن *", "code")}</div>
          <label className="block text-[12px] font-bold"><span className="mb-1 block text-muted-foreground">نوع تخفیف</span><Select value={form.type} onChange={(event) => update("type", event.target.value as CouponType)}><option value="PERCENT_BASED">درصدی</option><option value="AMOUNT_BASED">مبلغی</option><option value="SHIPPING_PRICE">ارسال رایگان</option></Select></label>
          {form.type !== "SHIPPING_PRICE" && input(form.type === "PERCENT_BASED" ? "درصد تخفیف" : "مبلغ تخفیف", "amount", "number")}
          <div className="grid gap-3 sm:grid-cols-2">{input("حداقل مبلغ سبد", "minCartPrice", "number")}{input("حداکثر تخفیف", "maxDiscountAmount", "number")}</div>
          <div className="grid gap-3 sm:grid-cols-2">{input("تعداد استفاده کل", "usageLimitPerCoupon", "number")}{input("استفاده هر کاربر", "usageLimitPerUser", "number")}</div>
          <div className="grid gap-3 sm:grid-cols-2">{input("تاریخ شروع", "startDate", "datetime-local")}{input("تاریخ پایان", "endDate", "datetime-local")}</div>
          {input("حداقل سفارش موفق قبلی", "minSuccessfulOrderCount", "number")}
          <Toggle label="فقط اولین سفارش" checked={form.onlyFirstOrder} onChange={(value) => update("onlyFirstOrder", value)} /><Toggle label="فعال" checked={form.isActive} onChange={(value) => update("isActive", value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDialogOpen(false)}>انصراف</Button><Button loading={saving} onClick={() => void submit()}>ایجاد کوپن</Button></div>
      </Dialog>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-2.5"><label className="text-[12px] font-bold">{label}</label><Switch checked={checked} onCheckedChange={onChange} /></div>;
}
