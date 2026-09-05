import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-ink-2/30 px-6 py-14 text-center">
      {Icon && <Icon className="size-8 text-gold/60" />}
      <h3 className="text-sm font-black">{title}</h3>
      {description && <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}