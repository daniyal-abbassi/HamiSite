"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGetWithMeta, apiPatch } from "@/lib/api-client";
import { formatFaDate } from "@/lib/content/order";
import type { AdminUser } from "@/types/admin";

const ROLES = ["RETAIL", "WHOLESALE", "AGENT", "ADMIN"] as const;
const PAGE_SIZE = 20;

export function UsersAdminClient() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>("");
  const [meta, setMeta] = useState<{ total: number; hasNextPage: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number, targetRole: string) => {
    setUsers(null);
    setFailed(false);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (targetRole) params.set("role", targetRole);
      const { data, meta: responseMeta } = await apiGetWithMeta<AdminUser[]>(`/api/admin/users?${params.toString()}`);
      setUsers(data);
      setMeta({
        total: Number(responseMeta?.total) || 0,
        hasNextPage: Boolean(responseMeta?.hasNextPage),
      });
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load(page, role);
  }, [load, page, role]);

  async function changeUser(userId: number, patch: { role?: string; isActive?: boolean }) {
    setBusyId(userId);
    setActionError(null);
    try {
      const updated = await apiPatch<AdminUser>(`/api/admin/users/${userId}`, patch);
      setUsers((prev) => (prev ? prev.map((u) => (u.id === userId ? updated : u)) : prev));
    } catch (cause) {
      const message = cause instanceof ApiClientError && cause.status === 400 ? "تغییر خود شما مجاز نیست." : apiErrorToFa(cause);
      setActionError(message);
      // Re-sync so optimistic-ish UI doesn't drift from server state.
      void load(page, role);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          aria-label="فیلتر نقش"
          className="w-44"
        >
          <option value="">همه نقش‌ها</option>
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        {meta && <span className="font-mono text-[11px] text-muted-foreground/70">{meta.total.toLocaleString("fa-IR")} کاربر</span>}
      </div>

      {actionError && (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
          {actionError}
        </p>
      )}

      {failed ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center">
          <p className="text-sm text-destructive">در بارگذاری کاربران خطایی رخ داد.</p>
          <button type="button" onClick={() => void load(page, role)} className="flex items-center gap-1.5 text-xs font-bold text-gold">
            <RotateCcw className="size-3.5" /> تلاش دوباره
          </button>
        </div>
      ) : !users ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">
          کاربری با این فیلتر پیدا نشد.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-ink-2/60 font-mono text-[10px] font-bold tracking-[0.1em] text-muted-foreground/80">
                  <th className="px-4 py-3 text-start">کاربر</th>
                  <th className="hidden px-4 py-3 text-start md:table-cell">موبایل</th>
                  <th className="hidden px-4 py-3 text-start lg:table-cell">تاریخ عضویت</th>
                  <th className="px-4 py-3 text-start">نقش</th>
                  <th className="px-4 py-3 text-start">وضعیت</th>
                  <th className="px-4 py-3 text-end">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-foreground/5">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <span className="block truncate font-bold">
                          {u.firstName ? `${u.firstName} ${u.lastName ?? ""}`.trim() : u.username}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/70">
                          @{u.username}
                          {u.id === currentUser?.id && <span className="ms-1.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] text-gold">شما</span>}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-muted-foreground md:table-cell">{u.phoneNumber || "—"}</td>
                    <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">{formatFaDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role}
                        disabled={busyId === u.id || u.id === currentUser?.id}
                        onChange={(event) => void changeUser(u.id, { role: event.target.value })}
                        aria-label={`نقش ${u.username}`}
                        className="h-9 w-36 text-[12px]"
                      >
                        {ROLES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={u.isActive} />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        disabled={busyId === u.id || u.id === currentUser?.id}
                        onClick={() => void changeUser(u.id, { isActive: !u.isActive })}
                        className="text-[12px] font-bold text-gold underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        {u.isActive ? "غیرفعال کن" : "فعال کن"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={meta?.total ?? 0} hasNextPage={meta?.hasNextPage ?? false} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}