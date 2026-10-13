"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
  X,
  XCircle,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { toPersianDigits } from "@/lib/serializers";
import type { AdminPartnerApplicationDetail } from "@/types/partner-applications";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { PartnerStatusBadge } from "./PartnerStatusBadge";

interface PartnerApplicationModalProps {
  applicationId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function PartnerApplicationModal({
  applicationId,
  isOpen,
  onClose,
  onUpdated,
}: PartnerApplicationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<AdminPartnerApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
  });

  // Decision flow states
  const [decisionMode, setDecisionMode] = useState<"APPROVE" | "REJECT" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ data: AdminPartnerApplicationDetail } | AdminPartnerApplicationDetail>(
        `/api/admin/partners/${id}`
      );
      const data = "data" in res && res.data ? res.data : (res as AdminPartnerApplicationDetail);
      setDetail(data);
    } catch (err) {
      console.error("Failed to load application detail:", err);
      setError("خطا در بارگذاری مشخصات درخواست");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && applicationId) {
      setDecisionMode(null);
      setDecisionNote("");
      setDecisionSuccess(null);
      void fetchDetail(applicationId);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [isOpen, applicationId, fetchDetail]);

  if (!isOpen) return null;

  const handleDecision = async () => {
    if (!detail || !decisionMode) return;

    if (decisionMode === "REJECT" && decisionNote.trim().length < 3) {
      alert("لطفاً علت رد درخواست را به طور کامل بنویسید (حداقل ۳ حرف)");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost(`/api/admin/partners/${detail.id}/decision`, {
        action: decisionMode,
        note: decisionNote.trim() || undefined,
      });

      setDecisionSuccess(
        decisionMode === "APPROVE"
          ? "درخواست با موفقیت تأیید شد و اکانت متقاضی به همکار عمده ارتقا یافت."
          : "درخواست همکاری با موفقیت رد شد."
      );

      // Refresh detail
      await fetchDetail(detail.id);
      if (onUpdated) onUpdated();
      setDecisionMode(null);
    } catch (err: unknown) {
      console.error("Failed to submit decision:", err);
      const msg = err instanceof Error ? err.message : "خطا در ثبت تصمیم بررسی";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return toPersianDigits(dateStr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-app-title"
        className="relative w-full max-w-3xl my-8 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Store size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="partner-app-title" className="text-base font-bold text-zinc-100">
                  {detail ? detail.shopName || detail.fullName : "بررسی درخواست همکاری"}
                </h3>
                {detail && <PartnerStatusBadge status={detail.status} />}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {detail ? (
                  <>
                    کد پیگیری: <span className="font-mono text-zinc-300">#{toPersianDigits(detail.id)}</span>
                    {" • "}
                    تاریخ ثبت: <span>{formatDate(detail.createdAt)}</span>
                  </>
                ) : (
                  "در حال بارگذاری..."
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-zinc-500 text-sm">
              در حال بارگذاری اطلاعات کامل متقاضی...
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          ) : detail ? (
            <>
              {decisionSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{decisionSuccess}</span>
                </div>
              )}

              {/* Applicant Personal & Commercial Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 pb-2 border-b border-zinc-800">
                    <User size={15} className="text-amber-400" />
                    <span>مشخصات متقاضی</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">نام و نام خانوادگی:</span>
                      <span className="font-semibold text-zinc-200">{detail.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">شماره موبایل:</span>
                      <a
                        href={`tel:${detail.mobile}`}
                        dir="ltr"
                        className="font-mono text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Phone size={12} />
                        <span>{detail.mobile}</span>
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">کد ملی:</span>
                      <span className="font-mono text-zinc-200">{toPersianDigits(detail.nationalCode)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">نوع شخصیت:</span>
                      <span className="text-zinc-200 font-medium">
                        {detail.entityType === "LEGAL" ? "حقوقی (شرکت)" : "حقیقی (فروشگاه)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 pb-2 border-b border-zinc-800">
                    <Store size={15} className="text-amber-400" />
                    <span>مشخصات کسب‌وکار و آدرس</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">نام فروشگاه:</span>
                      <span className="font-semibold text-zinc-200">{detail.shopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">تلفن ثابت:</span>
                      <span className="font-mono text-zinc-200">
                        {detail.shopPhone ? toPersianDigits(detail.shopPhone) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">کد پستی:</span>
                      <span className="font-mono text-zinc-200">
                        {detail.postalCode ? toPersianDigits(detail.postalCode) : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-1">نشانی دقیق:</span>
                      <p className="text-zinc-300 leading-relaxed bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/60">
                        {detail.shopAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Entity Extra Details if Applicable */}
              {detail.entityType === "LEGAL" && (
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 pb-2 border-b border-zinc-800">
                    <Building2 size={15} className="text-sky-400" />
                    <span>مشخصات ثبتی شخصیت حقوقی</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">نام شرکت:</span>
                      <span className="font-semibold text-zinc-200">{detail.companyName || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">شناسه ملی حقوقی:</span>
                      <span className="font-mono text-zinc-200">
                        {detail.legalNationalId ? toPersianDigits(detail.legalNationalId) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">کد اقتصادی:</span>
                      <span className="font-mono text-zinc-200">
                        {detail.economicCode ? toPersianDigits(detail.economicCode) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">آدرس ثبتی شرکت:</span>
                      <span className="text-zinc-200">{detail.companyAddress || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <FileCheck size={15} className="text-amber-400" />
                    <span>مدارک و ضمائم بارگذاری‌شده</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">محیط امن - مشاهده از طریق احراز هویت ادمین</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Lease Document */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold mb-1">
                        <FileText size={14} className="text-amber-400" />
                        <span>اجاره‌نامه یا سند مالکیت</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">مدرک احراز مالکیت یا استیجار فروشگاه</p>
                    </div>

                    {detail.documents.leaseDocument ? (
                      <a
                        href={detail.documents.leaseDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>مشاهده و دانلود مدرک</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic py-1 text-center bg-zinc-900 rounded-lg">
                        بارگذاری نشده
                      </span>
                    )}
                  </div>

                  {/* Business License */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold mb-1">
                        <FileText size={14} className="text-amber-400" />
                        <span>جواز کسب معتبر</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">پروانه کسب یا گواهی فعالیت صنفی</p>
                    </div>

                    {detail.documents.businessLicense ? (
                      <a
                        href={detail.documents.businessLicense}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>مشاهده و دانلود مدرک</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic py-1 text-center bg-zinc-900 rounded-lg">
                        بارگذاری نشده
                      </span>
                    )}
                  </div>

                  {/* Registration Notice */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold mb-1">
                        <FileText size={14} className="text-amber-400" />
                        <span>آگهی تأسیس و روزنامه</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">ویژه اشخاص حقوقی و شرکت‌ها</p>
                    </div>

                    {detail.documents.registrationNotice ? (
                      <a
                        href={detail.documents.registrationNotice}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>مشاهده و دانلود مدرک</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic py-1 text-center bg-zinc-900 rounded-lg">
                        بارگذاری نشده
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Audit Info & Notes */}
              {(detail.status !== "PENDING" || detail.notes) && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-semibold text-zinc-200">سوابق بررسی و تصمیم‌گیری:</span>
                    {detail.reviewedAt && <span>{formatDate(detail.reviewedAt)}</span>}
                  </div>
                  {detail.reviewer && (
                    <div className="text-zinc-400">
                      کارشناس بررسی‌کننده:{" "}
                      <span className="text-zinc-200 font-medium">
                        {detail.reviewer.firstName} {detail.reviewer.lastName} ({detail.reviewer.username})
                      </span>
                    </div>
                  )}
                  {detail.notes && (
                    <div>
                      <span className="text-zinc-400">یادداشت / علت تصمیم:</span>
                      <p className="mt-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 leading-relaxed">
                        {detail.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Decision Form (if active) */}
              {decisionMode && (
                <div
                  className={`p-5 rounded-2xl border ${
                    decisionMode === "APPROVE"
                      ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/20 border-rose-500/40 text-rose-300"
                  } space-y-4 animate-in fade-in`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {decisionMode === "APPROVE" ? (
                      <>
                        <ShieldCheck size={18} className="text-emerald-400" />
                        <span className="text-emerald-200">تأیید درخواست و ارتقای اکانت به همکار عمده</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} className="text-rose-400" />
                        <span className="text-rose-200">رد درخواست همکاری</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {decisionMode === "APPROVE"
                      ? "با تأیید این درخواست، وضعیت متقاضی به «تأییدشده» تغییر یافته و حساب کاربری او به صورت خودکار به سطح «همکار عمده» ارتقا می‌یابد تا بتواند به پنل سبدهای عمده‌فروشی دسترسی داشته باشد."
                      : "با رد این درخواست، متقاضی به عنوان همکار پذیرفته نخواهد شد. لطفاً علت عدم پذیرش یا نقص مدارک را بنویسید (الزامی):"}
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      {decisionMode === "APPROVE" ? "یادداشت بررسی (اختیاری):" : "علت رد درخواست (الزامی):"}
                    </label>
                    <textarea
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      rows={3}
                      placeholder={
                        decisionMode === "APPROVE"
                          ? "مثال: مدارک فیزیکی و پروانه کسب استعلام و تأیید شد."
                          : "مثال: تصویر پروانه کسب منقضی شده است یا وضوح کافی ندارد."
                      }
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-3 text-xs text-zinc-200 focus:outline-hidden focus:border-amber-400 placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setDecisionMode(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      disabled={submitting || (decisionMode === "REJECT" && decisionNote.trim().length < 3)}
                      onClick={handleDecision}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                        decisionMode === "APPROVE"
                          ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                          : "bg-rose-500 hover:bg-rose-400 text-zinc-950"
                      }`}
                    >
                      {submitting
                        ? "در حال ثبت..."
                        : decisionMode === "APPROVE"
                        ? "تأیید قطعی و فعال‌سازی اکانت"
                        : "ثبت قطعی رد درخواست"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {detail && detail.ipAddress && (
              <span>ثبت شده از آدرس: {detail.ipAddress}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {detail && detail.status === "PENDING" && !decisionMode && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionMode("REJECT");
                    setDecisionNote("");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  <XCircle size={15} />
                  <span>رد درخواست</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDecisionMode("APPROVE");
                    setDecisionNote("");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>تأیید درخواست و ارتقای اکانت</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

