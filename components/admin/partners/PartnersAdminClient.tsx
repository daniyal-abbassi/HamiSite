"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Search,
  Store,
  User,
  Users,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { toPersianDigits } from "@/lib/serializers";
import type {
  AdminPartnerApplicationSummary,
  AdminPartnerCounts,
  AdminPartnerListResponse,
  PartnerApplicationStatus,
  PartnerEntityType,
} from "@/types/partner-applications";
import { PartnerApplicationModal } from "./PartnerApplicationModal";
import { PartnerStatusBadge } from "./PartnerStatusBadge";

export function PartnersAdminClient() {
  const [items, setItems] = useState<AdminPartnerApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerApplicationStatus | "ALL">("ALL");
  const [entityFilter, setEntityFilter] = useState<PartnerEntityType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<AdminPartnerCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (entityFilter !== "ALL") params.set("entityType", entityFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await apiGet<{ data: AdminPartnerListResponse } | AdminPartnerListResponse>(
        `/api/admin/partners?${params.toString()}`
      );
      const data = "data" in res && res.data ? res.data : (res as AdminPartnerListResponse);

      if (data && Array.isArray(data.items)) {
        setItems(data.items);
        setTotalPages(data.pagination.totalPages);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to fetch partner applications:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, entityFilter, search]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const handleOpenDetail = (id: number) => {
    setSelectedAppId(id);
    setModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
      }).format(new Date(dateStr));
    } catch {
      return toPersianDigits(dateStr);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs & Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-zinc-800/90 border-zinc-600 text-zinc-100 shadow-md"
              : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} className="text-zinc-400" />
            <span className="text-xs font-semibold">همه درخواست‌ها</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {toPersianDigits(counts.total)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("PENDING");
            setPage(1);
          }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-md"
              : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold">در انتظار بررسی</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            {toPersianDigits(counts.pending)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("APPROVED");
            setPage(1);
          }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right cursor-pointer ${
            statusFilter === "APPROVED"
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-md"
              : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold">تأییدشده</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            {toPersianDigits(counts.approved)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(1);
          }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-md"
              : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-xs font-semibold">ردشده</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
            {toPersianDigits(counts.rejected)}
          </span>
        </button>
      </div>

      {/* Search and Entity Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute right-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="جست‌وجوی نام متقاضی، شماره موبایل، کد ملی یا نام فروشگاه..."
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pr-10 pl-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-hidden text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-zinc-500" />
          <span className="text-xs text-zinc-400">نوع متقاضی:</span>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value as PartnerEntityType | "ALL");
              setPage(1);
            }}
            className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">همه متقاضیان</option>
            <option value="INDIVIDUAL">حقیقی (فروشگاه)</option>
            <option value="LEGAL">حقوقی (شرکت)</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">شناسه</th>
                <th className="py-3.5 px-4 font-bold">نام متقاضی و موبایل</th>
                <th className="py-3.5 px-4 font-bold">نام فروشگاه / کسب‌وکار</th>
                <th className="py-3.5 px-4 font-bold">نوع شخصیت</th>
                <th className="py-3.5 px-4 font-bold">مدارک پیوست</th>
                <th className="py-3.5 px-4 font-bold">تاریخ ثبت</th>
                <th className="py-3.5 px-4 font-bold text-center">وضعیت</th>
                <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    در حال دریافت فهرست درخواست‌های همکاری...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    هیچ درخواستی با مشخصات انتخاب‌شده یافت نشد.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      #{toPersianDigits(item.id)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{item.fullName}</div>
                      <div dir="ltr" className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        {item.mobile}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200 font-medium">{item.shopName}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[200px]" title={item.shopAddress}>
                        {item.shopAddress}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.entityType === "LEGAL" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                          <Building2 size={12} />
                          <span>حقوقی</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">
                          <Store size={12} />
                          <span>حقیقی</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          title={item.hasLeaseDocument ? "اجاره‌نامه/سند بارگذاری شده" : "اجاره‌نامه ندارد"}
                          className={`p-1 rounded-md text-[10px] ${
                            item.hasLeaseDocument
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                          }`}
                        >
                          سند
                        </span>
                        <span
                          title={item.hasBusinessLicense ? "جواز کسب بارگذاری شده" : "جواز کسب ندارد"}
                          className={`p-1 rounded-md text-[10px] ${
                            item.hasBusinessLicense
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                          }`}
                        >
                          جواز
                        </span>
                        {item.entityType === "LEGAL" && (
                          <span
                            title={item.hasRegistrationNotice ? "آگهی تأسیس بارگذاری شده" : "آگهی تأسیس ندارد"}
                            className={`p-1 rounded-md text-[10px] ${
                              item.hasRegistrationNotice
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                            }`}
                          >
                            آگهی
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <PartnerStatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item.id)}
                        aria-label={`بررسی درخواست ${item.fullName}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <Eye size={13} aria-hidden="true" />
                        <span>بررسی</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/60">
            <span className="text-xs text-zinc-400">
              صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="صفحه قبلی"
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="صفحه بعدی"
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Inspection Modal */}
      <PartnerApplicationModal
        applicationId={selectedAppId}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppId(null);
        }}
        onUpdated={() => {
          void fetchApplications();
        }}
      />
    </div>
  );
}

