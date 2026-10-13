import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { PartnerApplicationStatus } from "@/types/partner-applications";

export function PartnerStatusBadge({ status }: { status: PartnerApplicationStatus }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 size={13} className="shrink-0" />
        <span>تأییدشده</span>
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <XCircle size={13} className="shrink-0" />
        <span>ردشده</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <Clock size={13} className="shrink-0 animate-pulse" />
      <span>در انتظار بررسی</span>
    </span>
  );
}

