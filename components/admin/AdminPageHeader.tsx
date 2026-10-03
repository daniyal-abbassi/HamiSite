/** Page header for admin surfaces — an editorial index, the page's own h1, one
 * line of context or basis, and at most one primary action. Flat by intent: the
 * storefront is allowed to perform, this header is allowed to label.
 *
 * `index` and `eyebrow` stay in the signature because all ten admin routes already
 * pass them; `description` is the optional basis line the spec asks for and no page
 * is obliged to fill. `actions` is one slot, not a toolbar — pass a single node. */
export function AdminPageHeader({
  index,
  eyebrow,
  title,
  description,
  actions,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground">
          <span className="tabular-nums">{index}</span>
          <span aria-hidden="true" className="h-px w-6 bg-champagne/40" />
          <span className="truncate">{eyebrow}</span>
        </div>
        <h1 className="mt-3 text-2xl font-black lg:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-[13px] leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2 lg:shrink-0">{actions}</div>}
    </header>
  );
}
