import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "gold" | "green" | "red" | "default";
};

/** Operate-mode stat card for the admin dashboard — flat hairline surface
 * (no glass lift), one number with a muted label. */
export function StatCard({ label, value, hint, icon: Icon, accent = "default" }: Props) {
  const tone =
    accent === "gold"
      ? "text-gold"
      : accent === "green"
        ? "text-emerald-400"
        : accent === "red"
          ? "text-destructive"
          : "text-foreground";

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-ink-2/60 p-5">
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground/80">{label}</p>
        <p className={`mt-2 truncate text-2xl font-black ${tone}`}>{value}</p>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>}
      </div>
      {Icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/5 text-gold">
          <Icon className="size-5" />
        </span>
      )}
    </div>
  );
}