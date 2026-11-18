"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TomanPrice } from "@/components/ui/TomanPrice";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGet, apiPost } from "@/lib/api-client";
import { toFaDigits } from "@/lib/utils";

type ManualPayment = {
  orderNumber: string;
  amount: number;
  paymentStatus: "INITIATED" | "SENT";
  bank: { bankName: string; cardNumber: string; accountNumber: string; iban: string; holder: string };
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const plain = value.replace(/\s+/g, "");
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the number stays visible and selectable for a manual copy.
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p dir="ltr" className="mt-1 select-all break-all text-start font-mono text-base font-black tracking-wide">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`کپی ${label}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-xs font-bold transition hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua"
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        <span aria-live="polite">{copied ? "کپی شد" : "کپی"}</span>
      </button>
    </div>
  );
}

export function TransferClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ManualPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await apiGet<ManualPayment>(`/api/orders/${orderId}/manual-payment`));
      setError(null);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
        router.replace(`/login?next=${encodeURIComponent(`/order/${orderId}/transfer`)}`);
        return;
      }
      setError(apiErrorToFa(cause));
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => { void load(); }, [load]);

  async function report() {
    setReporting(true);
    setError(null);
    try {
      await apiPost(`/api/orders/${orderId}/manual-payment/report`);
      await load();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setReporting(false);
    }
  }

  if (loading) return <Skeleton className="mx-auto h-72 max-w-2xl rounded-2xl" />;

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-line p-6" role="alert">
        <p className="text-sm leading-7">{error ?? "اطلاعات پرداخت در دسترس نیست."}</p>
        <Link href={`/order/${orderId}`} className="mt-4 inline-flex min-h-11 items-center font-bold text-aqua underline-offset-4 hover:underline">
          بازگشت به سفارش
        </Link>
      </div>
    );
  }

  const reported = data.paymentStatus === "SENT";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5">
        <p className="text-sm font-black">درگاه پرداخت اینترنتی در حال حاضر به‌دلیل ازدحام بالا در دسترس نیست.</p>
        <p className="mt-2 text-sm leading-7">
          سفارش شما ثبت شده است. برای تکمیل خرید، مبلغ سفارش را به‌صورت کارت‌به‌کارت به حساب زیر واریز کنید و پس از واریز، دکمه «پرداخت را انجام دادم» را بزنید.
        </p>
      </div>

      <div className="glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">شماره سفارش</p>
            <p className="mt-1 font-mono text-lg font-black text-aqua">{toFaDigits(data.orderNumber)}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">مبلغ قابل پرداخت</p>
            <p className="mt-1 text-lg font-black"><TomanPrice amount={data.amount} /></p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">دقیقاً همین مبلغ را واریز کنید و رسید واریز را نزد خود نگه دارید.</p>
      </div>

      <section className="glass rounded-2xl p-5 md:p-6" aria-labelledby="bank-details">
        <h2 id="bank-details" className="flex items-center gap-2 text-base font-black">
          <Landmark className="size-5" aria-hidden="true" /> مشخصات حساب {data.bank.bankName}
        </h2>
        <div className="mt-3">
          <CopyRow label="شماره کارت" value={data.bank.cardNumber} />
          <CopyRow label="شماره حساب" value={data.bank.accountNumber} />
          <CopyRow label="شماره شبا" value={data.bank.iban} />
          <div className="border-t border-line py-3">
            <p className="text-xs text-muted-foreground">به نام</p>
            <p className="mt-1 text-base font-black">{data.bank.holder}</p>
          </div>
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {reported ? (
        <div className="rounded-2xl border border-aqua/40 bg-aqua/10 p-5" role="status">
          <p className="text-sm font-black">گزارش پرداخت شما ثبت شد.</p>
          <p className="mt-2 text-sm leading-7">سفارش در انتظار تأیید پرداخت است. پس از بررسی واریز، وضعیت سفارش به‌روز می‌شود.</p>
          <Link href={`/order/${orderId}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-aqua underline-offset-4 hover:underline">مشاهده سفارش</Link>
        </div>
      ) : (
        <Button className="min-h-12 w-full" loading={reporting} onClick={() => void report()}>
          پرداخت را انجام دادم
        </Button>
      )}
    </div>
  );
}
