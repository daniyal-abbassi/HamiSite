"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiGet, apiMutate } from "@/lib/api-client";

/** Owner switch: card-to-card transfer page (on) or the online gateway (off). */
export function CardToCardSwitch() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<{ enabled: boolean }>("/api/admin/settings/card-to-card")
      .then((data) => { if (active) setEnabled(data.enabled); })
      .catch((cause) => { if (active) setError(apiErrorToFa(cause)); });
    return () => { active = false; };
  }, []);

  async function change(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    setError(null);
    try {
      const saved = await apiMutate<{ enabled: boolean }>("PUT", "/api/admin/settings/card-to-card", { enabled: next });
      setEnabled(saved.enabled);
    } catch (cause) {
      setEnabled(previous);
      setError(apiErrorToFa(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-ink-2/60 p-6" aria-labelledby="c2c-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 id="c2c-title" className="text-sm font-black">پرداخت کارت‌به‌کارت</h2>
          <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-muted-foreground">
            {enabled === null
              ? "در حال دریافت وضعیت…"
              : enabled
                ? "روشن: مشتری پس از ثبت سفارش به صفحه کارت‌به‌کارت می‌رود (درگاه پرداخت استفاده نمی‌شود)."
                : "خاموش: مشتری پس از ثبت سفارش به درگاه پرداخت اینترنتی هدایت می‌شود."}
          </p>
        </div>
        <Switch
          checked={enabled ?? false}
          disabled={enabled === null || saving}
          onCheckedChange={(next) => void change(next)}
          aria-label="فعال‌سازی پرداخت کارت‌به‌کارت"
        />
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] text-destructive">{error}</p>}
    </section>
  );
}
