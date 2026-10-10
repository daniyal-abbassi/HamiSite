"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/ui/Pagination";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGetWithMeta, apiPatch } from "@/lib/api-client";
import { formatFaDate } from "@/lib/content/order";
import type { AdminUser } from "@/types/admin";

const ROLES = [
  { value: "RETAIL", label: "مشتری خرده‌فروش" },
  { value: "WHOLESALE", label: "همکار عمده" },
  { value: "AGENT", label: "نماینده فروش" },
  { value: "ADMIN", label: "مدیر" },
] as const;
const PAGE_SIZE = 20;

type UserChange = {
  userId: number;
  username: string;
  patch: { role?: string; isActive?: boolean };
  description: string;
};

export function UsersAdminClient() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>("");
  const [meta, setMeta] = useState<{ total: number; hasNextPage: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<UserChange | null>(null);
  const requestVersion = useRef(0);

  const load = useCallback(async (targetPage: number, targetRole: string) => {
    const request = ++requestVersion.current;
    setUsers(null);
    setMeta(null);
    setFailed(false);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (targetRole) params.set("role", targetRole);
      const { data, meta: responseMeta } = await apiGetWithMeta<AdminUser[]>(`/api/admin/users?${params.toString()}`);
      if (request !== requestVersion.current) return;
      setUsers(data);
      setMeta({
        total: Number(responseMeta?.total) || 0,
        hasNextPage: Boolean(responseMeta?.hasNextPage),
      });
    } catch {
      if (request === requestVersion.current) setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load(page, role);
    return () => {
      requestVersion.current += 1;
    };
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

  function requestUserChange(user: AdminUser, patch: { role?: string; isActive?: boolean }) {
    if (patch.role !== undefined && patch.role === user.role) return;
    const description = patch.role !== undefined
      ? `نقش کاربر «${user.username}» به «${ROLES.find((role) => role.value === patch.role)?.label ?? patch.role}» تغییر کند؟`
      : `حساب کاربر «${user.username}» ${patch.isActive ? "فعال" : "غیرفعال"} شود؟`;
    setPendingChange({ userId: user.id, username: user.username, patch, description });
  }

  async function confirmUserChange() {
    if (!pendingChange) return;
    const change = pendingChange;
    await changeUser(change.userId, change.patch);
    setPendingChange(null);
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
            <option key={value.value} value={value.value}>
              {value.label}
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
          <button type="button" onClick={() => void load(page, role)} className="flex items-center gap-1.5 text-xs font-bold text-aqua">
            <RotateCcw className="size-3.5" /> تلاش دوباره
          </button>
        </div>
      ) : !users ? (
        <div className="space-y-2.5" aria-busy="true" aria-label="در حال بارگذاری کاربران">
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
          <div role="region" aria-label="فهرست کاربران" tabIndex={0} className="overflow-x-auto rounded-2xl border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne">
            <table aria-label="کاربران فروشگاه" className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line bg-ink-2/60 font-mono text-[10px] font-bold tracking-[0.1em] text-muted-foreground/80">
                  <th scope="col" className="px-4 py-3 text-start">کاربر</th>
                  <th scope="col" className="hidden px-4 py-3 text-start md:table-cell">موبایل</th>
                  <th scope="col" className="hidden px-4 py-3 text-start lg:table-cell">تاریخ عضویت</th>
                  <th scope="col" className="px-4 py-3 text-start">نقش</th>
                  <th scope="col" className="px-4 py-3 text-end">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-foreground/5">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="block truncate font-bold">
                              {u.firstName ? `${u.firstName} ${u.lastName ?? ""}`.trim() : u.username}
                            </span>
                            <ActiveBadge active={u.isActive} />
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            @{u.username}
                            {u.id === currentUser?.id && <span className="ms-1.5 rounded-full bg-aqua/15 px-1.5 py-0.5 text-xs text-aqua">شما</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-muted-foreground md:table-cell">{u.phoneNumber || "—"}</td>
                    <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">{formatFaDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role}
                        disabled={busyId !== null || u.id === currentUser?.id}
                        onChange={(event) => requestUserChange(u, { role: event.target.value })}
                        aria-label={`نقش ${u.username}`}
                        className="h-9 w-36 text-[12px]"
                      >
                        {ROLES.map((value) => (
                          <option key={value.value} value={value.value}>
                            {value.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        disabled={busyId !== null || u.id === currentUser?.id}
                        onClick={() => requestUserChange(u, { isActive: !u.isActive })}
                        className="text-[12px] font-bold text-aqua underline-offset-4 hover:underline disabled:opacity-50"
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

      <Dialog
        open={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        title="تأیید تغییر کاربر"
        description={pendingChange?.description}
      >
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setPendingChange(null)} disabled={busyId !== null} className="min-h-11 rounded-xl px-4 text-[13px] font-bold text-muted-foreground hover:bg-foreground/5 disabled:opacity-50">
            انصراف
          </button>
          <button type="button" onClick={() => void confirmUserChange()} disabled={busyId !== null} className="min-h-11 rounded-xl bg-aqua px-4 text-[13px] font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-50">
            {busyId !== null ? "در حال ذخیره…" : "تأیید تغییر"}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
